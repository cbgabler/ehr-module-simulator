/**
 * Reusable form input component with consistent styling
 */
function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
  step,
  id,
  ...props
}) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-") || "input"}`;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
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
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        style={{
          width: "100%",
          padding: "var(--ehr-spacing-sm)",
          borderRadius: "var(--ehr-radius-md)",
          border: "1px solid var(--ehr-border)",
          backgroundColor: "var(--ehr-bg-primary)",
          color: "var(--ehr-text-primary)",
        }}
        {...props}
      />
    </div>
  );
}

export default FormInput;
