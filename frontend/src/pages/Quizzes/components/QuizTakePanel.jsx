function QuizTakePanel({
  quiz,
  answers,
  onAnswerChange,
  onSubmit,
  canSubmit,
  submitting,
  submitError,
  submitResult,
  onClose,
}) {
  if (!quiz) {
    return null;
  }

  const answerKey =
    submitResult?.showCorrectAnswers && Array.isArray(submitResult?.answerKey)
      ? submitResult.answerKey
      : [];

  return (
    <div className="quiz-modal-overlay" role="dialog" aria-modal="true">
      <section className="quiz-take-panel quiz-modal-panel">
        <div className="quiz-take-header">
          <div>
            <h2>{quiz.title}</h2>
            {quiz.description && (
              <p className="quiz-description">{quiz.description}</p>
            )}
          </div>
          <button
            type="button"
            className="quiz-secondary-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {quiz.questions.map((question, index) => {
          const answerInfo = answerKey.find(
            (entry) => entry.questionId === question.id
          );
          const correctIndex = Number.isInteger(answerInfo?.correctAnswerIndex)
            ? answerInfo.correctAnswerIndex
            : null;

          return (
            <div key={question.id} className="quiz-take-question">
              <div className="quiz-question-prompt">
                <span>Q{index + 1}</span>
                <p>{question.prompt}</p>
              </div>
              <div className="quiz-answer-options">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={`${question.id}-${optionIndex}`}
                    className="quiz-answer-option"
                  >
                    <input
                      type="radio"
                      name={`answer-${question.id}`}
                      checked={answers[question.id] === optionIndex}
                      onChange={() => onAnswerChange(question.id, optionIndex)}
                    />
                    <span>{option}</span>
                    {correctIndex === optionIndex && (
                      <span className="quiz-answer-badge">Correct</span>
                    )}
                  </label>
                ))}
              </div>
              {answerInfo?.explanation && (
                <p className="quiz-explanation">{answerInfo.explanation}</p>
              )}
            </div>
          );
        })}

        <div className="quiz-submit-row">
          <button type="button" onClick={onSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
          {!canSubmit && (
            <span className="quiz-hint">Answer all questions to submit.</span>
          )}
        </div>

        {submitError && <p className="quiz-error">{submitError}</p>}
        {submitResult && (
          <div className="quiz-result">
            <strong>Score:</strong> {submitResult.score} / {submitResult.total}
          </div>
        )}
      </section>
    </div>
  );
}

export default QuizTakePanel;
