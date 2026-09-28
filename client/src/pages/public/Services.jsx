import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

function Services() {
  const services = [
    {
      id: "medical-consultation",
      number: "01",
      icon: Stethoscope,
      title: "Medical Consultation",
      description:
        "Book a consultation with a healthcare provider for your general health concerns, symptoms, and medical needs.",
      points: [
        "Choose your preferred branch",
        "Select an available provider",
        "Pick a convenient appointment slot",
      ],
    },
    {
      id: "specialist-care",
      number: "02",
      icon: UserRound,
      title: "Specialist Care",
      description:
        "Find the right healthcare provider based on their specialization and book an appointment according to your needs.",
      points: [
        "Explore provider specializations",
        "View provider information",
        "Choose your preferred provider",
      ],
    },
    {
      id: "health-checkup",
      number: "03",
      icon: Activity,
      title: "Health Checkup",
      description:
        "Explore available health checkup services and schedule an appointment at a time that works for you.",
      points: [
        "Explore available services",
        "Check service duration and fee",
        "Book an available appointment",
      ],
    },
  ];

  return (
    <main className="services-page">

      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <section className="services-page-header">
        <div className="services-header-inner">
          <div className="services-header-label">
            <span></span>
            OUR SERVICES
          </div>

          <div className="services-header-content">
            <div>
              <h1>
                Healthcare services
                <br />
                <em>made simpler.</em>
              </h1>
            </div>

            <div className="services-header-description">
              <p>
                Explore the healthcare services available through
                our platform and find the care that matches your
                needs.
              </p>

              <Link
                to="/patient/book-appointment"
                className="services-header-button"
              >
                Book an Appointment
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          SERVICES
      ========================================= */}

      <section className="services-main-section">
        <div className="services-section-top">
          <div>
            <span className="services-section-number">
              01 / AVAILABLE SERVICES
            </span>

            <h2>
              Choose the care
              <br />
              you need.
            </h2>
          </div>

          <p>
            Select a service below to learn more and continue
            with your appointment booking.
          </p>
        </div>

        <div className="services-list">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.id}
                id={service.id}
                className="services-large-card"
              >
                <div className="services-large-card-number">
                  {service.number}
                </div>

                <div className="services-large-card-icon">
                  <Icon size={30} strokeWidth={1.7} />
                </div>

                <div className="services-large-card-content">
                  <h3>{service.title}</h3>

                  <p>{service.description}</p>

                  <div className="services-points">
                    {service.points.map((point) => (
                      <div key={point}>
                        <CheckCircle2 size={16} />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="services-large-card-action">
                  <Link to="/patient/book-appointment">
                    Book Service
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================
          HOW IT WORKS
      ========================================= */}

      <section className="services-how-section">
        <div className="services-how-heading">
          <span>02 / HOW IT WORKS</span>

          <h2>
            Booking your care
            <br />
            takes a few simple steps.
          </h2>
        </div>

        <div className="services-how-grid">
          <div className="services-how-card">
            <span>01</span>

            <div className="services-how-icon">
              <HeartPulse size={22} />
            </div>

            <h3>Choose a Service</h3>

            <p>
              Select the healthcare service that matches what
              you need.
            </p>
          </div>

          <div className="services-how-card">
            <span>02</span>

            <div className="services-how-icon">
              <UserRound size={22} />
            </div>

            <h3>Select a Provider</h3>

            <p>
              Choose a healthcare provider available for your
              selected service.
            </p>
          </div>

          <div className="services-how-card">
            <span>03</span>

            <div className="services-how-icon">
              <CalendarDays size={22} />
            </div>

            <h3>Pick a Time</h3>

            <p>
              Select a date and an available appointment slot
              that works for you.
            </p>
          </div>

          <div className="services-how-card">
            <span>04</span>

            <div className="services-how-icon">
              <ShieldCheck size={22} />
            </div>

            <h3>Confirm Your Booking</h3>

            <p>
              Complete the booking process and receive your
              appointment confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================
          BOTTOM CTA
      ========================================= */}

      <section className="services-cta-section">
        <div className="services-cta-icon">
          <CalendarDays size={27} />
        </div>

        <div className="services-cta-content">
          <span>READY WHEN YOU ARE</span>

          <h2>
            Find the care you need
            <br />
            and book your appointment.
          </h2>
        </div>

        <Link
          to="/patient/book-appointment"
          className="services-cta-button"
        >
          Start Booking
          <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}

export default Services;