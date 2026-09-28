
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

// =========================================
// PUBLIC PAGES
// =========================================

import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Services from "../pages/public/Services";
import Contact from "../pages/public/Contact";
import Providers from "../pages/public/Providers";

// =========================================
// AUTH PAGES
// =========================================

import Login from "../pages/auth/Login";
import ProviderLogin from "../pages/auth/ProviderLogin";
import AdminLogin from "../pages/auth/AdminLogin";
import Register from "../pages/auth/Register";

// =========================================
// PATIENT PAGES
// =========================================

import PatientDashboard from "../pages/patient/Dashboard";
import BookAppointment from "../pages/patient/BookAppointment";
import Appointments from "../pages/patient/Appointments";
import Payments from "../pages/patient/Payments";
import Settings from "../pages/patient/Settings";
import Profile from "../pages/patient/Profile";

// =========================================
// PROVIDER PAGES
// =========================================

import ProviderDashboard from "../pages/provider/ProviderDashboard";
import ProviderAppointments from "../pages/provider/Appointments";
import ProviderAvailability from "../pages/provider/Availability";
import ProviderPatients from "../pages/provider/Patients";
import ProviderProfile from "../pages/provider/Profile";
import ProviderSettings from "../pages/provider/Settings";

// =========================================
// PAYMENT PAGES
// =========================================

import PaymentSuccess from "../pages/payment/PaymentSuccess";
import PaymentCancel from "../pages/payment/PaymentCancel";

// =========================================
// ADMIN PAGES
// =========================================

import AdminDashboard from "../pages/admin/Dashboard";
import Branches from "../pages/admin/Branches";
import AdminServices from "../pages/admin/Services";
import AdminProviders from "../pages/admin/Providers";
import ProviderServices from "../pages/admin/ProviderServices";
import Availability from "../pages/admin/Availability";
import Patients from "../pages/admin/Patients";
import AdminAppointments from "../pages/admin/Appointments";
import AdminSettings from "../pages/admin/Settings";

function AppRoutes() {
  return (
    <Routes>

      {/* =========================================
          PUBLIC ROUTES
      ========================================= */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/about"
        element={<About />}
      />

      <Route
        path="/services"
        element={<Services />}
      />

      <Route
        path="/providers"
        element={<Providers />}
      />

      <Route
        path="/contact"
        element={<Contact />}
      />

      {/* =========================================
          AUTH ROUTES
      ========================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/provider/login"
        element={<ProviderLogin />}
      />

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      {/* =========================================
          PATIENT ROUTES
      ========================================= */}

      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/book-appointment"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <BookAppointment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <Appointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/payments"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <Payments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/settings"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* =========================================
          PROVIDER ROUTES
      ========================================= */}

      <Route
        path="/provider/dashboard"
        element={
          <ProtectedRoute allowedRoles={["PROVIDER"]}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/appointments"
        element={
          <ProtectedRoute allowedRoles={["PROVIDER"]}>
            <ProviderAppointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/availability"
        element={
          <ProtectedRoute allowedRoles={["PROVIDER"]}>
            <ProviderAvailability />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/patients"
        element={
          <ProtectedRoute allowedRoles={["PROVIDER"]}>
            <ProviderPatients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/profile"
        element={
          <ProtectedRoute allowedRoles={["PROVIDER"]}>
            <ProviderProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/settings"
        element={
          <ProtectedRoute allowedRoles={["PROVIDER"]}>
            <ProviderSettings />
          </ProtectedRoute>
        }
      />

      {/* =========================================
          PAYMENT ROUTES
      ========================================= */}

      <Route
        path="/payment/success"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/cancel"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PaymentCancel />
          </ProtectedRoute>
        }
      />

      {/* =========================================
          ADMIN ROUTES
      ========================================= */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/branches"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <Branches />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/services"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <AdminServices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/providers"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <AdminProviders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/provider-services"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <ProviderServices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/availability"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <Availability />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <Patients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <AdminAppointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          >
            <AdminSettings />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default AppRoutes;

