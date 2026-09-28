
import { useEffect, useState } from "react";
import {
  Bell,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/ProviderSettings.css";

function Settings() {
  const [settings, setSettings] = useState({
    appointmentReminders: true,
    emailNotifications: false,
    paymentNotifications: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] =
    useState(false);

  // =========================================
  // FETCH SETTINGS
  // =========================================

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/providers/settings"
      );

      const data = response.data?.data;

      if (data) {
        setSettings({
          appointmentReminders:
            data.appointmentReminders ?? true,

          emailNotifications:
            data.emailNotifications ?? false,

          paymentNotifications:
            data.paymentNotifications ?? true,
        });
      }
    } catch (error) {
      console.error(
        "Fetch provider settings error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // =========================================
  // TOGGLE
  // =========================================

  const handleToggle = (name) => {
    setSettings((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));

    setError("");
  };

  // =========================================
  // SAVE SETTINGS
  // =========================================

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await api.put(
        "/providers/settings",
        {
          appointmentReminders:
            settings.appointmentReminders,

          paymentNotifications:
            settings.paymentNotifications,

          emailNotifications:
            settings.emailNotifications,
        }
      );

      const updatedSettings =
        response.data?.data;

      if (updatedSettings) {
        setSettings({
          appointmentReminders:
            updatedSettings.appointmentReminders ??
            true,

          emailNotifications:
            updatedSettings.emailNotifications ??
            false,

          paymentNotifications:
            updatedSettings.paymentNotifications ??
            true,
        });
      }

      // Show center success popup
      setShowSuccessModal(true);
    } catch (error) {
      console.error(
        "Update provider settings error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="provider-settings-page">
        <div className="provider-settings-loading">
          <Loader2
            size={20}
            className="provider-settings-loading-icon"
          />

          Loading settings...
        </div>
      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="provider-settings-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="provider-settings-header">
        <h1>Settings</h1>

        <p>
          Manage your account preferences and
          notification settings.
        </p>
      </div>

      {/* =====================================
          ERROR MESSAGE
      ===================================== */}

      {error && (
        <div className="provider-settings-alert error">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="provider-settings-layout">

        {/* =====================================
            ACCOUNT
        ===================================== */}

        <section className="provider-settings-card">
          <div className="provider-settings-card-header">
            <div className="provider-settings-card-icon">
              <UserRound size={19} />
            </div>

            <div>
              <h2>Account</h2>

              <p>
                Manage your provider account
                preferences.
              </p>
            </div>
          </div>

          <div className="provider-settings-info-list">

            <div className="provider-settings-info-item">
              <div className="provider-settings-info-icon">
                <UserRound size={16} />
              </div>

              <div>
                <span>Profile</span>

                <strong>
                  Manage your professional
                  information
                </strong>
              </div>
            </div>

            <div className="provider-settings-info-item">
              <div className="provider-settings-info-icon">
                <Lock size={16} />
              </div>

              <div>
                <span>Password</span>

                <strong>
                  Keep your account secure
                </strong>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================
            NOTIFICATIONS
        ===================================== */}

        <section className="provider-settings-card">

          <div className="provider-settings-card-header">
            <div className="provider-settings-card-icon">
              <Bell size={19} />
            </div>

            <div>
              <h2>Notifications</h2>

              <p>
                Choose which updates you want
                to receive.
              </p>
            </div>
          </div>

          <form
            className="provider-settings-form"
            onSubmit={handleSave}
          >

            {/* APPOINTMENT REMINDERS */}

            <div className="provider-settings-option">

              <div className="provider-settings-option-icon">
                <Bell size={17} />
              </div>

              <div className="provider-settings-option-content">
                <strong>
                  Appointment Reminders
                </strong>

                <span>
                  Receive reminders about your
                  upcoming appointments.
                </span>
              </div>

              <button
                type="button"
                className={`provider-settings-toggle ${
                  settings.appointmentReminders
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleToggle(
                    "appointmentReminders"
                  )
                }
                aria-label="Toggle appointment reminders"
              >
                <span></span>
              </button>

            </div>

            {/* EMAIL NOTIFICATIONS */}

            <div className="provider-settings-option">

              <div className="provider-settings-option-icon">
                <Mail size={17} />
              </div>

              <div className="provider-settings-option-content">
                <strong>
                  Email Notifications
                </strong>

                <span>
                  Receive important updates and
                  account notifications by email.
                </span>
              </div>

              <button
                type="button"
                className={`provider-settings-toggle ${
                  settings.emailNotifications
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleToggle(
                    "emailNotifications"
                  )
                }
                aria-label="Toggle email notifications"
              >
                <span></span>
              </button>

            </div>

            {/* PAYMENT NOTIFICATIONS */}

            <div className="provider-settings-option">

              <div className="provider-settings-option-icon">
                <ShieldCheck size={17} />
              </div>

              <div className="provider-settings-option-content">
                <strong>
                  Payment Notifications
                </strong>

                <span>
                  Get notified when appointment
                  payments are completed.
                </span>
              </div>

              <button
                type="button"
                className={`provider-settings-toggle ${
                  settings.paymentNotifications
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleToggle(
                    "paymentNotifications"
                  )
                }
                aria-label="Toggle payment notifications"
              >
                <span></span>
              </button>

            </div>

            {/* SAVE */}

            <div className="provider-settings-actions">

              <button
                type="submit"
                className="provider-settings-save-button"
                disabled={saving}
              >

                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="provider-settings-loading-icon"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />

                    Save Settings
                  </>
                )}

              </button>

            </div>

          </form>
        </section>

        {/* =====================================
            SECURITY
        ===================================== */}

        <section className="provider-settings-card">

          <div className="provider-settings-card-header">

            <div className="provider-settings-card-icon">
              <Lock size={19} />
            </div>

            <div>
              <h2>Security</h2>

              <p>
                Manage your account security.
              </p>
            </div>

          </div>

          <div className="provider-settings-security">

            <div className="provider-settings-security-icon">
              <ShieldCheck size={21} />
            </div>

            <div>

              <strong>
                Your account is protected
              </strong>

              <span>
                Keep your password private and use
                a strong password for better account
                security.
              </span>

            </div>

          </div>

        </section>

      </div>

      {/* =====================================
          SUCCESS POPUP
      ===================================== */}

      {showSuccessModal && (
        <div
          className="provider-settings-modal-overlay"
          onClick={() =>
            setShowSuccessModal(false)
          }
        >
          <div
            className="provider-settings-success-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="provider-settings-modal-close"
              onClick={() =>
                setShowSuccessModal(false)
              }
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="provider-settings-modal-icon">
              <CheckCircle2 size={46} />
            </div>

            <h2>Settings Updated</h2>

            <p>
              Your settings have been updated
              successfully.
            </p>

            <button
              type="button"
              className="provider-settings-modal-button"
              onClick={() =>
                setShowSuccessModal(false)
              }
            >
              OK
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;

