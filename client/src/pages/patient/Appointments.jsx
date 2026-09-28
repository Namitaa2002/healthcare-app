import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Stethoscope,
  Search,
  Filter,
  Loader2,
  MapPin,
} from "lucide-react";

import { Link } from "react-router-dom";

import { getMyAppointments } from "../../services/appointmentService";

function Appointments() {
  const [activeTab, setActiveTab] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyAppointments();

        setAppointments(response.data || []);
      } catch (error) {
        console.error("Fetch appointments error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load appointments. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      let matchesTab = true;

      if (activeTab === "upcoming") {
        matchesTab =
          appointment.status === "PENDING" ||
          appointment.status === "CONFIRMED";
      }

      if (activeTab === "completed") {
        matchesTab = appointment.status === "COMPLETED";
      }

      if (activeTab === "cancelled") {
        matchesTab = appointment.status === "CANCELLED";
      }

      if (!matchesTab) {
        return false;
      }

      if (!search) {
        return true;
      }

      const serviceName =
        appointment.service?.name?.toLowerCase() || "";

      const providerName =
        appointment.provider?.user?.name?.toLowerCase() || "";

      const branchName =
        appointment.branch?.name?.toLowerCase() || "";

      const status =
        appointment.status?.toLowerCase() || "";

      return (
        serviceName.includes(search) ||
        providerName.includes(search) ||
        branchName.includes(search) ||
        status.includes(search)
      );
    });
  }, [appointments, activeTab, searchTerm]);

  const getStatusClass = (status) => {
    return `status-badge ${status?.toLowerCase() || ""}`;
  };

  return (
    <div className="patient-page">
      <div className="patient-page-header">
        <div>
          <span className="page-eyebrow">YOUR HEALTHCARE</span>

          <h1>My Appointments</h1>

          <p>
            View and manage your upcoming and previous appointments.
          </p>
        </div>

        <Link
          to="/patient/book-appointment"
          className="page-primary-button"
        >
          <CalendarDays size={18} />
          Book Appointment
        </Link>
      </div>

      <div className="appointment-toolbar">
        <div className="appointment-search">
          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by doctor, service or branch..."
          />
        </div>

        <button
          type="button"
          className="filter-button"
          onClick={() => setSearchTerm("")}
        >
          <Filter size={17} />
          Clear
        </button>
      </div>

      <div className="appointment-tabs">
        <button
          type="button"
          className={`appointment-tab ${
            activeTab === "all" ? "active" : ""
          }`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>

        <button
          type="button"
          className={`appointment-tab ${
            activeTab === "upcoming" ? "active" : ""
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>

        <button
          type="button"
          className={`appointment-tab ${
            activeTab === "completed" ? "active" : ""
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>

        <button
          type="button"
          className={`appointment-tab ${
            activeTab === "cancelled" ? "active" : ""
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <div className="appointments-empty">
          <div className="appointments-empty-icon">
            <Loader2 size={30} className="loading-icon" />
          </div>

          <h2>Loading appointments...</h2>

          <p>
            Please wait while we fetch your appointments.
          </p>
        </div>
      ) : error ? (
        <div className="appointments-empty">
          <div className="appointments-empty-icon">
            <CalendarDays size={30} />
          </div>

          <h2>Unable to load appointments</h2>

          <p>{error}</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="appointments-empty">
          <div className="appointments-empty-icon">
            <CalendarDays size={30} />
          </div>

          <h2>
            {searchTerm
              ? "No matching appointments"
              : "No appointments found"}
          </h2>

          <p>
            {searchTerm
              ? "Try searching with a different doctor, service or branch name."
              : "You don't have any appointments in this category."}
          </p>

          <Link
            to="/patient/book-appointment"
            className="page-primary-button"
          >
            <Stethoscope size={18} />
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="appointment-item"
            >
              <div className="appointment-date">
                <CalendarDays size={20} />

                <span>
                  {new Date(
                    appointment.appointmentDate
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="appointment-details">
                <h3>
                  {appointment.service?.name ||
                    "Healthcare Consultation"}
                </h3>

                <p>
                  {appointment.provider?.user?.name || "Provider"}
                </p>

                <span>
                  {appointment.startTime} -{" "}
                  {appointment.endTime}
                </span>

                {appointment.branch?.name && (
                  <small>
                    <MapPin size={14} />
                    {appointment.branch.name}
                  </small>
                )}
              </div>

              <div className="appointment-status">
                <span
                  className={getStatusClass(
                    appointment.status
                  )}
                >
                  {appointment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Appointments;