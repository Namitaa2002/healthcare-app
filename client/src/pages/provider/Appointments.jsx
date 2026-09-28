
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  UserRound,
  Stethoscope,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/ProviderAppointments.css";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/appointments/provider/my");

      setAppointments(response.data?.data || []);
    } catch (error) {
      console.error("Fetch provider appointments error:", error);

      setAppointments([]);

      setError(
        error.response?.data?.message ||
          "Unable to load appointments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const getAppointmentDate = (appointment) => {
    if (!appointment?.appointmentDate) return "";

    return new Date(appointment.appointmentDate)
      .toISOString()
      .split("T")[0];
  };

  const getPatient = (appointment) => {
    return appointment?.patient?.user || appointment?.patient || {};
  };

  const filteredAppointments = useMemo(() => {
    return [...appointments]
      .filter((appointment) => {
        const appointmentDate = getAppointmentDate(appointment);

        if (activeFilter === "TODAY") {
          return (
            appointmentDate === today &&
            appointment.status !== "CANCELLED"
          );
        }

        if (activeFilter === "UPCOMING") {
          return (
            appointmentDate >= today &&
            appointment.status !== "CANCELLED" &&
            appointment.status !== "COMPLETED"
          );
        }

        if (activeFilter === "COMPLETED") {
          return appointment.status === "COMPLETED";
        }

        if (activeFilter === "CANCELLED") {
          return appointment.status === "CANCELLED";
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();

        if (dateA !== dateB) {
          return dateA - dateB;
        }

        return String(a.startTime || "").localeCompare(
          String(b.startTime || "")
        );
      });
  }, [appointments, activeFilter, today]);

  const counts = useMemo(() => {
    return {
      all: appointments.length,

      today: appointments.filter(
        (appointment) =>
          getAppointmentDate(appointment) === today &&
          appointment.status !== "CANCELLED"
      ).length,

      upcoming: appointments.filter((appointment) => {
        const appointmentDate = getAppointmentDate(appointment);

        return (
          appointmentDate >= today &&
          appointment.status !== "CANCELLED" &&
          appointment.status !== "COMPLETED"
        );
      }).length,

      completed: appointments.filter(
        (appointment) => appointment.status === "COMPLETED"
      ).length,

      cancelled: appointments.filter(
        (appointment) => appointment.status === "CANCELLED"
      ).length,
    };
  }, [appointments, today]);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDay = (date) => {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "confirmed";

      case "COMPLETED":
        return "completed";

      case "CANCELLED":
        return "cancelled";

      case "PENDING":
        return "pending";

      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 size={14} />;

      case "COMPLETED":
        return <CheckCircle2 size={14} />;

      case "CANCELLED":
        return <XCircle size={14} />;

      case "PENDING":
        return <Clock3 size={14} />;

      default:
        return <AlertCircle size={14} />;
    }
  };

  const getPaymentStatusClass = (status) => {
    if (status === "PAID") return "paid";

    if (status === "FAILED") return "failed";

    if (status === "REFUNDED") return "refunded";

    return "payment-pending";
  };

  const getPaymentLabel = (status) => {
    if (status === "PAID") return "Paid";

    if (status === "FAILED") return "Failed";

    if (status === "REFUNDED") return "Refunded";

    return "Pending";
  };

  return (
    <div className="provider-page">
      {/* PAGE HEADER */}
      <div className="provider-page-header">
        <div>
          <span className="provider-page-eyebrow">
            Schedule
          </span>

          <h1>Appointments</h1>

          <p>
            View and manage appointments scheduled with you.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="provider-page-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* FILTERS */}
      <div className="provider-appointment-filters">
        <button
          type="button"
          className={activeFilter === "ALL" ? "active" : ""}
          onClick={() => setActiveFilter("ALL")}
        >
          All
          <span>{counts.all}</span>
        </button>

        <button
          type="button"
          className={activeFilter === "TODAY" ? "active" : ""}
          onClick={() => setActiveFilter("TODAY")}
        >
          Today
          <span>{counts.today}</span>
        </button>

        <button
          type="button"
          className={
            activeFilter === "UPCOMING" ? "active" : ""
          }
          onClick={() => setActiveFilter("UPCOMING")}
        >
          Upcoming
          <span>{counts.upcoming}</span>
        </button>

        <button
          type="button"
          className={
            activeFilter === "COMPLETED" ? "active" : ""
          }
          onClick={() => setActiveFilter("COMPLETED")}
        >
          Completed
          <span>{counts.completed}</span>
        </button>

        <button
          type="button"
          className={
            activeFilter === "CANCELLED" ? "active" : ""
          }
          onClick={() => setActiveFilter("CANCELLED")}
        >
          Cancelled
          <span>{counts.cancelled}</span>
        </button>
      </div>

      {/* APPOINTMENTS */}
      <div className="provider-appointments-card">
        <div className="provider-appointments-card-header">
          <div>
            <span>Appointments</span>

            <h2>
              {activeFilter === "ALL"
                ? "All Appointments"
                : activeFilter === "TODAY"
                ? "Today's Appointments"
                : activeFilter === "UPCOMING"
                ? "Upcoming Appointments"
                : activeFilter === "COMPLETED"
                ? "Completed Appointments"
                : "Cancelled Appointments"}
            </h2>
          </div>

          <div className="provider-appointment-count">
            {filteredAppointments.length}{" "}
            {filteredAppointments.length === 1
              ? "appointment"
              : "appointments"}
          </div>
        </div>

        {loading ? (
          <div className="provider-appointments-loading">
            <Loader2
              size={22}
              className="provider-refresh-spin"
            />

            <span>Loading appointments...</span>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="provider-appointments-empty">
            <div className="provider-empty-icon">
              <CalendarDays size={28} />
            </div>

            <h3>No appointments found</h3>

            <p>
              There are no appointments available for this
              filter.
            </p>
          </div>
        ) : (
          <div className="provider-appointment-list-page">
            {filteredAppointments.map((appointment) => {
              const patient = getPatient(appointment);

              const appointmentDate =
                getAppointmentDate(appointment);

              return (
                <div
                  key={appointment.id}
                  className="provider-appointment-card"
                >
                  {/* DATE + STATUS */}
                  <div className="provider-appointment-card-top">
                    <div className="provider-appointment-date-box">
                      <CalendarDays size={17} />

                      <div>
                        <strong>
                          {formatDate(appointmentDate)}
                        </strong>

                        <span>
                          {formatDay(appointmentDate)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`provider-appointment-status ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getStatusIcon(appointment.status)}

                      {appointment.status || "UNKNOWN"}
                    </div>
                  </div>

                  {/* PATIENT + DETAILS */}
                  <div className="provider-appointment-main">
                    <div className="provider-appointment-patient-info">
                      <div className="provider-patient-avatar-large">
                        <UserRound size={24} />
                      </div>

                      <div>
                        <span>Patient</span>

                        <h3>
                          {patient.name || "Patient"}
                        </h3>

                        {patient.email && (
                          <p>{patient.email}</p>
                        )}

                        {patient.phone && (
                          <p>{patient.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="provider-appointment-details">
                      <div>
                        <Stethoscope size={17} />

                        <div>
                          <span>Service</span>

                          <strong>
                            {appointment.service?.name ||
                              "Service unavailable"}
                          </strong>
                        </div>
                      </div>

                      <div>
                        <Clock3 size={17} />

                        <div>
                          <span>Time</span>

                          <strong>
                            {appointment.startTime ||
                              "--"}{" "}
                            -{" "}
                            {appointment.endTime ||
                              "--"}
                          </strong>
                        </div>
                      </div>

                      <div>
                        <MapPin size={17} />

                        <div>
                          <span>Branch</span>

                          <strong>
                            {appointment.branch?.name ||
                              "Branch unavailable"}
                          </strong>

                          {appointment.branch?.city && (
                            <small>
                              {appointment.branch.city}

                              {appointment.branch.state
                                ? `, ${appointment.branch.state}`
                                : ""}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT */}
                  <div className="provider-appointment-card-footer">
                    <div className="provider-payment-info">
                      <span>Payment</span>

                      <strong>
                        {appointment.payment?.amount !==
                        undefined
                          ? `₹${Number(
                              appointment.payment.amount
                            ).toLocaleString("en-IN")}`
                          : appointment.service?.price !==
                            undefined
                          ? `₹${Number(
                              appointment.service.price
                            ).toLocaleString("en-IN")}`
                          : "—"}
                      </strong>

                      <small
                        className={getPaymentStatusClass(
                          appointment.payment?.status ||
                            appointment.paymentStatus
                        )}
                      >
                        {getPaymentLabel(
                          appointment.payment?.status ||
                            appointment.paymentStatus
                        )}
                      </small>
                    </div>

                    <div className="provider-appointment-id">
                      Appointment ID:{" "}
                      <span>
                        {appointment.id}
                      </span>
                    </div>
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

export default Appointments;

