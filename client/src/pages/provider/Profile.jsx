
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Stethoscope,
  GraduationCap,
  BriefcaseBusiness,
  FileText,
  Loader2,
  Save,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/ProviderProfile.css";

function Profile() {
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experienceYears: "",
    bio: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // FETCH PROFILE
  // =========================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/providers/profile");

      const provider = response.data?.data;

      if (!provider) {
        setError("Provider profile not found.");
        return;
      }

      setProfile(provider);

      setFormData({
        name: provider.user?.name || "",
        email: provider.user?.email || "",
        phone: provider.user?.phone || "",
        specialization: provider.specialization || "",
        qualification: provider.qualification || "",
        experienceYears:
          provider.experienceYears ?? "",
        bio: provider.bio || "",
      });
    } catch (error) {
      console.error(
        "Fetch provider profile error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =========================================
  // HANDLE INPUT
  // =========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================================
  // SAVE PROFILE
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        "/providers/profile",
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialization:
            formData.specialization,
          qualification:
            formData.qualification,
          experienceYears:
            formData.experienceYears,
          bio: formData.bio,
        }
      );

      const updatedProvider =
        response.data?.data;

      setProfile(updatedProvider);

      setFormData({
        name:
          updatedProvider?.user?.name || "",
        email:
          updatedProvider?.user?.email || "",
        phone:
          updatedProvider?.user?.phone || "",
        specialization:
          updatedProvider?.specialization || "",
        qualification:
          updatedProvider?.qualification || "",
        experienceYears:
          updatedProvider?.experienceYears ?? "",
        bio:
          updatedProvider?.bio || "",
      });

      setSuccess(
        response.data?.message ||
          "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Update provider profile error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update your profile."
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
      <div className="provider-profile-page">
        <div className="provider-profile-loading">
          <Loader2
            size={20}
            className="provider-profile-loading-icon"
          />
          Loading profile...
        </div>
      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="provider-profile-page">

      
        <div className="provider-profile-header">
        <h1>My Profile</h1>

        <p>
            Manage your professional and contact information.
        </p>
        </div>



      {/* ERROR */}
      {error && (
        <div className="provider-profile-alert error">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="provider-profile-alert success">
          <CheckCircle2 size={17} />
          <span>{success}</span>
        </div>
      )}

      <div className="provider-profile-layout">

        {/* =====================================
            LEFT PROFILE CARD
        ===================================== */}

        <aside className="provider-profile-card">

          <div className="provider-profile-avatar-large">
            <UserRound size={38} />
          </div>

          <h2>
            Dr.{" "}
            {profile?.user?.name || "Provider"}
          </h2>

          <span className="provider-profile-role">
            Healthcare Provider
          </span>

          <div className="provider-profile-status">
            <span className="provider-profile-status-dot"></span>
            {profile?.user?.isActive
              ? "Active"
              : "Inactive"}
          </div>

          <div className="provider-profile-contact">

            <div className="provider-profile-contact-item">
              <div className="provider-profile-contact-icon">
                <Mail size={15} />
              </div>

              <div>
                <span>Email</span>

                <strong>
                  {profile?.user?.email ||
                    "Not available"}
                </strong>
              </div>
            </div>

            <div className="provider-profile-contact-item">
              <div className="provider-profile-contact-icon">
                <Phone size={15} />
              </div>

              <div>
                <span>Phone</span>

                <strong>
                  {profile?.user?.phone ||
                    "Not available"}
                </strong>
              </div>
            </div>

            <div className="provider-profile-contact-item">
              <div className="provider-profile-contact-icon">
                <Building2 size={15} />
              </div>

              <div>
                <span>Branch</span>

                <strong>
                  {profile?.user?.branch?.name ||
                    "Not assigned"}
                </strong>
              </div>
            </div>

            <div className="provider-profile-contact-item">
              <div className="provider-profile-contact-icon">
                <MapPin size={15} />
              </div>

              <div>
                <span>Location</span>

                <strong>
                  {profile?.user?.branch?.city ||
                    "Not available"}
                  {profile?.user?.branch?.state
                    ? `, ${profile.user.branch.state}`
                    : ""}
                </strong>
              </div>
            </div>

          </div>
        </aside>

        {/* =====================================
            RIGHT FORM
        ===================================== */}

        <section className="provider-profile-form-card">

          <div className="provider-profile-form-header">

            <div>
              <h2>Professional Information</h2>

              <p>
                Keep your provider information
                up to date.
              </p>
            </div>

            <div className="provider-profile-edit-badge">
              <Stethoscope size={14} />
              Editable Profile
            </div>

          </div>

          <form
            className="provider-profile-form"
            onSubmit={handleSubmit}
          >

            <div className="provider-profile-form-grid">

              {/* NAME */}
              <div className="provider-profile-field">
                <label htmlFor="name">
                  Full Name
                </label>

                <div className="provider-profile-input-wrapper">
                  <UserRound
                    size={16}
                    className="provider-profile-input-icon"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="provider-profile-field">
                <label htmlFor="email">
                  Email Address
                </label>

                <div className="provider-profile-input-wrapper">
                  <Mail
                    size={16}
                    className="provider-profile-input-icon"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* PHONE */}
              <div className="provider-profile-field">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <div className="provider-profile-input-wrapper">
                  <Phone
                    size={16}
                    className="provider-profile-input-icon"
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* SPECIALIZATION */}
              <div className="provider-profile-field">
                <label htmlFor="specialization">
                  Specialization
                </label>

                <div className="provider-profile-input-wrapper">
                  <Stethoscope
                    size={16}
                    className="provider-profile-input-icon"
                  />

                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={
                      formData.specialization
                    }
                    onChange={handleChange}
                    placeholder="e.g. Cardiologist"
                  />
                </div>
              </div>

              {/* QUALIFICATION */}
              <div className="provider-profile-field">
                <label htmlFor="qualification">
                  Qualification
                </label>

                <div className="provider-profile-input-wrapper">
                  <GraduationCap
                    size={16}
                    className="provider-profile-input-icon"
                  />

                  <input
                    id="qualification"
                    name="qualification"
                    type="text"
                    value={
                      formData.qualification
                    }
                    onChange={handleChange}
                    placeholder="e.g. MBBS, MD"
                  />
                </div>
              </div>

              {/* EXPERIENCE */}
              <div className="provider-profile-field">
                <label htmlFor="experienceYears">
                  Experience
                </label>

                <div className="provider-profile-input-wrapper">
                  <BriefcaseBusiness
                    size={16}
                    className="provider-profile-input-icon"
                  />

                  <input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    value={
                      formData.experienceYears
                    }
                    onChange={handleChange}
                    placeholder="Years of experience"
                  />
                </div>

                <span className="provider-profile-field-hint">
                  Enter completed years of
                  professional experience.
                </span>
              </div>

              {/* BIO */}
              <div className="provider-profile-field provider-profile-field-full">
                <label htmlFor="bio">
                  Professional Bio
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Write a short professional bio..."
                  rows="5"
                />
              </div>

            </div>

            {/* FORM ACTION */}
            <div className="provider-profile-form-actions">

              <button
                type="submit"
                className="provider-profile-save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="provider-profile-loading-icon"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>

            </div>

          </form>
        </section>
      </div>
    </div>
  );
}

export default Profile;

