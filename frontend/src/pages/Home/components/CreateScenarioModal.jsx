import { useState } from "react";
import FormInput from "./shared/FormInput.jsx";
import PatientInfoForm from "./forms/PatientInfoForm.jsx";
import VitalsForm from "./forms/VitalsForm.jsx";
import MedicationsForm from "./forms/MedicationsForm.jsx";
import OrdersForm from "./forms/OrdersForm.jsx";
import LearningObjectivesForm from "./forms/LearningObjectivesForm.jsx";
import TagsForm from "./forms/TagsForm.jsx";
import SimulationParamsForm from "./forms/SimulationParamsForm.jsx";
import MetadataForm from "./forms/MetadataForm.jsx";

function CreateScenarioModal({ onClose, onCreateSuccess }) {
  const [scenarioName, setScenarioName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientMRN, setPatientMRN] = useState("");
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [room, setRoom] = useState("");
  const [attendingPhysician, setAttendingPhysician] = useState("");
  const [allergies, setAllergies] = useState([]);
  const [systolicBP, setSystolicBP] = useState("");
  const [diastolicBP, setDiastolicBP] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [painLevel, setPainLevel] = useState("0");
  const [weight, setWeight] = useState("");
  const [medications, setMedications] = useState([
    { id: 1, name: "", dosage: "", route: "PO", frequency: "", indication: "", prn: false, titration: { min: 1, max: 100, step: 1, unit: "mg" } }
  ]);
  const [orders, setOrders] = useState([]);
  const [learningObjectives, setLearningObjectives] = useState([""]);
  const [tags, setTags] = useState([]);
  const [tickInterval, setTickInterval] = useState("5000");
  const [targetSystolic, setTargetSystolic] = useState("");
  const [targetDiastolic, setTargetDiastolic] = useState("");
  const [holdTicks, setHoldTicks] = useState("3");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [estimatedDuration, setEstimatedDuration] = useState("30-45 minutes");
  const [specialty, setSpecialty] = useState("General Nursing");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isSuccessMessage = message.toLowerCase().includes("success");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      if (!window.api?.createScenario) {
        setMessage(
          "Error: Electron API is not available. Please run this in Electron."
        );
        setIsLoading(false);
        return;
      }

      // Validation
      if (!scenarioName.trim()) {
        setMessage("Please enter a scenario name.");
        setIsLoading(false);
        return;
      }

      if (!patientName.trim() || !patientAge || !primaryDiagnosis.trim()) {
        setMessage("Please fill in all required patient information.");
        setIsLoading(false);
        return;
      }

      if (!systolicBP || !diastolicBP || !heartRate || !respiratoryRate) {
        setMessage("Please fill in all required vital signs.");
        setIsLoading(false);
        return;
      }

      const validMedications = medications.filter(m => m.name.trim() && m.dosage.trim());
      if (validMedications.length === 0) {
        setMessage("Please enter at least one medication with name and dosage.");
        setIsLoading(false);
        return;
      }

      // Generate MRN if not provided
      const mrn = patientMRN.trim() || `MRN-${Date.now()}`;
      const currentTime = new Date().toISOString();

      // Build scenario definition
      const scenarioDefinition = {
        patient: {
          name: patientName.trim(),
          age: parseInt(patientAge, 10),
          gender: patientGender,
          mrn: mrn,
          dob: new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(patientAge, 10))).toISOString().split('T')[0],
          admissionDate: currentTime,
          room: room.trim() || "TBD",
          attendingPhysician: attendingPhysician.trim() || "TBD",
          primaryDiagnosis: primaryDiagnosis.trim(),
          allergies: allergies.filter(a => a.substance.trim()).map(a => ({
            substance: a.substance.trim(),
            reaction: a.reaction.trim(),
            severity: a.severity || "Mild",
          })),
        },
        vitals: {
          current: {
            timestamp: currentTime,
            bloodPressure: {
              systolic: parseInt(systolicBP, 10),
              diastolic: parseInt(diastolicBP, 10),
              unit: "mmHg",
            },
            heartRate: parseInt(heartRate, 10),
            respiratoryRate: parseInt(respiratoryRate, 10),
            temperature: temperature ? parseFloat(temperature) : 98.6,
            temperatureUnit: "F",
            oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation, 10) : 98,
            painLevel: parseInt(painLevel, 10) || 0,
            weight: weight ? parseFloat(weight) : 150,
            weightUnit: "lbs",
          },
          history: [],
        },
        medications: validMedications.map((med, index) => {
          const medId = `med-${String(index + 1).padStart(3, '0')}`;
          const doseValue = parseFloat(med.dosage.replace(/[^0-9.]/g, '')) || 10;
          return {
            id: medId,
            name: med.name.trim(),
            dosage: med.dosage.trim(),
            route: med.route || "PO",
            frequency: med.frequency.trim() || "As ordered",
            startDate: currentTime,
            status: "Active",
            indication: med.indication.trim() || primaryDiagnosis.trim(),
            lastGiven: currentTime,
            nextDue: currentTime,
            ...(med.prn && { prn: true }),
            ...(med.titration && {
              titration: {
                min: med.titration.min || 1,
                max: med.titration.max || 100,
                step: med.titration.step || 1,
                unit: med.titration.unit || "mg",
                current: doseValue,
              },
            }),
          };
        }),
        orders: orders.filter(o => o.description.trim()).map((order, index) => ({
          id: `order-${String(index + 1).padStart(3, '0')}`,
          type: order.type || "Medication",
          description: order.description.trim(),
          orderedBy: order.orderedBy.trim() || attendingPhysician.trim() || "TBD",
          orderedAt: currentTime,
          status: order.status || "Active",
          priority: order.priority || "Routine",
        })),
        labs: [],
        notes: [],
        assessment: {},
        simulation: {
          tickIntervalMs: parseInt(tickInterval, 10) || 5000,
          baselineDrift: {
            bloodPressure: { systolic: 0.5, diastolic: 0.3 },
            heartRate: 0.1,
          },
          medicationEffects: validMedications.reduce((acc, med, index) => {
            const medId = `med-${String(index + 1).padStart(3, '0')}`;
            const doseValue = parseFloat(med.dosage.replace(/[^0-9.]/g, '')) || 10;
            acc[medId] = {
              referenceDose: doseValue,
              perUnitChange: {
                bloodPressure: { systolic: -0.5, diastolic: -0.3 },
                heartRate: -0.05,
              },
            };
            return acc;
          }, {}),
          vitalRanges: {
            bloodPressure: {
              systolic: { min: 90, max: 200 },
              diastolic: { min: 50, max: 120 },
            },
            heartRate: { min: 40, max: 150 },
            respiratoryRate: { min: 8, max: 35 },
          },
          targets: targetSystolic && targetDiastolic ? {
            description: `Stabilize BP under ${targetSystolic}/${targetDiastolic} for ${holdTicks} consecutive ticks`,
            holdTicks: parseInt(holdTicks, 10) || 3,
            vitals: {
              bloodPressure: {
                systolic: { max: parseInt(targetSystolic, 10) },
                diastolic: { max: parseInt(targetDiastolic, 10) },
              },
            },
          } : null,
          startTime: currentTime,
          simulatedTime: currentTime,
          timeMultiplier: 1,
          events: [],
        },
        learningObjectives: learningObjectives.filter(obj => obj.trim()),
        metadata: {
          difficulty: difficulty,
          estimatedDuration: estimatedDuration.trim(),
          specialty: specialty.trim(),
          tags: tags.length > 0 ? tags.filter(t => t.trim()) : [primaryDiagnosis.trim()],
        },
      };

      const result = await window.api.createScenario({
        name: scenarioName.trim(),
        definition: scenarioDefinition,
      });

      if (result.success) {
        setMessage("Scenario created successfully!");
        setTimeout(() => {
          onCreateSuccess?.();
          onClose?.();
        }, 1500);
      } else {
        setMessage(result.error || "Failed to create scenario. Please try again.");
      }
    } catch (err) {
      setMessage(`Error creating scenario: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Scenario</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Scenario Name */}
            <div style={{ marginBottom: "var(--ehr-spacing-lg)" }}>
              <FormInput
                label="Scenario Name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., Post-Operative Hypertension Management"
                required
              />
            </div>

            {/* Patient Information */}
            <PatientInfoForm
              patientName={patientName}
              setPatientName={setPatientName}
              patientAge={patientAge}
              setPatientAge={setPatientAge}
              patientGender={patientGender}
              setPatientGender={setPatientGender}
              patientMRN={patientMRN}
              setPatientMRN={setPatientMRN}
              primaryDiagnosis={primaryDiagnosis}
              setPrimaryDiagnosis={setPrimaryDiagnosis}
              room={room}
              setRoom={setRoom}
              attendingPhysician={attendingPhysician}
              setAttendingPhysician={setAttendingPhysician}
              allergies={allergies}
              setAllergies={setAllergies}
            />

            {/* Initial Vitals */}
            <VitalsForm
              systolicBP={systolicBP}
              setSystolicBP={setSystolicBP}
              diastolicBP={diastolicBP}
              setDiastolicBP={setDiastolicBP}
              heartRate={heartRate}
              setHeartRate={setHeartRate}
              respiratoryRate={respiratoryRate}
              setRespiratoryRate={setRespiratoryRate}
              temperature={temperature}
              setTemperature={setTemperature}
              oxygenSaturation={oxygenSaturation}
              setOxygenSaturation={setOxygenSaturation}
              painLevel={painLevel}
              setPainLevel={setPainLevel}
              weight={weight}
              setWeight={setWeight}
            />

            {/* Medications */}
            <MedicationsForm medications={medications} setMedications={setMedications} />

            {/* Provider Orders */}
            <OrdersForm orders={orders} setOrders={setOrders} />

            {/* Learning Objectives */}
            <LearningObjectivesForm
              learningObjectives={learningObjectives}
              setLearningObjectives={setLearningObjectives}
            />

            {/* Tags */}
            <TagsForm tags={tags} setTags={setTags} />

            {/* Simulation Parameters */}
            <SimulationParamsForm
              tickInterval={tickInterval}
              setTickInterval={setTickInterval}
              targetSystolic={targetSystolic}
              setTargetSystolic={setTargetSystolic}
              targetDiastolic={targetDiastolic}
              setTargetDiastolic={setTargetDiastolic}
              holdTicks={holdTicks}
              setHoldTicks={setHoldTicks}
            />

            {/* Scenario Metadata */}
            <MetadataForm
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              estimatedDuration={estimatedDuration}
              setEstimatedDuration={setEstimatedDuration}
              specialty={specialty}
              setSpecialty={setSpecialty}
            />

            {message && (
              <div
                style={{
                  padding: "var(--ehr-spacing-md)",
                  borderRadius: "var(--ehr-radius-md)",
                  backgroundColor: isSuccessMessage
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  color: isSuccessMessage
                    ? "var(--ehr-success)"
                    : "var(--ehr-error)",
                  marginBottom: "var(--ehr-spacing-md)",
                }}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button className="modal-button secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="modal-button primary"
              onClick={handleSubmit}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? "Creating..." : "Create Scenario"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateScenarioModal;
