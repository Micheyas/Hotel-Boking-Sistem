import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getCustomerToken, getCustomerUser, logoutCustomer } from "./CustomerAuth";
import "../styles/ProfileSetup.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── All world nationalities ───────────────────────────────
const NATIONALITIES = [
  "Afghan","Albanian","Algerian","American","Andorran","Angolan","Antiguans",
  "Argentinean","Armenian","Australian","Austrian","Azerbaijani","Bahamian",
  "Bahraini","Bangladeshi","Barbadian","Barbudans","Batswana","Belarusian",
  "Belgian","Belizean","Beninese","Bhutanese","Bolivian","Bosnian","Brazilian",
  "British","Bruneian","Bulgarian","Burkinabe","Burmese","Burundian","Cambodian",
  "Cameroonian","Canadian","Cape Verdean","Central African","Chadian","Chilean",
  "Chinese","Colombian","Comoran","Congolese","Costa Rican","Croatian","Cuban",
  "Cypriot","Czech","Danish","Djibouti","Dominican","Dutch","East Timorese",
  "Ecuadorean","Egyptian","Emirian","Equatorial Guinean","Eritrean","Estonian",
  "Ethiopian","Fijian","Filipino","Finnish","French","Gabonese","Gambian",
  "Georgian","German","Ghanaian","Greek","Grenadian","Guatemalan","Guinea-Bissauan",
  "Guinean","Guyanese","Haitian","Herzegovinian","Honduran","Hungarian","I-Kiribati",
  "Icelander","Indian","Indonesian","Iranian","Iraqi","Irish","Israeli","Italian",
  "Ivorian","Jamaican","Japanese","Jordanian","Kazakhstani","Kenyan","Kittian and Nevisian",
  "Kuwaiti","Kyrgyz","Laotian","Latvian","Lebanese","Liberian","Libyan",
  "Liechtensteiner","Lithuanian","Luxembourger","Macedonian","Malagasy","Malawian",
  "Malaysian","Maldivian","Malian","Maltese","Marshallese","Mauritanian","Mauritian",
  "Mexican","Micronesian","Moldovan","Monacan","Mongolian","Moroccan","Mosotho",
  "Motswana","Mozambican","Namibian","Nauruan","Nepalese","New Zealander",
  "Ni-Vanuatu","Nicaraguan","Nigerian","Nigerien","Norwegian","Omani","Pakistani",
  "Palauan","Panamanian","Papua New Guinean","Paraguayan","Peruvian","Polish",
  "Portuguese","Qatari","Romanian","Russian","Rwandan","Saint Lucian",
  "Salvadoran","Samoan","San Marinese","Sao Tomean","Saudi Arabian","Senegalese",
  "Serbian","Seychellois","Sierra Leonean","Singaporean","Slovakian","Slovenian",
  "Solomon Islander","Somali","South African","South Korean","South Sudanese",
  "Spanish","Sri Lankan","Sudanese","Surinamer","Swazi","Swedish","Swiss",
  "Syrian","Taiwanese","Tajik","Tanzanian","Thai","Togolese","Tongan",
  "Trinidadian or Tobagonian","Tunisian","Turkish","Tuvaluan","Ugandan",
  "Ukrainian","Uruguayan","Uzbekistani","Venezuelan","Vietnamese","Welsh",
  "Yemenite","Zambian","Zimbabwean"
];

// ── Ethiopian Calendar helpers ────────────────────────────
// Ethiopian months
const ETH_MONTHS = [
  { value: 1,  label: "መስከረም (Meskerem)" },
  { value: 2,  label: "ጥቅምት (Tikimt)" },
  { value: 3,  label: "ኅዳር (Hidar)" },
  { value: 4,  label: "ታኅሣሥ (Tahsas)" },
  { value: 5,  label: "ጥር (Tir)" },
  { value: 6,  label: "የካቲት (Yekatit)" },
  { value: 7,  label: "መጋቢት (Megabit)" },
  { value: 8,  label: "ሚያዝያ (Miyazia)" },
  { value: 9,  label: "ግንቦት (Ginbot)" },
  { value: 10, label: "ሰኔ (Sene)" },
  { value: 11, label: "ሐምሌ (Hamle)" },
  { value: 12, label: "ነሐሴ (Nehase)" },
  { value: 13, label: "ጳጉሜ (Pagume)" },
];

// Convert Ethiopian date to Gregorian ISO string
function ethToGregorian(ethYear, ethMonth, ethDay) {
  try {
    // Ethiopian epoch: Meskerem 1, 1 EC = Aug 29, 8 AD (Julian) = Sep 11, 8 AD
    // JDN of Ethiopian epoch start
    const JDN_EPOCH = 1724221;
    const ethJDN = JDN_EPOCH + 365 * (ethYear - 1) + Math.floor((ethYear - 1) / 4)
      + 30 * (ethMonth - 1) + (ethDay - 1);

    // JDN to Gregorian
    const l = ethJDN + 68569;
    const n = Math.floor((4 * l) / 146097);
    const ll = l - Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (ll + 1)) / 1461001);
    const lll = ll - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * lll) / 2447);
    const day = lll - Math.floor((2447 * j) / 80);
    const jj = j + 2 - 12 * Math.floor(j / 11);
    const month = jj;
    const year = 100 * (n - 49) + i + Math.floor(j / 11);

    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  } catch {
    return "";
  }
}

// Ethiopian Date Picker component
const EthiopianDatePicker = ({ value, onChange }) => {
  const currentEthYear = new Date().getFullYear() - 7; // approx
  const [ethYear,  setEthYear]  = useState("");
  const [ethMonth, setEthMonth] = useState("");
  const [ethDay,   setEthDay]   = useState("");

  const handleChange = (y, m, d) => {
    if (y && m && d) {
      const days = parseInt(m) === 13 ? 5 : 30;
      if (parseInt(d) > days) return;
      const greg = ethToGregorian(parseInt(y), parseInt(m), parseInt(d));
      if (greg) onChange(greg);
    }
  };

  const maxDaysInMonth = ethMonth === "13" ? 5 : 30;

  return (
    <div className="ps-eth-picker">
      <select
        className="ps-input ps-select"
        value={ethYear}
        onChange={e => { setEthYear(e.target.value); handleChange(e.target.value, ethMonth, ethDay); }}
      >
        <option value="">Year (ዓ.ም)</option>
        {Array.from({ length: 100 }, (_, i) => currentEthYear - 17 - i).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        className="ps-input ps-select"
        value={ethMonth}
        onChange={e => { setEthMonth(e.target.value); handleChange(ethYear, e.target.value, ethDay); }}
      >
        <option value="">Month (ወር)</option>
        {ETH_MONTHS.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        className="ps-input ps-select"
        value={ethDay}
        onChange={e => { setEthDay(e.target.value); handleChange(ethYear, ethMonth, e.target.value); }}
      >
        <option value="">Day (ቀን)</option>
        {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      {value && <span className="ps-eth-converted">→ {value}</span>}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────
const ProfileSetup = () => {
  const navigate = useNavigate();
  const token = getCustomerToken();
  const user  = getCustomerUser();

  const [kycStatus, setKycStatus]       = useState(null);
  const [rejectedReason, setRejectedReason] = useState("");
  const [loadingStatus, setLoadingStatus]   = useState(true);

  // Form fields
  const [fullName, setFullName]         = useState("");
  const [phone, setPhone]               = useState("");
  const [dateOfBirth, setDateOfBirth]   = useState("");
  const [calendarType, setCalendarType] = useState("gregorian"); // 'gregorian' | 'ethiopian'
  const [nationality, setNationality]   = useState("");
  const [natSearch, setNatSearch]       = useState("");
  const [idType, setIdType]             = useState("national_id");
  const [idFront, setIdFront]           = useState(null);
  const [idBack, setIdBack]             = useState(null);
  const [previewFront, setPreviewFront] = useState(null);
  const [previewBack, setPreviewBack]   = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  useEffect(() => {
    if (!token || !user) { navigate("/login"); return; }
    fetchKycStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await axios.get(API + "/auth/kyc/status", {
        headers: { Authorization: "Bearer " + token },
      });
      setKycStatus(res.data.kycStatus);
      setRejectedReason(res.data.kycRejectedReason || "");
      if (res.data.phone)       setPhone(res.data.phone);
      if (res.data.nationality) setNationality(res.data.nationality);
      if (res.data.idType)      setIdType(res.data.idType);
    } catch {
      setKycStatus("pending");
    } finally {
      setLoadingStatus(false);
    }
  };

  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  const MAX_MB = 10;

  const validateFile = (file) => {
    if (!file) return "";
    if (!ALLOWED_TYPES.includes(file.type)) return "Invalid file type. Use JPG, PNG, WebP, or PDF.";
    if (file.size > MAX_MB * 1024 * 1024) return `File too large. Max ${MAX_MB}MB (your file: ${(file.size/1024/1024).toFixed(1)}MB).`;
    return "";
  };

  const handleFileChange = (side) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError("");
    if (side === "front") { setIdFront(file); setPreviewFront(URL.createObjectURL(file)); }
    else                  { setIdBack(file);  setPreviewBack(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!fullName.trim() || !phone || !dateOfBirth || !nationality) {
      setError("Please fill in all personal information fields."); return;
    }
    if (!idFront) {
      setError("Please upload the front of your ID document."); return;
    }
    if (idType === "national_id" && !idBack) {
      setError("Please upload the back of your National ID."); return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("fullName",    fullName.trim());
      fd.append("phone",       phone.trim());
      fd.append("dateOfBirth", dateOfBirth);
      fd.append("nationality", nationality);
      fd.append("idType",      idType);
      fd.append("idFront",     idFront);
      if (idBack) fd.append("idBack", idBack);

      await axios.post(API + "/auth/kyc", fd, {
        headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" },
      });

      setKycStatus("submitted");
      setSuccess("Your documents have been submitted! Staff will review within 24 hours.");
      const updatedUser = { ...user, kycStatus: "submitted" };
      localStorage.setItem("customerUser", JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !user) return null;
  if (loadingStatus) return <div className="ps-loading">Loading…</div>;

  if (kycStatus === "approved") {
    return (
      <div className="ps-page">
        <div className="ps-card">
          <div className="ps-status-icon">✅</div>
          <h2>Identity Verified</h2>
          <p>Your identity has been verified. You can now book rooms.</p>
          <Link to="/booking" className="ps-btn">Book a Room →</Link>
          <Link to="/" className="ps-link">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (kycStatus === "submitted") {
    return (
      <div className="ps-page">
        <div className="ps-card">
          <div className="ps-status-icon">⏳</div>
          <h2>Under Review</h2>
          <p>Your documents have been submitted and are being reviewed by our staff.</p>
          <p className="ps-sub">This usually takes less than 24 hours.</p>
          <Link to="/" className="ps-link">Back to Home</Link>
          <button className="ps-logout-link" onClick={() => { logoutCustomer(); navigate("/login"); }}>
            ↪ Log out
          </button>
        </div>
      </div>
    );
  }

  const isRejected = kycStatus === "rejected";

  // Filtered nationalities
  const filteredNationalities = NATIONALITIES.filter(n =>
    n.toLowerCase().includes(natSearch.toLowerCase())
  );

  return (
    <div className="ps-page">
      <div className="ps-card ps-card--form">

        <div className="ps-header">
          <Link to="/" className="ps-logo">2RN Solomon Hotel</Link>
          <h2 className="ps-title">
            {isRejected ? "Resubmit Your Documents" : "Complete Your Profile"}
          </h2>
          <p className="ps-subtitle">
            {isRejected
              ? "Your previous submission was rejected. Please resubmit with valid documents."
              : "One last step before you can book. Please provide your personal information and a valid ID."}
          </p>
        </div>

        {isRejected && rejectedReason && (
          <div className="ps-rejected-box">
            <span className="ps-rejected-icon">❌</span>
            <div>
              <strong>Rejection reason:</strong>
              <p>{rejectedReason}</p>
            </div>
          </div>
        )}

        <form className="ps-form" onSubmit={handleSubmit}>

          <div className="ps-section-title">👤 Personal Information / ግላዊ መረጃ</div>

          <div className="ps-row">
            <div className="ps-field">
              <label>Full Name / ሙሉ ስም <span className="ps-req">*</span></label>
              <input
                type="text" required
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="ps-input"
              />
            </div>
            <div className="ps-field">
              <label>Email / ኢሜይል</label>
              <input type="email" value={user.email} disabled className="ps-input ps-input--disabled" />
            </div>
          </div>

          <div className="ps-row">
            <div className="ps-field">
              <label>Phone Number / ስልክ ቁጥር <span className="ps-req">*</span></label>
              <input
                type="tel" required
                placeholder="+251 9xx xxx xxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="ps-input"
              />
            </div>
            <div className="ps-field">
              <label>Date of Birth / የልደት ቀን <span className="ps-req">*</span></label>
              {/* Calendar type toggle */}
              <div className="ps-cal-toggle">
                <button
                  type="button"
                  className={"ps-cal-btn" + (calendarType === "gregorian" ? " ps-cal-btn--active" : "")}
                  onClick={() => { setCalendarType("gregorian"); setDateOfBirth(""); }}
                >
                  🌍 Gregorian
                </button>
                <button
                  type="button"
                  className={"ps-cal-btn" + (calendarType === "ethiopian" ? " ps-cal-btn--active" : "")}
                  onClick={() => { setCalendarType("ethiopian"); setDateOfBirth(""); }}
                >
                  🇪🇹 Ethiopian
                </button>
              </div>

              {calendarType === "gregorian" ? (
                <input
                  type="date" required
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="ps-input"
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                />
              ) : (
                <EthiopianDatePicker
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                />
              )}
              {calendarType === "ethiopian" && !dateOfBirth && (
                <span className="ps-field-hint">Select year, month, and day in Ethiopian calendar</span>
              )}
            </div>
          </div>

          {/* Nationality dropdown with search */}
          <div className="ps-field">
            <label>Nationality / ዜግነት <span className="ps-req">*</span></label>
            <div className="ps-nat-wrap">
              <input
                type="text"
                className="ps-input"
                placeholder="🔍 Search nationality..."
                value={natSearch || nationality}
                onChange={e => {
                  setNatSearch(e.target.value);
                  setNationality("");
                }}
              />
              {natSearch && !nationality && (
                <div className="ps-nat-dropdown">
                  {filteredNationalities.length === 0 ? (
                    <div className="ps-nat-empty">No nationality found</div>
                  ) : (
                    filteredNationalities.slice(0, 8).map(n => (
                      <div
                        key={n}
                        className="ps-nat-option"
                        onClick={() => { setNationality(n); setNatSearch(""); }}
                      >
                        {n}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {nationality && (
              <div className="ps-nat-selected">
                ✅ {nationality}
                <button type="button" className="ps-nat-clear" onClick={() => { setNationality(""); setNatSearch(""); }}>✕</button>
              </div>
            )}
          </div>

          {/* ID Document */}
          <div className="ps-section-title">🪪 Identity Document / መታወቂያ ሰነድ</div>

          <div className="ps-field">
            <label>Document Type / ሰነድ አይነት <span className="ps-req">*</span></label>
            <div className="ps-id-type-row">
              <button
                type="button"
                className={"ps-id-type-btn" + (idType === "national_id" ? " ps-id-type-btn--active" : "")}
                onClick={() => setIdType("national_id")}
              >
                🪪 National ID (FIDA)
              </button>
              <button
                type="button"
                className={"ps-id-type-btn" + (idType === "passport" ? " ps-id-type-btn--active" : "")}
                onClick={() => setIdType("passport")}
              >
                📘 Passport / ፓስፖርት
              </button>
            </div>
          </div>

          <div className="ps-field">
            <label>
              {idType === "national_id" ? "National ID — Front Side / ፊት ገጽ" : "Passport — Photo Page / ፎቶ ገጽ"}
              <span className="ps-req"> *</span>
            </label>
            <label className="ps-upload-area">
              {previewFront ? (
                <img src={previewFront} alt="ID Front" className="ps-id-preview" />
              ) : (
                <div className="ps-upload-inner">
                  <span className="ps-upload-icon">📷</span>
                  <span className="ps-upload-text">Click to upload / ጠቅ አድርጉ</span>
                  <span className="ps-upload-hint">JPG, PNG or PDF · Max 10MB</span>
                </div>
              )}
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange("front")} className="ps-hidden-input" />
            </label>
            {previewFront && (
              <button type="button" className="ps-remove-btn" onClick={() => { setIdFront(null); setPreviewFront(null); }}>
                ✕ Remove
              </button>
            )}
          </div>

          {idType === "national_id" && (
            <div className="ps-field">
              <label>National ID — Back Side / ኋላ ገጽ <span className="ps-req">*</span></label>
              <label className="ps-upload-area">
                {previewBack ? (
                  <img src={previewBack} alt="ID Back" className="ps-id-preview" />
                ) : (
                  <div className="ps-upload-inner">
                    <span className="ps-upload-icon">📷</span>
                    <span className="ps-upload-text">Click to upload back side / ኋላ ገጽ ጠቅ አድርጉ</span>
                    <span className="ps-upload-hint">JPG, PNG or PDF · Max 10MB</span>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange("back")} className="ps-hidden-input" />
              </label>
              {previewBack && (
                <button type="button" className="ps-remove-btn" onClick={() => { setIdBack(null); setPreviewBack(null); }}>
                  ✕ Remove
                </button>
              )}
            </div>
          )}

          <div className="ps-notice">
            <span>🔒</span>
            <span>Your documents are encrypted and stored securely. They are only used to verify your identity and will not be shared with third parties.</span>
          </div>

          {error   && <p className="ps-error">{error}</p>}
          {success && <p className="ps-success">{success}</p>}

          <button type="submit" className="ps-submit-btn" disabled={submitting}>
            {submitting ? (
              <><span className="spinner spinner--sm" style={{borderTopColor:'#1a1a2e',borderColor:'rgba(26,26,46,0.2)'}} /> Uploading… / በመጫን ላይ…</>
            ) : "Submit for Verification / ለማረጋገጥ ያስገቡ"}
          </button>

        </form>

        <button className="ps-logout-link" onClick={() => { logoutCustomer(); navigate("/login"); }}>
          ↪ Log out and use a different account
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
