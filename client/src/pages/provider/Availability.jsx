
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/ProviderAvailability.css";

function Availability() {
  const [availability, setAvailability] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const days = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/availability/provider/my"
      );

      setAvailability(response.data?.data || []);
    } catch (error) {
      console.error(
        "Fetch provider availability error:",
        error
      );

      setAvailability([]);

      setError(
        error.response?.data?.message ||
          "Unable to load your availability."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const resetForm = () => {
    setDayOfWeek("");
    setStartTime("");
    setEndTime("");
    setEditingId(null);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
    setError("");
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleEditAvailability = (slot) => {
    setEditingId(slot.id);
    setDayOfWeek(String(slot.dayOfWeek));
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);

    setShowForm(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const sortAvailability = (items) => {
    return [...items].sort((a, b) => {
      if (Number(a.dayOfWeek) !== Number(b.dayOfWeek)) {
        return (
          Number(a.dayOfWeek) -
          Number(b.dayOfWeek)
        );
      }

      return String(a.startTime).localeCompare(
        String(b.startTime)
      );
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      dayOfWeek === "" ||
      !startTime ||
      !endTime
    ) {
      setError(
        "Please select a day and enter both start and end time."
      );
      return;
    }

    if (startTime >= endTime) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      };

      if (editingId) {
        // UPDATE EXISTING AVAILABILITY
        const response = await api.put(
          `/availability/provider/my/${editingId}`,
          payload
        );

        const updatedAvailability =
          response.data?.data;

        if (updatedAvailability) {
          setAvailability((previous) =>
            sortAvailability(
              previous.map((item) =>
                item.id === editingId
                  ? updatedAvailability
                  : item
              )
            )
          );
        } else {
          await fetchAvailability();
        }

        setSuccess(
          "Availability updated successfully."
        );
      } else {
        // CREATE NEW AVAILABILITY
        const response = await api.post(
          "/availability/provider/my",
          payload
        );

        const newAvailability =
          response.data?.data;

        if (newAvailability) {
          setAvailability((previous) =>
            sortAvailability([
              ...previous,
              newAvailability,
            ])
          );
        } else {
          await fetchAvailability();
        }

        setSuccess(
          "Availability added successfully."
        );
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(
        editingId
          ? "Update provider availability error:"
          : "Create provider availability error:",
        error
      );

      setError(
        error.response?.data?.message ||
          (editingId
            ? "Unable to update availability."
            : "Unable to add availability.")
      );
    } finally {
      setSaving(false);
    }
  };

  const groupedAvailability = days.map(
    (day) => ({
      ...day,
      slots: availability.filter(
        (item) =>
          Number(item.dayOfWeek) === day.value
      ),
    })
  );

  return (
    <div className="provider-page">
      {/* PAGE HEADER */}
      <div className="provider-page-header">
        <div>
          <span className="provider-page-eyebrow">
            Schedule
          </span>

          <h1>Availability</h1>

          <p>
            Manage the days and times when patients
            can book appointments with you.
          </p>
        </div>

        <button
          type="button"
          className="provider-add-availability-button"
          onClick={handleOpenAddForm}
        >
          <Plus size={17} />
          Add Availability
        </button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="provider-page-success">
          <CheckCircle2 size={18} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Close success message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && !showForm && (
        <div className="provider-page-error">
          <AlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div className="provider-availability-form-card">
          <div className="provider-availability-form-header">
            <div>
              <span>
                {editingId
                  ? "Update Schedule"
                  : "New Schedule"}
              </span>

              <h2>
                {editingId
                  ? "Edit Availability"
                  : "Add Availability"}
              </h2>

              <p>
                {editingId
                  ? "Update the weekly time when patients can book you."
                  : "Set a recurring weekly time when patients can book you."}
              </p>
            </div>

            <button
              type="button"
              className="provider-form-close"
              onClick={handleCloseForm}
              disabled={saving}
              aria-label="Close form"
            >
              <X size={19} />
            </button>
          </div>

          {error && (
            <div className="provider-form-error">
              <AlertCircle size={16} />

              <span>{error}</span>
            </div>
          )}

          <form
            className="provider-availability-form"
            onSubmit={handleSubmit}
          >
            {/* DAY */}
            <div className="provider-form-field">
              <label htmlFor="availability-day">
                Day
              </label>

              <select
                id="availability-day"
                value={dayOfWeek}
                onChange={(event) =>
                  setDayOfWeek(event.target.value)
                }
                disabled={saving}
              >
                <option value="">
                  Select day
                </option>

                {days.map((day) => (
                  <option
                    key={day.value}
                    value={day.value}
                  >
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* START TIME */}
            <div className="provider-form-field">
              <label htmlFor="availability-start">
                Start Time
              </label>

              <input
                id="availability-start"
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
                disabled={saving}
              />
            </div>

            {/* END TIME */}
            <div className="provider-form-field">
              <label htmlFor="availability-end">
                End Time
              </label>

              <input
                id="availability-end"
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
                disabled={saving}
              />
            </div>

            {/* FORM ACTIONS */}
            <div className="provider-form-actions">
              <button
                type="button"
                className="provider-form-cancel"
                onClick={handleCloseForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="provider-form-submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="provider-form-spinner"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />

                    {editingId
                      ? "Update Availability"
                      : "Save Availability"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WEEKLY SCHEDULE */}
      <div className="provider-availability-card">
        <div className="provider-availability-card-header">
          <div>
            <span>Weekly Schedule</span>

            <h2>Your Availability</h2>
          </div>

          <div className="provider-availability-total">
            {availability.length}{" "}
            {availability.length === 1
              ? "time slot"
              : "time slots"}
          </div>
        </div>

        {loading ? (
          <div className="provider-availability-loading">
            <Loader2
              size={22}
              className="provider-form-spinner"
            />

            <span>
              Loading your availability...
            </span>
          </div>
        ) : availability.length === 0 ? (
          <div className="provider-availability-empty">
            <div className="provider-empty-icon">
              <CalendarDays size={28} />
            </div>

            <h3>
              No availability added yet
            </h3>

            <p>
              Add your weekly working hours so patients
              can book appointments with you.
            </p>

            <button
              type="button"
              onClick={handleOpenAddForm}
            >
              <Plus size={16} />
              Add Availability
            </button>
          </div>
        ) : (
          <div className="provider-weekly-schedule">
            {groupedAvailability.map((day) => (
              <div
                key={day.value}
                className={`provider-day-row ${
                  day.slots.length > 0
                    ? "has-slots"
                    : ""
                }`}
              >
                <div className="provider-day-name">
                  <div className="provider-day-icon">
                    <CalendarDays size={17} />
                  </div>

                  <div>
                    <strong>
                      {day.label}
                    </strong>

                    <span>
                      {day.slots.length > 0
                        ? `${day.slots.length} ${
                            day.slots.length === 1
                              ? "schedule"
                              : "schedules"
                          }`
                        : "Not available"}
                    </span>
                  </div>
                </div>

                <div className="provider-day-slots">
                  {day.slots.length > 0 ? (
                    day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="provider-time-slot"
                      >
                        <Clock3 size={16} />

                        <span>
                          {slot.startTime}
                          {" - "}
                          {slot.endTime}
                        </span>

                        <button
                          type="button"
                          className="provider-edit-availability-button"
                          onClick={() =>
                            handleEditAvailability(
                              slot
                            )
                          }
                          aria-label={`Edit ${day.label} availability`}
                          title="Edit availability"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="provider-no-slot">
                      No availability
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INFORMATION */}
      <div className="provider-availability-note">
        <Clock3 size={17} />

        <div>
          <strong>
            How availability works
          </strong>

          <p>
            Your availability repeats every week.
            Patients can only book appointments during
            the time ranges you have added.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Availability;

