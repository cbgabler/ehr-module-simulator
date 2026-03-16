import { useCallback } from "react";

/**
 * CustomTab Component
 * 
 * Renders a dynamically generated form section based on the scenario's custom section definition.
 * Used during an active simulation session to allow students to input data for custom fields
 * (e.g., Urine Output, Wound Assessment) defined by the scenario author.
 * 
 * @param {Object} props
 * @param {Object} props.tab - The custom tab configuration object (id, label, fields array).
 * @param {Object} props.values - Current values for the fields in this tab, keyed by field.key.
 * @param {Function} [props.onChange] - Callback fired when a field value changes: onChange(tabId, fieldKey, newValue).
 * @param {boolean} [props.disabled] - If true, disables all input fields in the tab.
 * @returns {JSX.Element} The rendered custom tab section.
 */
function CustomTab({ tab, values, onChange, disabled }) {
    if (!tab || !tab.fields || tab.fields.length === 0) {
        return (
            <div className="custom-tab-empty">
                No fields configured for this section
            </div>
        );
    }

    const handleChange = useCallback(
        (fieldKey, newValue) => {
            if (onChange) {
                onChange(tab.id, fieldKey, newValue);
            }
        },
        [tab.id, onChange]
    );

    const fieldValues = values || {};

    return (
        <div className="custom-tab">
            {tab.fields.map((field) => {
                const fieldType = field.type || "text";
                const currentValue = fieldValues[field.key] ?? "";

                return (
                    <div key={field.key} className="custom-tab-field">
                        <label className="custom-tab-label" htmlFor={`custom-${tab.id}-${field.key}`}>
                            {field.label}
                            {field.unit && <span className="custom-tab-unit">({field.unit})</span>}
                        </label>
                        {fieldType === "textarea" ? (
                            <textarea
                                id={`custom-${tab.id}-${field.key}`}
                                className="custom-tab-textarea"
                                placeholder={field.placeholder || ""}
                                value={currentValue}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                disabled={disabled}
                                rows={3}
                            />
                        ) : (
                            <input
                                id={`custom-${tab.id}-${field.key}`}
                                className="custom-tab-input"
                                type={fieldType}
                                placeholder={field.placeholder || ""}
                                value={currentValue}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                disabled={disabled}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default CustomTab;
