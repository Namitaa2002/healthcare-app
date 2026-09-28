import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/adminAvailability.css";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const initialForm = {
  dayOfWeek: "",
  startTime: "",
  endTime: "",
};

function Availability() {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] =
    useState("");

  const [availability, setAvailability] =
    useState([]);

  const [formData, setFormData] =
    useState(initialForm);

  const [loadingProviders, setLoadingProviders] =
    useState(true);

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      setError("");

      const response = await api.get(
        "/providers/admin"
      );

      setProviders(response.data?.data || []);
    } catch (error) {
      console.error(
        "Fetch providers error:",
        error
      );

      setProviders([]);

      setError(
        error.response?.data?.message ||
          "Unable to load providers."
      );
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchAvailability = async (
    providerId
  ) => {
    if (!providerId) {
      setAvailability([]);
      return;
    }

    try {
      setLoadingAvailability(true);
      setError("");

      const response = await api.get(
        `/availability/provider/${providerId}`
      );

      setAvailability(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        "Fetch availability error:",
        error
      );

      setAvailability([]);

      setError(
        error.response?.data?.message ||
          "Unable to load provider availability."
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  const getProviderName = (provider) => {
    const name =
      provider.user?.name ||
      "Provider";

    const cleanName = String(name)
      .trim()
      .replace(/^dr\.?\s+/i, "");

    return cleanName
      ? `Dr. ${cleanName}`
      : "Provider";
  };

  const getDayName = (dayOfWeek) => {
    return (
      DAYS.find(
        (day) =>
          day.value === Number(dayOfWeek)
      )?.label || "Unknown day"
    );
  };

  const handleProviderChange = (event) => {
    const providerId =
      event.target.value;

    setSelectedProvider(providerId);
    setAvailability([]);
    setFormData(initialForm);
    setError("");
    setSuccess("");

    fetchAvailability(providerId);
  };

  const handleFormChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleAddAvailability = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedProvider) {
      setError(
        "Please select a provider."
      );
      return;
    }

    if (
      formData.dayOfWeek === "" ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setError(
        "Please select a day and enter start and end time."
      );
      return;
    }

    if (
      formData.startTime >=
      formData.endTime
    ) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    const alreadyExists =
      availability.some(
        (item) =>
          Number(item.dayOfWeek) ===
            Number(formData.dayOfWeek) &&
          item.isActive
      );

    if (alreadyExists) {
      setError(
        "Availability for this day already exists."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        "/availability",
        {
          providerId: selectedProvider,
          dayOfWeek: Number(
            formData.dayOfWeek
          ),
          startTime:
            formData.startTime,
          endTime:
            formData.endTime,
        }
      );

      if (response.data?.success) {
        setSuccess(
          "Provider availability added successfully."
        );

        setFormData(initialForm);

        await fetchAvailability(
          selectedProvider
        );
      }
    } catch (error) {
      console.error(
        "Create availability error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to add provider availability."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedProviderData =
    providers.find(
      (provider) =>
        provider.id === selectedProvider
    );

  return (
    <div className="admin-availability-page">
      <div className="admin-availability-header">
        <div>
          <span className="admin-availability-eyebrow">
            Organization
          </span>

          <h1>Provider Availability</h1>

          <p>
            Set the weekly schedule for each
            healthcare provider.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-availability-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-availability-alert success">
          {success}
        </div>
      )}

      <div className="admin-availability-layout">
        {/* SELECT PROVIDER */}
        <section className="admin-availability-card">
          <div className="admin-availability-card-header">
            <div className="admin-availability-icon">
              <UserRound size={22} />
            </div>

            <div>
              <span className="admin-availability-eyebrow">
                Provider
              </span>

              <h2>Select Provider</h2>

              <p>
                Choose a provider to manage their
                weekly availability.
              </p>
            </div>
          </div>

          <div className="admin-availability-form">
            <label htmlFor="availability-provider">
              Healthcare Provider *
            </label>

            <div className="admin-availability-select-wrapper">
              <UserRound size={17} />

              <select
                id="availability-provider"
                value={selectedProvider}
                onChange={
                  handleProviderChange
                }
                disabled={
                  loadingProviders ||
                  saving
                }
              >
                <option value="">
                  {loadingProviders
                    ? "Loading providers..."
                    : "Select Provider"}
                </option>

                {providers.map(
                  (provider) => (
                    <option
                      key={provider.id}
                      value={provider.id}
                    >
                      {getProviderName(
                        provider
                      )}
                      {provider.specialization
                        ? ` — ${provider.specialization}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {selectedProviderData && (
            <div className="admin-availability-provider">
              <div className="admin-availability-provider-avatar">
                <UserRound size={27} />
              </div>

              <div>
                <h3>
                  {getProviderName(
                    selectedProviderData
                  )}
                </h3>

                <span>
                  {selectedProviderData.specialization ||
                    "Healthcare Provider"}
                </span>

                <small>
                  {selectedProviderData.user
                    ?.branch?.name ||
                    "Branch"}
                </small>
              </div>
            </div>
          )}
        </section>

        {/* ADD AVAILABILITY */}
        <section className="admin-availability-card">
          <div className="admin-availability-card-header">
            <div className="admin-availability-icon">
              <Plus size={22} />
            </div>

            <div>
              <span className="admin-availability-eyebrow">
                Schedule
              </span>

              <h2>Add Availability</h2>

              <p>
                Add a working day and time for
                the selected provider.
              </p>
            </div>
          </div>

          {!selectedProvider ? (
            <div className="admin-availability-empty">
              <CalendarDays size={26} />

              <p>
                Select a provider first to add
                availability.
              </p>
            </div>
          ) : (
            <form
              className="admin-availability-form"
              onSubmit={
                handleAddAvailability
              }
            >
              <div className="admin-availability-field">
                <label htmlFor="availability-day">
                  Day *
                </label>

                <div className="admin-availability-select-wrapper">
                  <CalendarDays size={17} />

                  <select
                    id="availability-day"
                    name="dayOfWeek"
                    value={
                      formData.dayOfWeek
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={saving}
                    required
                  >
                    <option value="">
                      Select Day
                    </option>

                    {DAYS.map((day) => (
                      <option
                        key={day.value}
                        value={day.value}
                      >
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-availability-time-grid">
                <div className="admin-availability-field">
                  <label htmlFor="availability-start">
                    Start Time *
                  </label>

                  <div className="admin-availability-input-wrapper">
                    <Clock3 size={17} />

                    <input
                      id="availability-start"
                      name="startTime"
                      type="time"
                      value={
                        formData.startTime
                      }
                      onChange={
                        handleFormChange
                      }
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                <div className="admin-availability-field">
                  <label htmlFor="availability-end">
                    End Time *
                  </label>

                  <div className="admin-availability-input-wrapper">
                    <Clock3 size={17} />

                    <input
                      id="availability-end"
                      name="endTime"
                      type="time"
                      value={
                        formData.endTime
                      }
                      onChange={
                        handleFormChange
                      }
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="admin-availability-add-button"
                disabled={
                  saving ||
                  !selectedProvider
                }
              >
                {saving ? (
                  <>
                    <Loader2
                      size={18}
                      className="admin-availability-loading-icon"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Availability
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </div>

      {/* CURRENT SCHEDULE */}
      <section className="admin-availability-card schedule">
        <div className="admin-availability-card-header">
          <div className="admin-availability-icon">
            <CalendarDays size={22} />
          </div>

          <div>
            <span className="admin-availability-eyebrow">
              Weekly Schedule
            </span>

            <h2>Current Availability</h2>

            <p>
              Available appointment days and
              working hours.
            </p>
          </div>
        </div>

        {!selectedProvider ? (
          <div className="admin-availability-empty">
            <CalendarDays size={27} />

            <p>
              Select a provider to view their
              availability.
            </p>
          </div>
        ) : loadingAvailability ? (
          <div className="admin-availability-loading">
            <Loader2
              size={22}
              className="admin-availability-loading-icon"
            />

            Loading availability...
          </div>
        ) : availability.length === 0 ? (
          <div className="admin-availability-empty">
            <Clock3 size={27} />

            <p>
              No availability has been added for
              this provider yet.
            </p>
          </div>
        ) : (
          <div className="admin-availability-list">
            {availability.map(
              (item) => (
                <div
                  className="admin-availability-item"
                  key={item.id}
                >
                  <div className="admin-availability-day-icon">
                    <CalendarDays size={20} />
                  </div>

                  <div className="admin-availability-item-info">
                    <h3>
                      {getDayName(
                        item.dayOfWeek
                      )}
                    </h3>

                    <div>
                      <span>
                        <Clock3 size={14} />
                        {item.startTime} -{" "}
                        {item.endTime}
                      </span>
                    </div>
                  </div>

                  <span className="admin-availability-status">
                    <CheckCircle2 size={13} />
                    Active
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default Availability;