import FormInput from "../shared/FormInput.jsx";
import FormSelect from "../shared/FormSelect.jsx";
import AddButton from "../shared/AddButton.jsx";
import RemoveButton from "../shared/RemoveButton.jsx";

/**
 * Medications Form Section
 */
function MedicationsForm({ medications, setMedications }) {
  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: medications.length + 1,
        name: "",
        dosage: "",
        route: "PO",
        frequency: "",
        indication: "",
        prn: false,
        titration: { min: 1, max: 100, step: 1, unit: "mg" },
      },
    ]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    if (field === "prn") {
      updated[index] = { ...updated[index], [field]: value };
    } else if (field.startsWith("titration.")) {
      const titrationField = field.split(".")[1];
      updated[index] = {
        ...updated[index],
        titration: {
          ...updated[index].titration,
          [titrationField]:
            titrationField === "min" || titrationField === "max" || titrationField === "step"
              ? parseInt(value, 10) || 0
              : value,
        },
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setMedications(updated);
  };

  return (
    <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
        <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>
          Medications <span style={{ color: "var(--ehr-error)" }}>*</span>
        </h3>
        <AddButton onClick={addMedication}>+ Add Medication</AddButton>
      </div>
      {medications.map((med, index) => (
        <div
          key={med.id}
          style={{
            marginBottom: "var(--ehr-spacing-md)",
            padding: "var(--ehr-spacing-md)",
            backgroundColor: "var(--ehr-bg-secondary)",
            borderRadius: "var(--ehr-radius-md)",
            border: "1px solid var(--ehr-border)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--ehr-spacing-md)", marginBottom: "var(--ehr-spacing-md)" }}>
            <FormInput
              label="Medication Name"
              value={med.name}
              onChange={(e) => updateMedication(index, "name", e.target.value)}
              placeholder="e.g., Lisinopril"
            />
            <FormInput
              label="Dose"
              value={med.dosage}
              onChange={(e) => updateMedication(index, "dosage", e.target.value)}
              placeholder="e.g., 10 mg"
            />
            <FormSelect
              label="Route"
              value={med.route}
              onChange={(e) => updateMedication(index, "route", e.target.value)}
              options={["PO", "IV", "IM", "SubQ", "Topical"]}
            />
            <FormInput
              label="Frequency"
              value={med.frequency}
              onChange={(e) => updateMedication(index, "frequency", e.target.value)}
              placeholder="e.g., Once daily"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "var(--ehr-spacing-md)", alignItems: "end" }}>
            <FormInput
              label="Indication"
              value={med.indication}
              onChange={(e) => updateMedication(index, "indication", e.target.value)}
              placeholder="e.g., Hypertension"
            />
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ehr-spacing-sm)" }}>
              <input
                type="checkbox"
                checked={med.prn}
                onChange={(e) => updateMedication(index, "prn", e.target.checked)}
                id={`prn-${index}`}
                style={{ width: "auto" }}
              />
              <label htmlFor={`prn-${index}`} style={{ color: "var(--ehr-text-primary)", margin: 0 }}>
                PRN
              </label>
            </div>
            <RemoveButton onClick={() => removeMedication(index)} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default MedicationsForm;
