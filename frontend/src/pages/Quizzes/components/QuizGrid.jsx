function QuizGrid({ quizzes, onSelectQuiz }) {
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
            <button type="button" onClick={() => onSelectQuiz(quiz.id)}>
              Start Quiz
            </button>
          </article>
        ))
      )}
    </section>
  );
}

export default QuizGrid;
