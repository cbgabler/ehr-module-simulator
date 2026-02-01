import { useCallback } from "react";

function MedicationAdminTab({ medicationState, onAdjustMedication, disabled }) {
  const handleIncrement = useCallback(
    (medicationId, currentDose, step, max) => {
      const newDose = currentDose + (step || 1);
      // allow if max is null/undefined
      if ((max === null || max === undefined || newDose <= max) && onAdjustMedication) {
        onAdjustMedication(medicationId, newDose);
      }
    },
    [onAdjustMedication]
  );

  const handleDecrement = useCallback(
    (medicationId, currentDose, step, min) => {
      const newDose = currentDose - (step || 1);
      // allow if min is null/undefined, doesnt go below 0
      if ((min === null || min === undefined || newDose >= min) && newDose >= 0 && onAdjustMedication) {
        onAdjustMedication(medicationId, newDose);
      }
    },
    [onAdjustMedication]
  );

  const handleInputChange = useCallback(
    (medicationId, value, min, max) => {
      const newDose = parseFloat(value);
      if (!Number.isFinite(newDose) || newDose < 0) return;

      // check min limit 
      if (min !== null && min !== undefined && newDose < min) return;
      // check max limit 
      if (max !== null && max !== undefined && newDose > max) return;

      if (onAdjustMedication) {
        onAdjustMedication(medicationId, newDose);
      }
    },
    [onAdjustMedication]
  );

  const formatLimit = (value, unit) => {
    if (value === null || value === undefined) {
      return "No limit";
    }
    return `${value} ${unit || "units"}`;
  };

  if (!medicationState || Object.keys(medicationState).length === 0) {
    return (
      <div className="no-titratable">
        No titratable medications available for this simulation
      </div>
    );
  }

  // show all meds with titration data 
  const titratableMeds = Object.entries(medicationState).filter(
    ([, med]) => med.min !== undefined || med.max !== undefined || med.dose !== undefined
  );

  if (titratableMeds.length === 0) {
    return (
      <div className="no-titratable">
        No titratable medications available for this simulation
      </div>
    );
  }

  return (
    <div className="med-admin-tab">
      {titratableMeds.map(([medId, med]) => {
        const hasMin = med.min !== null && med.min !== undefined;
        const hasMax = med.max !== null && med.max !== undefined;
        const atMin = hasMin && med.dose <= med.min;
        const atMax = hasMax && med.dose >= med.max;

        return (
          <div key={medId} className="med-admin-card">
            <div className="med-admin-header">
              <span className="med-admin-name">{med.name || medId}</span>
            </div>
            <div className="med-admin-controls">
              <button
                type="button"
                className="med-admin-btn decrement"
                onClick={() => handleDecrement(medId, med.dose, med.step, med.min)}
                disabled={disabled || atMin || med.dose <= 0}
                aria-label="Decrease dose"
              >
                ▼
              </button>
              <div className="med-admin-value">
                <input
                  type="number"
                  className="med-admin-input"
                  value={med.dose}
                  min={hasMin ? med.min : 0}
                  max={hasMax ? med.max : undefined}
                  step={med.step || 1}
                  onChange={(e) => handleInputChange(medId, e.target.value, med.min, med.max)}
                  disabled={disabled}
                />
                <span className="med-admin-unit">{med.unit || "units"}</span>
              </div>
              <button
                type="button"
                className="med-admin-btn increment"
                onClick={() => handleIncrement(medId, med.dose, med.step, med.max)}
                disabled={disabled || atMax}
                aria-label="Increase dose"
              >
                ▲
              </button>
            </div>
            <div className="med-admin-range">
              <span>Min: {formatLimit(med.min, med.unit)}</span>
              <span>Max: {formatLimit(med.max, med.unit)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MedicationAdminTab;
