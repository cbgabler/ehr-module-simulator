import FormInput from "../shared/FormInput.jsx";
import AddButton from "../shared/AddButton.jsx";
import RemoveButton from "../shared/RemoveButton.jsx";

/**
 * Learning Objectives Form Section
 */
function LearningObjectivesForm({ learningObjectives, setLearningObjectives }) {
  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, ""]);
  };

  const removeLearningObjective = (index) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const updateLearningObjective = (index, value) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  return (
    <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
        <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>Learning Objectives</h3>
        <AddButton onClick={addLearningObjective}>+ Add Objective</AddButton>
      </div>
      {learningObjectives.map((objective, index) => (
        <div key={index} style={{ display: "flex", gap: "var(--ehr-spacing-md)", marginBottom: "var(--ehr-spacing-md)" }}>
          <input
            type="text"
            value={objective}
            onChange={(e) => updateLearningObjective(index, e.target.value)}
            placeholder="e.g., Assess and monitor patient vital signs"
            style={{
              flex: 1,
              padding: "var(--ehr-spacing-sm)",
              borderRadius: "var(--ehr-radius-md)",
              border: "1px solid var(--ehr-border)",
              backgroundColor: "var(--ehr-bg-primary)",
              color: "var(--ehr-text-primary)",
            }}
          />
          <RemoveButton onClick={() => removeLearningObjective(index)} />
        </div>
      ))}
    </div>
  );
}

export default LearningObjectivesForm;
