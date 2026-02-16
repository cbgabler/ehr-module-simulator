function QuizCreatePanel({
  newQuiz,
  setNewQuiz,
  creating,
  createError,
  createSuccess,
  onSubmit,
  addQuestion,
  removeQuestion,
  updateQuestion,
  handleQuestionTypeChange,
  addOption,
  updateOption,
  removeOption,
}) {
  return (
    <section className="quiz-create-panel">
      <h2>Create a Quiz</h2>
      <form onSubmit={onSubmit} className="quiz-create-form">
        <label className="quiz-label">
          Title
          <input
            type="text"
            value={newQuiz.title}
            onChange={(event) =>
              setNewQuiz((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            placeholder="Quiz title"
          />
        </label>
        <label className="quiz-label">
          Description (optional)
          <textarea
            rows="3"
            value={newQuiz.description}
            onChange={(event) =>
              setNewQuiz((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            placeholder="Add a short description"
          />
        </label>

        <div className="quiz-questions">
          {newQuiz.questions.map((question, index) => (
            <div key={question.tempId} className="quiz-question-card">
              <div className="quiz-question-header">
                <h3>Question {index + 1}</h3>
                {newQuiz.questions.length > 1 && (
                  <button
                    type="button"
                    className="quiz-link-button"
                    onClick={() => removeQuestion(question.tempId)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="quiz-label">
                Prompt
                <textarea
                  rows="2"
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(question.tempId, { prompt: event.target.value })
                  }
                  placeholder="Enter the question prompt"
                />
              </label>
              <label className="quiz-label">
                Question Type
                <select
                  value={question.type}
                  onChange={(event) =>
                    handleQuestionTypeChange(question.tempId, event.target.value)
                  }
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                </select>
              </label>

              {question.type === "multiple_choice" && (
                <div className="quiz-options">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={`${question.tempId}-${optionIndex}`}
                      className="quiz-option-row"
                    >
                      <input
                        type="text"
                        value={option}
                        onChange={(event) =>
                          updateOption(
                            question.tempId,
                            optionIndex,
                            event.target.value
                          )
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <label className="quiz-inline-label">
                        <input
                          type="radio"
                          name={`correct-${question.tempId}`}
                          checked={question.correctAnswerIndex === optionIndex}
                          onChange={() =>
                            updateQuestion(question.tempId, {
                              correctAnswerIndex: optionIndex,
                            })
                          }
                        />
                        Correct
                      </label>
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          className="quiz-link-button"
                          onClick={() =>
                            removeOption(question.tempId, optionIndex)
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="quiz-secondary-button"
                    onClick={() => addOption(question.tempId)}
                  >
                    Add Option
                  </button>
                </div>
              )}

              {question.type === "true_false" && (
                <div className="quiz-true-false">
                  <label className="quiz-inline-label">
                    <input
                      type="radio"
                      name={`correct-${question.tempId}`}
                      checked={question.correctAnswerIndex === 0}
                      onChange={() =>
                        updateQuestion(question.tempId, {
                          correctAnswerIndex: 0,
                        })
                      }
                    />
                    True
                  </label>
                  <label className="quiz-inline-label">
                    <input
                      type="radio"
                      name={`correct-${question.tempId}`}
                      checked={question.correctAnswerIndex === 1}
                      onChange={() =>
                        updateQuestion(question.tempId, {
                          correctAnswerIndex: 1,
                        })
                      }
                    />
                    False
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="quiz-create-actions">
          <button
            type="button"
            className="quiz-secondary-button"
            onClick={addQuestion}
          >
            Add Question
          </button>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Save Quiz"}
          </button>
        </div>

        {createError && <p className="quiz-error">{createError}</p>}
        {createSuccess && <p className="quiz-success">{createSuccess}</p>}
      </form>
    </section>
  );
}

export default QuizCreatePanel;
