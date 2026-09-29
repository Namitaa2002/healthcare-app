
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

import PatientLayout from "../layouts/PatientLayout";
import PublicLayout from "../layouts/PublicLayout";

import Chat from "../pages/patient/Chat";
import ChatWindow from "../pages/patient/ChatWindow";

import PatientDashboard from "../pages/patient/Dashboard";
import BookAppointment from "../pages/patient/BookAppointment";
import Appointments from "../pages/patient/Appointments";
import Payments from "../pages/patient/Payments";
import Settings from "../pages/patient/Settings";
import Profile from "../pages/patient/Profile";

// =========================================
// PROVIDER PAGES
// =========================================
import ProviderChat from "../pages/provider/Chat";
import ProviderChatWindow from "../pages/provider/ChatWindow";
import ProviderLayout from "../layouts/ProviderLayout";
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

import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import Branches from "../pages/admin/Branches";
import AdminServices from "../pages/admin/Services";
import AdminProviders from "../pages/admin/Providers";
import ProviderServices from "../pages/admin/ProviderServices";
import Availability from "../pages/admin/Availability";
import Patients from "../pages/admin/Patients";
import AdminAppointments from "../pages/admin/Appointments";
import AdminSettings from "../pages/admin/Settings";
import AdminChat from "../pages/admin/Chat";
import AdminChatWindow from "../pages/admin/ChatWindow";

function AppRoutes() {
  return (
    <Routes>

      {/* =========================================
          PUBLIC ROUTES
      ========================================= */}
      <Route element={<PublicLayout />}>
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
      </Route>
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
        element={
          <ProtectedRoute
            allowedRoles={["PATIENT"]}
          />
        }
      >
        <Route element={<PatientLayout />}>

          <Route
            path="/patient/dashboard"
            element={<PatientDashboard />}
          />

          <Route
            path="/patient/book-appointment"
            element={<BookAppointment />}
          />

          <Route
            path="/patient/appointments"
            element={<Appointments />}
          />

          <Route
            path="/patient/payments"
            element={<Payments />}
          />

          <Route
            path="/patient/profile"
            element={<Profile />}
          />

          <Route
            path="/patient/settings"
            element={<Settings />}
          />

          <Route
            path="/patient/chat"
            element={<Chat />}
          />

          <Route
            path="/patient/chat/provider/:providerUserId"
            element={<ChatWindow />}
          />

        </Route>
      </Route>

      {/* =========================================
          PROVIDER ROUTES
      ========================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["PROVIDER"]}
          />
        }
      >
        <Route element={<ProviderLayout />}>

          <Route
            path="/provider/dashboard"
            element={<ProviderDashboard />}
          />

          <Route
            path="/provider/appointments"
            element={<ProviderAppointments />}
          />

          <Route
            path="/provider/availability"
            element={<ProviderAvailability />}
          />

          <Route
            path="/provider/patients"
            element={<ProviderPatients />}
          />

          <Route
            path="/provider/profile"
            element={<ProviderProfile />}
          />

          <Route
            path="/provider/settings"
            element={<ProviderSettings />}
          />

          <Route
            path="/provider/chat"
            element={<ProviderChat />}
          />

          <Route
            path="/provider/chat/user/:patientUserId"
            element={<ProviderChatWindow />}
          />

        </Route>
      </Route>

      {/* =========================================
          PAYMENT ROUTES
      ========================================= */}

      <Route
        path="/payment/success"
        element={
          <ProtectedRoute
            allowedRoles={["PATIENT"]}
          >
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/cancel"
        element={
          <ProtectedRoute
            allowedRoles={["PATIENT"]}
          >
            <PaymentCancel />
          </ProtectedRoute>
        }
      />

      {/* =========================================
          ADMIN ROUTES
      ========================================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["ORGANIZATION_ADMIN"]}
          />
        }
      >
        <Route element={<AdminLayout />}>

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/branches"
            element={<Branches />}
          />

          <Route
            path="/admin/services"
            element={<AdminServices />}
          />

          <Route
            path="/admin/providers"
            element={<AdminProviders />}
          />

          <Route
            path="/admin/provider-services"
            element={<ProviderServices />}
          />

          <Route
            path="/admin/availability"
            element={<Availability />}
          />

          <Route
            path="/admin/patients"
            element={<Patients />}
          />

          <Route
            path="/admin/appointments"
            element={<AdminAppointments />}
          />

          <Route
            path="/admin/chat"
            element={<AdminChat />}
          />

          <Route
            path="/admin/chat/provider/:providerUserId"
            element={<AdminChatWindow />}
          />

          <Route
            path="/admin/settings"
            element={<AdminSettings />}
          />

        </Route>
      </Route>

    </Routes>
  );
}

export default AppRoutes;

