function QuizHeader({ isInstructor, showCreate, onToggleCreate }) {
  return (
    <div className="quizzes-header">
      <div>
        <h1>Quizzes</h1>
        <p className="quizzes-subtitle">
          Complete quizzes to reinforce learning. Instructors can also create new quizzes.
        </p>
      </div>
      {isInstructor && (
        <button type="button" onClick={onToggleCreate}>
          {showCreate ? "Close Creator" : "Create Quiz"}
        </button>
      )}
    </div>
  );
}

export default QuizHeader;
