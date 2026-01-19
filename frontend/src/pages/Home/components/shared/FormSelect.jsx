/**
 * Reusable form select component with consistent styling
 */
function FormSelect({
  label,
  value,
  onChange,
  options = [],
  required = false,
  id,
  ...props
}) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, "-") || "select"}`;

  return (
    <div>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            display: "block",
            marginBottom: "var(--ehr-spacing-sm)",
            color: "var(--ehr-text-primary)",
            fontWeight: 500,
          }}
        >
          {label}
          {required && <span style={{ color: "var(--ehr-error)" }}> *</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: "100%",
          padding: "var(--ehr-spacing-sm)",
          borderRadius: "var(--ehr-radius-md)",
          border: "1px solid var(--ehr-border)",
          backgroundColor: "var(--ehr-bg-primary)",
          color: "var(--ehr-text-primary)",
        }}
        {...props}
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default FormSelect;
