export const createEmptyQuestion = () => ({
  tempId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  prompt: "",
  type: "multiple_choice",
  options: ["", ""],
  correctAnswerIndex: 0,
});

export const normalizeQuizQuestions = (questions) => {
  return questions.map((question) => {
    const prompt = question.prompt.trim();
    const type = question.type;

    if (type === "true_false") {
      return {
        prompt,
        type,
        options: ["True", "False"],
        correctAnswerIndex: question.correctAnswerIndex ?? 0,
      };
    }

    const options = question.options.map((option) => option.trim());

    return {
      prompt,
      type: "multiple_choice",
      options,
      correctAnswerIndex: question.correctAnswerIndex ?? 0,
    };
  });
};
