import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck2,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";

import "../../styles/PaymentResult.css";

import { cancelAppointment } from "../../services/appointmentService";

function PaymentCancel() {
  const [searchParams] = useSearchParams();

  const appointmentId = searchParams.get("appointmentId");

  const [cancelling, setCancelling] = useState(true);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const cancelPendingAppointment = async () => {
      if (!appointmentId) {
        setCancelling(false);
        setCancelError("Appointment information was not found.");
        return;
      }

      try {
        await cancelAppointment(appointmentId);
      } catch (error) {
        console.error("Cancel appointment error:", error);

        setCancelError(
          error.response?.data?.message ||
            "We could not update the appointment status."
        );
      } finally {
        setCancelling(false);
      }
    };

    cancelPendingAppointment();
  }, [appointmentId]);

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        <div className="payment-cancel-icon">
          <XCircle size={48} />
        </div>

        <p className="payment-result-label payment-cancel-label">
          Payment Cancelled
        </p>

        <h1>Payment Was Not Completed</h1>

        <p className="payment-result-text">
          Your payment was cancelled or not completed. Your appointment has
          not been confirmed.
        </p>

        {cancelling ? (
          <div className="payment-cancel-status">
            <Loader2 className="spin" size={22} />
            <span>Updating your appointment...</span>
          </div>
        ) : (
          <>
            <div className="payment-result-info">
              <div className="payment-info-item">
                <CreditCard size={20} />
                <div>
                  <span>Payment</span>
                  <strong>Pending</strong>
                </div>
              </div>

              <div className="payment-info-item">
                <CalendarCheck2 size={20} />
                <div>
                  <span>Appointment</span>
                  <strong>
                    {cancelError ? "Not Updated" : "Cancelled"}
                  </strong>
                </div>
              </div>
            </div>

            {cancelError && (
              <p className="payment-cancel-error">
                {cancelError}
              </p>
            )}

            <Link
              to="/patient/book-appointment"
              className="payment-result-button payment-cancel-button"
            >
              Try Payment Again
              <ArrowLeft size={19} />
            </Link>

            <Link
              to="/patient/appointments"
              className="payment-secondary-link"
            >
              View My Appointments
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentCancel;