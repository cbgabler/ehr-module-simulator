function QuizGrid({
  quizzes,
  onSelectQuiz,
  isInstructor,
  onEditQuiz,
  onDeleteQuiz,
  onCopyQuiz,
  onExportQuiz,
}) {
  return (
    <section className="quiz-grid">
      {quizzes.length === 0 ? (
        <div className="quiz-empty">No quizzes available yet.</div>
      ) : (
        quizzes.map((quiz) => (
          <article key={quiz.id} className="quiz-card">
            <div className="quiz-card-header">
              <h3>{quiz.title}</h3>
              <span>{quiz.questionCount || 0} questions</span>
            </div>
            {quiz.description && <p>{quiz.description}</p>}
            <div className="quiz-card-actions">
              <button type="button" onClick={() => onSelectQuiz(quiz.id)}>
                Start Quiz
              </button>
              {isInstructor && (
                <>
                  <button
                    type="button"
                    className="quiz-secondary-button"
                    onClick={() => onEditQuiz(quiz.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="quiz-secondary-button"
                    onClick={() => onCopyQuiz(quiz.id)}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="quiz-secondary-button"
                    onClick={() => onExportQuiz(quiz.id)}
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    className="quiz-link-button"
                    onClick={() => onDeleteQuiz(quiz.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </article>
        ))
      )}
    </section>
  );
}

export default QuizGrid;
