import { useEffect, useState } from "react";
import {
  Clock3,
  IndianRupee,
  Loader2,
  Pencil,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/adminServices.css";

const initialFormData = {
  branchId: "",
  name: "",
  description: "",
  duration: "",
  price: "",
  isActive: true,
};

function Services() {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [deletingServiceId, setDeletingServiceId] =
    useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] =
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
      console.error(
        "Fetch branches error:",
        error
      );

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
  // FETCH ALL SERVICES
  // =========================================

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/services/admin"
      );

      setServices(response.data?.data || []);
    } catch (error) {
      console.error(
        "Fetch services error:",
        error
      );

      setServices([]);

      setError(
        error.response?.data?.message ||
          "Unable to load services."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchServices();
  }, []);

  // =========================================
  // FORM
  // =========================================

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingServiceId(null);
    setShowForm(false);
  };

  const handleAddService = () => {
    setFormData({
      ...initialFormData,
      branchId: branches[0]?.id || "",
    });

    setEditingServiceId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleEditService = (service) => {
    setFormData({
      branchId: service.branchId || "",
      name: service.name || "",
      description:
        service.description || "",
      duration:
        service.duration?.toString() || "",
      price:
        service.price?.toString() || "",
      isActive:
        service.isActive ?? true,
    });

    setEditingServiceId(service.id);
    setShowForm(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================
  // CREATE / UPDATE
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.branchId) {
      setError("Please select a branch.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (
      !formData.duration ||
      Number(formData.duration) <= 0
    ) {
      setError(
        "Duration must be greater than 0."
      );
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      setError(
        "Please enter a valid service price."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingServiceId) {
        const response = await api.patch(
          `/services/${editingServiceId}`,
          {
            branchId: formData.branchId,
            name: formData.name.trim(),
            description:
              formData.description.trim() ||
              null,
            duration: Number(
              formData.duration
            ),
            price: Number(formData.price),
            isActive: formData.isActive,
          }
        );

        const updatedService =
          response.data?.data;

        if (updatedService) {
          setServices((previous) =>
            previous.map((service) =>
              service.id ===
              updatedService.id
                ? updatedService
                : service
            )
          );
        } else {
          await fetchServices();
        }

        resetForm();
        setSuccess(
          "Service updated successfully."
        );
      } else {
        const response = await api.post(
          "/services",
          {
            branchId: formData.branchId,
            name: formData.name.trim(),
            description:
              formData.description.trim() ||
              null,
            duration: Number(
              formData.duration
            ),
            price: Number(formData.price),
          }
        );

        const createdService =
          response.data?.data;

        if (createdService) {
          const branch =
            branches.find(
              (item) =>
                item.id ===
                createdService.branchId
            );

          setServices((previous) => [
            ...previous,
            {
              ...createdService,
              branch: branch
                ? {
                    id: branch.id,
                    name: branch.name,
                    city: branch.city,
                    state: branch.state,
                  }
                : null,
            },
          ]);
        } else {
          await fetchServices();
        }

        resetForm();
        setSuccess(
          "Service created successfully."
        );
      }
    } catch (error) {
      console.error(
        editingServiceId
          ? "Update service error:"
          : "Create service error:",
        error
      );

      setError(
        error.response?.data?.message ||
          (editingServiceId
            ? "Unable to update service."
            : "Unable to create service.")
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // DELETE
  // =========================================

  const handleDeleteService = async (
    service
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingServiceId(service.id);
      setError("");
      setSuccess("");

      await api.delete(
        `/services/${service.id}`
      );

      setServices((previous) =>
        previous.filter(
          (item) =>
            item.id !== service.id
        )
      );

      if (
        editingServiceId === service.id
      ) {
        resetForm();
      }

      setSuccess(
        "Service deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete service error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to delete service."
      );
    } finally {
      setDeletingServiceId(null);
    }
  };

  // =========================================
  // HELPERS
  // =========================================

  const getBranchName = (service) => {
    if (service.branch?.name) {
      return service.branch.name;
    }

    const branch = branches.find(
      (item) =>
        item.id === service.branchId
    );

    return branch?.name || "Unknown Branch";
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString(
      "en-IN"
    );
  };

  return (
    <div className="admin-services-page">
      {/* =====================================
          HEADER
      ====================================== */}

      <div className="admin-services-header">
        <div>
          <span className="admin-services-eyebrow">
            Organization
          </span>

          <h1>Services</h1>

          <p>
            Manage healthcare services offered
            across your branches.
          </p>
        </div>

        <button
          type="button"
          className="admin-add-service-button"
          onClick={handleAddService}
          disabled={branches.length === 0}
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      {/* =====================================
          ALERTS
      ====================================== */}

      {error && (
        <div className="admin-services-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-services-alert success">
          {success}
        </div>
      )}

      {/* =====================================
          FORM
      ====================================== */}

      {showForm && (
        <section className="admin-service-form-card">
          <div className="admin-service-form-header">
            <div>
              <span className="admin-services-eyebrow">
                {editingServiceId
                  ? "Update Service"
                  : "New Service"}
              </span>

              <h2>
                {editingServiceId
                  ? "Edit Service"
                  : "Add Service"}
              </h2>

              <p>
                {editingServiceId
                  ? "Update the service details and availability."
                  : "Add a healthcare service to one of your branches."}
              </p>
            </div>

            <button
              type="button"
              className="admin-service-form-close"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-service-form-grid">
              {/* Branch */}

              <div className="admin-service-field full">
                <label htmlFor="service-branch">
                  Branch *
                </label>

                <select
                  id="service-branch"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
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

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                      {branch.city
                        ? ` — ${branch.city}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Name */}

              <div className="admin-service-field full">
                <label htmlFor="service-name">
                  Service Name *
                </label>

                <div className="admin-service-input-wrapper">
                  <Stethoscope size={17} />

                  <input
                    id="service-name"
                    name="name"
                    type="text"
                    placeholder="e.g. Dermatology Consultation"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              {/* Description */}

              <div className="admin-service-field full">
                <label htmlFor="service-description">
                  Description
                </label>

                <textarea
                  id="service-description"
                  name="description"
                  rows="3"
                  placeholder="Briefly describe this service..."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              {/* Duration */}

              <div className="admin-service-field">
                <label htmlFor="service-duration">
                  Duration *
                </label>

                <div className="admin-service-input-wrapper">
                  <Clock3 size={17} />

                  <input
                    id="service-duration"
                    name="duration"
                    type="number"
                    min="1"
                    placeholder="30"
                    value={formData.duration}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />

                  <span className="admin-service-input-suffix">
                    min
                  </span>
                </div>
              </div>

              {/* Price */}

              <div className="admin-service-field">
                <label htmlFor="service-price">
                  Price *
                </label>

                <div className="admin-service-input-wrapper">
                  <IndianRupee size={17} />

                  <input
                    id="service-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1000"
                    value={formData.price}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              {/* Active */}

              {editingServiceId && (
                <div className="admin-service-active-field">
                  <label className="admin-service-toggle">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={
                        formData.isActive
                      }
                      onChange={handleChange}
                      disabled={saving}
                    />

                    <span className="admin-service-toggle-track">
                      <span className="admin-service-toggle-thumb"></span>
                    </span>

                    <span>
                      Service is active
                    </span>
                  </label>

                  <small>
                    Inactive services will not
                    appear to patients during
                    booking.
                  </small>
                </div>
              )}
            </div>

            <div className="admin-service-form-actions">
              <button
                type="button"
                className="admin-service-cancel-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-save-service-button"
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
                      className="admin-loading-icon"
                    />

                    {editingServiceId
                      ? "Updating..."
                      : "Creating..."}
                  </>
                ) : editingServiceId ? (
                  <>
                    <Save size={17} />
                    Update Service
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Create Service
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =====================================
          SERVICE LIST
      ====================================== */}

      <section className="admin-services-card">
        <div className="admin-services-card-header">
          <div>
            <span className="admin-services-eyebrow">
              Healthcare
            </span>

            <h2>All Services</h2>
          </div>

          <span className="admin-service-count">
            {services.length}{" "}
            {services.length === 1
              ? "Service"
              : "Services"}
          </span>
        </div>

        {loading ? (
          <div className="admin-services-loading">
            <Loader2
              size={22}
              className="admin-loading-icon"
            />
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="admin-services-empty">
            <div className="admin-service-empty-icon">
              <Stethoscope size={26} />
            </div>

            <h3>No services yet</h3>

            <p>
              Add a service to one of your
              branches to make it available for
              patient bookings.
            </p>

            <button
              type="button"
              onClick={handleAddService}
              disabled={branches.length === 0}
            >
              <Plus size={17} />
              Add First Service
            </button>
          </div>
        ) : (
          <div className="admin-service-list">
            {services.map((service) => {
              const isDeleting =
                deletingServiceId ===
                service.id;

              return (
                <div
                  className="admin-service-item"
                  key={service.id}
                >
                  <div className="admin-service-icon">
                    <Stethoscope size={22} />
                  </div>

                  <div className="admin-service-info">
                    <div className="admin-service-title-row">
                      <h3>
                        {service.name}
                      </h3>

                      <span
                        className={`admin-service-status ${
                          service.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {service.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div className="admin-service-details">
                      <span>
                        <span className="admin-service-detail-label">
                          Branch
                        </span>

                        {getBranchName(
                          service
                        )}
                      </span>

                      <span>
                        <Clock3 size={14} />

                        {service.duration}{" "}
                        minutes
                      </span>

                      <span>
                        <IndianRupee size={14} />

                        {formatPrice(
                          service.price
                        )}
                      </span>
                    </div>

                    {service.description && (
                      <p>
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="admin-service-actions">
                    <button
                      type="button"
                      className="admin-service-edit-button"
                      title="Edit service"
                      onClick={() =>
                        handleEditService(
                          service
                        )
                      }
                      disabled={isDeleting}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      className="admin-service-delete-button"
                      title="Delete service"
                      onClick={() =>
                        handleDeleteService(
                          service
                        )
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

export default Services;