
import { useState } from "react";

import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProviderSidebar() {
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const getNavClass = ({ isActive }) =>
    `provider-sidebar-link ${
      isActive ? "active" : ""
    }`;

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
      <aside className="provider-sidebar">
        {/* BRAND */}
        <div className="provider-sidebar-brand">
          <div className="provider-brand-icon">
            <UserRound size={21} />
          </div>

          <div>
            <strong>Healthcare</strong>
            <span>Provider Panel</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="provider-sidebar-scroll">
          <nav className="provider-sidebar-nav">
            <p className="provider-sidebar-title">
              MENU
            </p>

            <NavLink
              to="/provider/dashboard"
              className={getNavClass}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/provider/appointments"
              className={getNavClass}
            >
              <CalendarDays size={18} />
              <span>Appointments</span>
            </NavLink>

            <NavLink
              to="/provider/availability"
              className={getNavClass}
            >
              <Clock3 size={18} />
              <span>Availability</span>
            </NavLink>

            <NavLink
              to="/provider/patients"
              className={getNavClass}
            >
              <Users size={18} />
              <span>Patients</span>
            </NavLink>

            <NavLink
              to="/provider/chat"
              className={getNavClass}
            >
              <MessageCircle size={18} />
              <span>Chat</span>
            </NavLink>

            <p className="provider-sidebar-title provider-sidebar-title-space">
              ACCOUNT
            </p>

            <NavLink
              to="/provider/profile"
              className={getNavClass}
            >
              <UserRound size={18} />
              <span>Profile</span>
            </NavLink>

            <NavLink
              to="/provider/settings"
              className={getNavClass}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* LOGOUT */}
        <div className="provider-sidebar-bottom">
          <button
            type="button"
            className="provider-sidebar-link"
            onClick={handleLogoutClick}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          LOGOUT MODAL
      ========================================= */}
      {showLogoutModal && (
        <div className="provider-logout-overlay">
          <div className="provider-logout-modal">
            <div className="provider-logout-icon">
              <LogOut size={24} />
            </div>

            <h2>Logout?</h2>

            <p>
              Are you sure you want to logout from
              your provider account?
            </p>

            <div className="provider-logout-actions">
              <button
                type="button"
                className="provider-logout-cancel"
                onClick={handleCancelLogout}
              >
                Cancel
              </button>

              <button
                type="button"
                className="provider-logout-confirm"
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

export default ProviderSidebar;

