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

**Responsive Design:**
- Desktop: 3-column grid for filters
- Tablet/Mobile: Single column stack
- Touch-friendly button sizes

## User Experience Improvements

### Before:
- Users had to scroll through all scenarios
- No way to search for specific conditions
- Difficult to find scenarios by difficulty level

### After:
- ✅ Instant search across multiple fields
- ✅ Filter by difficulty, specialty, or tag
- ✅ See how many scenarios match filters
- ✅ Clear all filters with one click
- ✅ Responsive design for all screen sizes

## Performance Considerations

1. **useMemo for filtering** - Prevents recalculation on every render
2. **useMemo for unique values** - Extracts specialties/tags only when scenarios change
3. **Controlled inputs** - React manages state efficiently
4. **No external dependencies** - Pure JavaScript filtering

## Future Enhancements (Optional)

- [ ] Add "Sort by" functionality (name, difficulty, date created)
- [ ] Save filter preferences to localStorage
- [ ] Add keyboard shortcuts (e.g., `/` to focus search)
- [ ] Multi-select for tags (filter by multiple tags at once)
- [ ] Advanced filters (duration range, patient age range)
- [ ] Filter presets ("My Favorites", "Recently Added")

## Testing Checklist

- [x] Search works across scenario name, patient, diagnosis
- [x] Difficulty filter shows correct scenarios
- [x] Specialty filter dynamically populates
- [x] Tag filter works with scenario tags
- [x] Clear All button resets all filters
- [x] Results counter updates correctly
- [x] No linter errors
- [x] Responsive design works on mobile
- [x] Empty state shows when no matches found

## Files Changed

1. **Created:**
   - `frontend/src/pages/Home/components/ScenarioFilters.jsx`
   - `docs/features/scenario-filters.md`

2. **Modified:**
   - `frontend/src/pages/Home/HomePage.jsx` (added filter state and logic)
   - `frontend/src/pages/Home/HomePage.css` (added filter styles)

## Contribution Notes

This feature demonstrates:
- **React best practices** - useMemo for performance optimization
- **Component composition** - Reusable ScenarioFilters component
- **User-centered design** - Multiple ways to find scenarios
- **Clean code** - Well-documented, no linter errors
- **Responsive design** - Works on all screen sizes

---

**Author:** Frontend Team  
**Date:** January 2026  
**Sprint:** Current Sprint
