import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser(formData);

      console.log("Login response:", response);

      const token = response.data.token;
      const userData = response.data.user;

      if (!token || !userData) {
        throw new Error("Invalid login response from server.");
      }

      login(userData, token);

      if (userData.role === "PATIENT") {
        navigate("/patient/dashboard");
      } else if (userData.role === "PROVIDER") {
        navigate("/provider/dashboard");
      } else if (userData.role === "BRANCH_ADMIN") {
        navigate("/branch-admin/dashboard");
      } else if (userData.role === "ORGANIZATION_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-brand">
          <div className="auth-brand-icon">
            <HeartPulse size={28} />
          </div>

          <h1>Welcome Back</h1>

          <p>
            Sign in to manage your appointments and healthcare journey.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Patient Login</h2>
            <p>Access your healthcare account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <div className="input-wrapper">
                <Mail size={17} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>

                <button
                  type="button"
                  className="forgot-password"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">
                <Lock size={17} />

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="loading-icon" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>New to HealthCare?</span>
          </div>

          <Link to="/register" className="auth-register">
            Create a patient account
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;