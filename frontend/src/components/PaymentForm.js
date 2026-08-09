import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useI18n } from "../LanguageContext";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB   = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const BANK_DETAILS_KEYS = [
  { labelKey: "payment.bankName",      value: "Grand National Bank" },
  { labelKey: "payment.accountName",   value: "2RN Solomon Ltd" },
  { labelKey: "payment.accountNumber", value: "1234-5678-9012-3456" },
  { labelKey: "payment.branch",        value: "Main Branch - 001" },
  { labelKey: "payment.swiftCode",     value: "GNBAUS33" },
];

const TIMER_SECONDS = 5 * 60;

const PaymentForm = ({ bookingId: propBookingId, amount: propAmount }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const bookingId = propBookingId || searchParams.get("bookingId");
  const amount    = propAmount    || searchParams.get("amount");

  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileErr, setFileErr] = useState("");
  const [fileMeta, setFileMeta] = useState(null); // { name, sizeKB }
  const [txnRef,  setTxnRef]  = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState("");
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const [dragOver, setDragOver] = useState(false);

  /* countdown */
  useEffect(() => {
    if (success) return;
    const id = setInterval(() => {
      setSeconds(s => (s <= 1 ? (clearInterval(id), 0) : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [success]);

  const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleCopy = (value, labelKey) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(labelKey);
      setTimeout(() => setCopied(""), 1800);
    });
  };

  const validateAndSetFile = (f) => {
    setFileErr("");
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileErr(`Invalid file type. Please upload a JPG, PNG, or WebP image.`);
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFileErr(`File too large. Maximum size is ${MAX_SIZE_MB}MB (your file: ${(f.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }
    setFile(f);
    setFileMeta({ name: f.name, sizeKB: Math.round(f.size / 1024) });
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const handleFileChange = e => validateAndSetFile(e.target.files[0]);

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setFileMeta(null);
    setFileErr("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file)       { setError(t("payment.errorNoFile"));    return; }
    if (!bookingId)  { setError(t("payment.errorNoBooking")); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("paymentProof", file);
      if (txnRef.trim()) fd.append("transactionRef", txnRef.trim());
      await api.post(`/payments/${bookingId}/upload-proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t("payment.errorUpload"));
    } finally {
      setLoading(false);
    }
  };

  /* ── success ── */
  if (success) {
    return (
      <div className="pf-page">
        <div className="pf-card" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
          <h3 style={{ color: "#2e7d32", margin: "0 0 10px" }}>{t("payment.successTitle")}</h3>
          <p style={{ color: "#555", marginBottom: 24 }}>{t("payment.successMsg")}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="pf-confirm-btn" onClick={() => navigate("/")}>{t("payment.backToHome")}</button>
            <button className="pf-confirm-btn" onClick={() => navigate("/rooms")}
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)" }}>
              ⭐ {t("rooms.writeReview")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-page">
      <button className="pf-back-btn" onClick={() => navigate(-1)}>{t("payment.back")}</button>

      <div className="pf-title-block">
        <h2 className="pf-title">{t("payment.title")}</h2>
        <p className="pf-subtitle">{t("payment.subtitle")}</p>
      </div>

      <div className={`pf-timer-banner${seconds < 60 ? " pf-timer-banner--urgent" : ""}`}>
        <div className="pf-timer-top">
          <span className="pf-timer-icon">🕐</span>
          <span className="pf-timer-text">
            {t("payment.timeRemaining")} <strong>{formatTime(seconds)}</strong>
          </span>
        </div>
        <p className="pf-timer-sub">{t("payment.timerSub")}</p>
      </div>

      {/* Stepper */}
      <div className="pf-stepper">
        <div className="pf-step">
          <div className="pf-step-circle pf-step-circle--done">✓</div>
          <span className="pf-step-label">{t("payment.stepDetails")}</span>
        </div>
        <div className="pf-step-line pf-step-line--done" />
        <div className="pf-step">
          <div className="pf-step-circle pf-step-circle--active">2</div>
          <span className="pf-step-label pf-step-label--active">{t("payment.stepPayment")}</span>
        </div>
        <div className="pf-step-line" />
        <div className="pf-step">
          <div className="pf-step-circle">3</div>
          <span className="pf-step-label">{t("payment.stepConfirmation")}</span>
        </div>
      </div>

      {/* Bank Details */}
      <div className="pf-card">
        <h4 className="pf-card-heading">
          <span className="pf-card-heading-icon">🏦</span> {t("payment.bankDetailsTitle")}
        </h4>
        <div className="pf-bank-list">
          {BANK_DETAILS_KEYS.map(({ labelKey, value }) => (
            <div key={labelKey} className="pf-bank-row">
              <div className="pf-bank-info">
                <span className="pf-bank-label">{t(labelKey)}</span>
                <span className="pf-bank-value">{value}</span>
              </div>
              <button className={`pf-copy-btn${copied === labelKey ? " pf-copy-btn--done" : ""}`}
                onClick={() => handleCopy(value, labelKey)} title={`Copy ${t(labelKey)}`} type="button">
                {copied === labelKey ? "✓" : "⧉"}
              </button>
            </div>
          ))}
        </div>
        <div className="pf-amount-box">
          <span className="pf-amount-label"><span>💳</span> {t("payment.amountLabel")}</span>
          <span className="pf-amount-value">
            {amount ? `Br${Number(amount).toLocaleString()}` : t("payment.seeBooking")}
          </span>
        </div>
      </div>

      {/* Upload Card */}
      <div className="pf-card">
        <h4 className="pf-card-heading">
          <span className="pf-card-heading-icon">📄</span> {t("payment.confirmTitle")}
        </h4>

        {error && <div className="pf-error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="pf-form">
          <div className="pf-field">
            <label className="pf-field-label">
              {t("payment.screenshotLabel")} <span className="pf-required">*</span>
            </label>

            {/* Upload drop zone */}
            {!preview ? (
              <label
                className={`pf-upload-area${dragOver ? " pf-upload-area--drag" : ""}${fileErr ? " pf-upload-area--error" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <span className="pf-upload-img-icon">🖼</span>
                <span className="pf-upload-main-text">
                  {dragOver ? "Drop file here" : t("payment.uploadText")}
                </span>
                <span className="pf-upload-hint-text">
                  JPG, PNG, WebP · Max {MAX_SIZE_MB}MB
                </span>
                <input type="file" accept={ALLOWED_TYPES.join(",")} onChange={handleFileChange} className="pf-hidden-input" />
              </label>
            ) : (
              <div className="pf-upload-area pf-upload-area--success" style={{ padding: 0, minHeight: 'auto' }}>
                <img src={preview} alt="Payment proof preview" className="pf-preview-img" style={{ borderRadius: 10, maxHeight: 240, objectFit: 'contain' }} />
                <button type="button" className="pf-remove-link" onClick={removeFile}
                  style={{ margin: '8px auto 4px', display: 'block' }}>
                  {t("payment.removeImage")}
                </button>
              </div>
            )}

            {/* File meta + error */}
            {fileMeta && !fileErr && (
              <div className="fu-meta">
                <span className="fu-badge fu-badge--ok">✓ {fileMeta.name}</span>
                <span className="fu-badge fu-badge--ok">{fileMeta.sizeKB} KB</span>
              </div>
            )}
            {fileErr && <div className="fu-error-text">⚠️ {fileErr}</div>}
          </div>

          <div className="pf-or-divider">
            <span className="pf-or-line" />
            <span className="pf-or-text">OR</span>
            <span className="pf-or-line" />
          </div>

          <div className="pf-field">
            <label className="pf-field-label">
              {t("payment.txnRefLabel")} <span className="pf-optional">({t("payment.txnRefOptional")})</span>
            </label>
            <input type="text" className="pf-text-input" placeholder={t("payment.txnRefPlaceholder")}
              value={txnRef} onChange={e => setTxnRef(e.target.value)} />
            <span className="pf-field-hint">{t("payment.txnRefHint")}</span>
          </div>

          <div className="pf-info-note">
            <span className="pf-info-icon">ℹ️</span>
            <span>{t("payment.infoNote")}</span>
          </div>

          <button type="submit" disabled={loading || !file || !!fileErr} className={`pf-confirm-btn${loading ? " btn-loading" : ""}`}>
            {loading ? (
              <><span className="spinner" />{t("payment.uploading")}</>
            ) : t("payment.confirmButton")}
          </button>
        </form>
      </div>

      <div className="pf-notes-card">
        <h4 className="pf-notes-title">{t("payment.importantNotes")}</h4>
        <ul className="pf-notes-list">
          {[t("payment.note1"), t("payment.note2"), t("payment.note3"), t("payment.note4")].map((note, i) => (
            <li key={i} className="pf-notes-item">
              <span className="pf-notes-check">✓</span>{note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PaymentForm;

const BANK_DETAILS_KEYS = [
  { labelKey: "payment.bankName", value: "Grand National Bank" },
  { labelKey: "payment.accountName", value: "2RN Solomon Ltd" },
  { labelKey: "payment.accountNumber", value: "1234-5678-9012-3456" },
  { labelKey: "payment.branch", value: "Main Branch - 001" },
  { labelKey: "payment.swiftCode", value: "GNBAUS33" },
];

const TIMER_SECONDS = 5 * 60;

const PaymentForm = ({ bookingId: propBookingId, amount: propAmount }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const bookingId = propBookingId || searchParams.get("bookingId");
  const amount = propAmount || searchParams.get("amount");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [txnRef, setTxnRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [seconds, setSeconds] = useState(TIMER_SECONDS);

  /* countdown */
  useEffect(() => {
    if (success) return;
    const id = setInterval(() => {
      setSeconds((s) => (s <= 1 ? (clearInterval(id), 0) : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [success]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleCopy = (value, labelKey) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(labelKey);
      setTimeout(() => setCopied(""), 1800);
    });
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("payment.errorNoFile"));
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t("payment.errorNoFile"));
      return;
    }
    if (!bookingId) {
      setError(t("payment.errorNoBooking"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("paymentProof", file);
      if (txnRef.trim()) fd.append("transactionRef", txnRef.trim());
      await api.post(`/payments/${bookingId}/upload-proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t("payment.errorUpload"));
    } finally {
      setLoading(false);
    }
  };

  /* ── success ── */
  if (success) {
    return (
      <div className="pf-page">
        <div
          className="pf-card"
          style={{ textAlign: "center", padding: "48px 32px" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
          <h3 style={{ color: "#2e7d32", margin: "0 0 10px" }}>
            {t("payment.successTitle")}
          </h3>
          <p style={{ color: "#555", marginBottom: 24 }}>
            {t("payment.successMsg")}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="pf-confirm-btn" onClick={() => navigate("/")}>
              {t("payment.backToHome")}
            </button>
            <button
              className="pf-confirm-btn"
              onClick={() => navigate("/rooms")}
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)" }}
            >
              ⭐ {t("rooms.writeReview")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-page">
      {/* Back */}
      <button className="pf-back-btn" onClick={() => navigate(-1)}>
        {t("payment.back")}
      </button>

      {/* Title */}
      <div className="pf-title-block">
        <h2 className="pf-title">{t("payment.title")}</h2>
        <p className="pf-subtitle">{t("payment.subtitle")}</p>
      </div>

      {/* Timer */}
      <div
        className={`pf-timer-banner${seconds < 60 ? " pf-timer-banner--urgent" : ""}`}
      >
        <div className="pf-timer-top">
          <span className="pf-timer-icon">🕐</span>
          <span className="pf-timer-text">
            {t("payment.timeRemaining")} <strong>{formatTime(seconds)}</strong>
          </span>
        </div>
        <p className="pf-timer-sub">{t("payment.timerSub")}</p>
      </div>

      {/* Stepper */}
      <div className="pf-stepper">
        <div className="pf-step pf-step--done">
          <div className="pf-step-circle pf-step-circle--done">✓</div>
          <span className="pf-step-label">{t("payment.stepDetails")}</span>
        </div>
        <div className="pf-step-line pf-step-line--done" />
        <div className="pf-step pf-step--active">
          <div className="pf-step-circle pf-step-circle--active">2</div>
          <span className="pf-step-label pf-step-label--active">
            {t("payment.stepPayment")}
          </span>
        </div>
        <div className="pf-step-line" />
        <div className="pf-step">
          <div className="pf-step-circle">3</div>
          <span className="pf-step-label">{t("payment.stepConfirmation")}</span>
        </div>
      </div>

      {/* ── Bank Details Card ── */}
      <div className="pf-card">
        <h4 className="pf-card-heading">
          <span className="pf-card-heading-icon">🏦</span>{" "}
          {t("payment.bankDetailsTitle")}
        </h4>

        <div className="pf-bank-list">
          {BANK_DETAILS_KEYS.map(({ labelKey, value }) => (
            <div key={labelKey} className="pf-bank-row">
              <div className="pf-bank-info">
                <span className="pf-bank-label">{t(labelKey)}</span>
                <span className="pf-bank-value">{value}</span>
              </div>
              <button
                className={`pf-copy-btn${copied === labelKey ? " pf-copy-btn--done" : ""}`}
                onClick={() => handleCopy(value, labelKey)}
                title={`${t("payment.copyTitle")} ${t(labelKey)}`}
                type="button"
              >
                {copied === labelKey ? "✓" : "⧉"}
              </button>
            </div>
          ))}
        </div>

        {/* Amount box */}
        <div className="pf-amount-box">
          <span className="pf-amount-label">
            <span>💳</span> {t("payment.amountLabel")}
          </span>
          <span className="pf-amount-value">
            {amount
              ? `Br${Number(amount).toLocaleString()}`
              : t("payment.seeBooking")}
          </span>
        </div>
      </div>

      {/* ── Confirm Payment Card ── */}
      <div className="pf-card">
        <h4 className="pf-card-heading">
          <span className="pf-card-heading-icon">📄</span>{" "}
          {t("payment.confirmTitle")}
        </h4>

        {error && <div className="pf-error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="pf-form">
          {/* Upload area */}
          <div className="pf-field">
            <label className="pf-field-label">
              {t("payment.screenshotLabel")}{" "}
              <span className="pf-required">*</span>
            </label>
            <label className="pf-upload-area">
              {preview ? (
                <img
                  src={preview}
                  alt={t("payment.screenshotLabel")}
                  className="pf-preview-img"
                />
              ) : (
                <>
                  <span className="pf-upload-img-icon">🖼</span>
                  <span className="pf-upload-main-text">
                    {t("payment.uploadText")}
                  </span>
                  <span className="pf-upload-hint-text">
                    {t("payment.uploadHint")}
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="pf-hidden-input"
              />
            </label>
            {preview && (
              <button
                type="button"
                className="pf-remove-link"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                {t("payment.removeImage")}
              </button>
            )}
          </div>

          {/* OR divider */}
          <div className="pf-or-divider">
            <span className="pf-or-line" />
            <span className="pf-or-text">OR</span>
            <span className="pf-or-line" />
          </div>

          {/* Transaction ref */}
          <div className="pf-field">
            <label className="pf-field-label">
              {t("payment.txnRefLabel")}{" "}
              <span className="pf-optional">
                ({t("payment.txnRefOptional")})
              </span>
            </label>
            <input
              type="text"
              className="pf-text-input"
              placeholder={t("payment.txnRefPlaceholder")}
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
            />
            <span className="pf-field-hint">{t("payment.txnRefHint")}</span>
          </div>

          {/* Info note */}
          <div className="pf-info-note">
            <span className="pf-info-icon">ℹ️</span>
            <span>{t("payment.infoNote")}</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !file}
            className="pf-confirm-btn"
          >
            {loading ? t("payment.uploading") : t("payment.confirmButton")}
          </button>
        </form>
      </div>

      {/* ── Important Notes ── */}
      <div className="pf-notes-card">
        <h4 className="pf-notes-title">{t("payment.importantNotes")}</h4>
        <ul className="pf-notes-list">
          {[
            t("payment.note1"),
            t("payment.note2"),
            t("payment.note3"),
            t("payment.note4"),
          ].map((note, i) => (
            <li key={i} className="pf-notes-item">
              <span className="pf-notes-check">✓</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PaymentForm;
