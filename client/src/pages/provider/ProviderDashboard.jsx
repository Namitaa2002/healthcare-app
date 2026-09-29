
import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  UserRound,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import { useAuth } from "../../context/AuthContext";

import "../../styles/ProviderDashboard.css";

function ProviderDashboard() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =========================================
     FETCH DASHBOARD DATA
  ========================================= */

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/appointments/provider/my"
      );

      setAppointments(response.data?.data || []);
    } catch (error) {
      console.error(
        "Fetch provider dashboard error:",
        error
      );

      setAppointments([]);

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* =========================================
     DATE HELPERS
  ========================================= */

  const today = useMemo(() => {
    const date = new Date();

    return date.toISOString().split("T")[0];
  }, []);

  const getAppointmentDate = (appointment) => {
    if (!appointment?.appointmentDate) {
      return "";
    }

    return new Date(
      appointment.appointmentDate
    )
      .toISOString()
      .split("T")[0];
  };

  /* =========================================
     TODAY'S APPOINTMENTS
  ========================================= */

  const todaysAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        getAppointmentDate(appointment) === today &&
        appointment.status !== "CANCELLED"
    );
  }, [appointments, today]);

  /* =========================================
     UPCOMING APPOINTMENTS
  ========================================= */

  const upcomingAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate =
        getAppointmentDate(appointment);

      return (
        appointmentDate > today &&
        appointment.status !== "CANCELLED"
      );
    });
  }, [appointments, today]);

  /* =========================================
     COMPLETED APPOINTMENTS
  ========================================= */

  const completedAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        appointment.status === "COMPLETED"
    );
  }, [appointments]);

  /* =========================================
     TOTAL PATIENTS
  ========================================= */

  const totalPatients = useMemo(() => {
    const patientIds = new Set();

    appointments.forEach((appointment) => {
      if (
        appointment.patient?.id ||
        appointment.patientId
      ) {
        patientIds.add(
          appointment.patient?.id ||
            appointment.patientId
        );
      }
    });

    return patientIds.size;
  }, [appointments]);

  /* =========================================
     RECENT PATIENTS
  ========================================= */

  const recentPatients = useMemo(() => {
    const patientMap = new Map();

    const sortedAppointments = [
      ...appointments,
    ].sort((a, b) => {
      const dateA = new Date(
        a.appointmentDate
      ).getTime();

      const dateB = new Date(
        b.appointmentDate
      ).getTime();

      return dateB - dateA;
    });

    sortedAppointments.forEach((appointment) => {
      const patient =
        appointment.patient?.user ||
        appointment.patient;

      const patientId =
        appointment.patient?.id ||
        appointment.patientId;

      if (
        patientId &&
        patient &&
        !patientMap.has(patientId)
      ) {
        patientMap.set(patientId, {
          id: patientId,
          name: patient.name || "Patient",
          email: patient.email || "",
          phone: patient.phone || "",
        });
      }
    });

    return Array.from(patientMap.values()).slice(
      0,
      5
    );
  }, [appointments]);

  /* =========================================
     PROVIDER NAME
  ========================================= */

  const getProviderName = () => {
    if (!user?.name) {
      return "Doctor";
    }

    return user.name.startsWith("Dr.")
      ? user.name
      : `Dr. ${user.name}`;
  };

  return (
    <div className="provider-dashboard-content">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="provider-header">
        <div>
          <span className="provider-page-label">
            PROVIDER PORTAL
          </span>

          <h1>Dashboard</h1>

          <p>
            Manage your appointments and patient
            care.
          </p>
        </div>

        <div className="provider-profile">
          <div className="provider-profile-avatar">
            <UserRound size={20} />
          </div>

          <div>
            <strong>
              {getProviderName()}
            </strong>

            <span>
              Healthcare Provider
            </span>
          </div>
        </div>
      </header>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="provider-error">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={fetchDashboardData}
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================
          WELCOME
      ===================================== */}

      <section className="provider-welcome">
        <div>
          <span>Welcome back</span>

          <h2>
            Good to see you, Doctor.
          </h2>

          <p>
            Here's an overview of your
            appointments and patients.
          </p>
        </div>

        <div className="provider-welcome-icon">
          <CalendarDays size={30} />
        </div>
      </section>

      {/* =====================================
          LOADING
      ===================================== */}

      {loading ? (
        <div className="provider-dashboard-loading">
          <Loader2
            size={25}
            className="provider-loading-icon"
          />

          <span>
            Loading your dashboard...
          </span>
        </div>
      ) : (
        <>
          {/* =================================
              STATS
          ================================= */}

          <section className="provider-stats">

            <div className="provider-stat-card">
              <div className="provider-stat-icon">
                <CalendarDays size={21} />
              </div>

              <div>
                <span>
                  Today's Appointments
                </span>

                <strong>
                  {todaysAppointments.length}
                </strong>
              </div>
            </div>

            <div className="provider-stat-card">
              <div className="provider-stat-icon">
                <Clock3 size={21} />
              </div>

              <div>
                <span>
                  Upcoming Appointments
                </span>

                <strong>
                  {upcomingAppointments.length}
                </strong>
              </div>
            </div>

            <div className="provider-stat-card">
              <div className="provider-stat-icon">
                <Users size={21} />
              </div>

              <div>
                <span>
                  Total Patients
                </span>

                <strong>
                  {totalPatients}
                </strong>
              </div>
            </div>

            <div className="provider-stat-card">
              <div className="provider-stat-icon">
                <UserRound size={21} />
              </div>

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {completedAppointments.length}
                </strong>
              </div>
            </div>

          </section>

          {/* =================================
              CONTENT
          ================================= */}

          <section className="provider-content-grid">

            {/* TODAY'S APPOINTMENTS */}

            <div className="provider-content-card">

              <div className="provider-card-header">
                <div>
                  <span>
                    Schedule
                  </span>

                  <h2>
                    Today's Appointments
                  </h2>
                </div>

                <button
                  type="button"
                  className="provider-card-action"
                  onClick={() =>
                    navigate(
                      "/provider/appointments"
                    )
                  }
                >
                  View all
                </button>
              </div>

              {todaysAppointments.length === 0 ? (
                <div className="provider-empty-state">

                  <CalendarDays size={30} />

                  <strong>
                    No appointments today
                  </strong>

                  <p>
                    Your scheduled appointments
                    will appear here.
                  </p>

                </div>
              ) : (
                <div className="provider-appointment-list">

                  {todaysAppointments
                    .slice(0, 5)
                    .map((appointment) => (
                      <div
                        className="provider-appointment-item"
                        key={appointment.id}
                      >

                        <div className="provider-appointment-time">
                          <Clock3 size={16} />

                          <span>
                            {appointment.startTime}{" "}
                            -{" "}
                            {appointment.endTime}
                          </span>
                        </div>

                        <div className="provider-appointment-patient">

                          <strong>
                            {appointment
                              .patient?.user
                              ?.name ||
                              appointment
                                .patient?.name ||
                              "Patient"}
                          </strong>

                          <span>
                            {appointment
                              .service
                              ?.name ||
                              "Appointment"}
                          </span>

                        </div>

                        <span
                          className={`provider-appointment-status ${appointment.status?.toLowerCase()}`}
                        >
                          {appointment.status ||
                            "PENDING"}
                        </span>

                      </div>
                    ))}

                </div>
              )}

            </div>

            {/* RECENT PATIENTS */}

            <div className="provider-content-card">

              <div className="provider-card-header">
                <div>
                  <span>
                    Patients
                  </span>

                  <h2>
                    Recent Patients
                  </h2>
                </div>

                <button
                  type="button"
                  className="provider-card-action"
                  onClick={() =>
                    navigate(
                      "/provider/patients"
                    )
                  }
                >
                  View all
                </button>
              </div>

              {recentPatients.length === 0 ? (
                <div className="provider-empty-state">

                  <Users size={30} />

                  <strong>
                    No patients yet
                  </strong>

                  <p>
                    Your recent patients
                    will appear here.
                  </p>

                </div>
              ) : (
                <div className="provider-patient-list">

                  {recentPatients.map(
                    (patient) => (
                      <div
                        className="provider-patient-item"
                        key={patient.id}
                      >

                        <div className="provider-patient-avatar">
                          <UserRound size={18} />
                        </div>

                        <div>
                          <strong>
                            {patient.name}
                          </strong>

                          <span>
                            {patient.email ||
                              patient.phone ||
                              "Patient"}
                          </span>
                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </section>
        </>
      )}
    </div>
  );
}

export default ProviderDashboard;

