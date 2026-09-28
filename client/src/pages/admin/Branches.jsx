import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  X,
  Loader2,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/adminBranches.css";

const initialFormData = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  phone: "",
};

function Branches() {
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingBranchId, setDeletingBranchId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState(initialFormData);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError("");

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingBranchId(null);
    setShowForm(false);
  };

  const handleAddBranch = () => {
    setFormData(initialFormData);
    setEditingBranchId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleEditBranch = (branch) => {
    setFormData({
      name: branch.name || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      country: branch.country || "India",
      phone: branch.phone || "",
    });

    setEditingBranchId(branch.id);
    setShowForm(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteBranch = async (branch) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${branch.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingBranchId(branch.id);
      setError("");
      setSuccess("");

      await api.delete(`/branches/${branch.id}`);

      setBranches((previous) =>
        previous.filter(
          (item) => item.id !== branch.id
        )
      );

      if (editingBranchId === branch.id) {
        resetForm();
      }

      setSuccess("Branch deleted successfully.");
    } catch (error) {
      console.error("Delete branch error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete branch."
      );
    } finally {
      setDeletingBranchId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Branch name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingBranchId) {
        const response = await api.patch(
          `/branches/${editingBranchId}`,
          {
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            state: formData.state.trim() || null,
            country: formData.country.trim() || null,
            phone: formData.phone.trim() || null,
          }
        );

        const updatedBranch = response.data?.data;

        if (updatedBranch) {
          setBranches((previous) =>
            previous.map((branch) =>
              branch.id === updatedBranch.id
                ? updatedBranch
                : branch
            )
          );
        } else {
          await fetchBranches();
        }

        resetForm();
        setSuccess("Branch updated successfully.");
      } else {
        const response = await api.post("/branches", {
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          country: formData.country.trim() || null,
          phone: formData.phone.trim() || null,
        });

        const createdBranch = response.data?.data;

        if (createdBranch) {
          setBranches((previous) => [
            ...previous,
            createdBranch,
          ]);
        } else {
          await fetchBranches();
        }

        resetForm();
        setSuccess("Branch created successfully.");
      }
    } catch (error) {
      console.error(
        editingBranchId
          ? "Update branch error:"
          : "Create branch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          (editingBranchId
            ? "Unable to update branch."
            : "Unable to create branch.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-branches-page">
      <div className="admin-branches-header">
        <div>
          <span className="admin-branches-eyebrow">
            Organization
          </span>

          <h1>Branches</h1>

          <p>
            Manage all healthcare branches under your
            organization.
          </p>
        </div>

        <button
          type="button"
          className="admin-add-branch-button"
          onClick={handleAddBranch}
        >
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      {error && (
        <div className="admin-branches-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-branches-alert success">
          {success}
        </div>
      )}

      {showForm && (
        <section className="admin-branch-form-card">
          <div className="admin-branch-form-header">
            <div>
              <span className="admin-branches-eyebrow">
                {editingBranchId
                  ? "Update Branch"
                  : "New Branch"}
              </span>

              <h2>
                {editingBranchId
                  ? "Edit Branch"
                  : "Add Branch"}
              </h2>

              <p>
                {editingBranchId
                  ? "Update the details of this healthcare branch."
                  : "Enter the details for the new healthcare branch."}
              </p>
            </div>

            <button
              type="button"
              className="admin-form-close"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-branch-form-grid">
              <div className="admin-form-field full">
                <label htmlFor="branch-name">
                  Branch Name *
                </label>

                <div className="admin-input-wrapper">
                  <Building2 size={17} />

                  <input
                    id="branch-name"
                    name="name"
                    type="text"
                    placeholder="e.g. Main Clinic"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-field full">
                <label htmlFor="branch-address">
                  Address
                </label>

                <div className="admin-input-wrapper">
                  <MapPin size={17} />

                  <input
                    id="branch-address"
                    name="address"
                    type="text"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="admin-form-field">
                <label htmlFor="branch-city">
                  City
                </label>

                <input
                  id="branch-city"
                  name="city"
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="branch-state">
                  State
                </label>

                <input
                  id="branch-state"
                  name="state"
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="branch-country">
                  Country
                </label>

                <input
                  id="branch-country"
                  name="country"
                  type="text"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="branch-phone">
                  Phone
                </label>

                <div className="admin-input-wrapper">
                  <Phone size={17} />

                  <input
                    id="branch-phone"
                    name="phone"
                    type="tel"
                    placeholder="Contact number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="admin-branch-form-actions">
              <button
                type="button"
                className="admin-cancel-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-save-branch-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="admin-loading-icon"
                    />

                    {editingBranchId
                      ? "Updating..."
                      : "Creating..."}
                  </>
                ) : editingBranchId ? (
                  <>
                    <Save size={17} />
                    Update Branch
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Create Branch
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-branches-card">
        <div className="admin-branches-card-header">
          <div>
            <span className="admin-branches-eyebrow">
              Locations
            </span>

            <h2>All Branches</h2>
          </div>

          <span className="admin-branch-count">
            {branches.length}{" "}
            {branches.length === 1
              ? "Branch"
              : "Branches"}
          </span>
        </div>

        {loading ? (
          <div className="admin-branches-loading">
            <Loader2
              size={22}
              className="admin-loading-icon"
            />
            Loading branches...
          </div>
        ) : branches.length === 0 ? (
          <div className="admin-branches-empty">
            <div className="admin-empty-icon">
              <Building2 size={26} />
            </div>

            <h3>No branches yet</h3>

            <p>
              Add your first healthcare branch to get
              started.
            </p>

            <button
              type="button"
              onClick={handleAddBranch}
            >
              <Plus size={17} />
              Add First Branch
            </button>
          </div>
        ) : (
          <div className="admin-branch-list">
            {branches.map((branch) => {
              const isDeleting =
                deletingBranchId === branch.id;

              return (
                <div
                  className="admin-branch-item"
                  key={branch.id}
                >
                  <div className="admin-branch-icon">
                    <Building2 size={22} />
                  </div>

                  <div className="admin-branch-info">
                    <h3>{branch.name}</h3>

                    <div className="admin-branch-details">
                      {(branch.city || branch.state) && (
                        <span>
                          <MapPin size={14} />

                          {branch.city || ""}

                          {branch.city && branch.state
                            ? ", "
                            : ""}

                          {branch.state || ""}
                        </span>
                      )}

                      {branch.phone && (
                        <span>
                          <Phone size={14} />
                          {branch.phone}
                        </span>
                      )}
                    </div>

                    {branch.address && (
                      <p>{branch.address}</p>
                    )}
                  </div>

                  <div className="admin-branch-actions">
                    <button
                      type="button"
                      className="admin-branch-edit-button"
                      title="Edit branch"
                      onClick={() =>
                        handleEditBranch(branch)
                      }
                      disabled={isDeleting}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      className="admin-branch-delete-button"
                      title="Delete branch"
                      onClick={() =>
                        handleDeleteBranch(branch)
                      }
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2
                          size={17}
                          className="admin-loading-icon"
                        />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Branches;