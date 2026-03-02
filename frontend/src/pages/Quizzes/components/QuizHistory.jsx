import { useEffect, useRef, useState } from "react";

function ScoreBar({ score, total }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const colorClass =
    pct >= 80 ? "quiz-score-bar--high" : pct >= 50 ? "quiz-score-bar--mid" : "quiz-score-bar--low";
  return (
    <div className="quiz-score-bar-track" title={`${pct}%`}>
      <div className={`quiz-score-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SubmissionBreakdown({ submissionId }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (details) return;
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.getQuizSubmissionDetails(submissionId);
      if (response.success) {
        setDetails(response.details);
      } else {
        setError(response.error || "Could not load details.");
      }
    } catch (err) {
      setError(err.message || "Could not load details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-breakdown">
      <button
        type="button"
        className="quiz-breakdown-toggle"
        onClick={handleToggle}
        aria-expanded={open}
      >
        {open ? "Hide Details ▲" : "View Details ▼"}
      </button>

      {open && (
        <div className="quiz-breakdown-body">
          {loading && <p className="quiz-breakdown-loading">Loading breakdown...</p>}
          {error && <p className="quiz-error">{error}</p>}
          {details && details.answers.length === 0 && (
            <p className="quiz-breakdown-empty">No answer data recorded.</p>
          )}
          {details &&
            details.answers.map((answer, index) => {
              const selectedLabel =
                answer.selectedAnswerIndex !== null
                  ? answer.options[answer.selectedAnswerIndex] ?? "—"
                  : "No answer";
              const correctLabel = answer.options[answer.correctAnswerIndex] ?? "—";

              return (
                <div
                  key={answer.questionId}
                  className={`quiz-breakdown-question ${answer.isCorrect ? "quiz-breakdown-question--correct" : "quiz-breakdown-question--incorrect"}`}
                >
                  <div className="quiz-breakdown-q-header">
                    <span className="quiz-breakdown-q-num">Q{index + 1}</span>
                    <span
                      className={`quiz-breakdown-badge ${answer.isCorrect ? "quiz-breakdown-badge--correct" : "quiz-breakdown-badge--incorrect"}`}
                    >
                      {answer.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <p className="quiz-breakdown-prompt">{answer.prompt}</p>
                  <div className="quiz-breakdown-answers">
                    <div className="quiz-breakdown-answer-row">
                      <span className="quiz-breakdown-answer-label">Your answer:</span>
                      <span
                        className={`quiz-breakdown-answer-value ${answer.isCorrect ? "quiz-breakdown-answer--correct" : "quiz-breakdown-answer--incorrect"}`}
                      >
                        {selectedLabel}
                      </span>
                    </div>
                    {!answer.isCorrect && (
                      <div className="quiz-breakdown-answer-row">
                        <span className="quiz-breakdown-answer-label">Correct answer:</span>
                        <span className="quiz-breakdown-answer-value quiz-breakdown-answer--correct">
                          {correctLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function QuizHistory({ submissions }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubmissions = submissions && submissions.length > 0;
  const prevCountRef = useRef(submissions?.length ?? 0);

  useEffect(() => {
    const prev = prevCountRef.current;
    const current = submissions?.length ?? 0;
    if (current > prev) {
      setExpanded(true);
    }
    prevCountRef.current = current;
  }, [submissions?.length]);

  return (
    <section className="quiz-history">
      <div className="quiz-history-header">
        <div>
          <h2 className="quiz-history-title">My Quiz History</h2>
          <p className="quiz-history-subtitle">
            {hasSubmissions
              ? `${submissions.length} attempt${submissions.length !== 1 ? "s" : ""} recorded`
              : "No attempts yet — submit a quiz to see your history here."}
          </p>
        </div>
        {hasSubmissions && (
          <button
            type="button"
            className="quiz-secondary-button"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Collapse ▲" : "Expand ▼"}
          </button>
        )}
      </div>

      {hasSubmissions && expanded && (
        <div className="quiz-history-list">
          {submissions.map((submission) => {
            const pct =
              submission.total > 0
                ? Math.round((submission.score / submission.total) * 100)
                : 0;
            const date = submission.submittedAt
              ? new Date(submission.submittedAt).toLocaleString()
              : "Unknown date";

            return (
              <div key={submission.id} className="quiz-history-card">
                <div className="quiz-history-card-top">
                  <div className="quiz-history-card-info">
                    <span className="quiz-history-quiz-title">{submission.title}</span>
                    <span className="quiz-history-date">{date}</span>
                  </div>
                  <div className="quiz-history-score-block">
                    <span className="quiz-history-score-text">
                      {submission.score} / {submission.total}
                      <span className="quiz-history-pct"> ({pct}%)</span>
                    </span>
                    <ScoreBar score={submission.score} total={submission.total} />
                  </div>
                </div>
                <SubmissionBreakdown submissionId={submission.id} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default QuizHistory;
