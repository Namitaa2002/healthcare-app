
import { useState } from "react";

import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  CreditCard,
  MessageCircle,
  UserRound,
  Settings,
  LogOut,
  HeartPulse,
  Activity,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function PatientSidebar() {
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const getNavClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <>
      <aside className="patient-sidebar">

        {/* ================= BRAND ================= */}

        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <HeartPulse
              size={22}
              strokeWidth={2.5}
            />
          </div>

          <div>
            <strong>HealthCare</strong>
            <span>Patient Portal</span>
          </div>
        </div>

        {/* ================= NAVIGATION ================= */}

        <div className="sidebar-section">
          <p className="sidebar-label">
            MAIN MENU
          </p>

          <nav className="sidebar-nav">

            <NavLink
              to="/patient/dashboard"
              className={getNavClass}
            >
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/patient/book-appointment"
              className={getNavClass}
            >
              <CalendarPlus size={19} />
              <span>Book Appointment</span>
            </NavLink>

            <NavLink
              to="/patient/appointments"
              className={getNavClass}
            >
              <CalendarDays size={19} />
              <span>My Appointments</span>
            </NavLink>

            <NavLink
              to="/patient/payments"
              className={getNavClass}
            >
              <CreditCard size={19} />
              <span>Payments</span>
            </NavLink>

            <NavLink
              to="/patient/chat"
              className={getNavClass}
            >
              <MessageCircle size={19} />
              <span>Chat</span>
            </NavLink>

          </nav>
        </div>

        {/* ================= ACCOUNT ================= */}

        <div className="sidebar-section sidebar-secondary">

          <p className="sidebar-label">
            ACCOUNT
          </p>

          <nav className="sidebar-nav">

            <NavLink
              to="/patient/profile"
              className={getNavClass}
            >
              <UserRound size={19} />
              <span>My Profile</span>
            </NavLink>

            <NavLink
              to="/patient/settings"
              className={getNavClass}
            >
              <Settings size={19} />
              <span>Settings</span>
            </NavLink>

          </nav>
        </div>

        {/* ================= BOTTOM ================= */}

        <div className="sidebar-bottom">

          <div className="sidebar-help-card">

            <div className="help-icon">
              <Activity size={18} />
            </div>

            <div>
              <strong>Need Help?</strong>

              <span>
                Contact our support team
              </span>
            </div>

          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogoutClick}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* ================= LOGOUT MODAL ================= */}

      {showLogoutModal && (
        <div className="patient-logout-overlay">

          <div className="patient-logout-modal">

            <div className="patient-logout-icon">
              <LogOut size={24} />
            </div>

            <h2>Logout?</h2>

            <p>
              Are you sure you want to logout from
              your patient account?
            </p>

            <div className="patient-logout-actions">

              <button
                type="button"
                className="patient-logout-cancel"
                onClick={handleCancelLogout}
              >
                Cancel
              </button>

              <button
                type="button"
                className="patient-logout-confirm"
                onClick={handleConfirmLogout}
              >
                <LogOut size={16} />
                Logout
              </button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}

export default PatientSidebar;

