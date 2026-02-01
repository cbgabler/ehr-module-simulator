function PatientInfoSidebar({ patient }) {
  if (!patient) {
    return (
      <div className="patient-sidebar">
        <p className="no-vitals">No patient information available</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="patient-sidebar">
      <div className="patient-header">
        <div className="patient-avatar">{getInitials(patient.name)}</div>
        <div className="patient-name">{patient.name || "Unknown Patient"}</div>
        <div className="patient-mrn">MRN: {patient.mrn || "N/A"}</div>
      </div>

      <div className="patient-section">
        <h4>Demographics</h4>
        <div className="patient-info-row">
          <span className="patient-info-label">Age</span>
          <span className="patient-info-value">{patient.age || "N/A"}</span>
        </div>
        <div className="patient-info-row">
          <span className="patient-info-label">Gender</span>
          <span className="patient-info-value">{patient.gender || "N/A"}</span>
        </div>
        <div className="patient-info-row">
          <span className="patient-info-label">DOB</span>
          <span className="patient-info-value">{formatDate(patient.dob)}</span>
        </div>
      </div>

      <div className="patient-section">
        <h4>Admission Info</h4>
        <div className="patient-info-row">
          <span className="patient-info-label">Room</span>
          <span className="patient-info-value">{patient.room || "N/A"}</span>
        </div>
        <div className="patient-info-row">
          <span className="patient-info-label">Admitted</span>
          <span className="patient-info-value">{formatDate(patient.admissionDate)}</span>
        </div>
        <div className="patient-info-row">
          <span className="patient-info-label">Physician</span>
          <span className="patient-info-value">{patient.attendingPhysician || "N/A"}</span>
        </div>
      </div>

      <div className="patient-section">
        <h4>Primary Diagnosis</h4>
        <div className="patient-diagnosis">
          {patient.primaryDiagnosis || "No diagnosis recorded"}
        </div>
      </div>

      <div className="patient-section">
        <h4>Allergies</h4>
        {patient.allergies && patient.allergies.length > 0 ? (
          <div className="patient-allergies">
            {patient.allergies.map((allergy, index) => (
              <div key={index} className="allergy-item">
                <span className="allergy-name">{allergy.substance}</span>
                {allergy.reaction && (
                  <span className="allergy-reaction"> - {allergy.reaction}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-allergies">No known allergies</p>
        )}
      </div>
    </div>
  );
}

export default PatientInfoSidebar;
