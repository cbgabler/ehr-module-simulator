# Scenario Search & Filter Feature

## Overview
Added comprehensive search and filtering functionality to help users quickly find relevant scenarios from a growing library.

## Features Implemented

### 1. **Text Search**
- Search across scenario name, patient name, and primary diagnosis
- Real-time filtering as you type
- Clear button (×) to quickly reset search

### 2. **Filter by Difficulty**
- Options: Beginner, Easy, Intermediate, Medium, Advanced, Hard
- Dropdown selection
- "All Difficulties" option to show everything

### 3. **Filter by Specialty**
- Dynamically populated from available scenarios
- Only shows specialties that exist in the database
- Sorted alphabetically

### 4. **Filter by Tag**
- Dynamically populated from scenario tags
- Helps find scenarios by topic/condition
- Sorted alphabetically

### 5. **Results Counter**
- Shows "X of Y scenarios" when filters are active
- Shows "Y scenarios available" when no filters applied
- Helps users understand filter impact

### 6. **Clear All Filters**
- One-click button to reset all filters
- Only appears when filters are active
- Improves UX for quick resets

## Technical Implementation

### New Component: `ScenarioFilters.jsx`
Location: `frontend/src/pages/Home/components/ScenarioFilters.jsx`

**Props:**
- `searchQuery`, `setSearchQuery` - Text search state
- `selectedDifficulty`, `setSelectedDifficulty` - Difficulty filter state
- `selectedSpecialty`, `setSelectedSpecialty` - Specialty filter state
- `selectedTag`, `setSelectedTag` - Tag filter state
- `availableSpecialties` - Array of unique specialties from scenarios
- `availableTags` - Array of unique tags from scenarios
- `totalCount` - Total number of scenarios
- `filteredCount` - Number of scenarios after filtering

### Updated: `HomePage.jsx`

**New State Variables:**
```javascript
const [searchQuery, setSearchQuery] = useState("");
const [selectedDifficulty, setSelectedDifficulty] = useState("");
const [selectedSpecialty, setSelectedSpecialty] = useState("");
const [selectedTag, setSelectedTag] = useState("");
```

**Performance Optimization with useMemo:**
1. **Extract unique values** - Specialties and tags are extracted once when scenarios change
2. **Filter scenarios** - Filtering logic runs only when scenarios or filter values change
3. **Prevents unnecessary re-renders** - Optimized for large scenario lists

**Filtering Logic:**
```javascript
const filteredScenarios = useMemo(() => {
  return scenarios.filter((scenario) => {
    // Text search (OR logic - matches any field)
    // Difficulty filter (exact match)
    // Specialty filter (exact match)
    // Tag filter (includes check for array)
    return true; // if all conditions pass
  });
}, [scenarios, searchQuery, selectedDifficulty, selectedSpecialty, selectedTag]);
```

### CSS Styles
Location: `frontend/src/pages/Home/HomePage.css`

**New Classes:**
- `.scenario-filters` - Main container with card styling
- `.filter-header` - Title and clear button layout
- `.filter-search` - Search input with clear button
- `.filter-controls` - Responsive grid for dropdowns
- `.filter-group` - Individual filter with label
- `.filter-results` - Results counter styling

## Files Changed

1. **Created:**
   - `frontend/src/pages/Home/components/ScenarioFilters.jsx`
   - `docs/features/scenario-filters.md`

2. **Modified:**
   - `frontend/src/pages/Home/HomePage.jsx` (added filter state and logic)
   - `frontend/src/pages/Home/HomePage.css` (added filter styles)

---

**Author:** Trey Springer (Frontend Team)  
**Date:** January 18th, 2026
**Sprint:** Sprint 1 of Winter Term
