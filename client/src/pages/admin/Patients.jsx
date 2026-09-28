
import { useEffect, useState } from "react";

import {
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import api from "../../services/api";

import "../../styles/adminPatients.css";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/patients");

      setPatients(response.data?.data || []);
    } catch (error) {
      console.error("Fetch patients error:", error);

      setPatients([]);

      setError(
        error.response?.data?.message ||
          "Unable to load patients."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="admin-patients-page">
      {/* HEADER */}
      <div className="admin-patients-header">
        <div>
          <span className="admin-patients-eyebrow">
            Organization
          </span>

          <h1>Patients</h1>

          <p>
            View and manage patients registered
            in your healthcare organization.
          </p>
        </div>

        <div className="admin-patient-count">
          <UserRound size={18} />
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
        <div className="admin-patients-alert">
          {error}
        </div>
      )}

      {/* PATIENT LIST */}
      <section className="admin-patients-card">
        <div className="admin-patients-card-header">
          <div>
            <span className="admin-patients-eyebrow">
              Patient Directory
            </span>

            <h2>All Patients</h2>
          </div>
        </div>

        {loading ? (
          <div className="admin-patients-loading">
            <Loader2
              size={22}
              className="admin-patients-loading-icon"
            />

            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="admin-patients-empty">
            <div className="admin-patients-empty-icon">
              <UserRound size={28} />
            </div>

            <h3>No patients found</h3>

            <p>
              Patients registered in the organization
              will appear here.
            </p>
          </div>
        ) : (
          <div className="admin-patients-list">
            {patients.map((patient) => (
              <div
                className="admin-patient-item"
                key={patient.id}
              >
                {/* AVATAR */}
                <div className="admin-patient-avatar">
                  <UserRound size={23} />
                </div>

                {/* MAIN INFO */}
                <div className="admin-patient-info">
                  <div className="admin-patient-title-row">
                    <h3>{patient.name}</h3>

                    <span
                      className={`admin-patient-status ${
                        patient.isActive
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {patient.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="admin-patient-details">
                    <span>
                      <Mail size={14} />
                      {patient.email ||
                        "No email"}
                    </span>

                    <span>
                      <Phone size={14} />
                      {patient.phone ||
                        "No phone"}
                    </span>
                  </div>

                  <div className="admin-patient-meta">
                    <span>
                      Branch:{" "}
                      {patient.branch?.name ||
                        "Not assigned"}
                    </span>

                    {patient.gender && (
                      <span>
                        Gender: {patient.gender}
                      </span>
                    )}

                    <span>
                      DOB:{" "}
                      {formatDate(
                        patient.dateOfBirth
                      )}
                    </span>

                    <span>
                      Appointments:{" "}
                      {patient.appointmentCount || 0}
                    </span>
                  </div>
                </div>

                {/* APPOINTMENT INFO */}
                <div className="admin-patient-appointment">
                  <CalendarDays size={17} />

                  <div>
                    <span>
                      Appointments
                    </span>

                    <strong>
                      {patient.appointmentCount || 0}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Patients;
