import { useMemo } from "react";

/**
 * ScenarioFilters Component
 * Provides search and filter controls for scenarios
 */
function ScenarioFilters({
  searchQuery,
  setSearchQuery,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedSpecialty,
  setSelectedSpecialty,
  selectedTag,
  setSelectedTag,
  availableSpecialties,
  availableTags,
  totalCount,
  filteredCount,
}) {
  const hasActiveFilters = searchQuery || selectedDifficulty || selectedSpecialty || selectedTag;

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("");
    setSelectedSpecialty("");
    setSelectedTag("");
  };

  return (
    <div className="scenario-filters">
      <div className="filter-header">
        <h2 className="filter-title">Filter Scenarios</h2>
        {hasActiveFilters && (
          <button
            type="button"
            className="clear-filters-button"
            onClick={handleClearFilters}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="filter-search">
        <input
          type="text"
          placeholder="Search by name, patient, or diagnosis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="difficulty-filter">Difficulty</label>
          <select
            id="difficulty-filter"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Easy">Easy</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Medium">Medium</option>
            <option value="Advanced">Advanced</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="specialty-filter">Specialty</label>
          <select
            id="specialty-filter"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Specialties</option>
            {availableSpecialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="tag-filter">Tag</label>
          <select
            id="tag-filter"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="filter-select"
          >
            <option value="">All Tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Counter */}
      <div className="filter-results">
        {filteredCount !== totalCount ? (
          <p>
            Showing <strong>{filteredCount}</strong> of{" "}
            <strong>{totalCount}</strong> scenarios
          </p>
        ) : (
          <p>
            <strong>{totalCount}</strong> scenario{totalCount !== 1 ? "s" : ""}{" "}
            available
          </p>
        )}
      </div>
    </div>
  );
}

export default ScenarioFilters;
