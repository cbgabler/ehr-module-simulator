/**
 * Reusable add button component for array fields
 */
function AddButton({ onClick, children = "+ Add" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="modal-button secondary"
      style={{ padding: "var(--ehr-spacing-xs) var(--ehr-spacing-md)" }}
    >
      {children}
    </button>
  );
}

export default AddButton;
