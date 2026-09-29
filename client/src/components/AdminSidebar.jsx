import { useState } from "react";

import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  BriefcaseMedical,
  Users,
  CalendarDays,
  Settings,
  LogOut,
  UserRound,
  Activity,
  Clock3,
  MessageCircle,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AdminSidebar() {
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const getNavClass = ({ isActive }) =>
    `admin-sidebar-link ${isActive ? "active" : ""}`;

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
      <aside className="admin-sidebar">

        {/* BRAND */}

        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon">
            <Activity size={22} />
          </div>

          <div>
            <strong>HealthCare</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        {/* NAVIGATION */}

        <div className="admin-sidebar-scroll">
          <div className="admin-sidebar-section">
            <p className="admin-sidebar-label">
              MAIN MENU
            </p>

            <nav className="admin-sidebar-nav">

              <NavLink
                to="/admin/dashboard"
                className={getNavClass}
              >
                <LayoutDashboard size={19} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/branches"
                className={getNavClass}
              >
                <Building2 size={19} />
                <span>Branches</span>
              </NavLink>

              <NavLink
                to="/admin/services"
                className={getNavClass}
              >
                <Stethoscope size={19} />
                <span>Services</span>
              </NavLink>

              <NavLink
                to="/admin/providers"
                className={getNavClass}
              >
                <UserRound size={19} />
                <span>Providers</span>
              </NavLink>

              <NavLink
                to="/admin/provider-services"
                className={getNavClass}
              >
                <BriefcaseMedical size={19} />
                <span>Provider Services</span>
              </NavLink>

              <NavLink
                to="/admin/availability"
                className={getNavClass}
              >
                <Clock3 size={19} />
                <span>Availability</span>
              </NavLink>

              <NavLink
                to="/admin/patients"
                className={getNavClass}
              >
                <Users size={19} />
                <span>Patients</span>
              </NavLink>

              <NavLink
                to="/admin/chat"
                className={getNavClass}
              >
                <MessageCircle size={19} />
                <span>Chat</span>
              </NavLink>

              <NavLink
                to="/admin/appointments"
                className={getNavClass}
              >
                <CalendarDays size={19} />
                <span>Appointments</span>
              </NavLink>

            </nav>
          </div>

          {/* SYSTEM */}

          <div className="admin-sidebar-section admin-sidebar-secondary">
            <p className="admin-sidebar-label">
              SYSTEM
            </p>

            <nav className="admin-sidebar-nav">

              <NavLink
                to="/admin/settings"
                className={getNavClass}
              >
                <Settings size={19} />
                <span>Settings</span>
              </NavLink>

            </nav>
          </div>
        </div>

        {/* BOTTOM */}

        <div className="admin-sidebar-bottom">

          <div className="admin-help-card">
            <div className="admin-help-icon">
              <Activity size={18} />
            </div>

            <div>
              <strong>Admin Support</strong>
              <span>
                Manage your healthcare system
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogoutClick}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>

        </div>
      </aside>

      {/* =========================================
          LOGOUT MODAL
      ========================================= */}

      {showLogoutModal && (
        <div className="admin-logout-overlay">

          <div className="admin-logout-modal">

            <div className="admin-logout-icon">
              <LogOut size={24} />
            </div>

            <h2>Logout?</h2>

            <p>
              Are you sure you want to logout from
              your admin account?
            </p>

            <div className="admin-logout-actions">

              <button
                type="button"
                className="admin-logout-cancel"
                onClick={handleCancelLogout}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-logout-confirm"
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

export default AdminSidebar;