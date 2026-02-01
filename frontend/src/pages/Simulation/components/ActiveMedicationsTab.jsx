function ActiveMedicationsTab({ medications }) {
  if (!medications || medications.length === 0) {
    return <div className="no-medications">No active medications</div>;
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="medications-tab">
      {medications.map((med, index) => (
        <div key={med.id || index} className="medication-card">
          <div className="medication-info">
            <div className="medication-name">{med.name}</div>
            <div className="medication-details">
              <div className="medication-detail">
                <span className="medication-detail-label">Dose:</span>
                <span>{med.dosage || "N/A"}</span>
              </div>
              <div className="medication-detail">
                <span className="medication-detail-label">Route:</span>
                <span>{med.route || "N/A"}</span>
              </div>
              <div className="medication-detail">
                <span className="medication-detail-label">Frequency:</span>
                <span>{med.frequency || "N/A"}</span>
              </div>
              {med.lastGiven && (
                <div className="medication-detail">
                  <span className="medication-detail-label">Last Given:</span>
                  <span>{formatDateTime(med.lastGiven)}</span>
                </div>
              )}
              {med.nextDue && (
                <div className="medication-detail">
                  <span className="medication-detail-label">Next Due:</span>
                  <span>{formatDateTime(med.nextDue)}</span>
                </div>
              )}
              {med.indication && (
                <div className="medication-detail">
                  <span className="medication-detail-label">Indication:</span>
                  <span>{med.indication}</span>
                </div>
              )}
            </div>
          </div>
          <div className="medication-badges">
            {med.prn && <span className="medication-status prn">PRN</span>}
            <span className={`medication-status ${med.status?.toLowerCase() || "active"}`}>
              {med.status || "Active"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ActiveMedicationsTab;
