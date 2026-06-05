import { useCallback, useState } from 'react';

const STEP_OPTIONS = [1, 10, 100];

function MedicationAdminTab({ medicationState, onAdjustMedication, disabled }) {
  // Staged dose edits keyed by medication id. Until "Apply" is pressed the
  // backend is not updated, so providers can dial in a dose before committing.
  const [draftDoses, setDraftDoses] = useState({});
  // Per-medication increment size used by the ▲/▼ arrows (1, 10, or 100).
  const [stepSizes, setStepSizes] = useState({});

  const getStepSize = useCallback(
    (medicationId) => stepSizes[medicationId] || 1,
    [stepSizes]
  );

  const setStepSize = useCallback((medicationId, size) => {
    setStepSizes((prev) => ({ ...prev, [medicationId]: size }));
  }, []);

  const clampDose = useCallback((value, min, max) => {
    let next = value;
    if (next < 0) next = 0;
    if (min !== null && min !== undefined && next < min) next = min;
    if (max !== null && max !== undefined && next > max) next = max;
    return next;
  }, []);

  const setDraftDose = useCallback((medicationId, value) => {
    setDraftDoses((prev) => ({ ...prev, [medicationId]: value }));
  }, []);

  const handleIncrement = useCallback(
    (medicationId, currentDraft, min, max) => {
      const step = getStepSize(medicationId);
      setDraftDose(medicationId, clampDose(currentDraft + step, min, max));
    },
    [clampDose, getStepSize, setDraftDose]
  );

  const handleDecrement = useCallback(
    (medicationId, currentDraft, min, max) => {
      const step = getStepSize(medicationId);
      setDraftDose(medicationId, clampDose(currentDraft - step, min, max));
    },
    [clampDose, getStepSize, setDraftDose]
  );

  const handleInputChange = useCallback(
    (medicationId, value) => {
      if (value === '') {
        setDraftDose(medicationId, '');
        return;
      }
      const parsed = parseFloat(value);
      if (!Number.isFinite(parsed)) return;
      setDraftDose(medicationId, parsed);
    },
    [setDraftDose]
  );

  const handleApply = useCallback(
    (medicationId, draftDose, min, max) => {
      const parsed = typeof draftDose === 'number' ? draftDose : parseFloat(draftDose);
      if (!Number.isFinite(parsed)) return;
      const finalDose = clampDose(parsed, min, max);
      if (onAdjustMedication) {
        onAdjustMedication(medicationId, finalDose);
      }
      // Reset the draft so it tracks the committed value again.
      setDraftDoses((prev) => {
        const next = { ...prev };
        delete next[medicationId];
        return next;
      });
    },
    [clampDose, onAdjustMedication]
  );

  const formatLimit = (value, unit) => {
    if (value === null || value === undefined) {
      return 'No limit';
    }
    return `${value} ${unit || 'units'}`;
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
        const draftDose =
          draftDoses[medId] !== undefined ? draftDoses[medId] : med.dose;
        const numericDraft =
          typeof draftDose === 'number' ? draftDose : parseFloat(draftDose);
        const hasValidDraft = Number.isFinite(numericDraft);
        const atMin = hasMin && hasValidDraft && numericDraft <= med.min;
        const atMax = hasMax && hasValidDraft && numericDraft >= med.max;
        const isDirty = hasValidDraft && numericDraft !== med.dose;
        const activeStep = getStepSize(medId);

        return (
          <div key={medId} className="med-admin-card">
            <div className="med-admin-header">
              <span className="med-admin-name">{med.name || medId}</span>
              <span className="med-admin-current">
                Current: {formatLimit(med.dose, med.unit)}
              </span>
            </div>
            <div className="med-admin-step-row">
              <span className="med-admin-step-label">Step</span>
              {STEP_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`med-admin-step-btn ${
                    activeStep === size ? 'active' : ''
                  }`}
                  onClick={() => setStepSize(medId, size)}
                  disabled={disabled}
                  aria-pressed={activeStep === size}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="med-admin-controls">
              <button
                type="button"
                className="med-admin-btn decrement"
                onClick={() =>
                  handleDecrement(medId, hasValidDraft ? numericDraft : 0, med.min, med.max)
                }
                disabled={disabled || atMin || (hasValidDraft && numericDraft <= 0)}
                aria-label={`Decrease dose by ${activeStep}`}
              >
                ▼
              </button>
              <div className="med-admin-value">
                <input
                  type="number"
                  className="med-admin-input"
                  value={draftDose}
                  min={hasMin ? med.min : 0}
                  max={hasMax ? med.max : undefined}
                  step={activeStep}
                  onChange={(e) => handleInputChange(medId, e.target.value)}
                  disabled={disabled}
                />
                <span className="med-admin-unit">{med.unit || 'units'}</span>
              </div>
              <button
                type="button"
                className="med-admin-btn increment"
                onClick={() =>
                  handleIncrement(medId, hasValidDraft ? numericDraft : 0, med.min, med.max)
                }
                disabled={disabled || atMax}
                aria-label={`Increase dose by ${activeStep}`}
              >
                ▲
              </button>
            </div>
            <div className="med-admin-apply-row">
              <button
                type="button"
                className="med-admin-apply"
                onClick={() => handleApply(medId, draftDose, med.min, med.max)}
                disabled={disabled || !isDirty}
              >
                Apply
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
