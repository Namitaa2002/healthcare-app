import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-inner">

          {/* LEFT CONTENT */}
          <div className="home-hero-content">
            <div className="home-eyebrow">
              <span className="home-eyebrow-line"></span>

              <span className="home-eyebrow-icon">
                <HeartPulse size={14} />
              </span>

              Healthcare, made personal
            </div>

            <h1 className="home-hero-title">
              Care that
              <br />
              <em>starts with you.</em>
            </h1>

            <p className="home-hero-description">
              Connect with trusted healthcare providers, discover
              the right services, and manage your appointments
              effortlessly — all in one place.
            </p>

            <div className="home-hero-actions">
              <Link
                to="/book-appointment"
                className="home-primary-action"
              >
                <span>Book an Appointment</span>

                <span className="home-action-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </Link>

              <Link
                to="/services"
                className="home-secondary-action"
              >
                Explore Services
              </Link>
            </div>

            <div className="home-hero-note">
              <ShieldCheck size={16} />

              <span>
                Simple booking • Trusted care • Secure experience
              </span>
            </div>
          </div>

          {/* RIGHT VISUAL */}
          <div className="home-hero-visual">

            <div className="home-visual-orbit orbit-one"></div>
            <div className="home-visual-orbit orbit-two"></div>

            <div className="home-visual-panel">

              <div className="home-visual-top">
                <span>01</span>

                <span className="home-visual-status">
                  <span></span>
                  Care is closer
                </span>
              </div>

              <div className="home-visual-center">
                <div className="home-heart-mark">
                  <HeartPulse
                    size={74}
                    strokeWidth={1.35}
                  />
                </div>

                <div className="home-heart-ring"></div>
              </div>

              <div className="home-visual-bottom">
                <div>
                  <span className="home-visual-label">
                    YOUR HEALTH
                  </span>

                  <h2>
                    One place.
                    <br />
                    Every step.
                  </h2>
                </div>

                <div className="home-sparkle">
                  <Sparkles size={18} />
                </div>
              </div>
            </div>

            {/* SMALL INFORMATION ELEMENT */}
            <div className="home-side-note">
              <span className="home-side-note-number">24/7</span>

              <span className="home-side-note-text">
                Easy access
                <br />
                to your care
              </span>
            </div>

            {/* DECORATIVE PLUS */}
            <div className="home-plus plus-one">+</div>
            <div className="home-plus plus-two">+</div>
          </div>
        </div>

        {/* BOTTOM STRIP */}
        <div className="home-hero-bottom">
          <div className="home-bottom-intro">
            <span>01</span>
            <p>Everything you need to take better care of yourself.</p>
          </div>

          <div className="home-bottom-items">
            <div>
              <strong>100+</strong>
              <span>Healthcare Providers</span>
            </div>

            <div>
              <strong>500+</strong>
              <span>Appointments</span>
            </div>

            <div>
              <strong>Easy</strong>
              <span>Appointment Booking</span>
            </div>

            <div className="home-bottom-mark">
              <CalendarDays size={19} />
              <span>Book your care</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;