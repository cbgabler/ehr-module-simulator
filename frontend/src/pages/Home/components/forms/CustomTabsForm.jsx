import FormInput from "../shared/FormInput.jsx";
import FormSelect from "../shared/FormSelect.jsx";
import AddButton from "../shared/AddButton.jsx";
import RemoveButton from "../shared/RemoveButton.jsx";

/**
 * Custom Tabs Form Section
 * Lets instructors define custom tab sections (e.g., Urine Output, Wound Assessment)
 * with configurable blank fields that students fill in during the simulation.
 */
function CustomTabsForm({ customTabs, setCustomTabs }) {
    const addTab = () => {
        const stableId = `custom-${Date.now()}`;
        setCustomTabs([
            ...customTabs,
            {
                _internalId: stableId,
                id: stableId,
                label: "",
                fields: [{ _internalKey: "field-1", key: "field-1", label: "", type: "text", placeholder: "", unit: "" }],
            },
        ]);
    };

    const removeTab = (tabIndex) => {
        setCustomTabs(customTabs.filter((_, i) => i !== tabIndex));
    };

    const updateTab = (tabIndex, field, value) => {
        const updated = [...customTabs];
        updated[tabIndex] = { ...updated[tabIndex], [field]: value };
        // Derive slug-based id from label for data purposes, but keep _internalId stable for React keys
        if (field === "label") {
            updated[tabIndex].id = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") || updated[tabIndex]._internalId;
        }
        setCustomTabs(updated);
    };

    const addField = (tabIndex) => {
        const updated = [...customTabs];
        const fields = [...updated[tabIndex].fields];
        const stableKey = `field-${Date.now()}`;
        fields.push({
            _internalKey: stableKey,
            key: stableKey,
            label: "",
            type: "text",
            placeholder: "",
            unit: "",
        });
        updated[tabIndex] = { ...updated[tabIndex], fields };
        setCustomTabs(updated);
    };

    const removeField = (tabIndex, fieldIndex) => {
        const updated = [...customTabs];
        const fields = updated[tabIndex].fields.filter((_, i) => i !== fieldIndex);
        updated[tabIndex] = { ...updated[tabIndex], fields };
        setCustomTabs(updated);
    };

    const updateField = (tabIndex, fieldIndex, prop, value) => {
        const updated = [...customTabs];
        const fields = [...updated[tabIndex].fields];
        fields[fieldIndex] = { ...fields[fieldIndex], [prop]: value };
        // Derive slug-based key from label for data purposes, but keep _internalKey stable for React keys
        if (prop === "label") {
            fields[fieldIndex].key = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, "") || fields[fieldIndex]._internalKey;
        }
        updated[tabIndex] = { ...updated[tabIndex], fields };
        setCustomTabs(updated);
    };

    const inputStyle = {
        padding: "var(--ehr-spacing-sm)",
        borderRadius: "var(--ehr-radius-md)",
        border: "1px solid var(--ehr-border)",
        backgroundColor: "var(--ehr-bg-primary)",
        color: "var(--ehr-text-primary)",
    };

    return (
        <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
                <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>Custom Sections</h3>
                <AddButton onClick={addTab}>+ Add Section</AddButton>
            </div>

            <p style={{ color: "var(--ehr-text-secondary)", fontSize: "0.85rem", marginBottom: "var(--ehr-spacing-md)" }}>
                Define custom tab sections with blank fields for students to fill in during the simulation (e.g., Urine Output, Wound Assessment, I&amp;O Tracking).
            </p>

            {customTabs.map((tab, tabIndex) => (
                <div
                    key={tab._internalId || tab.id}
                    style={{
                        marginBottom: "var(--ehr-spacing-md)",
                        padding: "var(--ehr-spacing-md)",
                        backgroundColor: "var(--ehr-bg-secondary)",
                        borderRadius: "var(--ehr-radius-md)",
                        border: "1px solid var(--ehr-border)",
                    }}
                >
                    {/* Tab header */}
                    <div style={{ display: "flex", gap: "var(--ehr-spacing-md)", alignItems: "flex-end", marginBottom: "var(--ehr-spacing-md)" }}>
                        <div style={{ flex: 1 }}>
                            <FormInput
                                label="Section Name"
                                value={tab.label}
                                onChange={(e) => updateTab(tabIndex, "label", e.target.value)}
                                placeholder="e.g., Urine Output"
                                required
                            />
                        </div>
                        <RemoveButton onClick={() => removeTab(tabIndex)}>Remove Section</RemoveButton>
                    </div>

                    {/* Fields */}
                    <div style={{ marginLeft: "var(--ehr-spacing-md)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-sm)" }}>
                            <span style={{ fontWeight: 500, fontSize: "0.85rem", color: "var(--ehr-text-secondary)" }}>Fields</span>
                            <AddButton onClick={() => addField(tabIndex)}>+ Add Field</AddButton>
                        </div>

                        {tab.fields.map((field, fieldIndex) => (
                            <div
                                key={field._internalKey || fieldIndex}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 2fr 1fr auto",
                                    gap: "var(--ehr-spacing-sm)",
                                    marginBottom: "var(--ehr-spacing-sm)",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateField(tabIndex, fieldIndex, "label", e.target.value)}
                                    placeholder="Field label"
                                    style={inputStyle}
                                />
                                <FormSelect
                                    value={field.type}
                                    onChange={(e) => updateField(tabIndex, fieldIndex, "type", e.target.value)}
                                    options={[
                                        { value: "text", label: "Text" },
                                        { value: "number", label: "Number" },
                                        { value: "textarea", label: "Text Area" },
                                    ]}
                                />
                                <input
                                    type="text"
                                    value={field.placeholder}
                                    onChange={(e) => updateField(tabIndex, fieldIndex, "placeholder", e.target.value)}
                                    placeholder="Placeholder text"
                                    style={inputStyle}
                                />
                                <input
                                    type="text"
                                    value={field.unit}
                                    onChange={(e) => updateField(tabIndex, fieldIndex, "unit", e.target.value)}
                                    placeholder="Unit (opt)"
                                    style={inputStyle}
                                />
                                <RemoveButton
                                    onClick={() => removeField(tabIndex, fieldIndex)}
                                    disabled={tab.fields.length <= 1}
                                >
                                    ×
                                </RemoveButton>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {customTabs.length === 0 && (
                <p style={{ color: "var(--ehr-text-secondary)", fontStyle: "italic" }}>
                    No custom sections. Click &quot;+ Add Section&quot; to create blank input fields for students.
                </p>
            )}
        </div>
    );
}

export default CustomTabsForm;
