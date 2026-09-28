
import {
  ArrowUpRight,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <a href="/" className="site-footer-logo">
            <span className="site-footer-logo-mark">
              +
            </span>

            <span>HealthCare</span>
          </a>

          <p>
            Simple, accessible healthcare management for
            patients, providers, and healthcare teams.
          </p>

          <a
            href="/patient/book-appointment"
            className="site-footer-book"
          >
            Book an Appointment
            <ArrowUpRight size={16} />
          </a>
        </div>

        <div className="site-footer-column">
          <span className="site-footer-heading">
            EXPLORE
          </span>

          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/providers">Providers</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </div>

        <div className="site-footer-column">
          <span className="site-footer-heading">
            PATIENTS
          </span>

          <a href="/patient/book-appointment">
            Book Appointment
          </a>

          <a href="/login">Patient Login</a>

          <a href="/patient/appointments">
            My Appointments
          </a>
        </div>

        <div className="site-footer-contact">
          <span className="site-footer-heading">
            GET IN TOUCH
          </span>

          <div className="site-footer-contact-item">
            <Mail size={16} />
            <span>support@healthcare.com</span>
          </div>

          <div className="site-footer-contact-item">
            <Phone size={16} />
            <span>+91 00000 00000</span>
          </div>

          <div className="site-footer-contact-item">
            <MapPin size={16} />
            <span>Healthcare Centre, India</span>
          </div>

          <div className="site-footer-contact-item">
            <CalendarDays size={16} />
            <span>Mon – Sat · 9:00 AM – 6:00 PM</span>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>
          © {new Date().getFullYear()} HealthCare. All
          rights reserved.
        </span>

        <div className="site-footer-bottom-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>

        <span className="site-footer-made">
          Healthcare, made simpler.
        </span>
      </div>
    </footer>
  );
}

export default Footer;

