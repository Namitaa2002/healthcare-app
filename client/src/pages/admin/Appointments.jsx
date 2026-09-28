import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  Stethoscope,
  UserRound,
} from "lucide-react";

import api from "../../services/api";

import "../../styles/adminAppointments.css";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/appointments");

      setAppointments(response.data?.data || []);
    } catch (error) {
      console.error(
        "Fetch appointments error:",
        error
      );

      setAppointments([]);

      setError(
        error.response?.data?.message ||
          "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatFullDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "confirmed";

      case "PENDING":
        return "pending";

      case "CANCELLED":
        return "cancelled";

      case "COMPLETED":
        return "completed";

      case "NO_SHOW":
        return "no-show";

      default:
        return "default";
    }
  };

  const getPaymentClass = (status) => {
    switch (status) {
      case "PAID":
        return "paid";

      case "PENDING":
        return "payment-pending";

      case "FAILED":
        return "failed";

      case "REFUNDED":
        return "refunded";

      default:
        return "default";
    }
  };

  const totalAppointments = appointments.length;

  const confirmedAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "CONFIRMED"
      ).length,
    [appointments]
  );

  const pendingAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "PENDING"
      ).length,
    [appointments]
  );

  const paidAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.paymentStatus === "PAID"
      ).length,
    [appointments]
  );

  return (
    <div className="admin-appointments-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="admin-appointments-header">
        <div>
          <span className="admin-appointments-eyebrow">
            Organization
          </span>

          <h1>Appointments</h1>

          <p>
            View and manage appointments across
            your healthcare organization.
          </p>
        </div>

        <div className="admin-appointments-count">
          <CalendarDays size={18} />

          <span>
            {totalAppointments}{" "}
            {totalAppointments === 1
              ? "Appointment"
              : "Appointments"}
          </span>
        </div>
      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="admin-appointments-alert">
          {error}
        </div>
      )}

      {/* =========================================
          SUMMARY STATS
      ========================================= */}

      {!loading && !error && (
        <div className="admin-appointment-stats">

          <div className="admin-appointment-stat">
            <div className="admin-appointment-stat-icon">
              <CalendarDays size={18} />
            </div>

            <div>
              <span>Total</span>

              <strong>
                {totalAppointments}
              </strong>
            </div>
          </div>

          <div className="admin-appointment-stat">
            <div className="admin-appointment-stat-icon">
              <Clock3 size={18} />
            </div>

            <div>
              <span>Pending</span>

              <strong>
                {pendingAppointments}
              </strong>
            </div>
          </div>

          <div className="admin-appointment-stat">
            <div className="admin-appointment-stat-icon">
              <Stethoscope size={18} />
            </div>

            <div>
              <span>Confirmed</span>

              <strong>
                {confirmedAppointments}
              </strong>
            </div>
          </div>

          <div className="admin-appointment-stat">
            <div className="admin-appointment-stat-icon">
              <span className="admin-appointment-stat-symbol">
                ₹
              </span>
            </div>

            <div>
              <span>Paid</span>

              <strong>
                {paidAppointments}
              </strong>
            </div>
          </div>

        </div>
      )}

      {/* =========================================
          APPOINTMENT CARD
      ========================================= */}

      <section className="admin-appointments-card">

        <div className="admin-appointments-card-header">
          <div>
            <span className="admin-appointments-eyebrow">
              Appointment Directory
            </span>

            <h2>All Appointments</h2>
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="admin-appointments-loading">
            <Loader2
              size={22}
              className="admin-appointments-loading-icon"
            />

            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          /* EMPTY */

          <div className="admin-appointments-empty">
            <div className="admin-appointments-empty-icon">
              <CalendarDays size={28} />
            </div>

            <h3>No appointments found</h3>

            <p>
              Appointments booked by patients will
              appear here.
            </p>
          </div>
        ) : (
          /* APPOINTMENT LIST */

          <div className="admin-appointments-list">

            {appointments.map(
              (appointment) => {
                const patient =
                  appointment.patient?.user;

                const provider =
                  appointment.provider?.user;

                const service =
                  appointment.service;

                const branch =
                  appointment.branch;

                return (
                  <div
                    className="admin-appointment-item"
                    key={appointment.id}
                  >

                    {/* DATE */}

                    <div className="admin-appointment-date-box">
                      <CalendarDays size={18} />

                      <div>
                        <span>Date</span>

                        <strong>
                          {formatDate(
                            appointment.appointmentDate
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* MAIN INFORMATION */}

                    <div className="admin-appointment-main">

                      <div className="admin-appointment-title-row">

                        <h3>
                          {service?.name ||
                            "Service not available"}
                        </h3>

                        <span
                          className={`admin-appointment-status ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          {appointment.status ||
                            "UNKNOWN"}
                        </span>

                      </div>

                      <div className="admin-appointment-details">

                        <span>
                          <UserRound size={14} />

                          Patient:{" "}
                          <strong>
                            {patient?.name ||
                              "Not available"}
                          </strong>
                        </span>

                        <span>
                          <Stethoscope size={14} />

                          Provider:{" "}
                          <strong>
                            Dr.{" "}
                            {provider?.name ||
                              "Not available"}
                          </strong>
                        </span>

                      </div>

                      <div className="admin-appointment-meta">

                        <span>
                          <Clock3 size={13} />

                          {appointment.startTime}{" "}
                          -{" "}
                          {appointment.endTime}
                        </span>

                        <span>
                          <MapPin size={13} />

                          {branch?.name ||
                            "Branch not available"}
                        </span>

                        <span>
                          {formatFullDate(
                            appointment.appointmentDate
                          )}
                        </span>

                      </div>

                    </div>

                    {/* PAYMENT */}

                    <div className="admin-appointment-payment">

                      <span>
                        Payment
                      </span>

                      <strong>
                        ₹
                        {Number(
                          service?.price || 0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <span
                        className={`admin-payment-status ${getPaymentClass(
                          appointment.paymentStatus
                        )}`}
                      >
                        {appointment.paymentStatus ||
                          "UNKNOWN"}
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>
    </div>
  );
}

export default Appointments;