
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowRight,
  HeartPulse,
  Loader2,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../../services/api";

function Providers() {
  const [providers, setProviders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // FETCH PROVIDERS FROM BACKEND
  // =========================================

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/providers/public");

        setProviders(response.data?.data || []);
      } catch (error) {
        console.error("Fetch providers error:", error);

        setProviders([]);

        setError(
          error.response?.data?.message ||
            "Unable to load healthcare providers."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // =========================================
  // SEARCH PROVIDERS
  // =========================================

  const filteredProviders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return providers;
    }

    return providers.filter((provider) => {
      const name =
        provider.user?.name?.toLowerCase() || "";

      const specialization =
        provider.specialization?.toLowerCase() || "";

      const qualification =
        provider.qualification?.toLowerCase() || "";

      const branch =
        provider.user?.branch?.name?.toLowerCase() || "";

      const city =
        provider.user?.branch?.city?.toLowerCase() || "";

      const state =
        provider.user?.branch?.state?.toLowerCase() || "";

      return (
        name.includes(search) ||
        specialization.includes(search) ||
        qualification.includes(search) ||
        branch.includes(search) ||
        city.includes(search) ||
        state.includes(search)
      );
    });
  }, [providers, searchTerm]);

  // =========================================
  // CLEAR SEARCH
  // =========================================

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <main className="providers-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <section className="providers-header">
        <div className="providers-header-inner">

          <div className="providers-label">
            <span></span>
            OUR HEALTHCARE PROVIDERS
          </div>

          <div className="providers-header-content">

            <div>
              <h1>
                Meet the people
                <br />
                <em>behind your care.</em>
              </h1>
            </div>

            <div className="providers-header-description">

              <p>
                Browse healthcare providers, explore their
                specializations, and choose the right professional
                for your appointment.
              </p>

              <Link
                to="/patient/book-appointment"
                className="providers-header-button"
              >
                Find a Provider
                <ArrowRight size={17} />
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================
          PROVIDER DIRECTORY
      ========================================= */}

      <section className="providers-directory">

        <div className="providers-directory-top">

          <div>
            <span className="providers-section-label">
              01 / PROVIDER DIRECTORY
            </span>

            <h2>
              Find the right
              <br />
              healthcare professional.
            </h2>
          </div>

          {/* SEARCH */}

          <div className="providers-search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search providers..."
              aria-label="Search providers"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

            {searchTerm && (
              <button
                type="button"
                className="providers-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

          </div>

        </div>

        {/* SEARCH RESULT COUNT */}

        {!loading && !error && searchTerm.trim() && (
          <div className="providers-search-result">
            <span>
              {filteredProviders.length}{" "}
              {filteredProviders.length === 1
                ? "provider"
                : "providers"}{" "}
              found
            </span>
          </div>
        )}

        {/* =========================================
            LOADING
        ========================================= */}

        {loading && (
          <div className="providers-loading">

            <Loader2
              size={22}
              className="providers-loading-icon"
            />

            <span>
              Loading healthcare providers...
            </span>

          </div>
        )}

        {/* =========================================
            ERROR
        ========================================= */}

        {!loading && error && (
          <div className="providers-error">
            {error}
          </div>
        )}

        {/* =========================================
            PROVIDER LIST
        ========================================= */}

        {!loading &&
          !error &&
          filteredProviders.length > 0 && (

            <div className="providers-list">

              {filteredProviders.map(
                (provider, index) => {

                  const providerName =
                    provider.user?.name ||
                    "Healthcare Provider";

                  const branch =
                    provider.user?.branch;

                  return (
                    <article
                      key={provider.id}
                      className="provider-public-card"
                    >

                      {/* NUMBER */}

                      <div className="provider-public-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      {/* AVATAR */}

                      <div className="provider-public-avatar">
                        <UserRound
                          size={30}
                          strokeWidth={1.7}
                        />
                      </div>

                      {/* INFORMATION */}

                      <div className="provider-public-info">

                        <h3>
                          {providerName}
                        </h3>

                        {provider.specialization && (
                          <span className="provider-public-specialization">

                            <Stethoscope size={14} />

                            {provider.specialization}

                          </span>
                        )}

                        <div className="provider-public-meta">

                          {provider.qualification && (
                            <span>
                              {provider.qualification}
                            </span>
                          )}

                          {provider.experienceYears !==
                            null &&
                            provider.experienceYears !==
                              undefined && (
                              <span>
                                {provider.experienceYears}{" "}
                                years experience
                              </span>
                            )}

                          {branch?.name && (
                            <span>
                              {branch.name}
                            </span>
                          )}

                          {branch?.city && (
                            <span>
                              {branch.city}
                              {branch.state
                                ? `, ${branch.state}`
                                : ""}
                            </span>
                          )}

                        </div>

                      </div>

                      {/* BOOK */}

                      <Link
                        to="/patient/book-appointment"
                        className="provider-public-action"
                      >
                        Book Appointment
                        <ArrowRight size={16} />
                      </Link>

                    </article>
                  );
                }
              )}

            </div>
          )}

        {/* =========================================
            SEARCH EMPTY
        ========================================= */}

        {!loading &&
          !error &&
          filteredProviders.length === 0 &&
          searchTerm.trim() && (

            <div className="providers-empty">

              <Search size={24} />

              <strong>
                No providers found
              </strong>

              <span>
                Try searching with a different name,
                specialization, branch, or qualification.
              </span>

              <button
                type="button"
                onClick={handleClearSearch}
              >
                Clear Search
              </button>

            </div>
          )}

        {/* =========================================
            NO PROVIDERS
        ========================================= */}

        {!loading &&
          !error &&
          providers.length === 0 &&
          !searchTerm.trim() && (

            <div className="providers-empty">

              <UserRound size={24} />

              <strong>
                No providers available
              </strong>

              <span>
                There are currently no healthcare providers
                available.
              </span>

            </div>
          )}

      </section>

      {/* =========================================
          SPECIALIZATIONS
      ========================================= */}

      <section
        id="specializations"
        className="providers-specializations"
      >

        <div className="providers-specializations-heading">

          <span>
            02 / SPECIALIZATIONS
          </span>

          <h2>
            Care across
            <br />
            different needs.
          </h2>

        </div>

        <div className="specialization-grid">

          <div className="specialization-item">
            <Stethoscope size={21} />

            <div>
              <strong>
                General Medicine
              </strong>

              <span>
                Everyday health consultations
              </span>
            </div>
          </div>

          <div className="specialization-item">
            <HeartPulse size={21} />

            <div>
              <strong>
                Cardiology
              </strong>

              <span>
                Heart and cardiovascular care
              </span>
            </div>
          </div>

          <div className="specialization-item">
            <Activity size={21} />

            <div>
              <strong>
                Dermatology
              </strong>

              <span>
                Skin and related healthcare
              </span>
            </div>
          </div>

          <div className="specialization-item">
            <UserRound size={21} />

            <div>
              <strong>
                Specialist Care
              </strong>

              <span>
                Care based on your health needs
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================
          CTA
      ========================================= */}

      <section
        id="availability"
        className="providers-availability"
      >

        <div className="providers-availability-icon">
          <Stethoscope size={27} />
        </div>

        <div>

          <span>
            READY TO FIND YOUR PROVIDER?
          </span>

          <h2>
            Choose a provider,
            <br />
            pick a time, and book your care.
          </h2>

        </div>

        <Link
          to="/patient/book-appointment"
          className="providers-availability-button"
        >
          Start Booking
          <ArrowRight size={17} />
        </Link>

      </section>

    </main>
  );
}

export default Providers;

