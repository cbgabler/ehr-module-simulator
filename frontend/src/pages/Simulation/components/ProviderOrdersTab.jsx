function ProviderOrdersTab({ orders }) {
  if (!orders || orders.length === 0) {
    return <div className="no-orders">No provider orders</div>;
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getPriorityClass = (priority) => {
    if (!priority) return "routine";
    const p = priority.toLowerCase();
    if (p === "stat" || p === "emergency") return "stat";
    if (p === "urgent" || p === "asap") return "urgent";
    return "routine";
  };

  return (
    <div className="orders-tab">
      {orders.map((order, index) => (
        <div key={order.id || index} className="order-card">
          <div className="order-header">
            <span className="order-type">{order.type || "Order"}</span>
            {order.priority && (
              <span className={`order-priority ${getPriorityClass(order.priority)}`}>
                {order.priority}
              </span>
            )}
          </div>
          <div className="order-description">{order.description}</div>
          <div className="order-meta">
            {order.orderedBy && <span>Ordered by: {order.orderedBy}</span>}
            {order.orderedAt && <span>At: {formatDateTime(order.orderedAt)}</span>}
            {order.status && <span>Status: {order.status}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProviderOrdersTab;
