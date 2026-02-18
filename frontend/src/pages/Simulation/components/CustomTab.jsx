import { useCallback } from "react";

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
