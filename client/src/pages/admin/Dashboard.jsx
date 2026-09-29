import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  Building2,
  Stethoscope,
  BriefcaseMedical,
  Users,
  CalendarDays,
  CreditCard,
  ChevronRight,
  UserRound,
  Activity,
  CalendarCheck2,
  Clock3,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import api from "../../services/api";

import "../../styles/adminDashboard.css";

function Dashboard() {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState({
    branches: 0,
    services: 0,
    providers: 0,
    patients: 0,
    appointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    paidPayments: 0,
    recentAppointments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const adminName = user?.name || "Admin";

  /* =========================================
     FETCH ORGANIZATION DASHBOARD DATA
  ========================================= */

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/organizations/dashboard"
        );

        const data = response.data?.data || {};

        setDashboardData({
          branches: data.branches || 0,
          services: data.services || 0,
          providers: data.providers || 0,
          patients: data.patients || 0,
          appointments: data.appointments || 0,
          pendingAppointments:
            data.pendingAppointments || 0,
          completedAppointments:
            data.completedAppointments || 0,
          paidPayments:
            data.paidAppointments || 0,
          recentAppointments:
            data.recentAppointments || [],
        });
      } catch (error) {
        console.error(
          "Fetch admin dashboard data error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getProviderName = (appointment) => {
    const name =
      appointment?.provider?.user?.name ||
      "Provider";

    const cleanName = String(name)
      .trim()
      .replace(/^dr\.?\s+/i, "");

    return cleanName
      ? `Dr. ${cleanName}`
      : "Provider";
  };

  const getStatusClass = (status) => {
    return String(status || "PENDING").toLowerCase();
  };

  const getStatusLabel = (status) => {
    if (!status) return "Pending";

    return String(status)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-content">

        {/* API ERROR */}

        {error && (
          <div className="admin-api-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* WELCOME */}

        <section className="admin-welcome">
          <div className="admin-welcome-content">
            <span className="admin-welcome-label">
              <Activity size={15} />
              Organization overview
            </span>

            <h2>
              Welcome back,{" "}
              <span>
                {adminName.split(" ")[0]}
              </span>{" "}
              👋
            </h2>

            <p>
              Manage your healthcare
              organization, branches, providers,
              services, patients and
              appointments from one place.
            </p>
          </div>

          <div className="admin-welcome-visual">
            <div className="admin-welcome-circle large" />
            <div className="admin-welcome-circle medium" />

            <div className="admin-health-card">
              <div className="admin-health-icon">
                <CalendarCheck2 size={24} />
              </div>

              <div>
                <span>Appointments</span>

                <strong>
                  {loading
                    ? "Loading..."
                    : `${dashboardData.appointments} total`}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* STATISTICS */}

        <section className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <Building2 size={21} />
            </div>

            <div className="admin-stat-content">
              <span>Branches</span>

              <strong>
                {loading
                  ? "—"
                  : dashboardData.branches}
              </strong>

              <small>
                Organization branches
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <Stethoscope size={21} />
            </div>

            <div className="admin-stat-content">
              <span>Providers</span>

              <strong>
                {loading
                  ? "—"
                  : dashboardData.providers}
              </strong>

              <small>
                Healthcare providers
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon purple">
              <Users size={21} />
            </div>

            <div className="admin-stat-content">
              <span>Patients</span>

              <strong>
                {loading
                  ? "—"
                  : dashboardData.patients}
              </strong>

              <small>
                Registered patients
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon amber">
              <CalendarDays size={21} />
            </div>

            <div className="admin-stat-content">
              <span>Appointments</span>

              <strong>
                {loading
                  ? "—"
                  : dashboardData.appointments}
              </strong>

              <small>
                Total appointments
              </small>
            </div>
          </div>
        </section>

        {/* SECONDARY STATS */}

        <section className="admin-secondary-stats">
          <div className="admin-secondary-stat">
            <div>
              <span>
                Pending Appointments
              </span>

              <strong>
                {loading
                  ? "—"
                  : dashboardData.pendingAppointments}
              </strong>
            </div>

            <Clock3 size={22} />
          </div>

          <div className="admin-secondary-stat">
            <div>
              <span>
                Completed Appointments
              </span>

              <strong>
                {loading
                  ? "—"
                  : dashboardData.completedAppointments}
              </strong>
            </div>

            <CalendarCheck2 size={22} />
          </div>

          <div className="admin-secondary-stat">
            <div>
              <span>
                Paid Appointments
              </span>

              <strong>
                {loading
                  ? "—"
                  : dashboardData.paidPayments}
              </strong>
            </div>

            <CreditCard size={22} />
          </div>
        </section>

        {/* RECENT APPOINTMENTS */}

        <section className="admin-dashboard-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-card-eyebrow">
                ACTIVITY
              </span>

              <h3>
                Recent Appointments
              </h3>
            </div>

            <Link
              to="/admin/appointments"
              className="admin-card-link"
            >
              View all
              <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="admin-loading">
              <Loader2
                size={22}
                className="admin-loading-icon"
              />

              <span>
                Loading appointments...
              </span>
            </div>
          ) : dashboardData
              .recentAppointments.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">
                <CalendarDays size={26} />
              </div>

              <h4>
                No appointments yet
              </h4>

              <p>
                Patient appointments will
                appear here once they are booked.
              </p>
            </div>
          ) : (
            <div className="admin-appointments-list">
              {dashboardData.recentAppointments.map(
                (appointment) => (
                  <div
                    className="admin-appointment-item"
                    key={appointment.id}
                  >
                    <div className="admin-appointment-date">
                      <strong>
                        {new Date(
                          appointment.appointmentDate
                        ).getDate()}
                      </strong>

                      <span>
                        {new Date(
                          appointment.appointmentDate
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                          }
                        )}
                      </span>
                    </div>

                    <div className="admin-appointment-info">
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

                        <span className="admin-dot">
                          •
                        </span>

                        {appointment.patient
                          ?.user?.name ||
                          "Patient"}
                      </small>
                    </div>

                    <span
                      className={`admin-status-badge ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(
                        appointment.status
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}

        <section className="admin-dashboard-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-card-eyebrow">
                MANAGEMENT
              </span>

              <h3>
                Quick Actions
              </h3>
            </div>
          </div>

          <div className="admin-quick-actions">
            <Link
              to="/admin/branches"
              className="admin-quick-action"
            >
              <span className="blue">
                <Building2 size={20} />
              </span>

              <div>
                <strong>
                  Manage Branches
                </strong>

                <small>
                  Add and manage organization
                  branches
                </small>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link
              to="/admin/services"
              className="admin-quick-action"
            >
              <span className="green">
                <Stethoscope size={20} />
              </span>

              <div>
                <strong>
                  Manage Services
                </strong>

                <small>
                  Create and update healthcare
                  services
                </small>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link
              to="/admin/providers"
              className="admin-quick-action"
            >
              <span className="purple">
                <UserRound size={20} />
              </span>

              <div>
                <strong>
                  Manage Providers
                </strong>

                <small>
                  Manage doctors and provider
                  information
                </small>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link
              to="/admin/provider-services"
              className="admin-quick-action"
            >
              <span className="green">
                <BriefcaseMedical size={20} />
              </span>

              <div>
                <strong>
                  Provider Services
                </strong>

                <small>
                  Assign services to healthcare
                  providers
                </small>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link
              to="/admin/availability"
              className="admin-quick-action"
            >
              <span className="blue">
                <Clock3 size={20} />
              </span>

              <div>
                <strong>
                  Provider Availability
                </strong>

                <small>
                  Set provider working days
                  and hours
                </small>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link
              to="/admin/appointments"
              className="admin-quick-action"
            >
              <span className="amber">
                <CalendarDays size={20} />
              </span>

              <div>
                <strong>
                  Appointments
                </strong>

                <small>
                  View and manage all
                  appointments
                </small>
              </div>

              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;