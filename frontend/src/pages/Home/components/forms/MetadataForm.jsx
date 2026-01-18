import FormInput from "../shared/FormInput.jsx";
import FormSelect from "../shared/FormSelect.jsx";

/**
 * Scenario Metadata Form Section
 */
function MetadataForm({
  difficulty,
  setDifficulty,
  estimatedDuration,
  setEstimatedDuration,
  specialty,
  setSpecialty,
}) {
  return (
    <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
      <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
        Scenario Metadata
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
        <FormSelect
          label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={["Beginner", "Intermediate", "Advanced"]}
        />
        <FormInput
          label="Estimated Duration"
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)}
          placeholder="e.g., 30-45 minutes"
        />
        <FormInput
          label="Specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder="e.g., Medical-Surgical Nursing"
        />
      </div>
    </div>
  );
}

export default MetadataForm;
