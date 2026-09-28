import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseMedical,
  CheckCircle2,
  Loader2,
  Plus,
  Stethoscope,
  UserRound,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/adminProviderServices.css";

function ProviderServices() {
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedProvider, setSelectedProvider] =
    useState("");
  const [selectedService, setSelectedService] =
    useState("");

  const [loadingProviders, setLoadingProviders] =
    useState(true);
  const [loadingServices, setLoadingServices] =
    useState(true);
  const [loadingAssignments, setLoadingAssignments] =
    useState(false);
  const [assigning, setAssigning] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // FETCH PROVIDERS
  // =========================================

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

  // =========================================
  // FETCH SERVICES
  // =========================================

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
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
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchServices();
  }, []);

  // =========================================
  // SELECTED PROVIDER
  // =========================================

  const selectedProviderData = useMemo(() => {
    return providers.find(
      (provider) =>
        provider.id === selectedProvider
    );
  }, [providers, selectedProvider]);

  // =========================================
  // SERVICES FOR SELECTED PROVIDER'S BRANCH
  // =========================================

  const availableServices = useMemo(() => {
    if (!selectedProviderData) {
      return services;
    }

    const providerBranchId =
      selectedProviderData.user?.branchId;

    if (!providerBranchId) {
      return services;
    }

    return services.filter(
      (service) =>
        service.branchId === providerBranchId
    );
  }, [services, selectedProviderData]);

  // =========================================
  // PROVIDER NAME
  // =========================================

  const getProviderName = (provider) => {
    const name =
      provider.user?.name || "Provider";

    const cleanName = String(name)
      .trim()
      .replace(/^dr\.?\s+/i, "");

    return cleanName
      ? `Dr. ${cleanName}`
      : "Provider";
  };

  // =========================================
  // BRANCH NAME
  // =========================================

  const getBranchName = (provider) => {
    return (
      provider.user?.branch?.name ||
      "Branch"
    );
  };

  // =========================================
  // ASSIGN SERVICE
  // =========================================

  const handleAssign = async (event) => {
    event.preventDefault();

    if (!selectedProvider) {
      setError("Please select a provider.");
      return;
    }

    if (!selectedService) {
      setError("Please select a service.");
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        "/provider-services",
        {
          providerId: selectedProvider,
          serviceId: selectedService,
        }
      );

      if (response.data?.success) {
        setSuccess(
          "Service assigned to provider successfully."
        );

        setSelectedService("");

        await fetchAssignments();
      }
    } catch (error) {
      console.error(
        "Assign service error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to assign service."
      );
    } finally {
      setAssigning(false);
    }
  };

  // =========================================
  // FETCH ASSIGNMENTS
  // =========================================

  const fetchAssignments = async () => {
    if (!selectedProvider) {
      setAssignments([]);
      return;
    }

    try {
      setLoadingAssignments(true);

      const providerServices = [];

      for (const service of services) {
        try {
          const response = await api.get(
            "/provider-services",
            {
              params: {
                serviceId: service.id,
              },
            }
          );

          const providerList =
            response.data?.data || [];

          const providerExists =
            providerList.some(
              (provider) =>
                provider.id ===
                selectedProvider
            );

          if (providerExists) {
            providerServices.push(service);
          }
        } catch (error) {
          console.error(
            `Fetch assignment for service ${service.id} error:`,
            error
          );
        }
      }

      setAssignments(providerServices);
    } catch (error) {
      console.error(
        "Fetch assignments error:",
        error
      );

      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (
      selectedProvider &&
      services.length > 0
    ) {
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [selectedProvider, services]);

  // =========================================
  // PROVIDER CHANGE
  // =========================================

  const handleProviderChange = (event) => {
    setSelectedProvider(
      event.target.value
    );

    setSelectedService("");
    setError("");
    setSuccess("");
  };

  // =========================================
  // SERVICE CHANGE
  // =========================================

  const handleServiceChange = (event) => {
    setSelectedService(
      event.target.value
    );

    setError("");
    setSuccess("");
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="admin-provider-services-page">
      {/* HEADER */}

      <div className="admin-provider-services-header">
        <div>
          <span className="admin-provider-services-eyebrow">
            Organization
          </span>

          <h1>Provider Services</h1>

          <p>
            Assign healthcare services to
            providers in their respective
            branches.
          </p>
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="admin-provider-services-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-provider-services-alert success">
          {success}
        </div>
      )}

      <div className="admin-provider-services-layout">
        {/* ASSIGN CARD */}

        <section className="admin-provider-services-card">
          <div className="admin-provider-services-card-header">
            <div className="admin-provider-services-icon">
              <BriefcaseMedical size={22} />
            </div>

            <div>
              <span className="admin-provider-services-eyebrow">
                Assignment
              </span>

              <h2>
                Assign Service
              </h2>

              <p>
                Select a provider and assign an
                available service.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAssign}
            className="admin-provider-services-form"
          >
            {/* PROVIDER */}

            <div className="admin-provider-services-field">
              <label htmlFor="provider-select">
                Provider *
              </label>

              <div className="admin-provider-services-select-wrapper">
                <UserRound size={17} />

                <select
                  id="provider-select"
                  value={selectedProvider}
                  onChange={
                    handleProviderChange
                  }
                  disabled={
                    loadingProviders ||
                    assigning
                  }
                  required
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
                        )}{" "}
                        —{" "}
                        {getBranchName(
                          provider
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* SERVICE */}

            <div className="admin-provider-services-field">
              <label htmlFor="service-select">
                Service *
              </label>

              <div className="admin-provider-services-select-wrapper">
                <Stethoscope size={17} />

                <select
                  id="service-select"
                  value={selectedService}
                  onChange={
                    handleServiceChange
                  }
                  disabled={
                    !selectedProvider ||
                    loadingServices ||
                    assigning
                  }
                  required
                >
                  <option value="">
                    {!selectedProvider
                      ? "Select provider first"
                      : loadingServices
                      ? "Loading services..."
                      : availableServices.length ===
                        0
                      ? "No services for this branch"
                      : "Select Service"}
                  </option>

                  {availableServices.map(
                    (service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name} — ₹
                        {Number(
                          service.price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="admin-provider-services-assign-button"
              disabled={
                assigning ||
                loadingProviders ||
                loadingServices ||
                !selectedProvider ||
                !selectedService
              }
            >
              {assigning ? (
                <>
                  <Loader2
                    size={18}
                    className="admin-provider-services-loading-icon"
                  />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Assign Service
                </>
              )}
            </button>
          </form>
        </section>

        {/* SELECTED PROVIDER CARD */}

        <section className="admin-provider-services-card">
          <div className="admin-provider-services-card-header">
            <div className="admin-provider-services-icon">
              <UserRound size={22} />
            </div>

            <div>
              <span className="admin-provider-services-eyebrow">
                Provider
              </span>

              <h2>
                Selected Provider
              </h2>
            </div>
          </div>

          {!selectedProviderData ? (
            <div className="admin-provider-services-empty">
              <UserRound size={25} />

              <p>
                Select a provider to view their
                assigned services.
              </p>
            </div>
          ) : (
            <div className="admin-provider-services-provider">
              <div className="admin-provider-services-provider-avatar">
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
                  {getBranchName(
                    selectedProviderData
                  )}
                </small>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ASSIGNED SERVICES */}

      <section className="admin-provider-services-card assigned">
        <div className="admin-provider-services-card-header">
          <div className="admin-provider-services-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span className="admin-provider-services-eyebrow">
              Current Assignments
            </span>

            <h2>
              Assigned Services
            </h2>
          </div>
        </div>

        {!selectedProvider ? (
          <div className="admin-provider-services-empty">
            <Stethoscope size={26} />

            <p>
              Select a provider to view assigned
              services.
            </p>
          </div>
        ) : loadingAssignments ? (
          <div className="admin-provider-services-loading">
            <Loader2
              size={22}
              className="admin-provider-services-loading-icon"
            />

            Loading assigned services...
          </div>
        ) : assignments.length === 0 ? (
          <div className="admin-provider-services-empty">
            <Stethoscope size={26} />

            <p>
              No services assigned to this
              provider yet.
            </p>
          </div>
        ) : (
          <div className="admin-provider-services-assignment-list">
            {assignments.map((service) => (
              <div
                key={service.id}
                className="admin-provider-services-assignment-item"
              >
                <div className="admin-provider-services-assignment-icon">
                  <Stethoscope size={20} />
                </div>

                <div className="admin-provider-services-assignment-info">
                  <h3>
                    {service.name}
                  </h3>

                  <div>
                    <span>
                      {service.duration} minutes
                    </span>

                    <span>
                      ₹
                      {Number(
                        service.price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                </div>

                <span className="admin-provider-services-assignment-status">
                  <CheckCircle2 size={13} />
                  Assigned
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ProviderServices;