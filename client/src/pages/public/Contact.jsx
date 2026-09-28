
import { useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

import api from "../../services/api";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setSubmitted(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setSubmitted(false);
      setError("");

      await api.post("/contact", formData);

      setSubmitted(true);

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form submission error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to send your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">
      {/* =========================================
          HERO
      ========================================= */}

      <section className="contact-hero">
        <div className="contact-hero-inner">
          <div className="contact-label">
            <span></span>
            CONTACT US
          </div>

          <div className="contact-hero-grid">
            <div>
              <h1>
                We're here
                <br />
                <em>to help.</em>
              </h1>
            </div>

            <div className="contact-hero-description">
              <p>
                Have a question about appointments, services,
                providers, or your account? Send us a message and
                we'll help you find the right information.
              </p>

              <div className="contact-hero-note">
                <MessageSquare size={17} />

                <span>
                  Tell us what you need help with.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          CONTACT CONTENT
      ========================================= */}

      <section className="contact-main">
        <div className="contact-form-section">
          <div className="contact-section-heading">
            <span>01 / SEND A MESSAGE</span>

            <h2>
              How can we
              <br />
              help you?
            </h2>

            <p>
              Fill in the details below and send us your
              question or message.
            </p>
          </div>

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="contact-name">
                  Full Name
                </label>

                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">
                  Email Address
                </label>

                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="contact-phone">
                  Phone Number
                </label>

                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">
                  Subject
                </label>

                <select
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select a subject
                  </option>

                  <option value="appointment">
                    Appointment
                  </option>

                  <option value="services">
                    Healthcare Services
                  </option>

                  <option value="provider">
                    Provider
                  </option>

                  <option value="payment">
                    Payment
                  </option>

                  <option value="account">
                    Account
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">
                Message
              </label>

              <textarea
                id="contact-message"
                name="message"
                rows="6"
                placeholder="Tell us how we can help..."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <div className="contact-error">
                <span>{error}</span>
              </div>
            )}

            {submitted && (
              <div className="contact-success">
                <CheckCircle2 size={18} />

                <span>
                  Your message has been received. We'll get
                  back to you as soon as possible.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="contact-submit-button"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Message"}

              {!loading && <Send size={16} />}
            </button>
          </form>
        </div>

        {/* =========================================
            CONTACT DETAILS
        ========================================= */}

        <aside className="contact-details">
          <div className="contact-details-heading">
            <span>02 / GET IN TOUCH</span>

            <h2>
              Contact
              <br />
              information.
            </h2>
          </div>

          <div className="contact-details-list">
            <div className="contact-detail-item">
              <div className="contact-detail-icon">
                <Mail size={19} />
              </div>

              <div>
                <span>Email</span>

                <strong>
                  support@healthcare.com
                </strong>
              </div>
            </div>

            <div className="contact-detail-item">
              <div className="contact-detail-icon">
                <Phone size={19} />
              </div>

              <div>
                <span>Phone</span>

                <strong>
                  +91 00000 00000
                </strong>
              </div>
            </div>

            <div className="contact-detail-item">
              <div className="contact-detail-icon">
                <MapPin size={19} />
              </div>

              <div>
                <span>Location</span>

                <strong>
                  Healthcare Centre
                </strong>

                <small>
                  India
                </small>
              </div>
            </div>

            <div className="contact-detail-item">
              <div className="contact-detail-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <span>Support Hours</span>

                <strong>
                  Monday – Saturday
                </strong>

                <small>
                  9:00 AM – 6:00 PM
                </small>
              </div>
            </div>
          </div>

          <div className="contact-help-card">
            <div className="contact-help-icon">
              <MessageSquare size={21} />
            </div>

            <div>
              <span>NEED HELP?</span>

              <h3>
                We're happy to
                <br />
                hear from you.
              </h3>

              <p>
                Whether you have a question or need assistance
                with your appointment, you can reach out to us.
              </p>
            </div>
          </div>
        </aside>
      </section>

      {/* =========================================
          QUICK HELP
      ========================================= */}

      <section className="contact-help-section">
        <div className="contact-help-heading">
          <span>03 / QUICK HELP</span>

          <h2>
            Common questions,
            <br />
            simple answers.
          </h2>
        </div>

        <div className="contact-help-grid">
          <div className="contact-help-item">
            <span>01</span>

            <div>
              <h3>
                How do I book an appointment?
              </h3>

              <p>
                Choose a branch, service, provider, date,
                and available time slot from the appointment
                booking page.
              </p>
            </div>
          </div>

          <div className="contact-help-item">
            <span>02</span>

            <div>
              <h3>
                Can I choose my provider?
              </h3>

              <p>
                Yes. Available providers are shown according
                to the service you select.
              </p>
            </div>
          </div>

          <div className="contact-help-item">
            <span>03</span>

            <div>
              <h3>
                Where can I see my appointments?
              </h3>

              <p>
                After signing in, patients can view their
                appointments from their dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          CTA
      ========================================= */}

      <section className="contact-cta">
        <div className="contact-cta-icon">
          <CalendarDays size={27} />
        </div>

        <div className="contact-cta-content">
          <span>
            READY TO GET STARTED?
          </span>

          <h2>
            Find your provider
            <br />
            and book your care.
          </h2>
        </div>

        <a
          href="/patient/book-appointment"
          className="contact-cta-button"
        >
          Book Appointment
          <ArrowRight size={17} />
        </a>
      </section>
    </main>
  );
}

export default Contact;

