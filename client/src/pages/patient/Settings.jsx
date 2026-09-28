import { useEffect, useState } from "react";

import {
  LockKeyhole,
  LogOut,
  Trash2,
  Bell,
  CreditCard,
  Mail,
  ShieldCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getSettings,
  updateSettings,
  changePassword,
  deleteAccount,
} from "../../services/settingsService";

import "../../styles/Settings.css";

function Settings() {
  const { logout } = useAuth();

  const [settings, setSettings] = useState({
    appointmentReminders: true,
    paymentUpdates: true,
    emailUpdates: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] =
    useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSettings();

        if (response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error("Fetch settings error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load your settings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const showTemporaryMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  const handleSettingChange = async (settingName) => {
    const newValue = !settings[settingName];

    setSettings((previousSettings) => ({
      ...previousSettings,
      [settingName]: newValue,
    }));

    try {
      setSaving(settingName);
      setMessage("");
      setError("");

      const response = await updateSettings({
        [settingName]: newValue,
      });

      if (response.data) {
        setSettings((previousSettings) => ({
          ...previousSettings,
          ...response.data,
        }));
      }

      showTemporaryMessage("Settings updated successfully.");
    } catch (error) {
      console.error("Update settings error:", error);

      setSettings((previousSettings) => ({
        ...previousSettings,
        [settingName]: !newValue,
      }));

      setError(
        error.response?.data?.message ||
          "Unable to update setting."
      );
    } finally {
      setSaving("");
    }
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setPasswordError("");
    setPasswordMessage("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (changingPassword) {
      return;
    }

    setShowPasswordModal(false);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordMessage("");
  };

  const handleChangePassword = async (event) => {
  event.preventDefault();

  const {
    currentPassword,
    newPassword,
    confirmPassword,
  } = passwordData;

  if (!currentPassword || !newPassword || !confirmPassword) {
    setPasswordError("Please fill in all password fields.");
    return;
  }

  if (newPassword.length < 6) {
    setPasswordError(
      "New password must be at least 6 characters long."
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError(
      "New password and confirm password do not match."
    );
    return;
  }

  try {
    setChangingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    const response = await changePassword({
      currentPassword,
      newPassword,
    });

    setPasswordMessage(
      response.message || "Password changed successfully."
    );

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  } catch (error) {
    console.error("Change password error:", error);

    setPasswordError(
      error.response?.data?.message ||
        "Unable to change password."
    );
  } finally {
    setChangingPassword(false);
  }
};

  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = async () => {
  try {
    setError("");

    await deleteAccount();

    setShowDeleteModal(false);

    logout();
  } catch (error) {
    console.error("Delete account error:", error);

    setShowDeleteModal(false);

    setError(
      error.response?.data?.message ||
        "Unable to delete your account."
    );
  }
};

  if (loading) {
    return (
      <div className="patient-page">
        <div className="patient-page-header">
          <div>
            <span className="page-eyebrow">
              ACCOUNT SETTINGS
            </span>

            <h1>Settings</h1>

            <p>
              Manage your account preferences, security and
              notifications.
            </p>
          </div>
        </div>

        <div className="settings-loading">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="patient-page">
      <div className="patient-page-header">
        <div>
          <span className="page-eyebrow">
            ACCOUNT SETTINGS
          </span>

          <h1>Settings</h1>

          <p>
            Manage your account preferences, security and
            notifications.
          </p>
        </div>
      </div>

      {message && (
        <div className="settings-success">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="settings-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="settings-grid">

        {/* ================= SECURITY ================= */}

        <div className="settings-card">
          <h3>Security</h3>

          <div className="settings-item">
            <div className="settings-item-content">
              <div className="settings-item-icon">
                <LockKeyhole size={18} />
              </div>

              <div>
                <strong>Change Password</strong>

                <p>
                  Update your account password to keep your
                  account secure.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="settings-btn"
              onClick={openPasswordModal}
            >
              Update
            </button>
          </div>
        </div>

        {/* ================= NOTIFICATIONS ================= */}

        <div className="settings-card">
          <h3>Notifications</h3>

          <div className="settings-item">
            <div className="settings-item-content">
              <div className="settings-item-icon">
                <Bell size={18} />
              </div>

              <div>
                <strong>Appointment Reminders</strong>

                <p>
                  Receive reminders about upcoming
                  appointments.
                </p>
              </div>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.appointmentReminders}
                disabled={
                  saving === "appointmentReminders"
                }
                onChange={() =>
                  handleSettingChange(
                    "appointmentReminders"
                  )
                }
              />

              <span className="settings-switch-slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <div className="settings-item-icon">
                <CreditCard size={18} />
              </div>

              <div>
                <strong>Payment Updates</strong>

                <p>
                  Get notifications about your payment
                  transactions.
                </p>
              </div>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.paymentUpdates}
                disabled={saving === "paymentUpdates"}
                onChange={() =>
                  handleSettingChange("paymentUpdates")
                }
              />

              <span className="settings-switch-slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <div className="settings-item-icon">
                <Mail size={18} />
              </div>

              <div>
                <strong>Email Updates</strong>

                <p>
                  Receive important healthcare updates by
                  email.
                </p>
              </div>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.emailUpdates}
                disabled={saving === "emailUpdates"}
                onChange={() =>
                  handleSettingChange("emailUpdates")
                }
              />

              <span className="settings-switch-slider"></span>
            </label>
          </div>
        </div>

        {/* ================= ACCOUNT ACTIONS ================= */}

        <div className="settings-card">
          <h3>Account Actions</h3>

          <div className="settings-actions">

            <button
              type="button"
              className="settings-btn logout-btn"
              onClick={() =>
                setShowLogoutModal(true)
              }
            >
              <LogOut size={15} />
              Logout
            </button>

            <button
              type="button"
              className="settings-btn danger"
              onClick={() =>
                setShowDeleteModal(true)
              }
            >
              <Trash2 size={15} />
              Delete Account
            </button>

          </div>
        </div>
      </div>

      {/* ================= CHANGE PASSWORD MODAL ================= */}

      {showPasswordModal && (
        <div
          className="settings-modal-overlay"
          onClick={closePasswordModal}
        >
          <div
            className="settings-modal password-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-modal-header">
              <div>
                <div className="settings-modal-icon">
                  <LockKeyhole size={22} />
                </div>

                <h3>Change Password</h3>

                <p>
                  Enter your current password and choose a
                  new password.
                </p>
              </div>

              <button
                type="button"
                className="settings-modal-close"
                onClick={closePasswordModal}
                disabled={changingPassword}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {passwordMessage && (
              <div className="settings-success">
                <CheckCircle2 size={16} />
                <span>{passwordMessage}</span>
              </div>
            )}

            {passwordError && (
              <div className="settings-error">
                <AlertTriangle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form
              className="password-form"
              onSubmit={handleChangePassword}
            >
              <div className="password-field">
                <label htmlFor="currentPassword">
                  Current Password
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="currentPassword"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    name="currentPassword"
                    value={
                      passwordData.currentPassword
                    }
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (value) => !value
                      )
                    }
                    aria-label="Toggle current password"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="password-field">
                <label htmlFor="newPassword">
                  New Password
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="newPassword"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
                    aria-label="Toggle new password"
                  >
                    {showNewPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="password-field">
                <label htmlFor="confirmPassword">
                  Confirm New Password
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={
                      passwordData.confirmPassword
                    }
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    aria-label="Toggle confirm password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-modal-cancel"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-modal-confirm password-confirm"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LOGOUT MODAL ================= */}

      {showLogoutModal && (
        <div
          className="settings-modal-overlay"
          onClick={() =>
            setShowLogoutModal(false)
          }
        >
          <div
            className="settings-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-modal-icon">
              <LogOut size={22} />
            </div>

            <h3>Are you sure?</h3>

            <p>
              Are you sure you want to logout from your
              account?
            </p>

            <div className="settings-modal-actions">
              <button
                type="button"
                className="settings-modal-cancel"
                onClick={() =>
                  setShowLogoutModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-modal-confirm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE ACCOUNT MODAL ================= */}

      {showDeleteModal && (
        <div
          className="settings-modal-overlay"
          onClick={() =>
            setShowDeleteModal(false)
          }
        >
          <div
            className="settings-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="settings-modal-icon danger-icon">
              <Trash2 size={22} />
            </div>

            <h3>Delete Account?</h3>

            <p>
              Are you sure you want to delete your account?
              This action cannot be undone.
            </p>

            <div className="settings-modal-actions">
              <button
                type="button"
                className="settings-modal-cancel"
                onClick={() =>
                  setShowDeleteModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-modal-confirm delete-confirm"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;