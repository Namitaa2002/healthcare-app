import "../../styles/BookAppointment.css";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { getBranches } from "../../services/branchService";

import {
  createAppointment,
  getAvailableSlots,
} from "../../services/appointmentService";

import { createCheckoutSession } from "../../services/stripeService";

import api from "../../services/api";

function BookAppointment() {
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState("");

  // =========================================
  // FETCH BRANCHES
  // =========================================

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        setError("");

        const response = await getBranches();

        setBranches(response.data || []);
      } catch (error) {
        console.error("Fetch branches error:", error);

        setBranches([]);

        setError(
          error.response?.data?.message ||
            "Unable to load branches. Please try again."
        );
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  // =========================================
  // FETCH SERVICES
  // =========================================

  useEffect(() => {
    if (!selectedBranch) {
      setServices([]);
      return;
    }

    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        setError("");

        const response = await api.get("/services", {
          params: {
            branchId: selectedBranch,
          },
        });

        setServices(response.data?.data || []);
      } catch (error) {
        console.error("Fetch services error:", error);

        setServices([]);

        setError(
          error.response?.data?.message ||
            "Unable to load services. Please try again."
        );
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [selectedBranch]);

  // =========================================
  // FETCH PROVIDERS
  // =========================================

  useEffect(() => {
    if (!selectedService) {
      setProviders([]);
      return;
    }

    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        setError("");

        const response = await api.get("/provider-services", {
          params: {
            serviceId: selectedService,
          },
        });

        setProviders(response.data?.data || []);
      } catch (error) {
        console.error("Fetch providers error:", error);

        setProviders([]);

        setError(
          error.response?.data?.message ||
            "Unable to load providers. Please try again."
        );
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [selectedService]);

  // =========================================
  // FETCH AVAILABLE SLOTS
  // =========================================

  useEffect(() => {
    if (!selectedProvider || !selectedService || !selectedDate) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setError("");
        setSelectedSlot(null);

        const response = await getAvailableSlots({
          providerId: selectedProvider,
          serviceId: selectedService,
          date: selectedDate,
        });

        setSlots(response.data || []);
      } catch (error) {
        console.error("Fetch slots error:", error);

        setSlots([]);

        setError(
          error.response?.data?.message ||
            "Unable to load available slots. Please try again."
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedProvider, selectedService, selectedDate]);

  // =========================================
  // SELECTED DATA
  // =========================================

  const selectedBranchData = useMemo(
    () => branches.find((branch) => branch.id === selectedBranch),
    [branches, selectedBranch]
  );

  const selectedServiceData = useMemo(
    () => services.find((service) => service.id === selectedService),
    [services, selectedService]
  );

  const selectedProviderData = useMemo(
    () => providers.find((provider) => provider.id === selectedProvider),
    [providers, selectedProvider]
  );

  // =========================================
  // DATE
  // =========================================

  const today = new Date().toISOString().split("T")[0];

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  // =========================================
  // HANDLERS
  // =========================================

  const handleBranchSelect = (branchId) => {
    setSelectedBranch(branchId);

    setSelectedService("");
    setSelectedProvider("");
    setSelectedDate("");
    setSelectedSlot(null);

    setServices([]);
    setProviders([]);
    setSlots([]);

    setError("");
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);

    setSelectedProvider("");
    setSelectedDate("");
    setSelectedSlot(null);

    setProviders([]);
    setSlots([]);

    setError("");
  };

  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId);

    setSelectedDate("");
    setSelectedSlot(null);

    setSlots([]);

    setError("");
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);

    setSelectedSlot(null);
    setError("");
  };

  // =========================================
  // CONTINUE TO PAYMENT
  // =========================================

  const handleContinue = async () => {
    if (!selectedBranch) {
      setError("Please select a branch.");
      return;
    }

    if (!selectedService) {
      setError("Please select a service.");
      return;
    }

    if (!selectedProvider) {
      setError("Please select a provider.");
      return;
    }

    if (!selectedDate) {
      setError("Please select an appointment date.");
      return;
    }

    if (!selectedSlot) {
      setError("Please select an available time slot.");
      return;
    }

    try {
      setProcessingPayment(true);
      setError("");

      // 1. Create appointment
      const appointmentResponse = await createAppointment({
        providerId: selectedProvider,
        serviceId: selectedService,
        branchId: selectedBranch,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      if (
        !appointmentResponse?.success ||
        !appointmentResponse?.data?.id
      ) {
        throw new Error(
          appointmentResponse?.message ||
            "Unable to create appointment."
        );
      }

      const appointmentId = appointmentResponse.data.id;

      // 2. Create Stripe Checkout Session
      const checkoutResponse =
        await createCheckoutSession(appointmentId);

      if (
        !checkoutResponse?.success ||
        !checkoutResponse?.data?.checkoutUrl
      ) {
        throw new Error(
          checkoutResponse?.message ||
            "Unable to start payment."
        );
      }

      // 3. Redirect to Stripe Checkout
      window.location.href =
        checkoutResponse.data.checkoutUrl;
    } catch (error) {
      console.error("Booking/payment error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong while processing your booking."
      );

      setProcessingPayment(false);
    }
  };

  return (
    <div className="book-appointment-page">
      <div className="booking-container">

        {/* HEADER */}
        <div className="booking-header">
          <div>
            <p className="booking-eyebrow">
              Appointments
            </p>

            <h1>Book an Appointment</h1>

            <p className="booking-subtitle">
              Choose your branch, service, provider and
              preferred appointment time.
            </p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="booking-progress">

          <div
            className={`progress-item ${
              selectedBranch ? "completed" : "active"
            }`}
          >
            <span>1</span>

            <div>
              <strong>Branch</strong>
              <small>Select location</small>
            </div>
          </div>

          <div
            className={`progress-item ${
              selectedService ? "completed" : ""
            }`}
          >
            <span>2</span>

            <div>
              <strong>Service</strong>
              <small>Choose service</small>
            </div>
          </div>

          <div
            className={`progress-item ${
              selectedProvider ? "completed" : ""
            }`}
          >
            <span>3</span>

            <div>
              <strong>Provider</strong>
              <small>Choose provider</small>
            </div>
          </div>

          <div
            className={`progress-item ${
              selectedDate ? "completed" : ""
            }`}
          >
            <span>4</span>

            <div>
              <strong>Date</strong>
              <small>Select date</small>
            </div>
          </div>

          <div
            className={`progress-item ${
              selectedSlot ? "completed" : ""
            }`}
          >
            <span>5</span>

            <div>
              <strong>Time</strong>
              <small>Select slot</small>
            </div>
          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="booking-error">
            {error}
          </div>
        )}

        <div className="booking-layout">

          {/* MAIN BOOKING CONTENT */}
          <div className="booking-main">

            {/* =========================================
                BRANCH
            ========================================= */}

            <section className="booking-section">

              <div className="section-heading">

                <div className="section-icon">
                  <Building2 size={22} />
                </div>

                <div>
                  <h2>Choose a Branch</h2>

                  <p>
                    Select where you want your appointment.
                  </p>
                </div>

              </div>

              {loadingBranches ? (
                <div className="section-loading">
                  <Loader2
                    className="spin"
                    size={22}
                  />

                  Loading branches...
                </div>
              ) : branches.length === 0 ? (
                <div className="empty-state">
                  No branches available.
                </div>
              ) : (
                <div className="option-grid branch-grid">

                  {branches.map((branch) => (

                    <button
                      type="button"
                      key={branch.id}
                      className={`option-card branch-card ${
                        selectedBranch === branch.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleBranchSelect(branch.id)
                      }
                    >

                      <div className="option-card-icon">
                        <Building2 size={24} />
                      </div>

                      <div className="option-card-content">

                        <h3>{branch.name}</h3>

                        {(branch.city || branch.state) && (
                          <p>
                            {[branch.city, branch.state]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}

                        {branch.address && (
                          <span>
                            {branch.address}
                          </span>
                        )}

                      </div>

                      {selectedBranch === branch.id && (
                        <CheckCircle2
                          className="selected-check"
                          size={22}
                        />
                      )}

                    </button>

                  ))}

                </div>
              )}

            </section>

            {/* =========================================
                SERVICE
            ========================================= */}

            {selectedBranch && (

              <section className="booking-section">

                <div className="section-heading">

                  <div className="section-icon">
                    <Stethoscope size={22} />
                  </div>

                  <div>
                    <h2>Choose a Service</h2>

                    <p>
                      Select the consultation or service.
                    </p>
                  </div>

                </div>

                {loadingServices ? (
                  <div className="section-loading">

                    <Loader2
                      className="spin"
                      size={22}
                    />

                    Loading services...

                  </div>
                ) : services.length === 0 ? (
                  <div className="empty-state">
                    No services are available at this branch.
                  </div>
                ) : (

                  <div className="option-grid service-grid">

                    {services.map((service) => (

                      <button
                        type="button"
                        key={service.id}
                        className={`option-card service-card ${
                          selectedService === service.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleServiceSelect(service.id)
                        }
                      >

                        <div className="option-card-content">

                          <div className="service-title-row">

                            <h3>{service.name}</h3>

                            {selectedService === service.id && (
                              <CheckCircle2
                                className="selected-check"
                                size={22}
                              />
                            )}

                          </div>

                          {service.description && (
                            <p>
                              {service.description}
                            </p>
                          )}

                          <div className="service-meta">

                            <span>
                              <Clock3 size={16} />

                              {service.duration} min
                            </span>

                            <strong>
                              ₹
                              {Number(
                                service.price
                              ).toLocaleString("en-IN")}
                            </strong>

                          </div>

                        </div>

                      </button>

                    ))}

                  </div>

                )}

              </section>

            )}

            {/* =========================================
                PROVIDER
            ========================================= */}

            {selectedService && (

              <section className="booking-section">

                <div className="section-heading">

                  <div className="section-icon">
                    <UserRound size={22} />
                  </div>

                  <div>
                    <h2>Choose a Provider</h2>

                    <p>
                      Select your preferred doctor or provider.
                    </p>
                  </div>

                </div>

                {loadingProviders ? (

                  <div className="section-loading">

                    <Loader2
                      className="spin"
                      size={22}
                    />

                    Loading providers...

                  </div>

                ) : providers.length === 0 ? (

                  <div className="empty-state">
                    No providers are available for this service.
                  </div>

                ) : (

                  <div className="option-grid provider-grid">

                    {providers.map((provider) => (

                      <button
                        type="button"
                        key={provider.id}
                        className={`option-card provider-card ${
                          selectedProvider === provider.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleProviderSelect(provider.id)
                        }
                      >

                        <div className="provider-avatar">
                          <UserRound size={26} />
                        </div>

                        <div className="option-card-content">

                          <div className="provider-name-row">

                            <h3>
                              {provider.name}
                            </h3>

                            {selectedProvider === provider.id && (
                              <CheckCircle2
                                className="selected-check"
                                size={22}
                              />
                            )}

                          </div>

                          {provider.specialization && (
                            <p className="provider-specialization">
                              {provider.specialization}
                            </p>
                          )}

                          {provider.qualification && (
                            <span>
                              {provider.qualification}
                            </span>
                          )}

                          {provider.experienceYears !== null &&
                            provider.experienceYears !==
                              undefined && (
                              <span>
                                {provider.experienceYears}{" "}
                                years experience
                              </span>
                            )}

                        </div>

                      </button>

                    ))}

                  </div>

                )}

              </section>

            )}

            {/* =========================================
                DATE
            ========================================= */}

            {selectedProvider && (

              <section className="booking-section">

                <div className="section-heading">

                  <div className="section-icon">
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <h2>Select Date</h2>

                    <p>
                      Choose your preferred appointment date.
                    </p>
                  </div>

                </div>

                <div className="date-picker-wrapper">

                  <CalendarDays size={22} />

                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={handleDateChange}
                  />

                </div>

                {selectedDate && (
                  <div className="selected-date-label">
                    {formatDate(selectedDate)}
                  </div>
                )}

              </section>

            )}

            {/* =========================================
                TIME
            ========================================= */}

            {selectedDate && (

              <section className="booking-section">

                <div className="section-heading">

                  <div className="section-icon">
                    <Clock3 size={22} />
                  </div>

                  <div>
                    <h2>Select Time</h2>

                    <p>
                      Available appointment slots for the
                      selected date.
                    </p>
                  </div>

                </div>

                {loadingSlots ? (

                  <div className="section-loading">

                    <Loader2
                      className="spin"
                      size={22}
                    />

                    Finding available slots...

                  </div>

                ) : slots.length === 0 ? (

                  <div className="empty-state">

                    No available slots for this date.
                    Please choose another date.

                  </div>

                ) : (

                  <div className="slot-grid">

                    {slots.map((slot) => {

                      const isSelected =
                        selectedSlot?.startTime ===
                          slot.startTime &&
                        selectedSlot?.endTime ===
                          slot.endTime;

                      return (

                        <button
                          type="button"
                          key={`${slot.startTime}-${slot.endTime}`}
                          className={`slot-card ${
                            isSelected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setError("");
                          }}
                        >

                          <Clock3 size={18} />

                          <span>
                            {slot.startTime} -{" "}
                            {slot.endTime}
                          </span>

                          {isSelected && (
                            <CheckCircle2 size={19} />
                          )}

                        </button>

                      );
                    })}

                  </div>

                )}

              </section>

            )}

          </div>

          {/* =========================================
              SUMMARY
          ========================================= */}

          <aside className="booking-summary">

            <div className="summary-header">

              <h2>Appointment Summary</h2>

              <p>
                Review your selection before payment.
              </p>

            </div>

            <div className="summary-content">

              {/* BRANCH */}
              <div className="summary-item">

                <span>Branch</span>

                <strong>
                  {selectedBranchData?.name ||
                    "Not selected"}
                </strong>

              </div>

              <div className="summary-divider" />

              {/* SERVICE */}
              <div className="summary-item">

                <span>Service</span>

                <strong>
                  {selectedServiceData?.name ||
                    "Not selected"}
                </strong>

              </div>

              <div className="summary-divider" />

              {/* PROVIDER */}
              <div className="summary-item">

                <span>Provider</span>

                <strong>
                  {selectedProviderData?.name ||
                    "Not selected"}
                </strong>

              </div>

              <div className="summary-divider" />

              {/* DATE */}
              <div className="summary-item">

                <span>Date</span>

                <strong>
                  {selectedDate
                    ? formatDate(selectedDate)
                    : "Not selected"}
                </strong>

              </div>

              <div className="summary-divider" />

              {/* TIME */}
              <div className="summary-item">

                <span>Time</span>

                <strong>
                  {selectedSlot
                    ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                    : "Not selected"}
                </strong>

              </div>

              {/* =====================================
                  TOTAL
                  FEE APPEARS ONLY AFTER PROVIDER
                  IS SELECTED
              ===================================== */}

              {selectedProvider &&
                selectedServiceData && (

                  <div className="summary-total">

                    <span>
                      Consultation Fee
                    </span>

                    <strong>
                      ₹
                      {Number(
                        selectedServiceData.price
                      ).toLocaleString("en-IN")}
                    </strong>

                  </div>

                )}

              {/* PAYMENT BUTTON */}

              <button
                type="button"
                className="payment-button"
                disabled={
                  processingPayment ||
                  !selectedBranch ||
                  !selectedService ||
                  !selectedProvider ||
                  !selectedDate ||
                  !selectedSlot
                }
                onClick={handleContinue}
              >

                {processingPayment ? (

                  <>
                    <Loader2
                      className="spin"
                      size={20}
                    />

                    Processing...
                  </>

                ) : (

                  <>
                    Continue to Payment

                    <ArrowRight size={20} />
                  </>

                )}

              </button>

              {/* SECURE PAYMENT NOTE */}

              <div className="secure-payment-note">

                <CheckCircle2 size={17} />

                <span>
                  You will be redirected to secure Stripe
                  Checkout to complete your payment.
                </span>

              </div>

            </div>

          </aside>

        </div>
      </div>
    </div>
  );
}

export default BookAppointment;