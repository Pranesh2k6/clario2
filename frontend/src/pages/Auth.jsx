import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Stars } from '../components/Stars';
import { T } from '../components/theme';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const FIREBASE_ERROR_MAP = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
};

const inp = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(124,58,237,0.22)",
  borderRadius: 10,
  padding: "13px 16px",
  color: "#dce8ff",
  fontFamily: "'Sora',sans-serif",
  fontSize: 14,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

function Field({ label, type = "text", placeholder, value, onChange, showToggle, onToggle, show }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#3a4a62", display: "block", marginBottom: 7 }}>
        {label.toUpperCase()}
      </label>
      <div style={{ position: "relative" }}>
        <input
          style={inp}
          type={showToggle ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
          onBlur={e => (e.target.style.borderColor = "rgba(124,58,237,0.22)")}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#3a4a62", cursor: "pointer", fontSize: 15 }}
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { loginWithEmail, signupWithEmail, currentUser } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // If already logged in, redirect
  if (currentUser) {
    navigate('/dashboard');
    return null;
  }

  function switchMode(m) {
    setMode(m);
    setError("");
    setEmail("");
    setPw("");
    setConfirmPw("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "signup" && pw !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signupWithEmail(email, pw);
        // Sync new user to Postgres
        await client.post('/auth/sync').catch(() => { });
        navigate('/onboarding/subjects');
      } else {
        await loginWithEmail(email, pw);
        // Sync user to Postgres
        await client.post('/auth/sync').catch(() => { });
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = FIREBASE_ERROR_MAP[err.code] || err.message?.replace("Firebase: ", "") || "Authentication failed.";
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center", width: "100vw", minHeight: "100vh" }}>
      <Stars />
      <div style={{ position: "fixed", top: "-20%", right: "-5%", width: "55%", height: "60%", background: "radial-gradient(circle,rgba(76,29,149,0.28) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ ...T.card, display: "flex", borderRadius: 22, overflow: "hidden", width: 840, minHeight: 500, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", position: "relative", zIndex: 1 }}>
        {/* Left illustration panel */}
        <div style={{ width: "42%", background: "linear-gradient(150deg,#12053a 0%,#1a1060 45%,#0c2060 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {[200, 290, 370].map((r, i) => (
            <div key={i} style={{ position: "absolute", width: r, height: r, borderRadius: "50%", border: `1px solid rgba(139,92,246,${0.12 - i * 0.03})`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
          <div style={{ width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#c084fc,#7c3aed 50%,#1e1b4b)", boxShadow: "0 0 60px rgba(196,132,252,0.32)", animation: "floatY 7s ease-in-out infinite", position: "relative", zIndex: 2 }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotateX(72deg)", width: 190, height: 190, borderRadius: "50%", border: "16px solid rgba(139,92,246,0.28)" }} />
          </div>
          <div style={{ position: "absolute", bottom: "22%", left: "18%", width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#60a5fa,#1e40af)", animation: "floatY 9s 1s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "20%", right: "16%", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#34d399,#064e3b)", animation: "floatY 11s 2s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,transparent 75%,rgba(10,14,40,0.65))" }} />
          <div style={{ position: "absolute", bottom: 28, left: 28, right: 28 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 5, letterSpacing: "0.06em" }}>CLARIO</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.45 }}>
              {mode === "login" ? "Welcome back, Explorer" : "Begin your journey through the cosmos"}
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div style={{ flex: 1, padding: "50px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 6 }}>
            {mode === "login" ? "Welcome back, Explorer" : "Join the Mission"}
          </h1>
          <p style={{ fontSize: 14, color: "#4b5e82", marginBottom: 28 }}>
            {mode === "login" ? "Continue your journey through the cosmos of knowledge" : "Begin your adventure in gamified STEM learning"}
          </p>

          {/* Toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 28, border: "1px solid rgba(124,58,237,0.14)" }}>
            {["login", "signup"].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{ flex: 1, padding: "10px", background: mode === m ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent", border: "none", borderRadius: 8, color: mode === m ? "white" : "#3a4a62", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s" }}
              >
                {m === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 13, color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Field label="Email" type="email" placeholder="explorer@clario.space" value={email} onChange={setEmail} />
            <Field label="Password" showToggle show={showPw} onToggle={() => setShowPw(s => !s)} placeholder="Enter your password" value={pw} onChange={setPw} />

            {/* Confirm password — only in signup mode */}
            {mode === "signup" && (
              <Field label="Confirm Password" showToggle show={showConfirmPw} onToggle={() => setShowConfirmPw(s => !s)} placeholder="Re-enter your password" value={confirmPw} onChange={setConfirmPw} />
            )}

            <button
              type="submit"
              disabled={busy}
              style={{ ...T.btn, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, boxShadow: "0 0 28px rgba(124,58,237,0.38)", marginTop: 10, opacity: busy ? 0.6 : 1 }}
              onMouseEnter={e => !busy && (e.target.style.boxShadow = "0 0 48px rgba(124,58,237,0.65)")}
              onMouseLeave={e => (e.target.style.boxShadow = "0 0 28px rgba(124,58,237,0.38)")}
            >
              {busy ? "Authenticating..." : mode === "login" ? "Continue →" : "Create Account →"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              {mode === "login" ? (
                <>
                  <span style={{ fontSize: 12, color: "#2a3448", cursor: "pointer" }}>Forgot password?</span>
                  <span onClick={() => switchMode("signup")} style={{ fontSize: 12, color: "#6366f1", cursor: "pointer" }}>Need an account?</span>
                </>
              ) : (
                <span onClick={() => switchMode("login")} style={{ fontSize: 12, color: "#6366f1", cursor: "pointer", margin: "0 auto" }}>
                  Already have an account?
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
                @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
                @keyframes scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
            `}</style>
    </div>
  );
}