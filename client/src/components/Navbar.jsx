import { useEffect, useRef, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ChevronDown,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  UserRound,
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);

  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const navbarRef = useRef(null);

  const isLoggedIn = Boolean(user);

  // =========================================
  // CLOSE DROPDOWN ON ROUTE CHANGE
  // =========================================

  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname, location.hash]);

  // =========================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // =========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // =========================================
  // DROPDOWN
  // =========================================

  const toggleDropdown = (menu) => {
    setOpenDropdown((current) =>
      current === menu ? null : menu
    );
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    closeDropdown();
    logout();
    navigate("/");
  };

  // =========================================
  // ROLE BASED DASHBOARD
  // =========================================

  const getDashboardPath = () => {
    if (user?.role === "ORGANIZATION_ADMIN") {
      return "/admin/dashboard";
    }

    if (user?.role === "PROVIDER") {
      return "/provider/dashboard";
    }

    if (user?.role === "PATIENT") {
      return "/patient/dashboard";
    }

    return "/";
  };

  const getDashboardLabel = () => {
    if (user?.role === "ORGANIZATION_ADMIN") {
      return "Admin Dashboard";
    }

    if (user?.role === "PROVIDER") {
      return "Provider Dashboard";
    }

    return "My Dashboard";
  };

  // =========================================
  // USER NAME
  // =========================================

  const getUserName = () => {
    if (!user?.name) {
      return "Account";
    }

    return user.name.split(" ")[0];
  };

  // =========================================
  // ACTIVE ROUTE
  // =========================================

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav
      className="navbar"
      ref={navbarRef}
    >
      <div className="navbar-container">

        {/* =========================================
            LOGO
        ========================================= */}

        <Link
          to="/"
          className="navbar-logo"
          onClick={closeDropdown}
        >
          <span className="logo-icon">
            <HeartPulse
              size={21}
              strokeWidth={2.4}
            />
          </span>

          <span>HealthCare</span>
        </Link>

        {/* =========================================
            NAVIGATION
        ========================================= */}

        <div className="navbar-menu">

          {/* HOME */}

          <Link
            to="/"
            className={`nav-link ${
              isActive("/") ? "active" : ""
            }`}
            onClick={closeDropdown}
          >
            Home
          </Link>

          {/* SERVICES */}

          <Link
            to="/services"
            className={`nav-link ${
              isActive("/services") ? "active" : ""
            }`}
            onClick={closeDropdown}
          >
            Services
          </Link>

          {/* PROVIDERS */}

          <Link
            to="/providers"
            className={`nav-link ${
              isActive("/providers") ? "active" : ""
            }`}
            onClick={closeDropdown}
          >
            Providers
          </Link>

          {/* ABOUT */}

          <Link
            to="/about"
            className={`nav-link ${
              isActive("/about") ? "active" : ""
            }`}
            onClick={closeDropdown}
          >
            About
          </Link>

          {/* CONTACT */}

          <Link
            to="/contact"
            className={`nav-link ${
              isActive("/contact") ? "active" : ""
            }`}
            onClick={closeDropdown}
          >
            Contact
          </Link>

          {/* =========================================
              LOGIN / ACCOUNT
          ========================================= */}

          {!isLoggedIn ? (
            <div className="nav-dropdown">

              <button
                type="button"
                className="nav-dropdown-button"
                onClick={() =>
                  toggleDropdown("login")
                }
              >
                Login

                <ChevronDown
                  size={15}
                  className={
                    openDropdown === "login"
                      ? "rotate-icon"
                      : ""
                  }
                />
              </button>

              {openDropdown === "login" && (
                <div className="mega-dropdown login-dropdown">

                  {/* PATIENT LOGIN */}

                  <Link
                    to="/login"
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    <span className="dropdown-icon blue">
                      <UserRound size={19} />
                    </span>

                    <span className="dropdown-content">
                      <strong>
                        Patient Login
                      </strong>

                      <small>
                        Manage appointments & health
                        records
                      </small>
                    </span>
                  </Link>

                  {/* PROVIDER LOGIN */}

                  <Link
                    to="/provider/login"
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    <span className="dropdown-icon green">
                      <Stethoscope size={19} />
                    </span>

                    <span className="dropdown-content">
                      <strong>
                        Provider Login
                      </strong>

                      <small>
                        Manage your practice &
                        appointments
                      </small>
                    </span>
                  </Link>

                  {/* ADMIN LOGIN */}

                  <Link
                    to="/admin/login"
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    <span className="dropdown-icon purple">
                      <ShieldCheck size={19} />
                    </span>

                    <span className="dropdown-content">
                      <strong>
                        Admin Login
                      </strong>

                      <small>
                        Manage your healthcare
                        organization
                      </small>
                    </span>
                  </Link>

                </div>
              )}
            </div>
          ) : (

            /* =========================================
               LOGGED IN ACCOUNT
            ========================================= */

            <div className="nav-dropdown">

              <button
                type="button"
                className="nav-dropdown-button navbar-account-button"
                onClick={() =>
                  toggleDropdown("account")
                }
              >
                <span className="navbar-account-icon">
                  <UserRound size={16} />
                </span>

                Hi, {getUserName()}

                <ChevronDown
                  size={15}
                  className={
                    openDropdown === "account"
                      ? "rotate-icon"
                      : ""
                  }
                />
              </button>

              {openDropdown === "account" && (
                <div className="mega-dropdown account-dropdown">

                  {/* DASHBOARD */}

                  <Link
                    to={getDashboardPath()}
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    <span className="dropdown-icon blue">
                      <LayoutDashboard size={19} />
                    </span>

                    <span className="dropdown-content">
                      <strong>
                        {getDashboardLabel()}
                      </strong>

                      <small>
                        View your dashboard
                      </small>
                    </span>
                  </Link>

                  {/* PATIENT APPOINTMENTS */}

                  {user?.role === "PATIENT" && (
                    <Link
                      to="/patient/appointments"
                      className="dropdown-item"
                      onClick={closeDropdown}
                    >
                      <span className="dropdown-icon green">
                        <CalendarDays size={19} />
                      </span>

                      <span className="dropdown-content">
                        <strong>
                          My Appointments
                        </strong>

                        <small>
                          View your bookings
                        </small>
                      </span>
                    </Link>
                  )}

                  {/* PATIENT BOOK APPOINTMENT */}

                  {user?.role === "PATIENT" && (
                    <Link
                      to="/patient/book-appointment"
                      className="dropdown-item"
                      onClick={closeDropdown}
                    >
                      <span className="dropdown-icon blue">
                        <CalendarDays size={19} />
                      </span>

                      <span className="dropdown-content">
                        <strong>
                          Book Appointment
                        </strong>

                        <small>
                          Find a provider and time
                        </small>
                      </span>
                    </Link>
                  )}

                  {/* ADMIN SETTINGS */}

                  {user?.role ===
                    "ORGANIZATION_ADMIN" && (
                    <Link
                      to="/admin/settings"
                      className="dropdown-item"
                      onClick={closeDropdown}
                    >
                      <span className="dropdown-icon purple">
                        <Settings size={19} />
                      </span>

                      <span className="dropdown-content">
                        <strong>
                          Settings
                        </strong>

                        <small>
                          Manage organization
                          settings
                        </small>
                      </span>
                    </Link>
                  )}

                  {/* PROVIDER PROFILE */}

                  {user?.role === "PROVIDER" && (
                    <Link
                      to="/provider/profile"
                      className="dropdown-item"
                      onClick={closeDropdown}
                    >
                      <span className="dropdown-icon green">
                        <UserRound size={19} />
                      </span>

                      <span className="dropdown-content">
                        <strong>
                          My Profile
                        </strong>

                        <small>
                          Manage your professional
                          profile
                        </small>
                      </span>
                    </Link>
                  )}

                  {/* PROVIDER SETTINGS */}

                  {user?.role === "PROVIDER" && (
                    <Link
                      to="/provider/settings"
                      className="dropdown-item"
                      onClick={closeDropdown}
                    >
                      <span className="dropdown-icon purple">
                        <Settings size={19} />
                      </span>

                      <span className="dropdown-content">
                        <strong>
                          Settings
                        </strong>

                        <small>
                          Manage your preferences
                        </small>
                      </span>
                    </Link>
                  )}

                  {/* LOGOUT */}

                  <button
                    type="button"
                    className="dropdown-item navbar-logout-item"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon red">
                      <LogOut size={19} />
                    </span>

                    <span className="dropdown-content">
                      <strong>
                        Logout
                      </strong>

                      <small>
                        Sign out of your account
                      </small>
                    </span>
                  </button>

                </div>
              )}

            </div>
          )}

        </div>

        {/* =========================================
            SIGN UP
        ========================================= */}

        {!isLoggedIn && (
          <Link
            to="/register"
            className="signup-button"
            onClick={closeDropdown}
          >
            Sign Up
          </Link>
        )}

      </div>
    </nav>
  );
}

export default Navbar;