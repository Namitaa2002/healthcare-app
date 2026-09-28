import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  Lock,
  Building2,
  ArrowRight,
  HeartPulse,
  Loader2,
} from "lucide-react";

import { registerUser } from "../../services/authService";
import { getBranches } from "../../services/branchService";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: "",
    password: "",
    confirmPassword: "",
  });

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch available branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setBranchesLoading(true);

        const response = await getBranches();

        setBranches(response.data || []);
      } catch (error) {
        console.error("Fetch branches error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load branches. Please try again."
        );
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const {
      name,
      email,
      phone,
      branchId,
      password,
      confirmPassword,
    } = formData;

    if (
      !name ||
      !email ||
      !phone ||
      !branchId ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    const selectedBranch = branches.find(
      (branch) => branch.id === branchId
    );

    if (!selectedBranch) {
      setError("Please select a valid branch.");
      return;
    }

    try {
      setLoading(true);

      const response = await registerUser({
        name,
        email,
        password,
        phone,
        role: "PATIENT",
        branchId: selectedBranch.id,
        organizationId: selectedBranch.organizationId,
      });

      console.log("Registration response:", response);

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page register-auth">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <HeartPulse size={28} />
          </div>

          <h1>Start Your Healthcare Journey</h1>

          <p>
            Create your patient account and make managing your
            healthcare simple and convenient.
          </p>
        </div>

        <div className="auth-card register-card">
          <div className="auth-card-header">
            <h2>Create Account</h2>
            <p>Register as a patient</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name">Full Name</label>

              <div className="input-wrapper">
                <UserRound size={17} />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="input-wrapper">
                <Mail size={17} />

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>

              <div className="input-wrapper">
                <Phone size={17} />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Branch */}
            <div className="form-group">
              <label htmlFor="branchId">Select Branch</label>

              <div className="input-wrapper">
                <Building2 size={17} />

                <select
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  disabled={loading || branchesLoading}
                >
                  <option value="">
                    {branchesLoading
                      ? "Loading branches..."
                      : "Select your branch"}
                  </option>

                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                      {branch.city ? ` - ${branch.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="input-wrapper">
                <Lock size={17} />

                <input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">
                <Lock size={17} />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading || branchesLoading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="loading-icon"
                  />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="auth-register">
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;