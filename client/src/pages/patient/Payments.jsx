import { useEffect, useMemo, useState } from "react";

import {
  CreditCard,
  CheckCircle2,
  Clock3,
  ReceiptText,
  Eye,
  X,
  ShieldCheck,
} from "lucide-react";

import { getMyAppointments } from "../../services/appointmentService";

function Payments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyAppointments();

        setAppointments(response.data || []);
      } catch (error) {
        console.error("Fetch payments error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load payment history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const payments = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.payment)
      .map((appointment) => ({
        appointmentId: appointment.id,
        payment: appointment.payment,
      }));
  }, [appointments]);

  const paidPayments = payments.filter(
    (item) => item.payment.status === "PAID"
  );

  const pendingPayments = payments.filter(
    (item) => item.payment.status === "PENDING"
  );

  const totalPaid = paidPayments.reduce(
    (total, item) => total + Number(item.payment.amount || 0),
    0
  );

  const formatAmount = (payment) => {
    const amount = Number(payment.amount || 0);

    return `$${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    return `payment-status-badge ${
      status?.toLowerCase() || ""
    }`;
  };

  return (
    <div className="patient-page">
      {/* ================= HEADER ================= */}

      <div className="patient-page-header">
        <div>
          <span className="page-eyebrow">
            FINANCIAL OVERVIEW
          </span>

          <h1>Payments</h1>

          <p>
            Track your healthcare payments and transaction history.
          </p>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}

      <section className="payment-summary-grid">
        <div className="payment-summary-card">
          <div className="payment-summary-icon blue">
            <CreditCard size={20} />
          </div>

          <div>
            <span>Total Spent</span>

            <strong>
              ${totalPaid.toLocaleString("en-IN")}
            </strong>

            <small>Successful payments</small>
          </div>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Successful</span>

            <strong>{paidPayments.length}</strong>

            <small>Completed transactions</small>
          </div>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon amber">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Pending</span>

            <strong>{pendingPayments.length}</strong>

            <small>Awaiting payment</small>
          </div>
        </div>
      </section>

      {/* ================= TRANSACTIONS ================= */}

      <section className="dashboard-card payments-history-card">
        <div className="card-header">
          <div>
            <span className="card-eyebrow">
              TRANSACTIONS
            </span>

            <h3>Payment History</h3>
          </div>
        </div>

        {loading ? (
          <div className="payments-empty">
            <div className="payments-empty-icon">
              <CreditCard size={28} />
            </div>

            <h4>Loading transactions...</h4>

            <p>
              Please wait while we fetch your payment history.
            </p>
          </div>
        ) : error ? (
          <div className="payments-empty">
            <div className="payments-empty-icon">
              <CreditCard size={28} />
            </div>

            <h4>Unable to load transactions</h4>

            <p>{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="payments-empty">
            <div className="payments-empty-icon">
              <CreditCard size={28} />
            </div>

            <h4>No transactions yet</h4>

            <p>
              Your payment transactions will appear here once
              you make a payment.
            </p>
          </div>
        ) : (
          <div className="transaction-table">
            <div className="transaction-header">
              <span>Transaction</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span></span>
            </div>

            {payments.map(({ appointmentId, payment }) => (
              <div
                className="transaction-row"
                key={payment.id}
              >
                <div className="transaction-id">
                  <div className="transaction-icon">
                    <ReceiptText size={17} />
                  </div>

                  <div>
                    <strong>{payment.id}</strong>

                    <small>Stripe Payment</small>
                  </div>
                </div>

                <div className="transaction-date">
                  {formatDate(
                    payment.updatedAt || payment.createdAt
                  )}
                </div>

                <div className="transaction-amount">
                  {formatAmount(payment)}
                </div>

                <div>
                  <span className={getStatusClass(payment.status)}>
                    {payment.status}
                  </span>
                </div>

                <button
                  type="button"
                  className="payment-view-button"
                  onClick={() =>
                    setSelectedPayment({
                      appointmentId,
                      payment,
                    })
                  }
                >
                  <Eye size={15} />
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= SECURITY NOTE ================= */}

      <div className="payment-security-note">
        <div className="payment-security-icon">
          <ShieldCheck size={19} />
        </div>

        <div>
          <strong>Secure payments</strong>

          <p>
            Your payments are securely processed through Stripe.
          </p>
        </div>
      </div>

      {/* ================= PAYMENT DETAILS MODAL ================= */}

      {selectedPayment && (
        <div
          className="payment-modal-overlay"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-modal-header">
              <div>
                <span>TRANSACTION DETAILS</span>

                <h3>Payment Details</h3>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() => setSelectedPayment(null)}
                aria-label="Close payment details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="payment-detail-status">
              <div className="payment-detail-status-icon">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <span>Payment Status</span>

                <strong>
                  {selectedPayment.payment.status}
                </strong>
              </div>
            </div>

            <div className="payment-detail-grid">
              <div className="payment-detail-item">
                <span>Transaction ID</span>

                <strong>
                  {selectedPayment.payment.id}
                </strong>
              </div>

              <div className="payment-detail-item">
                <span>Amount</span>

                <strong>
                  {formatAmount(selectedPayment.payment)}
                </strong>
              </div>

              <div className="payment-detail-item">
                <span>Payment Date</span>

                <strong>
                  {formatDate(
                    selectedPayment.payment.updatedAt ||
                      selectedPayment.payment.createdAt
                  )}
                </strong>
              </div>

              <div className="payment-detail-item">
                <span>Currency</span>

                <strong>
                  {selectedPayment.payment.currency?.toUpperCase() ||
                    "USD"}
                </strong>
              </div>

              <div className="payment-detail-item payment-detail-full">
                <span>Stripe Payment ID</span>

                <strong>
                  {selectedPayment.payment
                    .stripePaymentIntentId || "Not available"}
                </strong>
              </div>

              <div className="payment-detail-item payment-detail-full">
                <span>Related Appointment ID</span>

                <strong>
                  {selectedPayment.appointmentId}
                </strong>
              </div>
            </div>

            <div className="payment-modal-footer">
              <ShieldCheck size={16} />

              <span>
                This transaction was securely processed through
                Stripe.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;