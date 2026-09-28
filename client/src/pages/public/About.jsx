
import {
  ArrowRight,
  CalendarDays,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { Link } from "react-router-dom";

function About() {
  const values = [
    {
      icon: HeartPulse,
      number: "01",
      title: "Patient First",
      description:
        "Every part of the experience is designed around making healthcare easier and more accessible for patients.",
    },
    {
      icon: ShieldCheck,
      number: "02",
      title: "Trusted Care",
      description:
        "We bring patients and healthcare providers together through a simple and structured care experience.",
    },
    {
      icon: CalendarDays,
      number: "03",
      title: "Simple Booking",
      description:
        "Find a service, choose a provider, select an available time, and manage your appointment in one place.",
    },
  ];

  return (
    <main className="about-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="about-hero">
        <div className="about-hero-inner">

          <div className="about-label">
            <span></span>
            ABOUT HEALTHCARE
          </div>

          <div className="about-hero-grid">

            <div className="about-hero-heading">
              <h1>
                Healthcare
                <br />
                <em>with you</em>
                <br />
                at every step.
              </h1>
            </div>

            <div className="about-hero-content">

              <p className="about-hero-intro">
                We are building a simpler way for patients to
                discover healthcare services, connect with providers,
                and manage their appointments.
              </p>

              <p className="about-hero-text">
                Healthcare should feel clear, accessible, and
                organized. Our platform brings branches, healthcare
                providers, services, availability, appointments,
                and payments together in one connected experience.
              </p>

              <Link
                to="/patient/book-appointment"
                className="about-hero-button"
              >
                Book an Appointment
                <ArrowRight size={17} />
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================
          PLATFORM OVERVIEW
      ========================================= */}

      <section className="about-overview">

        <div className="about-overview-number">
          01
        </div>

        <div className="about-overview-content">

          <span>OUR APPROACH</span>

          <h2>
            Making the journey
            <br />
            to better care simpler.
          </h2>

          <p>
            From finding the right healthcare provider to choosing
            a convenient appointment time, our platform keeps the
            process straightforward. Patients can explore available
            services and providers before making a booking.
          </p>

        </div>

        <div className="about-overview-visual">

          <div className="about-visual-card">

            <div className="about-visual-top">
              <span>HEALTHCARE</span>
              <span>01 / 04</span>
            </div>

            <div className="about-visual-icon">
              <HeartPulse
                size={65}
                strokeWidth={1.35}
              />
            </div>

            <div className="about-visual-bottom">

              <div>
                <strong>
                  One connected
                  <br />
                  care experience.
                </strong>
              </div>

              <Stethoscope size={23} />

            </div>

          </div>

        </div>

      </section>

      {/* =========================================
          WHAT WE OFFER
      ========================================= */}

      <section className="about-platform">

        <div className="about-platform-heading">

          <div>
            <span>02 / THE PLATFORM</span>

            <h2>
              Everything connected
              <br />
              around your care.
            </h2>
          </div>

          <p>
            The platform connects the different parts of the
            appointment journey so patients and healthcare providers
            can manage care more efficiently.
          </p>

        </div>

        <div className="about-platform-grid">

          <div className="about-platform-item">

            <div className="about-platform-icon">
              <UsersRound size={22} />
            </div>

            <div>
              <span>01</span>
              <h3>Healthcare Providers</h3>
              <p>
                Discover providers along with their
                specializations, qualifications, and experience.
              </p>
            </div>

          </div>

          <div className="about-platform-item">

            <div className="about-platform-icon">
              <Stethoscope size={22} />
            </div>

            <div>
              <span>02</span>
              <h3>Healthcare Services</h3>
              <p>
                Explore available services, duration, and
                consultation fees before booking.
              </p>
            </div>

          </div>

          <div className="about-platform-item">

            <div className="about-platform-icon">
              <CalendarDays size={22} />
            </div>

            <div>
              <span>03</span>
              <h3>Appointments</h3>
              <p>
                Select a provider, choose an available date and
                time, and manage your appointment.
              </p>
            </div>

          </div>

          <div className="about-platform-item">

            <div className="about-platform-icon">
              <ShieldCheck size={22} />
            </div>

            <div>
              <span>04</span>
              <h3>Secure Experience</h3>
              <p>
                Keep the booking and payment journey structured
                through a secure platform experience.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* =========================================
          VALUES
      ========================================= */}

      <section className="about-values">

        <div className="about-values-heading">

          <span>03 / WHAT MATTERS</span>

          <h2>
            Built around
            <br />
            better experiences.
          </h2>

        </div>

        <div className="about-values-list">

          {values.map((value) => {
            const Icon = value.icon;

            return (
              <article
                key={value.number}
                className="about-value-card"
              >

                <div className="about-value-number">
                  {value.number}
                </div>

                <div className="about-value-icon">
                  <Icon size={23} />
                </div>

                <div className="about-value-content">

                  <h3>
                    {value.title}
                  </h3>

                  <p>
                    {value.description}
                  </p>

                </div>

                <ArrowRight
                  size={19}
                  className="about-value-arrow"
                />

              </article>
            );
          })}

        </div>

      </section>

      {/* =========================================
          CTA
      ========================================= */}

      <section className="about-cta">

        <div className="about-cta-icon">
          <HeartPulse size={28} />
        </div>

        <div className="about-cta-content">

          <span>
            YOUR CARE STARTS HERE
          </span>

          <h2>
            Find a provider.
            <br />
            Choose your time.
          </h2>

        </div>

        <Link
          to="/patient/book-appointment"
          className="about-cta-button"
        >
          Start Booking
          <ArrowRight size={17} />
        </Link>

      </section>

    </main>
  );
}

export default About;

