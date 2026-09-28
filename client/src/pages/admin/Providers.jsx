
import { useEffect, useState } from "react";

import {
  BriefcaseMedical,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import api from "../../services/api";

import "../../styles/adminProviders.css";

const initialFormData = {
  branchId: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  specialization: "",
  qualification: "",
  experienceYears: "",
  bio: "",
};

function Providers() {
  const [providers, setProviders] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingProviderId, setDeletingProviderId] =
    useState(null);

  const [showForm, setShowForm] = useState(false);

  const [editingProviderId, setEditingProviderId] =
    useState(null);

  const [formData, setFormData] =
    useState(initialFormData);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // FETCH BRANCHES
  // =========================================

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);

      const response = await api.get("/branches");

      setBranches(response.data?.data || []);
    } catch (error) {
      console.error("Fetch branches error:", error);

      setBranches([]);

      setError(
        error.response?.data?.message ||
          "Unable to load branches."
      );
    } finally {
      setLoadingBranches(false);
    }
  };

  // =========================================
  // FETCH PROVIDERS
  // =========================================

  const fetchProviders = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchProviders();
  }, []);

  // =========================================
  // FORM CHANGE
  // =========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================================
  // RESET FORM
  // =========================================

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProviderId(null);
    setShowForm(false);
  };

  // =========================================
  // ADD PROVIDER
  // =========================================

  const handleAddProvider = () => {
    setFormData({
      ...initialFormData,
      branchId: branches[0]?.id || "",
    });

    setEditingProviderId(null);

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // =========================================
  // EDIT PROVIDER
  // =========================================

  const handleEditProvider = (provider) => {
    const user = provider.user || {};

    setFormData({
      branchId: user.branchId || "",
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      specialization:
        provider.specialization || "",
      qualification:
        provider.qualification || "",
      experienceYears:
        provider.experienceYears?.toString() ||
        "",
      bio: provider.bio || "",
    });

    setEditingProviderId(provider.id);

    setShowForm(true);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // CREATE / UPDATE PROVIDER
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.branchId) {
      setError("Please select a branch.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Provider name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (
      formData.password &&
      formData.password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (!formData.specialization.trim()) {
      setError("Specialization is required.");
      return;
    }

    if (
      formData.experienceYears !== "" &&
      Number(formData.experienceYears) < 0
    ) {
      setError(
        "Experience cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        branchId: formData.branchId,

        name: formData.name.trim(),

        email: formData.email.trim(),

        phone:
          formData.phone.trim() || null,

        specialization:
          formData.specialization.trim(),

        qualification:
          formData.qualification.trim() ||
          null,

        experienceYears:
          formData.experienceYears === ""
            ? null
            : Number(
                formData.experienceYears
              ),

        bio:
          formData.bio.trim() || null,

        ...(formData.password
          ? {
              password: formData.password,
            }
          : {}),
      };

      // =========================================
      // UPDATE
      // =========================================

      if (editingProviderId) {
        const response = await api.patch(
          `/providers/${editingProviderId}`,
          payload
        );

        const updatedProvider =
          response.data?.data;

        if (updatedProvider) {
          setProviders((previous) =>
            previous.map((provider) =>
              provider.id ===
              updatedProvider.id
                ? updatedProvider
                : provider
            )
          );
        } else {
          await fetchProviders();
        }

        resetForm();

        setSuccess(
          "Provider updated successfully."
        );
      }

      // =========================================
      // CREATE
      // =========================================

      else {
        await api.post(
          "/providers",
          payload
        );

        await fetchProviders();

        resetForm();

        setSuccess(
          "Provider created successfully."
        );
      }
    } catch (error) {
      console.error(
        editingProviderId
          ? "Update provider error:"
          : "Create provider error:",
        error
      );

      setError(
        error.response?.data?.message ||
          (editingProviderId
            ? "Unable to update provider."
            : "Unable to create provider.")
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // DELETE PROVIDER
  // =========================================

  const handleDeleteProvider = async (
    provider
  ) => {
    const providerName =
      provider.user?.name ||
      "this provider";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${providerName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProviderId(provider.id);

      setError("");
      setSuccess("");

      await api.delete(
        `/providers/${provider.id}`
      );

      setProviders((previous) =>
        previous.filter(
          (item) =>
            item.id !== provider.id
        )
      );

      if (
        editingProviderId ===
        provider.id
      ) {
        resetForm();
      }

      setSuccess(
        "Provider deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete provider error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to delete provider."
      );
    } finally {
      setDeletingProviderId(null);
    }
  };

  // =========================================
  // HELPERS
  // =========================================

  const getProviderBranch = (
    provider
  ) => {
    if (
      provider.user?.branch?.name
    ) {
      return provider.user.branch.name;
    }

    const branch = branches.find(
      (item) =>
        item.id ===
        provider.user?.branchId
    );

    return (
      branch?.name ||
      "No branch assigned"
    );
  };

  const getProviderName = (
    provider
  ) => {
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

  // =========================================
  // UI
  // =========================================

  return (
    <div className="admin-providers-page">

      {/* HEADER */}

      <div className="admin-providers-header">
        <div>
          <span className="admin-providers-eyebrow">
            Organization
          </span>

          <h1>Providers</h1>

          <p>
            Manage healthcare providers
            and their branch assignments.
          </p>
        </div>

        <button
          type="button"
          className="admin-add-provider-button"
          onClick={
            handleAddProvider
          }
          disabled={
            branches.length === 0
          }
        >
          <Plus size={18} />
          Add Provider
        </button>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="admin-providers-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-providers-alert success">
          {success}
        </div>
      )}

      {/* FORM */}

      {showForm && (
        <section className="admin-provider-form-card">

          <div className="admin-provider-form-header">
            <div>
              <span className="admin-providers-eyebrow">
                {editingProviderId
                  ? "Update Provider"
                  : "New Provider"}
              </span>

              <h2>
                {editingProviderId
                  ? "Edit Provider"
                  : "Add Provider"}
              </h2>

              <p>
                {editingProviderId
                  ? "Update provider information and branch assignment."
                  : "Create a provider account for your organization."}
              </p>
            </div>

            <button
              type="button"
              className="admin-provider-form-close"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={19} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
          >
            <div className="admin-provider-form-grid">

              {/* BRANCH */}

              <div className="admin-provider-field full">
                <label htmlFor="provider-branch">
                  Branch *
                </label>

                <select
                  id="provider-branch"
                  name="branchId"
                  value={
                    formData.branchId
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loadingBranches ||
                    saving
                  }
                  required
                >
                  <option value="">
                    {loadingBranches
                      ? "Loading branches..."
                      : "Select Branch"}
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}

                        {branch.city
                          ? ` — ${branch.city}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* NAME */}

              <div className="admin-provider-field">
                <label htmlFor="provider-name">
                  Full Name *
                </label>

                <div className="admin-provider-input-wrapper">
                  <UserRound
                    size={17}
                  />

                  <input
                    id="provider-name"
                    name="name"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div className="admin-provider-field">
                <label htmlFor="provider-email">
                  Email *
                </label>

                <input
                  id="provider-email"
                  name="email"
                  type="email"
                  placeholder="provider@example.com"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="admin-provider-field">
                <label htmlFor="provider-password">
                  {editingProviderId
                    ? "New Password"
                    : "Password *"}
                </label>

                <input
                  id="provider-password"
                  name="password"
                  type="password"
                  placeholder={
                    editingProviderId
                      ? "Enter new password to reset"
                      : "Minimum 6 characters"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  disabled={saving}
                  required={!editingProviderId}
                />

                {editingProviderId ? (
                  <small>
                    Leave blank if you do not want to change the
                    provider's password.
                  </small>
                ) : (
                  <small>
                    This password will be used by the provider to log in.
                  </small>
                )}
              </div>

              {/* PHONE */}

              <div className="admin-provider-field">
                <label htmlFor="provider-phone">
                  Phone
                </label>

                <input
                  id="provider-phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                />
              </div>

              {/* SPECIALIZATION */}

              <div className="admin-provider-field">
                <label htmlFor="provider-specialization">
                  Specialization *
                </label>

                <div className="admin-provider-input-wrapper">
                  <BriefcaseMedical
                    size={17}
                  />

                  <input
                    id="provider-specialization"
                    name="specialization"
                    type="text"
                    placeholder="e.g. Neurology"
                    value={
                      formData.specialization
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              {/* QUALIFICATION */}

              <div className="admin-provider-field">
                <label htmlFor="provider-qualification">
                  Qualification
                </label>

                <input
                  id="provider-qualification"
                  name="qualification"
                  type="text"
                  placeholder="e.g. MBBS, MD"
                  value={
                    formData.qualification
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                />
              </div>

              {/* EXPERIENCE */}

              <div className="admin-provider-field">
                <label htmlFor="provider-experience">
                  Experience
                </label>

                <div className="admin-provider-input-wrapper">
                  <input
                    id="provider-experience"
                    name="experienceYears"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={
                      formData.experienceYears
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />

                  <span className="admin-provider-input-suffix">
                    years
                  </span>
                </div>
              </div>

              {/* BIO */}

              <div className="admin-provider-field full">
                <label htmlFor="provider-bio">
                  Bio
                </label>

                <textarea
                  id="provider-bio"
                  name="bio"
                  rows="4"
                  placeholder="Brief professional information about the provider..."
                  value={
                    formData.bio
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                />
              </div>
            </div>

            {/* FORM ACTIONS */}

            <div className="admin-provider-form-actions">

              <button
                type="button"
                className="admin-provider-cancel-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-save-provider-button"
                disabled={
                  saving ||
                  loadingBranches ||
                  branches.length === 0
                }
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="admin-provider-loading-icon"
                    />

                    {editingProviderId
                      ? "Updating..."
                      : "Creating..."}
                  </>
                ) : editingProviderId ? (
                  <>
                    <Save size={17} />
                    Update Provider
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Create Provider
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* PROVIDER LIST */}

      <section className="admin-providers-card">

        <div className="admin-providers-card-header">
          <div>
            <span className="admin-providers-eyebrow">
              Healthcare Team
            </span>

            <h2>All Providers</h2>
          </div>

          <span className="admin-provider-count">
            {providers.length}{" "}
            {providers.length === 1
              ? "Provider"
              : "Providers"}
          </span>
        </div>

        {loading ? (
          <div className="admin-providers-loading">
            <Loader2
              size={22}
              className="admin-provider-loading-icon"
            />

            Loading providers...
          </div>
        ) : providers.length === 0 ? (
          <div className="admin-providers-empty">

            <div className="admin-provider-empty-icon">
              <UserRound
                size={27}
              />
            </div>

            <h3>
              No providers yet
            </h3>

            <p>
              Add a healthcare provider
              and assign them to one of
              your branches.
            </p>

            <button
              type="button"
              onClick={
                handleAddProvider
              }
              disabled={
                branches.length === 0
              }
            >
              <Plus size={17} />
              Add First Provider
            </button>
          </div>
        ) : (
          <div className="admin-provider-list">

            {providers.map(
              (provider) => {
                const isDeleting =
                  deletingProviderId ===
                  provider.id;

                return (
                  <div
                    className="admin-provider-item"
                    key={provider.id}
                  >

                    {/* AVATAR */}

                    <div className="admin-provider-avatar">
                      <UserRound
                        size={23}
                      />
                    </div>

                    {/* PROVIDER INFO */}

                    <div className="admin-provider-info">

                      <div className="admin-provider-title-row">

                        <h3>
                          {getProviderName(
                            provider
                          )}
                        </h3>

                        <span className="admin-provider-status">
                          <CheckCircle2
                            size={12}
                          />
                          Active
                        </span>

                      </div>

                      <div className="admin-provider-specialization">
                        {provider.specialization ||
                          "Healthcare Provider"}
                      </div>

                      <div className="admin-provider-details">

                        <span>
                          <span className="admin-provider-detail-label">
                            Branch
                          </span>

                          {getProviderBranch(
                            provider
                          )}
                        </span>

                        {provider.qualification && (
                          <span>
                            {
                              provider.qualification
                            }
                          </span>
                        )}

                        {provider.experienceYears !==
                          null &&
                          provider.experienceYears !==
                            undefined && (
                            <span>
                              {
                                provider.experienceYears
                              }{" "}
                              years experience
                            </span>
                          )}

                        {provider.user?.email && (
                          <span>
                            {
                              provider
                                .user
                                .email
                            }
                          </span>
                        )}

                      </div>

                      {provider.bio && (
                        <p>
                          {provider.bio}
                        </p>
                      )}

                    </div>

                    {/* ACTIONS */}

                    <div className="admin-provider-actions">

                      <button
                        type="button"
                        className="admin-provider-edit-button"
                        title="Edit provider"
                        onClick={() =>
                          handleEditProvider(
                            provider
                          )
                        }
                        disabled={
                          isDeleting
                        }
                      >
                        <Pencil
                          size={17}
                        />
                      </button>

                      <button
                        type="button"
                        className="admin-provider-delete-button"
                        title="Delete provider"
                        onClick={() =>
                          handleDeleteProvider(
                            provider
                          )
                        }
                        disabled={
                          isDeleting
                        }
                      >
                        {isDeleting ? (
                          <Loader2
                            size={17}
                            className="admin-provider-loading-icon"
                          />
                        ) : (
                          <Trash2
                            size={17}
                          />
                        )}
                      </button>

                    </div>

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

export default Providers;

