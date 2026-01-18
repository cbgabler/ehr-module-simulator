import FormInput from "../shared/FormInput.jsx";
import FormSelect from "../shared/FormSelect.jsx";
import AddButton from "../shared/AddButton.jsx";
import RemoveButton from "../shared/RemoveButton.jsx";

/**
 * Patient Information Form Section
 * Includes patient demographics and allergies
 */
function PatientInfoForm({
  patientName,
  setPatientName,
  patientAge,
  setPatientAge,
  patientGender,
  setPatientGender,
  patientMRN,
  setPatientMRN,
  primaryDiagnosis,
  setPrimaryDiagnosis,
  room,
  setRoom,
  attendingPhysician,
  setAttendingPhysician,
  allergies,
  setAllergies,
}) {
  const addAllergy = () => {
    setAllergies([...allergies, { substance: "", reaction: "", severity: "Mild" }]);
  };

  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const updateAllergy = (index, field, value) => {
    const updated = [...allergies];
    updated[index] = { ...updated[index], [field]: value };
    setAllergies(updated);
  };

  return (
    <>
      {/* Patient Information */}
      <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
        <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
          Patient Information
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
          <FormInput
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g., John Martinez"
            required
          />
          <FormInput
            label="Age"
            type="number"
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            placeholder="e.g., 65"
            min="1"
            max="120"
            required
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ehr-spacing-md)", marginTop: "var(--ehr-spacing-md)" }}>
          <FormSelect
            label="Gender"
            value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}
            options={["Male", "Female", "Other"]}
          />
          <FormInput
            label="MRN (optional)"
            value={patientMRN}
            onChange={(e) => setPatientMRN(e.target.value)}
            placeholder="Auto-generated if empty"
          />
        </div>
        <div style={{ marginTop: "var(--ehr-spacing-md)" }}>
          <FormInput
            label="Primary Diagnosis"
            value={primaryDiagnosis}
            onChange={(e) => setPrimaryDiagnosis(e.target.value)}
            placeholder="e.g., Post-operative hypertension management"
            required
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ehr-spacing-md)", marginTop: "var(--ehr-spacing-md)" }}>
          <FormInput
            label="Room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g., 304B"
          />
          <FormInput
            label="Attending Physician"
            value={attendingPhysician}
            onChange={(e) => setAttendingPhysician(e.target.value)}
            placeholder="e.g., Dr. Sarah Chen, MD"
          />
        </div>
      </div>

      {/* Allergies */}
      <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
          <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>Allergies</h3>
          <AddButton onClick={addAllergy}>+ Add Allergy</AddButton>
        </div>
        {allergies.map((allergy, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr auto",
              gap: "var(--ehr-spacing-md)",
              marginBottom: "var(--ehr-spacing-md)",
              padding: "var(--ehr-spacing-md)",
              backgroundColor: "var(--ehr-bg-secondary)",
              borderRadius: "var(--ehr-radius-md)",
            }}
          >
            <input
              type="text"
              value={allergy.substance}
              onChange={(e) => updateAllergy(index, "substance", e.target.value)}
              placeholder="Substance (e.g., Penicillin)"
              style={{
                padding: "var(--ehr-spacing-sm)",
                borderRadius: "var(--ehr-radius-md)",
                border: "1px solid var(--ehr-border)",
                backgroundColor: "var(--ehr-bg-primary)",
                color: "var(--ehr-text-primary)",
              }}
            />
            <input
              type="text"
              value={allergy.reaction}
              onChange={(e) => updateAllergy(index, "reaction", e.target.value)}
              placeholder="Reaction (e.g., Rash and hives)"
              style={{
                padding: "var(--ehr-spacing-sm)",
                borderRadius: "var(--ehr-radius-md)",
                border: "1px solid var(--ehr-border)",
                backgroundColor: "var(--ehr-bg-primary)",
                color: "var(--ehr-text-primary)",
              }}
            />
            <FormSelect
              value={allergy.severity}
              onChange={(e) => updateAllergy(index, "severity", e.target.value)}
              options={["Mild", "Moderate", "Severe"]}
            />
            <RemoveButton onClick={() => removeAllergy(index)} />
          </div>
        ))}
        {allergies.length === 0 && (
          <p style={{ color: "var(--ehr-text-secondary)", fontStyle: "italic" }}>
            No allergies added. Click "Add Allergy" to add one.
          </p>
        )}
      </div>
    </>
  );
}

export default PatientInfoForm;
