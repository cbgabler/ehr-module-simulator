/**
 * Reusable remove/delete button component
 */
function RemoveButton({ onClick, disabled = false, children = "Remove" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)",
        backgroundColor: disabled ? "var(--ehr-border)" : "var(--ehr-error)",
        color: "var(--ehr-text-inverse)",
        border: "none",
        borderRadius: "var(--ehr-radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default RemoveButton;
