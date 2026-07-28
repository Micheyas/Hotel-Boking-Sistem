import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api";

const VerifyEmailPage = () => {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  // Resend form state
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState(""); // "" | sending | done
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please use the link from your email.");
      return;
    }

    axios
      .get(`${API}/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.error ||
            "Verification failed. The link may have expired."
        );
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendStatus("sending");
    try {
      const res = await axios.post(`${API}/auth/resend-verification`, {
        email: resendEmail,
      });
      setResendMsg(res.data.message);
      setResendStatus("done");
    } catch (err) {
      setResendMsg(
        err.response?.data?.error || "Failed to resend. Please try again."
      );
      setResendStatus("done");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {status === "verifying" && (
          <>
            <div style={styles.icon}>⏳</div>
            <h2 style={styles.title}>Verifying your email…</h2>
            <p style={styles.sub}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={styles.icon}>✅</div>
            <h2 style={styles.title}>Email Verified!</h2>
            <p style={styles.sub}>{message}</p>
            <Link to="/booking" style={styles.btn}>
              Book a Room Now
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={styles.icon}>❌</div>
            <h2 style={styles.title}>Verification Failed</h2>
            <p style={styles.sub}>{message}</p>

            {/* Resend form */}
            <div style={styles.resendBox}>
              <p style={styles.resendLabel}>Need a new verification link?</p>
              {resendStatus !== "done" ? (
                <form onSubmit={handleResend} style={styles.resendForm}>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    style={styles.input}
                  />
                  <button
                    type="submit"
                    style={styles.resendBtn}
                    disabled={resendStatus === "sending"}
                  >
                    {resendStatus === "sending"
                      ? "Sending…"
                      : "Resend Verification Email"}
                  </button>
                </form>
              ) : (
                <p style={styles.resendDone}>{resendMsg}</p>
              )}
            </div>
          </>
        )}

        <Link to="/" style={styles.homeLink}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#e2c97e 0%,#d4a574 50%,#c9a84c 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.93)",
    borderRadius: "18px",
    padding: "2.5rem 2rem",
    maxWidth: "460px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(26,26,46,0.15)",
    border: "1px solid rgba(201,168,76,0.4)",
  },
  icon: { fontSize: "3rem", marginBottom: "0.5rem" },
  title: {
    margin: "0 0 0.75rem",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#1a1a2e",
  },
  sub: { color: "#555", fontSize: "0.95rem", marginBottom: "1.5rem" },
  btn: {
    display: "inline-block",
    padding: "0.75rem 2rem",
    background: "linear-gradient(135deg,#1a1a2e,#0f3460)",
    color: "#e2c97e",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.95rem",
    textDecoration: "none",
    marginBottom: "1.2rem",
  },
  resendBox: {
    marginTop: "0.5rem",
    padding: "1.2rem",
    background: "rgba(201,168,76,0.1)",
    borderRadius: "10px",
    border: "1px solid rgba(201,168,76,0.35)",
    marginBottom: "1.2rem",
  },
  resendLabel: {
    margin: "0 0 0.75rem",
    fontSize: "0.9rem",
    color: "#444",
    fontWeight: 600,
  },
  resendForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  input: {
    padding: "0.65rem 0.9rem",
    border: "1.5px solid #d4c4a0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    background: "#fffdf5",
  },
  resendBtn: {
    padding: "0.65rem",
    background: "linear-gradient(135deg,#1a1a2e,#0f3460)",
    color: "#e2c97e",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  resendDone: { color: "#276749", fontWeight: 600, margin: 0 },
  homeLink: {
    display: "block",
    marginTop: "0.5rem",
    color: "#0f3460",
    fontSize: "0.88rem",
    textDecoration: "underline",
  },
};

export default VerifyEmailPage;
