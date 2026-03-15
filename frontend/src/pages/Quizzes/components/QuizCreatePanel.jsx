function QuizCreatePanel({
  newQuiz,
  setNewQuiz,
  isEditing,
  creating,
  createError,
  createSuccess,
  onSubmit,
  onCancelEdit,
  addQuestion,
  removeQuestion,
  updateQuestion,
  handleQuestionTypeChange,
  addOption,
  updateOption,
  removeOption,
  students = [],
}) {
  return (
    <section className="quiz-create-panel">
      <h2>{isEditing ? 'Edit Quiz' : 'Create a Quiz'}</h2>
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
        <div className="quiz-visibility">
          <label className="quiz-label">
            Visibility
            <select
              value={newQuiz.isPublic ? 'public' : 'assigned'}
              onChange={(event) =>
                setNewQuiz((previous) => ({
                  ...previous,
                  isPublic: event.target.value === 'public',
                }))
              }
            >
              <option value="public">Public to all students</option>
              <option value="assigned">Assign to students</option>
            </select>
          </label>
          {!newQuiz.isPublic && (
            <div className="quiz-assignees">
              <p className="quiz-helper">Select students who should see this quiz.</p>
              <div className="quiz-assignee-grid">
                {students.length === 0 && (
                  <span className="quiz-hint">No students found.</span>
                )}
                {students.map((student) => (
                  <label key={student.id} className="quiz-inline-label">
                    <input
                      type="checkbox"
                      checked={newQuiz.assignedStudentIds.includes(student.id)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setNewQuiz((previous) => {
                          const next = new Set(previous.assignedStudentIds);
                          if (checked) {
                            next.add(student.id);
                          } else {
                            next.delete(student.id);
                          }
                          return {
                            ...previous,
                            assignedStudentIds: Array.from(next),
                          };
                        });
                      }}
                    />
                    {student.username}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <label className="quiz-inline-label quiz-toggle">
          <input
            type="checkbox"
            checked={newQuiz.showCorrectAnswers}
            onChange={(event) =>
              setNewQuiz((previous) => ({
                ...previous,
                showCorrectAnswers: event.target.checked,
              }))
            }
          />
          Show correct answers after submission
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

              {question.type === 'multiple_choice' && (
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

              {question.type === 'true_false' && (
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

              <label className="quiz-label">
                Explanation (optional)
                <textarea
                  rows="2"
                  value={question.explanation || ''}
                  onChange={(event) =>
                    updateQuestion(question.tempId, {
                      explanation: event.target.value,
                    })
                  }
                  placeholder="Explain why this is the correct answer"
                />
              </label>
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
          {isEditing && (
            <button
              type="button"
              className="quiz-secondary-button"
              onClick={onCancelEdit}
            >
              Cancel Edit
            </button>
          )}
          <button type="submit" disabled={creating}>
            {creating
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save Changes'
                : 'Save Quiz'}
          </button>
        </div>

        {createError && <p className="quiz-error">{createError}</p>}
        {createSuccess && <p className="quiz-success">{createSuccess}</p>}
      </form>
    </section>
  );
}

export default QuizCreatePanel;
