# dbt Error Fix Plan

**Generated:** 2026-02-25  
**Daily Build Run:** 465096765 (30 failures)  
**PR Build Runs:** 465191869, 465191429 (1 failure each)

---

## Priority 1: PR Build Blocker

### Fix `silver_segment.order_completed` email validation

**Failing tests:**
- `dbt_utils_not_empty_string_silver_segment_order_completed_email` (15 empty strings)
- `not_null_silver_segment_order_completed_email` (24 nulls)

**Steps:**
1. Open `models/silver_segment/order_completed.sql`
2. Find the `email` column transformation
3. Update to handle empty strings and nulls:
   ```sql
   NULLIF(TRIM(email), '') AS email
   ```
4. If emails are required, add a `WHERE` clause to filter out invalid records:
   ```sql
   WHERE NULLIF(TRIM(email), '') IS NOT NULL
   ```
5. Alternatively, if nulls are acceptable, update the schema.yml to remove or warn-only the not_null test

---

## Priority 2: Critical Scale Issue

### Fix `gold_fact.code_contributions.is_pr_approved` (57M nulls)

**Failing test:**
- `not_null_gold_fact_code_contributions_is_pr_approved`

**Steps:**
1. Open `models/gold_fact/code_contributions.sql`
2. Investigate: This column likely should be NULL for non-PR contributions (commits, issues, etc.)
3. **Option A - Fix the test:** Update schema.yml to add a where clause:
   ```yaml
   - name: is_pr_approved
     tests:
       - not_null:
           where: "contribution_type = 'pull_request'"
   ```
4. **Option B - Fix the model:** Add default value:
   ```sql
   COALESCE(is_pr_approved, FALSE) AS is_pr_approved
   ```
5. Verify which approach aligns with business logic

---

## Priority 3: Bronze Data Issues

### Fix `bronze_census_ti.purchases` null dates (224,950 records)

**Failing tests:**
- `not_null_bronze_census_ti_purchases_purchase_date`
- `not_null_bronze_census_ti_purchases_purchase_ts`

**Steps:**
1. Check if this is a source sync issue - query the source:
   ```sql
   SELECT COUNT(*) FROM ANALYTICS.bronze_census_ti.purchases WHERE purchase_date IS NULL
   ```
2. **If upstream data issue:** Contact data engineering to investigate Census sync
3. **If expected behavior:** Update downstream models to handle nulls:
   - Open `models/silver_fact/ti_course_purchases.sql`
   - Open `models/silver_fact/ti_course_purchases_legacy.sql`
   - Add COALESCE or filter logic
4. Consider changing test severity to `warn` if nulls are expected:
   ```yaml
   - name: purchase_date
     tests:
       - not_null:
           severity: warn
   ```

---

## Priority 4: Uniqueness Issues - Dashboard Models

### Fix `_key` duplicates in gold/platinum dashboard models

**Affected models (all have duplicate `_key` values):**
- `gold_individual_dashboard.yearly_contributions` (5 duplicates)
- `gold_individual_dashboard.yearly_org_contributions` (3 duplicates)
- `gold_individual_dashboard.commit_active_days` (5 duplicates)
- `gold_organization_dashboard.project_organizations_leaderboard_by_contributions` (32 duplicates)
- `gold_organization_dashboard.project_organizations_leaderboard_by_collaborations` (39 duplicates)
- `gold_organization_dashboard.project_organizations_technical_influence_tr` (32 duplicates)
- `platinum_individual_dashboard.commit_active_days` (4 duplicates)
- `platinum_individual_dashboard.github_chart` (5 duplicates)
- `platinum_individual_dashboard.yearly_org_contributions` (3 duplicates)

**Steps for each model:**
1. Open the model file
2. Find the `_key` generation logic (usually a concatenation or hash)
3. Run diagnostic query to find duplicate patterns:
   ```sql
   SELECT _key, COUNT(*) as cnt, *
   FROM <model>
   GROUP BY ALL
   HAVING COUNT(*) > 1
   ```
4. Identify missing grain columns and add to `_key`:
   ```sql
   MD5(CONCAT_WS('|', col1, col2, col3, <missing_col>)) AS _key
   ```
5. **OR** add deduplication with window function:
   ```sql
   QUALIFY ROW_NUMBER() OVER (PARTITION BY _key ORDER BY <priority_col> DESC) = 1
   ```

---

## Priority 5: Mailing Lists Duplicates

### Fix `silver_fact.mailing_lists` and `gold_project_health_mailing_lists`

**Failing tests:**
- `unique_silver_fact_mailing_lists_activity_id` (99 duplicates)
- `unique_gold_project_health_mailing_lists_activity_id` (99 duplicates)

**Steps:**
1. Open `models/silver_fact/mailing_lists.sql`
2. Run diagnostic to find duplicate source:
   ```sql
   SELECT activity_id, COUNT(*) as cnt
   FROM ANALYTICS.silver_fact.mailing_lists
   GROUP BY activity_id
   HAVING COUNT(*) > 1
   ```
3. Likely cause: JOIN creating duplicates or source has duplicates
4. Add deduplication:
   ```sql
   QUALIFY ROW_NUMBER() OVER (PARTITION BY activity_id ORDER BY created_at DESC) = 1
   ```
5. The gold model likely inherits this issue - fix silver first, then verify gold

---

## Priority 6: Work History Duplicates

### Fix `silver_dim.end_date_backfilled_work_history` and helper

**Failing tests:**
- `unique__end_date_backfilled_work_history__key` (32 duplicates)
- `unique__helper_end_date_backfilled_work_history_member_org_history_id` (119 duplicates)

**Steps:**
1. Open `models/silver_dim/_helper_end_date_backfilled_work_history.sql`
2. Investigate the 119 duplicates on `member_org_history_id`:
   ```sql
   SELECT member_org_history_id, COUNT(*) 
   FROM ANALYTICS.silver_dim._helper_end_date_backfilled_work_history
   GROUP BY 1 HAVING COUNT(*) > 1
   ```
3. Fix the helper model first (upstream)
4. Then open `models/silver_dim/end_date_backfilled_work_history.sql`
5. Fix `_key` generation or add deduplication

---

## Priority 7: GitHub Stars Duplicates

### Fix `gold_fact.github_stars`

**Failing test:**
- `unique_gold_fact_github_stars_activity_project_id` (891 duplicates)

**Steps:**
1. Open `models/gold_fact/github_stars.sql`
2. Investigate:
   ```sql
   SELECT activity_project_id, COUNT(*) 
   FROM ANALYTICS.gold_fact.github_stars
   GROUP BY 1 HAVING COUNT(*) > 1
   ```
3. Determine if `activity_project_id` should be the unique key or if additional columns needed
4. Fix with either:
   - Better key definition
   - Deduplication with `QUALIFY`

---

## Priority 8: Remaining Data Quality Issues

### Fix Stripe charges accepted values

**Failing test:**
- `accepted_values_silver_fact_stripe_charges_item_purchasable_type`

**Steps:**
1. Query to find the unexpected value:
   ```sql
   SELECT DISTINCT item_purchasable_type 
   FROM ANALYTICS.silver_fact.stripe_charges
   WHERE item_purchasable_type NOT IN ('course','discountGroup','pickableGroup','product','freight')
   ```
2. **Option A:** Add the new value to the test in schema.yml
3. **Option B:** Filter out invalid records in the model

### Fix sub_segments referential integrity

**Failing test:**
- `dbt_utils_relationships_where_silver_dim_sub_segments_project_group_slug`

**Steps:**
1. Find orphaned slugs:
   ```sql
   SELECT DISTINCT project_group_slug 
   FROM ANALYTICS.silver_dim.sub_segments
   WHERE project_group_slug NOT IN (SELECT slug FROM ANALYTICS.silver_dim.active_segments)
   ```
2. Either add missing segments to source or filter sub_segments

### Fix activities null timestamp

**Failing test:**
- `not_null_silver_dim_activities_engagement_created_ts` (2 records)

**Steps:**
1. Find the 2 offending records
2. Add COALESCE with sensible default or filter

---

## Priority 9: Business Logic Comparison Tests

### Fix membership count discrepancies

**Failing tests:**
- `compare_model_counts_silver_dim_memberships_membership_id` (159 discrepancies)
- `platinum_membership_member_tier_year_count` (1 discrepancy)
- `platinum_membership_overall_accounts_count` (1 discrepancy)

**Steps:**
1. Run the test queries manually to identify which records differ
2. Compare filter logic between `silver_dim.memberships` and `bronze_fivetran_salesforce_b2b.memberships`
3. Likely causes:
   - Different handling of edge cases
   - Transformation dropping records
   - Date/status filter differences
4. Align logic between models

### Fix ecosystem influence leaderboard uniqueness

**Failing test:**
- `unique_combination_platinum_organization_dashboard_ecosystem_influence_leaderboard` (7 duplicates)

**Steps:**
1. Find duplicate combinations:
   ```sql
   SELECT account_id, project_id, COUNT(*)
   FROM ANALYTICS.platinum_organization_dashboard.ecosystem_influence_leaderboard
   GROUP BY 1, 2 HAVING COUNT(*) > 1
   ```
2. Add deduplication or include additional column in grain

---

## Verification Steps

After making changes:

1. Run locally to verify:
   ```bash
   dbt build --select <model_name>
   ```

2. Run specific tests:
   ```bash
   dbt test --select <model_name>
   ```

3. Create PR and verify CI passes

4. Monitor next Daily Build after merge
