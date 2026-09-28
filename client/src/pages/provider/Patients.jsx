
import { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  Stethoscope,
  Loader2,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/ProviderPatients.css";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/patients/provider/my"
      );

      setPatients(response.data?.data || []);
    } catch (error) {
      console.error(
        "Fetch provider patients error:",
        error
      );

      setPatients([]);

      setError(
        error.response?.data?.message ||
          "Unable to load your patients."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const formatDate = (date) => {
    if (!date) return "No appointment";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="provider-page">
      {/* PAGE HEADER */}
      <div className="provider-page-header">
        <div>
          <span className="provider-page-eyebrow">
            Patient Management
          </span>

          <h1>Patients</h1>

          <p>
            View the patients who have appointments
            with you.
          </p>
        </div>

        <div className="provider-patients-count">
          <Users size={18} />

          <span>
            {patients.length}{" "}
            {patients.length === 1
              ? "Patient"
              : "Patients"}
          </span>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="provider-page-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* PATIENT CARD */}
      <div className="provider-patients-card">
        <div className="provider-patients-card-header">
          <div>
            <span>My Patients</span>
            <h2>Patient List</h2>
          </div>

          <div className="provider-patients-total">
            {patients.length}{" "}
            {patients.length === 1
              ? "patient"
              : "patients"}
          </div>
        </div>

        {loading ? (
          <div className="provider-patients-loading">
            <Loader2
              size={23}
              className="provider-patients-spinner"
            />

            <span>
              Loading your patients...
            </span>
          </div>
        ) : patients.length === 0 ? (
          <div className="provider-patients-empty">
            <div className="provider-patients-empty-icon">
              <Users size={30} />
            </div>

            <h3>No patients yet</h3>

            <p>
              Patients who book an appointment with you
              will appear here.
            </p>
          </div>
        ) : (
          <div className="provider-patients-list">
            {patients.map((patient) => {
              const user = patient.user;
              const lastAppointment =
                patient.appointments?.[0];

              return (
                <div
                  key={patient.id}
                  className="provider-patient-card"
                >
                  {/* PATIENT IDENTITY */}
                  <div className="provider-patient-identity">
                    <div className="provider-patient-avatar">
                      <UserRound size={24} />
                    </div>

                    <div>
                      <h3>
                        {user?.name ||
                          "Unnamed Patient"}
                      </h3>

                      <span>
                        Patient
                      </span>
                    </div>
                  </div>

                  {/* CONTACT */}
                  <div className="provider-patient-contact">
                    <div>
                      <Mail size={15} />

                      <span>
                        {user?.email ||
                          "Email not available"}
                      </span>
                    </div>

                    <div>
                      <Phone size={15} />

                      <span>
                        {user?.phone ||
                          "Phone not available"}
                      </span>
                    </div>
                  </div>

                  {/* LAST APPOINTMENT */}
                  <div className="provider-patient-appointment">
                    <span className="provider-patient-label">
                      Last Appointment
                    </span>

                    {lastAppointment ? (
                      <>
                        <div className="provider-patient-appointment-date">
                          <CalendarDays size={15} />

                          <strong>
                            {formatDate(
                              lastAppointment.appointmentDate
                            )}
                          </strong>
                        </div>

                        <div className="provider-patient-service">
                          <Stethoscope size={14} />

                          <span>
                            {lastAppointment
                              .service?.name ||
                              "Service"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="provider-patient-no-appointment">
                        No appointment found
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Patients;

