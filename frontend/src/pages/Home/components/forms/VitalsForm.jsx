import FormInput from "../shared/FormInput.jsx";

/**
 * Vital Signs Form Section
 */
function VitalsForm({
  systolicBP,
  setSystolicBP,
  diastolicBP,
  setDiastolicBP,
  heartRate,
  setHeartRate,
  respiratoryRate,
  setRespiratoryRate,
  temperature,
  setTemperature,
  oxygenSaturation,
  setOxygenSaturation,
  painLevel,
  setPainLevel,
  weight,
  setWeight,
}) {
  return (
    <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
      <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
        Initial Vital Signs
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
        <FormInput
          label="Systolic BP"
          type="number"
          value={systolicBP}
          onChange={(e) => setSystolicBP(e.target.value)}
          placeholder="e.g., 158"
          min="50"
          max="250"
          required
        />
        <FormInput
          label="Diastolic BP"
          type="number"
          value={diastolicBP}
          onChange={(e) => setDiastolicBP(e.target.value)}
          placeholder="e.g., 92"
          min="30"
          max="150"
          required
        />
        <FormInput
          label="Heart Rate"
          type="number"
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
          placeholder="e.g., 88"
          min="30"
          max="200"
          required
        />
        <FormInput
          label="Respiratory Rate"
          type="number"
          value={respiratoryRate}
          onChange={(e) => setRespiratoryRate(e.target.value)}
          placeholder="e.g., 18"
          min="5"
          max="50"
          required
        />
        <FormInput
          label="Temperature (°F)"
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="e.g., 98.6"
          min="90"
          max="110"
          step="0.1"
        />
        <FormInput
          label="O2 Saturation (%)"
          type="number"
          value={oxygenSaturation}
          onChange={(e) => setOxygenSaturation(e.target.value)}
          placeholder="e.g., 96"
          min="70"
          max="100"
        />
        <FormInput
          label="Pain Level (0-10)"
          type="number"
          value={painLevel}
          onChange={(e) => setPainLevel(e.target.value)}
          placeholder="0"
          min="0"
          max="10"
        />
        <FormInput
          label="Weight (lbs)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g., 185"
          min="1"
          step="0.1"
        />
      </div>
    </div>
  );
}

export default VitalsForm;
