import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

function ProviderLogin() {
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

      console.log("Provider login response:", response);

      const token = response.data.token;
      const userData = response.data.user;

      if (!token || !userData) {
        throw new Error("Invalid login response from server.");
      }

      // Provider login page should only allow provider accounts
      if (userData.role !== "PROVIDER") {
        setError("This account is not a provider account.");
        return;
      }

      login(userData, token);

      navigate("/provider/dashboard");
    } catch (error) {
      console.error("Provider login error:", error);

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
    <div className="auth-page provider-auth">
      <div className="auth-container">

        <div className="auth-brand">
          <div className="auth-brand-icon provider-icon">
            <Stethoscope size={28} />
          </div>

          <h1>Provider Portal</h1>

          <p>
            Manage your appointments, patients, services, and availability.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Provider Login</h2>
            <p>Sign in to your provider account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="provider-email">Email Address</label>

              <div className="input-wrapper">
                <Mail size={17} />

                <input
                  id="provider-email"
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
                <label htmlFor="provider-password">Password</label>

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
                  id="provider-password"
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
            <span>Healthcare Provider?</span>
          </div>

          <Link to="/" className="auth-register">
            Back to HealthCare
          </Link>
        </div>

      </div>
    </div>
  );
}

export default ProviderLogin;