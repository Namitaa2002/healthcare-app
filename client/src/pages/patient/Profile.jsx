import { useEffect, useState } from "react";

import {
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  HeartPulse,
  Pencil,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import api from "../../services/api";

import "../../styles/Profile.css";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/patients/profile");

        if (response.data?.data) {
          const data = response.data.data;

          setProfile({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            dateOfBirth: data.dateOfBirth
              ? data.dateOfBirth.slice(0, 10)
              : "",
            gender: data.gender || "",
            address: data.address || "",
            emergencyName: data.emergencyName || "",
            emergencyPhone: data.emergencyPhone || "",
          });
        }
      } catch (error) {
        console.error("Fetch profile error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previousProfile) => ({
      ...previousProfile,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleEdit = () => {
    setError("");
    setMessage("");
    setEditing(true);
  };

  const handleCancel = () => {
    window.location.reload();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (profile.phone && !/^[0-9]{10}$/.test(profile.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (
      profile.emergencyPhone &&
      !/^[0-9]{10}$/.test(profile.emergencyPhone)
    ) {
      setError(
        "Please enter a valid emergency contact number."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await api.patch(
        "/patients/profile",
        {
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          dateOfBirth: profile.dateOfBirth || null,
          gender: profile.gender || null,
          address: profile.address.trim(),
          emergencyName: profile.emergencyName.trim(),
          emergencyPhone: profile.emergencyPhone.trim(),
        }
      );

      if (response.data?.data) {
        const data = response.data.data;

        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth
            ? data.dateOfBirth.slice(0, 10)
            : "",
          gender: data.gender || "",
          address: data.address || "",
          emergencyName: data.emergencyName || "",
          emergencyPhone: data.emergencyPhone || "",
        });
      }

      setEditing(false);

      setMessage(
        response.data?.message ||
          "Profile updated successfully."
      );
    } catch (error) {
      console.error("Update profile error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="patient-page">
        <div className="patient-page-header">
          <div>
            <span className="page-eyebrow">
              ACCOUNT PROFILE
            </span>

            <h1>My Profile</h1>

            <p>
              Manage your personal and emergency contact
              information.
            </p>
          </div>
        </div>

        <div className="profile-loading">
          <Loader2 size={18} className="profile-spinner" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-page">
      <div className="patient-page-header profile-page-header">
        <div>
          <span className="page-eyebrow">
            ACCOUNT PROFILE
          </span>

          <h1>My Profile</h1>

          <p>
            Manage your personal and emergency contact
            information.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="profile-edit-btn"
            onClick={handleEdit}
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className="profile-success">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="profile-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form
        className="profile-grid"
        onSubmit={handleSubmit}
      >
        {/* ================= PERSONAL INFORMATION ================= */}

        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon">
              <User size={18} />
            </div>

            <div>
              <h3>Personal Information</h3>
              <p>
                Your basic account and personal details.
              </p>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label htmlFor="name">Full Name</label>

              <div className="profile-input-wrapper">
                <User size={16} />

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="email">Email Address</label>

              <div className="profile-input-wrapper">
                <Mail size={16} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={profile.email}
                  disabled
                  placeholder="Your email address"
                />
              </div>

              <small>
                Email address cannot be changed here.
              </small>
            </div>

            <div className="profile-field">
              <label htmlFor="phone">Phone Number</label>

              <div className="profile-input-wrapper">
                <Phone size={16} />

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength="10"
                  placeholder="Enter 10-digit phone number"
                />
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="dateOfBirth">
                Date of Birth
              </label>

              <div className="profile-input-wrapper">
                <CalendarDays size={16} />

                <input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={profile.dateOfBirth}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="gender">Gender</label>

              <div className="profile-input-wrapper">
                <HeartPulse size={16} />

                <select
                  id="gender"
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  disabled={!editing}
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">Male</option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">Other</option>

                  <option value="Prefer not to say">
                    Prefer not to say
                  </option>
                </select>
              </div>
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="address">Address</label>

              <div className="profile-input-wrapper profile-textarea-wrapper">
                <MapPin size={16} />

                <textarea
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your address"
                  rows="3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= EMERGENCY CONTACT ================= */}

        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon emergency">
              <HeartPulse size={18} />
            </div>

            <div>
              <h3>Emergency Contact</h3>
              <p>
                Someone we can contact in case of an
                emergency.
              </p>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label htmlFor="emergencyName">
                Contact Name
              </label>

              <div className="profile-input-wrapper">
                <User size={16} />

                <input
                  id="emergencyName"
                  type="text"
                  name="emergencyName"
                  value={profile.emergencyName}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter contact name"
                />
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="emergencyPhone">
                Contact Phone
              </label>

              <div className="profile-input-wrapper">
                <Phone size={16} />

                <input
                  id="emergencyPhone"
                  type="tel"
                  name="emergencyPhone"
                  value={profile.emergencyPhone}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength="10"
                  placeholder="Enter contact number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SAVE ACTIONS ================= */}

        {editing && (
          <div className="profile-actions">
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              <X size={15} />
              Cancel
            </button>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={15}
                    className="profile-spinner"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default Profile;