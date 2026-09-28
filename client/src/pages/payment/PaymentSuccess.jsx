import "../../styles/PaymentResult.css";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("session_id");

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        <div className="payment-success-icon">
          <CheckCircle2 size={48} />
        </div>

        <p className="payment-result-label">Payment Successful</p>

        <h1>Appointment Confirmed!</h1>

        <p className="payment-result-text">
          Your payment has been successfully processed and your appointment
          has been confirmed.
        </p>

        <div className="payment-result-info">
          <div className="payment-info-item">
            <CalendarDays size={20} />
            <div>
              <span>Appointment</span>
              <strong>Confirmed</strong>
            </div>
          </div>

          <div className="payment-info-item">
            <ShieldCheck size={20} />
            <div>
              <span>Payment</span>
              <strong>Paid</strong>
            </div>
          </div>
        </div>

        {sessionId && (
          <p className="payment-session">
            Payment reference: {sessionId.slice(0, 18)}...
          </p>
        )}

        <Link to="/patient/appointments" className="payment-result-button">
          View My Appointments
          <ArrowRight size={19} />
        </Link>

        <Link to="/patient/book-appointment" className="payment-secondary-link">
          Book another appointment
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;