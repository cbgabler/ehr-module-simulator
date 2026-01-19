import FormInput from "../shared/FormInput.jsx";
import FormSelect from "../shared/FormSelect.jsx";
import AddButton from "../shared/AddButton.jsx";
import RemoveButton from "../shared/RemoveButton.jsx";

/**
 * Provider Orders Form Section
 */
function OrdersForm({ orders, setOrders }) {
  const addOrder = () => {
    setOrders([
      ...orders,
      { type: "Medication", description: "", orderedBy: "", status: "Active", priority: "Routine" },
    ]);
  };

  const removeOrder = (index) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const updateOrder = (index, field, value) => {
    const updated = [...orders];
    updated[index] = { ...updated[index], [field]: value };
    setOrders(updated);
  };

  return (
    <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--ehr-spacing-md)" }}>
        <h3 style={{ color: "var(--ehr-primary)", margin: 0 }}>Provider Orders</h3>
        <AddButton onClick={addOrder}>+ Add Order</AddButton>
      </div>
      {orders.map((order, index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr 1fr auto",
            gap: "var(--ehr-spacing-md)",
            marginBottom: "var(--ehr-spacing-md)",
            padding: "var(--ehr-spacing-md)",
            backgroundColor: "var(--ehr-bg-secondary)",
            borderRadius: "var(--ehr-radius-md)",
          }}
        >
          <FormSelect
            value={order.type}
            onChange={(e) => updateOrder(index, "type", e.target.value)}
            options={["Medication", "Vital Signs", "Activity", "Diet", "Lab", "Other"]}
          />
          <input
            type="text"
            value={order.description}
            onChange={(e) => updateOrder(index, "description", e.target.value)}
            placeholder="Order description"
            style={{
              padding: "var(--ehr-spacing-sm)",
              borderRadius: "var(--ehr-radius-md)",
              border: "1px solid var(--ehr-border)",
              backgroundColor: "var(--ehr-bg-primary)",
              color: "var(--ehr-text-primary)",
            }}
          />
          <FormSelect
            value={order.status}
            onChange={(e) => updateOrder(index, "status", e.target.value)}
            options={["Active", "Pending", "Completed"]}
          />
          <FormSelect
            value={order.priority}
            onChange={(e) => updateOrder(index, "priority", e.target.value)}
            options={["Routine", "Stat", "Urgent"]}
          />
          <RemoveButton onClick={() => removeOrder(index)} />
        </div>
      ))}
      {orders.length === 0 && (
        <p style={{ color: "var(--ehr-text-secondary)", fontStyle: "italic" }}>
          No orders added. Click "Add Order" to add one.
        </p>
      )}
    </div>
  );
}

export default OrdersForm;
