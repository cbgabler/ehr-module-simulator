import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext.jsx";
import ScenarioGrid from "./components/ScenarioGrid.jsx";
import ScenarioDetailsModal from "./components/ScenarioDetailsModal.jsx";
import ImportModal from "./components/ImportModal.jsx";
import ExportModal from "./components/ExportModal.jsx";
import CreateScenarioModal from "./components/CreateScenarioModal.jsx";
import ScenarioFilters from "./components/ScenarioFilters.jsx";
import "./HomePage.css";

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [startError, setStartError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionSummaries, setSessionSummaries] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [sessionSummariesLoading, setSessionSummariesLoading] = useState(false);
  const [sessionSummariesError, setSessionSummariesError] = useState(null);
  const [expandedSummaryId, setExpandedSummaryId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateScenarioModal, setShowCreateScenarioModal] = useState(false);
  const [deletingScenarioId, setDeletingScenarioId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const electronApiAvailable = typeof window !== "undefined" && window.api;

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!electronApiAvailable || !window.api.getAllScenarios) {
        setError("Electron API not available. Please run this in Electron.");
        setLoading(false);
        return;
      }
      const result = await window.api.getAllScenarios();
      if (result.success) {
        setScenarios(result.scenarios || []);
      } else {
        setError(result.error || "Failed to load scenarios");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [electronApiAvailable]);

  const handleScenarioClick = async (scenarioId) => {
    setStartError(null);
    try {
      if (!window.api?.getScenario) {
        setError("Electron API not available.");
        return;
      }
      const result = await window.api.getScenario(scenarioId);
      if (result.success) {
        setSelectedScenario(result.scenario);
      } else {
        setError(result.error || "Failed to load scenario details");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    }
  };

  const handleDeleteScenario = async (scenarioId) => {
    if (!window.confirm("Are you sure you want to delete this scenario? This action cannot be undone.")) {
      return;
    }

    setDeletingScenarioId(scenarioId);
    setDeleteError(null);
    try {
      if (!window.api?.deleteScenario) {
        setDeleteError("Electron API not available.");
        setDeletingScenarioId(null);
        return;
      }
      const result = await window.api.deleteScenario(scenarioId);
      if (result.success) {
        if (selectedScenario?.id === scenarioId) {
          setSelectedScenario(null);
        }
        await loadScenarios();
      } else {
        setDeleteError(result.error || "Failed to delete scenario");
      }
    } catch (err) {
      setDeleteError(err.message || "An unexpected error occurred");
    } finally {
      setDeletingScenarioId(null);
    }
  };

  const closeScenarioDetails = () => {
    setSelectedScenario(null);
    setStartError(null);
  };

  const openImportModal = () => setShowImportModal(true);
  const closeImportModal = () => setShowImportModal(false);
  const openExportModal = () => setShowExportModal(true);
  const closeExportModal = () => setShowExportModal(false);
  const openCreateScenarioModal = () => setShowCreateScenarioModal(true);
  const closeCreateScenarioModal = () => setShowCreateScenarioModal(false);

  const loadSessionSummaries = useCallback(async () => {
    const parsedUserId = Number.parseInt(user?.id, 10);
    if (!window.api?.getSessionSummaries || !Number.isFinite(parsedUserId)) {
      return;
    }
    setSessionSummariesLoading(true);
    setSessionSummariesError(null);
    try {
      const response = await window.api.getSessionSummaries(parsedUserId);
      if (response.success) {
        setSessionSummaries(response.summaries || []);
      } else {
        setSessionSummariesError(
          response.error || "Unable to load session summaries"
        );
      }
    } catch (err) {
      setSessionSummariesError(
        err.message || "Unable to load session summaries"
      );
    } finally {
      setSessionSummariesLoading(false);
    }
  }, [user?.id]);

  const toggleSummary = (summaryId) => {
    setExpandedSummaryId((previous) =>
      previous === summaryId ? null : summaryId
    );
  };

  const handleStartScenario = async (scenario) => {
    if (!scenario) {
      setStartError("Select a scenario to start.");
      return false;
    }
    setStartError(null);

    const parsedUserId = Number.parseInt(user?.id, 10);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setStartError("You must be signed in with a valid user.");
      return false;
    }
    if (!window.api?.startSimulation) {
      setStartError("Simulation API unavailable in this environment.");
      return false;
    }

    setIsStarting(true);
    try {
      const response = await window.api.startSimulation({
        scenarioId: scenario.id,
        userId: parsedUserId,
      });
      if (response.success) {
        setSelectedScenario(null);
        navigate(`/simulation/${response.sessionId}`);
        return true;
      }
      setStartError(response.error || "Unable to start simulation");
      return false;
    } catch (err) {
      setStartError(err.message || "Unable to start simulation");
      return false;
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  useEffect(() => {
    if (user?.id) {
      loadSessionSummaries();
    } else {
      setSessionSummaries([]);
    }
  }, [loadSessionSummaries, user?.id]);

  // Extract unique specialties and tags from all scenarios
  const { availableSpecialties, availableTags } = useMemo(() => {
    const specialties = new Set();
    const tags = new Set();

    scenarios.forEach((scenario) => {
      const metadata = scenario.definition?.metadata;
      if (metadata?.specialty) {
        specialties.add(metadata.specialty);
      }
      if (metadata?.tags && Array.isArray(metadata.tags)) {
        metadata.tags.forEach((tag) => tags.add(tag));
      }
    });

    return {
      availableSpecialties: Array.from(specialties).sort(),
      availableTags: Array.from(tags).sort(),
    };
  }, [scenarios]);

  // Filter scenarios based on search and filters
  const filteredScenarios = useMemo(() => {
    return scenarios.filter((scenario) => {
      const definition = scenario.definition || {};
      const metadata = definition.metadata || {};
      const patient = definition.patient || {};

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = scenario.name?.toLowerCase().includes(query);
        const matchesPatient = patient.name?.toLowerCase().includes(query);
        const matchesDiagnosis = patient.primaryDiagnosis?.toLowerCase().includes(query);

        if (!matchesName && !matchesPatient && !matchesDiagnosis) {
          return false;
        }
      }

      if (selectedDifficulty && metadata.difficulty !== selectedDifficulty) {
        return false;
      }

      if (selectedSpecialty && metadata.specialty !== selectedSpecialty) {
        return false;
      }

      if (selectedTag) {
        const scenarioTags = metadata.tags || [];
        if (!scenarioTags.includes(selectedTag)) {
          return false;
        }
      }

      return true;
    });
  }, [scenarios, searchQuery, selectedDifficulty, selectedSpecialty, selectedTag]);

  const formatSummaryTimestamp = (timestamp) => {
    if (!timestamp) {
      return "";
    }
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="scenarios-loading">
          <p>Loading scenarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="scenarios-error">
          <p>Error: {error}</p>
          <button onClick={loadScenarios} className="retry-button" type="button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  return (
    <div className="page-container">
      <div className="scenario-actions">
        {isInstructor && (
          <button type="button" onClick={openCreateScenarioModal}>
            Create Scenario
          </button>
        )}
        <button type="button" onClick={openExportModal}>
          Export
        </button>
        <button type="button" onClick={openImportModal}>
          Import
        </button>
      </div>

      <div className="scenarios-header">
        <h1>Simulation Home</h1>
        <p className="scenarios-subtitle">
          Select a scenario to begin practicing with simulated patient cases
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="scenarios-empty">
          <p>No scenarios available. Scenarios will appear here once created.</p>
        </div>
      ) : (
        <>
          <ScenarioFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            availableSpecialties={availableSpecialties}
            availableTags={availableTags}
            totalCount={scenarios.length}
            filteredCount={filteredScenarios.length}
          />

          {filteredScenarios.length === 0 ? (
            <div className="scenarios-empty">
              <p>No scenarios match your filters. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <ScenarioGrid scenarios={filteredScenarios} onSelect={handleScenarioClick} />
          )}
        </>
      )}

      {selectedScenario && (
        <ScenarioDetailsModal
          scenario={selectedScenario}
          onClose={closeScenarioDetails}
          onStartScenario={handleStartScenario}
          onDeleteScenario={handleDeleteScenario}
          isStarting={isStarting}
          startError={startError}
          currentUser={user}
          isDeleting={deletingScenarioId === selectedScenario.id}
          deleteError={deleteError}
        />
      )}

      {showImportModal && (
        <ImportModal onClose={closeImportModal} onImportSuccess={loadScenarios} />
      )}
      {showExportModal && <ExportModal onClose={closeExportModal} scenarios={scenarios} />}
      {showCreateScenarioModal && (
        <CreateScenarioModal
          onClose={closeCreateScenarioModal}
          onCreateSuccess={loadScenarios}
        />
      )}

      {user?.id && (
        <section className="session-summaries-panel">
          <div className="session-summaries-header">
            <h2>My Session Summaries</h2>
            {sessionSummariesLoading && (
              <span className="session-summaries-status">Loading...</span>
            )}
          </div>
          {sessionSummariesError && (
            <div className="session-summaries-error">
              {sessionSummariesError}
            </div>
          )}
          {!sessionSummariesLoading &&
            !sessionSummariesError &&
            sessionSummaries.length === 0 && (
              <p className="session-summaries-empty">
                No session summaries yet.
              </p>
            )}
          {!sessionSummariesLoading &&
            !sessionSummariesError &&
            sessionSummaries.length > 0 && (
              <div className="session-summaries-list">
                {sessionSummaries.map((summary) => (
                  <article
                    key={`${summary.id}-${summary.sessionId}`}
                    className="session-summary-card"
                  >
                    <button
                      type="button"
                      className="session-summary-toggle"
                      onClick={() => toggleSummary(summary.id)}
                      aria-expanded={expandedSummaryId === summary.id}
                    >
                      <span className="session-summary-title">
                        {summary.scenarioName || "Unknown scenario"}
                      </span>
                      <span className="session-summary-date">
                        {formatSummaryTimestamp(summary.createdAt)}
                      </span>
                      <span className="session-summary-chevron">
                        {expandedSummaryId === summary.id ? "▲" : "▼"}
                      </span>
                    </button>
                    {expandedSummaryId === summary.id && (
                      <pre className="session-summary-content">
                        {summary.summary}
                      </pre>
                    )}
                  </article>
                ))}
              </div>
            )}
        </section>
      )}
    </div>
  );
}

export default HomePage;
