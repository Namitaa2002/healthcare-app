import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/adminSettings.css";

function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [organization, setOrganization] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    paymentUpdates: true,
    emailUpdates: false,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [popup, setPopup] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  const showPopup = (type, title, message) => {
    setPopup({
      open: true,
      type,
      title,
      message,
    });
  };

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        const response = await api.get(
          "/organizations/settings"
        );

        const data = response.data?.data;

        if (data) {
          setOrganization({
            name: data.organization?.name || "",
            email: data.organization?.email || "",
            phone: data.organization?.phone || "",
            address: data.organization?.address || "",
            city: data.organization?.city || "",
            state: data.organization?.state || "",
            country: data.organization?.country || "",
          });

          setNotifications({
            appointmentReminders:
              data.admin?.appointmentReminders ?? true,
            paymentUpdates:
              data.admin?.paymentUpdates ?? true,
            emailUpdates:
              data.admin?.emailUpdates ?? false,
          });
        }
      } catch (error) {
        console.error(
          "Fetch settings error:",
          error
        );

        showPopup(
          "error",
          "Unable to Load Settings",
          error.response?.data?.message ||
            "Something went wrong while loading settings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleOrganizationChange = (event) => {
    const { name, value } = event.target;

    setOrganization((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (name) => {
    setNotifications((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await api.put(
        "/organizations/settings",
        {
          name: organization.name,
          email: organization.email,
          phone: organization.phone,
          address: organization.address,
          city: organization.city,
          state: organization.state,
          country: organization.country,
          appointmentReminders:
            notifications.appointmentReminders,
          paymentUpdates:
            notifications.paymentUpdates,
          emailUpdates:
            notifications.emailUpdates,
        }
      );

      showPopup(
        "success",
        "Settings Saved",
        "Your organization settings have been updated successfully."
      );
    } catch (error) {
      console.error(
        "Save settings error:",
        error
      );

      showPopup(
        "error",
        "Unable to Save Settings",
        error.response?.data?.message ||
          "Something went wrong while saving settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    closePopup();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwords;

    if (!currentPassword) {
      showPopup(
        "error",
        "Current Password Required",
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      showPopup(
        "error",
        "New Password Required",
        "Please enter your new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      showPopup(
        "error",
        "Password Too Short",
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (!confirmPassword) {
      showPopup(
        "error",
        "Confirm Password Required",
        "Please confirm your new password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showPopup(
        "error",
        "Passwords Don't Match",
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setUpdatingPassword(true);

      const response = await api.put(
        "/organizations/settings/password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        }
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      showPopup(
        "success",
        "Password Updated",
        response.data?.message ||
          "Your password has been updated successfully."
      );
    } catch (error) {
      console.error(
        "Update password error:",
        error
      );

      showPopup(
        "error",
        "Password Update Failed",
        error.response?.data?.message ||
          "Something went wrong while updating your password."
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-settings-loading">
        <Loader2
          size={25}
          className="admin-settings-loading-icon"
        />
        Loading settings...
      </div>
    );
  }

  return (
    <>
      <div className="admin-settings-page">
        <div className="admin-settings-header">
          <div>
            <span className="admin-settings-eyebrow">
              System
            </span>

            <h1>Settings</h1>

            <p>
              Manage your organization details,
              notifications and account security.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSaveSettings}
          className="admin-settings-layout"
        >
          <main className="admin-settings-main">
            {/* ORGANIZATION */}
            <section className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div className="admin-settings-icon">
                  <Building2 size={20} />
                </div>

                <div>
                  <span>Organization</span>

                  <h2>Organization Information</h2>

                  <p>
                    Update your organization's basic
                    information.
                  </p>
                </div>
              </div>

              <div className="admin-settings-form-grid">
                <div className="admin-settings-field">
                  <label>Organization Name</label>

                  <div className="admin-settings-input-wrapper">
                    <Building2 size={17} />

                    <input
                      type="text"
                      name="name"
                      value={organization.name}
                      onChange={
                        handleOrganizationChange
                      }
                      placeholder="Organization name"
                    />
                  </div>
                </div>

                <div className="admin-settings-field">
                  <label>Email Address</label>

                  <div className="admin-settings-input-wrapper">
                    <Mail size={17} />

                    <input
                      type="email"
                      name="email"
                      value={organization.email}
                      onChange={
                        handleOrganizationChange
                      }
                      placeholder="organization@example.com"
                    />
                  </div>
                </div>

                <div className="admin-settings-field">
                  <label>Phone Number</label>

                  <div className="admin-settings-input-wrapper">
                    <Phone size={17} />

                    <input
                      type="text"
                      name="phone"
                      value={organization.phone}
                      onChange={
                        handleOrganizationChange
                      }
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="admin-settings-field">
                  <label>City</label>

                  <div className="admin-settings-input-wrapper">
                    <MapPin size={17} />

                    <input
                      type="text"
                      name="city"
                      value={organization.city}
                      onChange={
                        handleOrganizationChange
                      }
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="admin-settings-field">
                  <label>State</label>

                  <div className="admin-settings-input-wrapper">
                    <MapPin size={17} />

                    <input
                      type="text"
                      name="state"
                      value={organization.state}
                      onChange={
                        handleOrganizationChange
                      }
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="admin-settings-field">
                  <label>Country</label>

                  <div className="admin-settings-input-wrapper">
                    <MapPin size={17} />

                    <input
                      type="text"
                      name="country"
                      value={organization.country}
                      onChange={
                        handleOrganizationChange
                      }
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="admin-settings-field admin-settings-field-full">
                  <label>Address</label>

                  <div className="admin-settings-input-wrapper">
                    <MapPin size={17} />

                    <input
                      type="text"
                      name="address"
                      value={organization.address}
                      onChange={
                        handleOrganizationChange
                      }
                      placeholder="Organization address"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* NOTIFICATIONS */}
<section className="admin-settings-card">
  <div className="admin-settings-card-header">
    <div className="admin-settings-icon">
      <Bell size={20} />
    </div>

    <div>
      <span>Preferences</span>

      <h2>Notifications</h2>

      <p>
        Choose which notifications you want to receive.
      </p>
    </div>
  </div>

  <div className="admin-settings-notifications">

    {/* APPOINTMENT REMINDERS */}
    <div className="admin-settings-toggle-row">
      <div className="admin-settings-toggle-icon">
        <Bell size={18} />
      </div>

      <div className="admin-settings-toggle-content">
        <strong>Appointment Reminders</strong>

        <span>
          Receive reminders about upcoming appointments.
        </span>
      </div>

      <button
        type="button"
        className={`admin-settings-switch ${
          notifications.appointmentReminders
            ? "active"
            : ""
        }`}
        onClick={() =>
          handleNotificationChange(
            "appointmentReminders"
          )
        }
        aria-label="Toggle appointment reminders"
        aria-pressed={
          notifications.appointmentReminders
        }
      >
        <span></span>
      </button>
    </div>

    {/* PAYMENT UPDATES */}
    <div className="admin-settings-toggle-row">
      <div className="admin-settings-toggle-icon">
        <CheckCircle2 size={18} />
      </div>

      <div className="admin-settings-toggle-content">
        <strong>Payment Updates</strong>

        <span>
          Receive notifications for payment activity.
        </span>
      </div>

      <button
        type="button"
        className={`admin-settings-switch ${
          notifications.paymentUpdates
            ? "active"
            : ""
        }`}
        onClick={() =>
          handleNotificationChange(
            "paymentUpdates"
          )
        }
        aria-label="Toggle payment updates"
        aria-pressed={
          notifications.paymentUpdates
        }
      >
        <span></span>
      </button>
    </div>

    {/* EMAIL UPDATES */}
    <div className="admin-settings-toggle-row">
      <div className="admin-settings-toggle-icon">
        <Mail size={18} />
      </div>

      <div className="admin-settings-toggle-content">
        <strong>Email Updates</strong>

        <span>
          Receive important organization updates by email.
        </span>
      </div>

      <button
        type="button"
        className={`admin-settings-switch ${
          notifications.emailUpdates
            ? "active"
            : ""
        }`}
        onClick={() =>
          handleNotificationChange(
            "emailUpdates"
          )
        }
        aria-label="Toggle email updates"
        aria-pressed={
          notifications.emailUpdates
        }
      >
        <span></span>
      </button>
    </div>

  </div>
</section>

            {/* PASSWORD */}
            <section className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div className="admin-settings-icon">
                  <KeyRound size={20} />
                </div>

                <div>
                  <span>Security</span>

                  <h2>Change Password</h2>

                  <p>
                    Update your organization admin
                    account password.
                  </p>
                </div>
              </div>

              <div className="admin-settings-password-section">
                <div className="admin-settings-password-grid">
                  <div className="admin-settings-field">
                    <label>Current Password</label>

                    <div className="admin-settings-input-wrapper">
                      <KeyRound size={17} />

                      <input
                        type={
                          showCurrentPassword
                            ? "text"
                            : "password"
                        }
                        name="currentPassword"
                        value={
                          passwords.currentPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Enter current password"
                      />

                      <button
                        type="button"
                        className="admin-settings-password-toggle"
                        onClick={() =>
                          setShowCurrentPassword(
                            (prev) => !prev
                          )
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="admin-settings-field">
                    <label>New Password</label>

                    <div className="admin-settings-input-wrapper">
                      <KeyRound size={17} />

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        name="newPassword"
                        value={
                          passwords.newPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Enter new password"
                      />

                      <button
                        type="button"
                        className="admin-settings-password-toggle"
                        onClick={() =>
                          setShowNewPassword(
                            (prev) => !prev
                          )
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="admin-settings-field">
                    <label>Confirm New Password</label>

                    <div className="admin-settings-input-wrapper">
                      <KeyRound size={17} />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        value={
                          passwords.confirmPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Confirm new password"
                      />

                      <button
                        type="button"
                        className="admin-settings-password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(
                            (prev) => !prev
                          )
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="admin-settings-password-bottom">
                  <div className="admin-settings-password-note">
                    <ShieldCheck size={17} />

                    <span>
                      Use at least 8 characters for a
                      secure password.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="admin-settings-secondary-button"
                    onClick={
                      handlePasswordUpdate
                    }
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2
                          size={16}
                          className="admin-settings-loading-icon"
                        />
                        Updating...
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* SAVE */}
            <div className="admin-settings-save-bar">
              <button
                type="submit"
                className="admin-settings-save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="admin-settings-loading-icon"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </main>

          {/* SIDEBAR */}
          <aside className="admin-settings-sidebar">
            <div className="admin-settings-info-card">
              <div className="admin-settings-info-icon">
                <Building2 size={20} />
              </div>

              <h3>Organization Settings</h3>

              <p>
                These details are used across your
                healthcare management system.
              </p>

              <div className="admin-settings-info-item">
                <UserRound size={16} />

                <span>Organization Admin</span>
              </div>

              <div className="admin-settings-info-item">
                <MapPin size={16} />

                <span>
                  {organization.city ||
                    "Location not set"}
                </span>
              </div>
            </div>

            <div className="admin-settings-security-card">
              <div className="admin-settings-security-icon">
                <ShieldCheck size={20} />
              </div>

              <strong>Account Security</strong>

              <p>
                Keep your account password secure and
                update it regularly.
              </p>
            </div>
          </aside>
        </form>
      </div>

      {/* CUSTOM POPUP */}
      {popup.open && (
        <div
          className="admin-settings-popup-overlay"
          onClick={closePopup}
        >
          <div
            className={`admin-settings-popup ${
              popup.type === "success"
                ? "success"
                : "error"
            }`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="admin-settings-popup-close"
              onClick={closePopup}
            >
              <X size={18} />
            </button>

            <div className="admin-settings-popup-icon">
              {popup.type === "success" ? (
                <CheckCircle2 size={27} />
              ) : (
                <ShieldCheck size={27} />
              )}
            </div>

            <h3>{popup.title}</h3>

            <p>{popup.message}</p>

            <button
              type="button"
              className="admin-settings-popup-button"
              onClick={closePopup}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Settings;