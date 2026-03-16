function QuizHeader({
  isInstructor,
  showCreate,
  onToggleCreate,
  onImportQuiz,
}) {
  return (
    <div className="quizzes-header">
      <div>
        <h1>Quizzes</h1>
        <p className="quizzes-subtitle">
          Complete quizzes to reinforce learning. Instructors can also create new quizzes.
        </p>
      </div>
      {isInstructor && (
        <div className="quiz-header-actions">
          <button type="button" onClick={onImportQuiz}>
            Import Quiz
          </button>
          <button type="button" onClick={onToggleCreate}>
            {showCreate ? 'Close Creator' : 'Create Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}

export default QuizHeader;
