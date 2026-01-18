import FormInput from "../shared/FormInput.jsx";
import AddButton from "../shared/AddButton.jsx";
import RemoveButton from "../shared/RemoveButton.jsx";

/**
 * Tags Form Section
 */
function TagsForm({ tags, setTags }) {
  const addTag = () => {
    setTags([...tags, ""]);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const updateTag = (index, value) => {
    const updated = [...tags];
    updated[index] = value;
    setTags(updated);
  };

  return (
    <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
        <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>Tags</h3>
        <AddButton onClick={addTag}>+ Add Tag</AddButton>
      </div>
      {tags.map((tag, index) => (
        <div key={index} style={{ display: "flex", gap: "var(--ehr-spacing-md)", marginBottom: "var(--ehr-spacing-md)" }}>
          <input
            type="text"
            value={tag}
            onChange={(e) => updateTag(index, e.target.value)}
            placeholder="e.g., Hypertension, Cardiovascular"
            style={{
              flex: 1,
              padding: "var(--ehr-spacing-sm)",
              borderRadius: "var(--ehr-radius-md)",
              border: "1px solid var(--ehr-border)",
              backgroundColor: "var(--ehr-bg-primary)",
              color: "var(--ehr-text-primary)",
            }}
          />
          <RemoveButton onClick={() => removeTag(index)} />
        </div>
      ))}
      {tags.length === 0 && (
        <p style={{ color: "var(--ehr-text-secondary)", fontStyle: "italic" }}>
          No tags added. Primary diagnosis will be used as default tag.
        </p>
      )}
    </div>
  );
}

export default TagsForm;
