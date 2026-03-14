function VitalSignsTab({ vitals }) {
  if (!vitals) {
    return <div className="no-vitals">No vital signs available</div>;
  }

  const formatBloodPressure = (bp) => {
    if (!bp) {
      return null;
    }
    const systolic = bp.systolic != null ? Math.round(bp.systolic) : "—";
    const diastolic = bp.diastolic != null ? Math.round(bp.diastolic) : "—";
    return `${systolic}/${diastolic}`;
  };

  const getVitalStatus = (label, value) => {
    // define normal ranges for vitals
    const ranges = {
      "Heart Rate": { low: 60, high: 100, criticalLow: 40, criticalHigh: 150 },
      "Resp Rate": { low: 12, high: 20, criticalLow: 8, criticalHigh: 30 },
      "O2 Sat": { low: 95, high: 100, criticalLow: 90, criticalHigh: 101 },
      "Temperature": { low: 97, high: 99, criticalLow: 95, criticalHigh: 104 },
      "Systolic": { low: 90, high: 140, criticalLow: 70, criticalHigh: 180 },
      "Diastolic": { low: 60, high: 90, criticalLow: 40, criticalHigh: 120 },
      "Blood Glucose": { low: 70, high: 140, criticalLow: 50, criticalHigh: 300 },
    };

    const range = ranges[label];
    if (!range || typeof value !== "number") return "";

    if (value < range.criticalLow || value > range.criticalHigh) return "critical";
    if (value < range.low || value > range.high) return "warning";
    return "";
  };

  const vitalCards = [];

  // blood Pressure
  if (vitals.bloodPressure) {
    const bp = vitals.bloodPressure;
    const systolicStatus = getVitalStatus("Systolic", bp.systolic);
    const diastolicStatus = getVitalStatus("Diastolic", bp.diastolic);
    const status = systolicStatus === "critical" || diastolicStatus === "critical"
      ? "critical"
      : systolicStatus || diastolicStatus;

    vitalCards.push(
      <div key="bp" className={`vital-card ${status}`}>
        <div className="vital-label">Blood Pressure</div>
        <div className="vital-value">
          {formatBloodPressure(bp)}
          <span className="vital-unit"> {bp.unit || "mmHg"}</span>
        </div>
      </div>
    );
  }

  // heart Rate
  if (vitals.heartRate !== undefined) {
    const status = getVitalStatus("Heart Rate", vitals.heartRate);
    vitalCards.push(
      <div key="hr" className={`vital-card ${status}`}>
        <div className="vital-label">Heart Rate</div>
        <div className="vital-value">
          {Math.round(vitals.heartRate)}
          <span className="vital-unit"> bpm</span>
        </div>
      </div>
    );
  }

  // respiratory rate
  if (vitals.respiratoryRate !== undefined) {
    const status = getVitalStatus("Resp Rate", vitals.respiratoryRate);
    vitalCards.push(
      <div key="rr" className={`vital-card ${status}`}>
        <div className="vital-label">Respiratory Rate</div>
        <div className="vital-value">
          {vitals.respiratoryRate}
          <span className="vital-unit"> /min</span>
        </div>
      </div>
    );
  }

  // oxygen saturation
  if (vitals.oxygenSaturation !== undefined) {
    const status = getVitalStatus("O2 Sat", vitals.oxygenSaturation);
    vitalCards.push(
      <div key="o2" className={`vital-card ${status}`}>
        <div className="vital-label">O2 Saturation</div>
        <div className="vital-value">
          {vitals.oxygenSaturation}
          <span className="vital-unit">%</span>
        </div>
      </div>
    );
  }

  // temperature
  if (vitals.temperature !== undefined) {
    const status = getVitalStatus("Temperature", vitals.temperature);
    vitalCards.push(
      <div key="temp" className={`vital-card ${status}`}>
        <div className="vital-label">Temperature</div>
        <div className="vital-value">
          {vitals.temperature}
          <span className="vital-unit">°{vitals.temperatureUnit || "F"}</span>
        </div>
      </div>
    );
  }

  // pain level
  if (vitals.painLevel !== undefined) {
    const status = vitals.painLevel >= 7 ? "critical" : vitals.painLevel >= 4 ? "warning" : "";
    vitalCards.push(
      <div key="pain" className={`vital-card ${status}`}>
        <div className="vital-label">Pain Level</div>
        <div className="vital-value">
          {vitals.painLevel}
          <span className="vital-unit">/10</span>
        </div>
      </div>
    );
  }

  // blood glucose
  if (vitals.bloodGlucose !== undefined) {
    const status = getVitalStatus("Blood Glucose", vitals.bloodGlucose);
    vitalCards.push(
      <div key="glucose" className={`vital-card ${status}`}>
        <div className="vital-label">Blood Glucose</div>
        <div className="vital-value">
          {vitals.bloodGlucose}
          <span className="vital-unit"> mg/dL</span>
        </div>
      </div>
    );
  }

  // weight
  if (vitals.weight !== undefined) {
    vitalCards.push(
      <div key="weight" className="vital-card">
        <div className="vital-label">Weight</div>
        <div className="vital-value">
          {vitals.weight}
          <span className="vital-unit"> {vitals.weightUnit || "kg"}</span>
        </div>
      </div>
    );
  }

  if (vitalCards.length === 0) {
    return <div className="no-vitals">No vital signs recorded</div>;
  }

  return <div className="vitals-tab">{vitalCards}</div>;
}

export default VitalSignsTab;
