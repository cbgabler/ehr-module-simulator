import FormInput from "../shared/FormInput.jsx";

/**
 * Simulation Parameters Form Section
 */
function SimulationParamsForm({
  tickInterval,
  setTickInterval,
  targetSystolic,
  setTargetSystolic,
  targetDiastolic,
  setTargetDiastolic,
  holdTicks,
  setHoldTicks,
}) {
  return (
    <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
      <h3 style={{ color: "var(--ehr-primary)", marginBottom: "var(--ehr-spacing-md)" }}>
        Simulation Parameters
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--ehr-spacing-md)" }}>
        <FormInput
          label="Tick Interval (ms)"
          type="number"
          value={tickInterval}
          onChange={(e) => setTickInterval(e.target.value)}
          placeholder="5000"
          min="1000"
          max="60000"
        />
        <FormInput
          label="Target Systolic BP (optional)"
          type="number"
          value={targetSystolic}
          onChange={(e) => setTargetSystolic(e.target.value)}
          placeholder="e.g., 145"
          min="90"
          max="200"
        />
        <FormInput
          label="Target Diastolic BP (optional)"
          type="number"
          value={targetDiastolic}
          onChange={(e) => setTargetDiastolic(e.target.value)}
          placeholder="e.g., 90"
          min="50"
          max="120"
        />
      </div>
      {targetSystolic && targetDiastolic && (
        <div style={{ marginTop: "var(--ehr-spacing-md)" }}>
          <FormInput
            label="Hold Ticks Required"
            type="number"
            value={holdTicks}
            onChange={(e) => setHoldTicks(e.target.value)}
            placeholder="3"
            min="1"
            max="10"
          />
        </div>
      )}
    </div>
  );
}

export default SimulationParamsForm;
