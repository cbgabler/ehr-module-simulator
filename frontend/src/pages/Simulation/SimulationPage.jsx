import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext.jsx";
import PatientInfoSidebar from "./components/PatientInfoSidebar.jsx";
import VitalSignsTab from "./components/VitalSignsTab.jsx";
import ActiveMedicationsTab from "./components/ActiveMedicationsTab.jsx";
import ProviderOrdersTab from "./components/ProviderOrdersTab.jsx";
import MedicationAdminTab from "./components/MedicationAdminTab.jsx";
import NotesSection from "./components/NotesSection.jsx";
import "./SimulationPage.css";

const POLL_INTERVAL_MS = 2500;

const TABS = [
  { id: "vitals", label: "Vital Signs" },
  { id: "medications", label: "Active Medications" },
  { id: "orders", label: "Provider Orders" },
  { id: "medAdmin", label: "Medication Administration" },
];

function SimulationPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("vitals");
  const [sessionState, setSessionState] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  // notes state
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState(null);
  const [noteDeletingId, setNoteDeletingId] = useState(null);

  // session summary state
  const [sessionSummary, setSessionSummary] = useState(null);

  const pollingRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const refreshSessionState = useCallback(async () => {
    if (!window.api?.getSimulationState || !sessionId) {
      return;
    }
    try {
      const response = await window.api.getSimulationState(sessionId);
      if (response.success) {
        setSessionState(response.state);
        if (response.state?.status === "ended") {
          stopPolling();
        }
      } else {
        setSessionError(response.error || "Failed to read simulation state");
        stopPolling();
      }
    } catch (err) {
      setSessionError(err.message || "Failed to read simulation state");
      stopPolling();
    }
  }, [sessionId, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    if (!window.api?.getSimulationState) {
      return;
    }
    pollingRef.current = setInterval(refreshSessionState, POLL_INTERVAL_MS);
  }, [refreshSessionState, stopPolling]);

  // load initial scenario session
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        // get session state
        if (!window.api?.getSimulationState) {
          setError("Simulation API not available");
          setLoading(false);
          return;
        }

        const response = await window.api.getSimulationState(sessionId);
        if (!response.success) {
          setError(response.error || "Failed to load session");
          setLoading(false);
          return;
        }

        setSessionState(response.state);

        // get scenario details
        if (response.state?.scenarioId && window.api?.getScenario) {
          const scenarioResponse = await window.api.getScenario(response.state.scenarioId);
          if (scenarioResponse.success) {
            setScenario(scenarioResponse.scenario);
          }
        }

        // start polling if session is active
        if (response.state?.status !== "ended") {
          startPolling();
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load session");
        setLoading(false);
      }
    };

    loadSession();
    return () => stopPolling();
  }, [sessionId, startPolling, stopPolling]);

  // load notes
  const loadNotes = useCallback(async () => {
    if (!window.api?.getNotes || !sessionId) {
      return;
    }
    try {
      const response = await window.api.getNotes(sessionId);
      if (response.success) {
        setNotes(response.notes || []);
        setNoteError(null);
      } else {
        setNoteError(response.error || "Unable to fetch notes");
      }
    } catch (err) {
      setNoteError(err.message || "Unable to fetch notes");
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadNotes();
    }
  }, [sessionId, loadNotes]);

  // load session summary when ended
  useEffect(() => {
    const loadSummary = async () => {
      if (sessionState?.status === "ended" && sessionId && window.api?.getSessionSummary) {
        try {
          const response = await window.api.getSessionSummary(sessionId);
          if (response.success && response.summary) {
            setSessionSummary(response.summary);
          }
        } catch (err) {
          console.error("Failed to load session summary:", err);
        }
      }
    };
    loadSummary();
  }, [sessionState?.status, sessionId]);

  const handleAddNote = async (event) => {
    event?.preventDefault?.();
    if (!sessionId) {
      setNoteError("No active session");
      return;
    }
    if (!noteContent.trim()) {
      setNoteError("Enter a note before saving");
      return;
    }
    if (!window.api?.addNote) {
      setNoteError("Notes API unavailable");
      return;
    }

    setNoteSubmitting(true);
    setNoteError(null);
    try {
      const response = await window.api.addNote({
        sessionId,
        userId: user?.id,
        content: noteContent,
        vitalsSnapshot: sessionState?.currentVitals,
      });
      if (response.success) {
        setNotes((prev) => [...prev, response.note]);
        setNoteContent("");
      } else {
        setNoteError(response.error || "Unable to save note");
      }
    } catch (err) {
      setNoteError(err.message || "Unable to save note");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.api?.deleteNote || !noteId) {
      return;
    }
    setNoteDeletingId(noteId);
    setNoteError(null);
    try {
      const response = await window.api.deleteNote({
        noteId,
        userId: user?.id,
      });
      if (response.success) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
      } else {
        setNoteError(response.error || "Unable to delete note");
      }
    } catch (err) {
      setNoteError(err.message || "Unable to delete note");
    } finally {
      setNoteDeletingId(null);
    }
  };

  const handleAdjustMedication = async (medicationId, newDose) => {
    if (!sessionId || !window.api?.adjustMedication) {
      return;
    }
    try {
      const response = await window.api.adjustMedication({
        sessionId,
        medicationId,
        newDose,
      });
      if (response.success) {
        setSessionState(response.state);
        setSessionError(null);
      } else {
        setSessionError(response.error || "Unable to adjust medication");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to adjust medication");
    }
  };

  const handlePause = async () => {
    if (!sessionId || !window.api?.pauseSimulation) {
      return;
    }
    try {
      const response = await window.api.pauseSimulation(sessionId);
      if (response.success) {
        setSessionState(response.state);
        setSessionError(null);
      } else {
        setSessionError(response.error || "Unable to pause simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to pause simulation");
    }
  };

  const handleResume = async () => {
    if (!sessionId || !window.api?.resumeSimulation) {
      return;
    }
    try {
      const response = await window.api.resumeSimulation(sessionId);
      if (response.success) {
        setSessionState(response.state);
        setSessionError(null);
      } else {
        setSessionError(response.error || "Unable to resume simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to resume simulation");
    }
  };

  const handleEnd = async () => {
    if (!sessionId || !window.api?.endSimulation) {
      return;
    }
    try {
      const response = await window.api.endSimulation(sessionId);
      if (response.success) {
        setSessionState(response.state);
        if (response.summary) {
          setSessionSummary(response.summary);
        }
        setSessionError(null);
        stopPolling();
      } else {
        setSessionError(response.error || "Unable to end simulation");
      }
    } catch (err) {
      setSessionError(err.message || "Unable to end simulation");
    }
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="simulation-page">
        <div className="simulation-loading">
          <p>Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simulation-page">
        <div className="simulation-error">
          <p>Error: {error}</p>
          <button onClick={handleBackToHome} type="button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const patient = scenario?.definition?.patient;
  const isEnded = sessionState?.status === "ended";

  return (
    <div className="simulation-page">
      <div className="simulation-layout">
        {/* left sidebar - patient info */}
        <aside className="simulation-sidebar">
          <PatientInfoSidebar patient={patient} />
        </aside>

        {/* right - main content area with tabs */}
        <main className="simulation-main">
          {/* tab navigation */}
          <nav className="simulation-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`simulation-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* session status bar */}
          <div className="simulation-status-bar">
            <div className="status-info">
              <span className="status-label">Session:</span>
              <span className="status-value">#{sessionId}</span>
              <span className={`status-badge status-${sessionState?.status || "unknown"}`}>
                {sessionState?.status || "Unknown"}
              </span>
              <span className="status-label">Tick:</span>
              <span className="status-value">{sessionState?.tickCount || 0}</span>
            </div>
            {sessionState?.targetStatus?.configured && (
              <div className={`target-status ${sessionState.targetStatus.met ? "met" : ""}`}>
                <span className="target-label">Target:</span>
                <span className="target-description">
                  {sessionState.targetStatus.description}
                </span>
                {sessionState.targetStatus.met ? (
                  <span className="target-met-badge">Target Met!</span>
                ) : (
                  <span className="target-progress">
                    {sessionState.targetStatus.consecutiveTicks || 0}/
                    {sessionState.targetStatus.holdTicksRequired || 0} ticks
                  </span>
                )}
              </div>
            )}
          </div>

          {/* tab content */}
          <div className="simulation-content">
            {activeTab === "vitals" && (
              <VitalSignsTab vitals={sessionState?.currentVitals} />
            )}
            {activeTab === "medications" && (
              <ActiveMedicationsTab medications={sessionState?.medications || []} />
            )}
            {activeTab === "orders" && (
              <ProviderOrdersTab orders={sessionState?.orders || []} />
            )}
            {activeTab === "medAdmin" && (
              <MedicationAdminTab
                medicationState={sessionState?.medicationState || {}}
                onAdjustMedication={handleAdjustMedication}
                disabled={isEnded}
              />
            )}
          </div>

          {/* notes section */}
          <NotesSection
            notes={notes}
            noteContent={noteContent}
            onNoteContentChange={setNoteContent}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            noteSubmitting={noteSubmitting}
            noteError={noteError}
            noteDeletingId={noteDeletingId}
            disabled={isEnded}
          />

          {/* session summary (when ended) */}
          {isEnded && sessionSummary && (
            <div className="session-summary-display">
              <h3>Session Summary</h3>
              <pre className="summary-content">{sessionSummary.summary}</pre>
            </div>
          )}

          {/* error display */}
          {sessionError && (
            <div className="simulation-error-banner">
              {sessionError}
            </div>
          )}
        </main>
      </div>

      {/* bottom control bar */}
      <footer className="simulation-controls">
        <button
          type="button"
          className="control-btn secondary"
          onClick={handleBackToHome}
        >
          Back to Home
        </button>
        <div className="control-actions">
          {!isEnded && sessionState?.status === "running" && (
            <button type="button" className="control-btn warning" onClick={handlePause}>
              Pause
            </button>
          )}
          {!isEnded && sessionState?.status === "paused" && (
            <button type="button" className="control-btn success" onClick={handleResume}>
              Resume
            </button>
          )}
          {!isEnded && (
            <button type="button" className="control-btn danger" onClick={handleEnd}>
              End Simulation
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default SimulationPage;
