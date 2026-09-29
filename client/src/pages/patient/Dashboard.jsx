import { useEffect, useMemo, useState } from "react";
import {
  Link,
} from "react-router-dom";

import {
  CalendarPlus,
  CalendarDays,
  CreditCard,
  ChevronRight,
  Stethoscope,
  CheckCircle2,
  Hourglass,
  CalendarCheck2,
  ArrowUpRight,
  HeartPulse,
  MapPin,
  Clock3,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "../../styles/patientDashboard.css";

function Dashboard() {
  const { user } = useAuth();

  const patientName = user?.name || "Patient";

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] =
    useState(true);
  const [appointmentError, setAppointmentError] =
    useState("");

  // =========================================
  // FETCH PATIENT APPOINTMENTS
  // =========================================

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true);
        setAppointmentError("");

        const response = await api.get("/appointments/my");

        setAppointments(response.data?.data || []);
      } catch (error) {
        console.error(
          "Fetch dashboard appointments error:",
          error
        );

        setAppointments([]);

        setAppointmentError(
          error.response?.data?.message ||
            "Unable to load your appointments."
        );
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, []);

  // =========================================
  // HELPERS
  // =========================================

  const getProviderName = (appointment) => {
    const name =
      appointment?.provider?.user?.name || "Provider";

    // Prevent "Dr. Dr. Sharma"
    const cleanName = name
      .trim()
      .replace(/^dr\.?\s*/i, "");

    return cleanName
      ? `Dr. ${cleanName}`
      : "Dr. Provider";
  };

  const getAppointmentDate = (appointment) => {
    if (!appointment?.appointmentDate) {
      return null;
    }

    const date = new Date(
      appointment.appointmentDate
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const getAppointmentDateTime = (appointment) => {
    const date = getAppointmentDate(appointment);

    if (!date) {
      return Number.MAX_SAFE_INTEGER;
    }

    const datePart = date.toISOString().split("T")[0];

    const startTime =
      appointment?.startTime || "00:00";

    const combinedDate = new Date(
      `${datePart}T${startTime}:00`
    );

    if (Number.isNaN(combinedDate.getTime())) {
      return date.getTime();
    }

    return combinedDate.getTime();
  };

  const formatAppointmentDate = (appointment) => {
    const date = getAppointmentDate(appointment);

    if (!date) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (appointment) => {
    const date = getAppointmentDate(appointment);

    if (!date) {
      return {
        day: "--",
        month: "---",
      };
    }

    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
    };
  };

  const getStatusClass = (status) => {
    return String(status || "PENDING").toLowerCase();
  };

  const getStatusLabel = (status) => {
    if (!status) {
      return "Pending";
    }

    return String(status)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  // =========================================
  // DASHBOARD DATA
  // =========================================

  const dashboardData = useMemo(() => {
    const now = new Date();

    const upcomingAppointments = appointments
      .filter((appointment) => {
        const appointmentTime =
          getAppointmentDateTime(appointment);

        return (
          appointmentTime >= now.getTime() &&
          ["PENDING", "CONFIRMED"].includes(
            appointment.status
          )
        );
      })
      .sort(
        (a, b) =>
          getAppointmentDateTime(a) -
          getAppointmentDateTime(b)
      );

    const completedAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "COMPLETED"
      );

    const pendingAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "PENDING"
      );

    const nextAppointment =
      upcomingAppointments.length > 0
        ? upcomingAppointments[0]
        : null;

    const recentAppointments = [...appointments]
      .sort(
        (a, b) =>
          getAppointmentDateTime(b) -
          getAppointmentDateTime(a)
      )
      .slice(0, 5);

    return {
      upcomingAppointments,
      completedAppointments,
      pendingAppointments,
      nextAppointment,
      recentAppointments,
    };
  }, [appointments]);

  const {
    upcomingAppointments,
    completedAppointments,
    pendingAppointments,
    nextAppointment,
    recentAppointments,
  } = dashboardData;

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="patient-content">

      {/* ================= WELCOME ================= */}

      <section className="dashboard-welcome">
        <div className="welcome-content">

          <span className="welcome-label">
            <HeartPulse size={15} />
            Your health matters
          </span>

          <h1>
            Good morning{" "}
            <span>
              {patientName.split(" ")[0]}
            </span>{" "}
            👋
          </h1>

          <p>
            Stay on top of your healthcare.
            Manage appointments, payments,
            and your health journey from one
            place.
          </p>

          <Link
            to="/patient/book-appointment"
            className="welcome-button"
          >
            <CalendarPlus size={18} />
            Book an Appointment
            <ArrowUpRight size={17} />
          </Link>

        </div>

        <div className="welcome-visual">

          <div className="welcome-circle large"></div>

          <div className="welcome-circle medium"></div>

          <div className="welcome-health-card">

            <div className="health-card-icon">
              <HeartPulse size={27} />
            </div>

            <div>
              <span>Health Status</span>

              <strong>
                You're doing great
              </strong>
            </div>

            <CheckCircle2 size={22} />

          </div>

        </div>
      </section>

      {/* ================= ERROR ================= */}

      {appointmentError && (
        <div className="dashboard-api-error">

          <AlertCircle size={18} />

          <span>
            {appointmentError}
          </span>

        </div>
      )}

      {/* ================= STATS ================= */}

      <section className="dashboard-stats">

        <div className="stat-card">

          <div className="stat-icon blue">
            <CalendarCheck2 size={21} />
          </div>

          <div className="stat-content">

            <span>Upcoming</span>

            <strong>
              {loadingAppointments
                ? "—"
                : upcomingAppointments.length}
            </strong>

            <small>
              Upcoming appointments
            </small>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div className="stat-content">

            <span>Completed</span>

            <strong>
              {loadingAppointments
                ? "—"
                : completedAppointments.length}
            </strong>

            <small>
              Appointments completed
            </small>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon amber">
            <Hourglass size={21} />
          </div>

          <div className="stat-content">

            <span>Pending</span>

            <strong>
              {loadingAppointments
                ? "—"
                : pendingAppointments.length}
            </strong>

            <small>
              Awaiting confirmation
            </small>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon purple">
            <CalendarDays size={21} />
          </div>

          <div className="stat-content">

            <span>Total Visits</span>

            <strong>
              {loadingAppointments
                ? "—"
                : appointments.length}
            </strong>

            <small>
              Your healthcare visits
            </small>

          </div>

        </div>

      </section>

      {/* ================= MAIN GRID ================= */}

      <section className="dashboard-grid">

        {/* ================= UPCOMING ================= */}

        <div className="dashboard-card upcoming-card">

          <div className="card-header">

            <div>

              <span className="card-eyebrow">
                NEXT APPOINTMENT
              </span>

              <h3>
                Upcoming Appointment
              </h3>

            </div>

            <Link
              to="/patient/appointments"
              className="card-link"
            >
              View all
              <ChevronRight size={16} />
            </Link>

          </div>

          {loadingAppointments ? (

            <div className="dashboard-loading">

              <Loader2
                size={23}
                className="dashboard-loading-icon"
              />

              <span>
                Loading appointment...
              </span>

            </div>

          ) : nextAppointment ? (

            <div className="upcoming-appointment">

              <div className="upcoming-date-box">

                <CalendarDays size={20} />

                <strong>
                  {
                    formatShortDate(
                      nextAppointment
                    ).day
                  }
                </strong>

                <span>
                  {
                    formatShortDate(
                      nextAppointment
                    ).month
                  }
                </span>

              </div>

              <div className="upcoming-details">

                <span className="upcoming-label">
                  {formatAppointmentDate(
                    nextAppointment
                  )}
                </span>

                <h4>
                  {nextAppointment.service?.name ||
                    "Appointment"}
                </h4>

                <p>
                  <Stethoscope size={14} />

                  {getProviderName(
                    nextAppointment
                  )}
                </p>

                <div className="upcoming-meta">

                  <span>
                    <Clock3 size={13} />

                    {nextAppointment.startTime} -{" "}
                    {nextAppointment.endTime}
                  </span>

                  {nextAppointment.branch?.name && (
                    <span>
                      <MapPin size={13} />

                      {nextAppointment.branch.name}
                    </span>
                  )}

                </div>

                <span
                  className={`status-badge ${getStatusClass(
                    nextAppointment.status
                  )}`}
                >
                  {getStatusLabel(
                    nextAppointment.status
                  )}
                </span>

              </div>

            </div>

          ) : (

            <div className="empty-appointment">

              <div className="empty-icon">
                <CalendarDays size={28} />
              </div>

              <h4>
                No upcoming appointments
              </h4>

              <p>
                You don't have any upcoming
                appointments. Book a consultation
                with a healthcare provider.
              </p>

              <Link
                to="/patient/book-appointment"
                className="outline-action"
              >
                <CalendarPlus size={17} />
                Book Appointment
              </Link>

            </div>

          )}

        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <div className="dashboard-card quick-card">

          <div className="card-header">

            <div>

              <span className="card-eyebrow">
                QUICK ACCESS
              </span>

              <h3>
                Quick Actions
              </h3>

            </div>

          </div>

          <div className="quick-actions">

            <Link
              to="/patient/book-appointment"
              className="quick-action blue"
            >

              <span>
                <CalendarPlus size={20} />
              </span>

              <div>

                <strong>
                  Book Appointment
                </strong>

                <small>
                  Find a provider and schedule a
                  visit
                </small>

              </div>

              <ChevronRight size={17} />

            </Link>

            <Link
              to="/patient/appointments"
              className="quick-action green"
            >

              <span>
                <CalendarDays size={20} />
              </span>

              <div>

                <strong>
                  My Appointments
                </strong>

                <small>
                  View your appointment history
                </small>

              </div>

              <ChevronRight size={17} />

            </Link>

            <Link
              to="/patient/payments"
              className="quick-action purple"
            >

              <span>
                <CreditCard size={20} />
              </span>

              <div>

                <strong>
                  Payments
                </strong>

                <small>
                  View your payment history
                </small>

              </div>

              <ChevronRight size={17} />

            </Link>

          </div>

        </div>

      </section>

      {/* ================= RECENT APPOINTMENTS ================= */}

      <section className="dashboard-card recent-card">

        <div className="card-header">

          <div>

            <span className="card-eyebrow">
              ACTIVITY
            </span>

            <h3>
              Recent Appointments
            </h3>

          </div>

          <Link
            to="/patient/appointments"
            className="card-link"
          >
            View all
            <ChevronRight size={16} />
          </Link>

        </div>

        {loadingAppointments ? (

          <div className="dashboard-loading recent-loading">

            <Loader2
              size={22}
              className="dashboard-loading-icon"
            />

            <span>
              Loading appointment history...
            </span>

          </div>

        ) : recentAppointments.length === 0 ? (

          <div className="recent-empty">

            <div className="recent-empty-icon">
              <Stethoscope size={24} />
            </div>

            <div>

              <h4>
                No appointment history yet
              </h4>

              <p>
                Your completed and previous
                appointments will appear here.
              </p>

            </div>

          </div>

        ) : (

          <div className="dashboard-recent-list">

            {recentAppointments.map(
              (appointment) => {

                const shortDate =
                  formatShortDate(
                    appointment
                  );

                return (
                  <div
                    className="dashboard-recent-item"
                    key={appointment.id}
                  >

                    <div className="recent-date">

                      <strong>
                        {shortDate.day}
                      </strong>

                      <span>
                        {shortDate.month}
                      </span>

                    </div>

                    <div className="recent-info">

                      <strong>
                        {appointment.service?.name ||
                          "Appointment"}
                      </strong>

                      <span>
                        {getProviderName(
                          appointment
                        )}
                      </span>

                      <small>
                        <Clock3 size={12} />

                        {appointment.startTime} -{" "}
                        {appointment.endTime}
                      </small>

                    </div>

                    <span
                      className={`status-badge ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(
                        appointment.status
                      )}
                    </span>

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

export default Dashboard;