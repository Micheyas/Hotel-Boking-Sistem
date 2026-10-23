import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import "../styles/CustomerAuth.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const GOOGLE_CLIENT_ID = "799209083609-g7o38t31s1jotiosi8lafkbf2smggc92.apps.googleusercontent.com";

// ── Shared helpers ────────────────────────────────────────
export function getCustomerToken() {
  return localStorage.getItem("customerToken");
}
export function getCustomerUser() {
  try {
    return JSON.parse(localStorage.getItem("customerUser"));
  } catch {
    return null;
  }
}
export function isCustomerVerified() {
  const u = getCustomerUser();
  return !!(u && u.emailVerified);
}
export function logoutCustomer() {
  localStorage.removeItem("customerToken");
  localStorage.removeItem("customerUser");
}

// ── Google Sign-In Button ─────────────────────────────────
const GoogleSignInButton = ({ onLogin, label = "Continue with Google" }) => {
  const [error, setError] = useState("");
  const [gsiRendered, setGsiRendered] = useState(false);
  const containerRef = React.useRef(null);

  const handleCredentialResponse = React.useCallback(async (response) => {
    try {
      const res = await axios.post(API + "/auth/google", {
        credential: response.credential,
      });
      const { token, user } = res.data;
      localStorage.setItem("customerToken", token);
      localStorage.setItem("customerUser", JSON.stringify(user));
      await onLogin(user);
    } catch (err) {
      setError(err.response?.data?.error || "Google sign-in failed. Try again.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLogin]);

  useEffect(() => {
    let intervalId = null;
    let attempts = 0;

    const renderGsi = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: label === "Register with Google" ? "signup_with" : "signin_with",
          width: Math.max(260, Math.min(380, containerRef.current.offsetWidth || 340)),
          logo_alignment: "left",
        });
        setGsiRendered(true);
        return true;
      } catch (err) {
        console.warn("Google renderButton notice:", err);
        return false;
      }
    };

    if (renderGsi()) {
      return;
    }

    intervalId = setInterval(() => {
      attempts++;
      if (renderGsi() || attempts > 15) {
        clearInterval(intervalId);
      }
    }, 200);

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => renderGsi();
      document.body.appendChild(script);
    } else {
      existing.addEventListener("load", () => renderGsi());
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleCredentialResponse, label]);

  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {
        setError("Google Sign-In is initializing. Please try again in a moment.");
      }
    } else {
      setError("Google Sign-In services are currently loading or unavailable.");
    }
  };

  return (
    <div className="ca-google-wrap">
      {error && <p className="ca-error">{error}</p>}
      {/* Google renders its own button inside this div */}
      <div
        ref={containerRef}
        className="ca-google-btn-container"
        style={{ minHeight: "44px", display: "flex", justifyContent: "center" }}
      >
        {!gsiRendered && (
          <button type="button" className="ca-google-btn" onClick={handleFallbackClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{label}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ── Divider ───────────────────────────────────────────────
const OrDivider = () => (
  <div className="ca-or-divider">
    <span className="ca-or-line" />
    <span className="ca-or-text">or</span>
    <span className="ca-or-line" />
  </div>
);
const RegisterForm = ({ onSwitch, onLogin }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="ca-success-box">
        <div className="ca-success-icon">📧</div>
        <h3>Check your inbox!</h3>
        <p>
          We sent a verification email to <strong>{form.email}</strong>.
          Click the link in that email to activate your account, then come
          back here to log in and make your booking.
        </p>
        <button className="ca-btn" onClick={onSwitch}>
          Go to Login →
        </button>
      </div>
    );
  }

  return (
    <form className="ca-form" onSubmit={handleSubmit}>
      {/* Google Sign-In */}
      <GoogleSignInButton onLogin={onLogin} label="Register with Google" />
      <OrDivider />
      <div className="ca-field">
        <label>Full Name <span className="ca-req">*</span></label>
        <input
          name="name" type="text" required
          placeholder="Your full name"
          value={form.name} onChange={handleChange}
        />
      </div>
      <div className="ca-field">
        <label>Email Address <span className="ca-req">*</span></label>
        <input
          name="email" type="email" required
          placeholder="your@email.com"
          value={form.email} onChange={handleChange}
        />
        <span className="ca-hint">A verification link will be sent to this address.</span>
      </div>
      <div className="ca-field">
        <label>Password <span className="ca-req">*</span></label>
        <input
          name="password" type="password" required
          placeholder="Min. 6 characters"
          value={form.password} onChange={handleChange}
        />
      </div>
      <div className="ca-field">
        <label>Confirm Password <span className="ca-req">*</span></label>
        <input
          name="confirm" type="password" required
          placeholder="Repeat password"
          value={form.confirm} onChange={handleChange}
        />
      </div>
      {error && <p className="ca-error">{error}</p>}
      <button className="ca-btn" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create Account & Send Verification Email"}
      </button>
    </form>
  );
};

// ── Login tab ─────────────────────────────────────────────
const LoginForm = ({ onSwitch, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setUnverified(false);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });
      const { token, user } = res.data;

      // Staff must use the Staff Portal (/admin)
      if (["admin", "manager", "receptionist"].includes(user.role)) {
        setError("Staff accounts must use the Staff Portal (🔑 Staff link in the nav).");
        setLoading(false); return;
      }

      // Verified check
      if (!user.emailVerified) {
        setUnverified(true);
        setLoading(false); return;
      }

      localStorage.setItem("customerToken", token);
      localStorage.setItem("customerUser", JSON.stringify(user));
      await onLogin(user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await axios.post(`${API}/auth/resend-verification`, { email });
      setResendDone(true);
    } catch {
      setResendDone(true); // still show success (anti-enumeration)
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form className="ca-form" onSubmit={handleSubmit}>
      {/* Google Sign-In */}
      <GoogleSignInButton onLogin={async (u) => { await onLogin(u); }} label="Sign in with Google" />
      <OrDivider />
      <div className="ca-field">
        <label>Email Address <span className="ca-req">*</span></label>
        <input
          type="email" required
          placeholder="your@email.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="ca-field">
        <label>Password <span className="ca-req">*</span></label>
        <input
          type="password" required
          placeholder="Your password"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="ca-error">{error}</p>}

      {unverified && (
        <div className="ca-unverified-box">
          <span className="ca-unverified-icon">📧</span>
          <div>
            <strong>Email not verified yet.</strong>
            <p>
              Please check your inbox for the verification link. If you didn't
              receive it, click below to get a new one.
            </p>
            {!resendDone ? (
              <button
                type="button"
                className="ca-resend-btn"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? "Sending…" : "📨 Resend Verification Email"}
              </button>
            ) : (
              <p className="ca-resend-done">
                ✅ A new verification email has been sent to {email}.
              </p>
            )}
          </div>
        </div>
      )}

      <button className="ca-btn" type="submit" disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </button>

      <p className="ca-switch-text">
        Don't have an account?{" "}
        <button type="button" className="ca-link-btn" onClick={onSwitch}>
          Register here
        </button>
      </p>
    </form>
  );
};

// ── Main CustomerAuth page ────────────────────────────────
const CustomerAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultTab = location.pathname === "/register" ? "register" : "login";
  const [tab, setTab] = useState(defaultTab);

  // Where to go after login — default to home, not booking
  const from = new URLSearchParams(location.search).get("from") || "/";

  const handleLogin = async (user) => {
    // Also fetch fresh KYC status from server (in case admin approved while user was logged out)
    if (user.role === 'customer') {
      try {
        const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        const token = localStorage.getItem('customerToken');
        const res = await fetch(`${API}/auth/kyc/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          user.kycStatus = data.kycStatus || 'pending';
          localStorage.setItem('customerUser', JSON.stringify(user));
        }
      } catch (e) {
        console.warn('[KYC] Could not refresh status after login:', e.message);
      }
    }

    // If KYC not done yet, always go to profile setup first
    if (user.kycStatus === 'pending' || user.kycStatus === 'rejected') {
      navigate("/profile-setup");
    } else {
      navigate(from);
    }
  };

  return (
    <div className="ca-page">
      <div className="ca-card">
        <div className="ca-header">
          <Link to="/" className="ca-logo">2RN Solomon Hotel</Link>
          <h2 className="ca-title">
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="ca-subtitle">
            {tab === "login"
              ? "Log in to book your stay"
              : "Register to book rooms and leave reviews"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="ca-tabs">
          <button
            className={`ca-tab ${tab === "login" ? "ca-tab--active" : ""}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={`ca-tab ${tab === "register" ? "ca-tab--active" : ""}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        {/* Forms */}
        {tab === "login" ? (
          <LoginForm onSwitch={() => setTab("register")} onLogin={handleLogin} />
        ) : (
          <RegisterForm onSwitch={() => setTab("login")} onLogin={handleLogin} />
        )}

        {/* Verify email page link */}
        <p className="ca-verify-link">
          Already registered?{" "}
          <Link to="/verify-email">Verify your email here</Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerAuth;
