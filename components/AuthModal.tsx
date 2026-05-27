"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  FacebookAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  getAdditionalUserInfo,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

type AuthView = "options" | "phone" | "otp" | "email" | "name_prompt";
type EmailMode = "login" | "create";

/* ── Glass input ─────────────────────────────────────── */
function GlassInput({
  type,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-5 py-3 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: focused ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 2px rgba(255,255,255,0.06)" : "none",
        fontFamily: "'DM Sans', sans-serif",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

/* ── Social / Login Option Button ─────────────────────── */
function SocialButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-full font-medium text-white text-sm transition-all duration-200 hover:brightness-125 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: "linear-gradient(to bottom, #232526, #2d2e30)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── Icons ────────────────────────────────────────────── */
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z" fill="white"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
  </svg>
);

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, authInitialMode, refreshUser } = useAuth();

  const [view, setView] = useState<AuthView>("options");
  const [emailMode, setEmailMode] = useState<EmailMode>("login");

  /* Form Fields */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  /* Reset modal states when it opens/closes */
  useEffect(() => {
    if (showAuthModal) {
      setView("options");
      setEmailMode(authInitialMode);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setPhone("");
      setOtp("");
      setConfirmResult(null);
    } else {
      // Clean up reCAPTCHA when modal closes
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
    }
  }, [showAuthModal, authInitialMode]);

  /* Prevent rendering if not open */
  if (!showAuthModal) return null;

  /* ── helper to save profile details to firestore ── */
  const saveUserProfile = async (currentUser: User, name: string) => {
    const providerId = currentUser.providerData?.[0]?.providerId || "";
    let method = "Email";
    if (providerId.includes("phone")) method = "Phone";
    else if (providerId.includes("facebook")) method = "Facebook";

    let identifier = currentUser.email || "";
    if (method === "Phone") identifier = currentUser.phoneNumber || "";
    else if (method === "Facebook") identifier = currentUser.displayName || currentUser.email || "Facebook User";

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        displayName: name,
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
        loginMethod: method,
        identifier: identifier,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  /* ── Complete Profile (Name Prompt) Submit ── */
  const handleNamePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // 1. Update the local auth profile (very fast)
        await updateProfile(currentUser, { displayName: fullName });
        
        // 2. Refresh the context user so components re-render with the new name instantly
        await refreshUser();

        // 3. Save to database in the background without blocking the UI
        saveUserProfile(currentUser, fullName).catch((err) => {
          console.error("Background user profile database sync failed:", err);
        });

        toast.success("Welcome to SOUNDWAVE!");
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error("Error updating profile display name:", error);
      toast.error("Failed to complete profile.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Cancel Name Prompt (Log out) ── */
  const handleCancelNamePrompt = async () => {
    try {
      await firebaseSignOut(auth);
      setFullName("");
      setView("options");
    } catch (e) {
      console.error("Error signing out during name prompt cancel:", e);
    }
  };

  /* ── Email / Password Auth Submit ── */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      if (emailMode === "create") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match.");
          setIsLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        // Email signup moves directly to name prompt
        setView("name_prompt");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back.");
        setShowAuthModal(false);
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Email auth error:", err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email is already registered.");
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        toast.error("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else {
        toast.error(err.message || "Authentication failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Facebook Sign In ── */
  const handleFacebook = async () => {
    setIsLoading(true);
    try {
      const provider = new FacebookAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      
      const isNew = getAdditionalUserInfo(cred)?.isNewUser || !cred.user.displayName;
      if (isNew) {
        if (cred.user.displayName) {
          setFullName(cred.user.displayName);
        }
        setView("name_prompt");
      } else {
        toast.success("Signed in with Facebook!");
        setShowAuthModal(false);
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Facebook auth error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in window was closed.");
      } else {
        toast.error(err.message || "Facebook login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Phone OTP Send ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    const fullPhone = `+91${digits}`;
    setIsLoading(true);
    try {
      // Always clear old verifier first — prevents stale/broken state
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current!, {
        size: "invisible",
        callback: () => { /* reCAPTCHA solved */ },
        "expired-callback": () => {
          if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
            window.recaptchaVerifier = undefined;
          }
        },
      });
      await window.recaptchaVerifier.render();
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmResult(result);
      setView("otp");
      toast.success("OTP sent to +91 " + digits);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("OTP send error:", err);
      // Clear broken verifier so next attempt starts fresh
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
      // Show specific Firebase error
      if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else if (err.code === "auth/invalid-phone-number") {
        toast.error("Invalid phone number. Please check and try again.");
      } else if (err.code === "auth/captcha-check-failed") {
        toast.error("Security check failed. Please refresh and try again.");
      } else {
        toast.error(err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Phone OTP Verify ── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Please enter the OTP.");
      return;
    }
    if (!confirmResult) {
      toast.error("No active verification found. Please resend OTP.");
      return;
    }
    setIsLoading(true);
    try {
      const cred = await confirmResult.confirm(otp);
      const isNew = getAdditionalUserInfo(cred)?.isNewUser || !cred.user.displayName;
      if (isNew) {
        setView("name_prompt");
      } else {
        toast.success("Signed in successfully!");
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Invisible recaptcha container */}
      <div ref={recaptchaRef} id="recaptcha-container" />

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => {
          if (view !== "name_prompt") {
            setShowAuthModal(false);
          }
        }}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
      />

      {/* Glass card with floating animation */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.065) 0%, rgba(18,18,18,0.97) 100%)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Close button (not shown during name prompt to force registration details) */}
        {view !== "name_prompt" && (
          <button
            onClick={() => setShowAuthModal(false)}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-5 overflow-hidden"
          style={{
            background: "#000000",
            border: "1px solid rgba(201,168,76,0.5)",
            boxShadow: "0 0 20px rgba(201,168,76,0.2), 0 0 0 1px rgba(201,168,76,0.08)",
          }}
        >
          <Image
            src="/images/logo.png?v=3"
            alt="Soundwave Logo"
            width={56}
            height={44}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* Brand name */}
        <h2
          className="text-xl font-semibold text-white mb-6 text-center tracking-widest uppercase"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.3em", fontSize: "1.1rem" }}
        >
          Soundwave
        </h2>

        {/* Animated content area */}
        <AnimatePresence mode="wait">
          
          {/* ── View 1: Main Login Options ── */}
          {view === "options" && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-4"
            >
              <p className="text-sm text-gray-400 text-center -mt-2 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Choose a login method to continue
              </p>
              
              <div className="flex flex-col gap-2.5">
                <SocialButton
                  onClick={() => setView("phone")}
                  disabled={isLoading}
                  icon={<PhoneIcon />}
                  label="Continue with Phone"
                />
                <SocialButton
                  onClick={handleFacebook}
                  disabled={isLoading}
                  icon={<FacebookIcon />}
                  label="Continue with Facebook"
                />
                <SocialButton
                  onClick={() => setView("email")}
                  disabled={isLoading}
                  icon={<EmailIcon />}
                  label="Continue with Email"
                />
              </div>
            </motion.div>
          )}

          {view === "phone" && (
            <motion.div
              key="phone-entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-4"
            >
              <p className="text-sm text-gray-400 text-center -mt-2 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Enter your 10-digit mobile number
              </p>
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                {/* Phone input with locked +91 prefix */}
                <div
                  className="flex items-center w-full rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {/* Country code chip */}
                  <div
                    className="flex items-center gap-1.5 px-4 py-3 shrink-0"
                    style={{
                      borderRight: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.5)",
                      userSelect: "none",
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  {/* Number input */}
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    disabled={isLoading}
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    className="flex-1 bg-transparent px-4 py-3 text-white text-sm focus:outline-none"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.08em",
                      color: "#F5F5F5",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.replace(/\D/g, "").length !== 10}
                  className="w-full py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </form>
              <button
                onClick={() => setView("options")}
                className="text-xs text-gray-500 hover:text-white transition-colors text-center mt-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── View 3: OTP Verification ── */}
          {view === "otp" && (
            <motion.div
              key="otp-verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-4"
            >
              <p className="text-sm text-gray-400 text-center -mt-2 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Enter the OTP sent to <span className="text-white">{phone}</span>
              </p>
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                <GlassInput
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
              <button
                onClick={() => {
                  setView("phone");
                  setOtp("");
                }}
                className="text-xs text-gray-500 hover:text-white transition-colors text-center"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ← Back to Phone
              </button>
            </motion.div>
          )}

          {/* ── View 4: Email / Password Flow ── */}
          {view === "email" && (
            <motion.div
              key="email-flow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-4"
            >
              <p className="text-sm text-gray-400 text-center -mt-2 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {emailMode === "create" ? "Create your account" : "Sign in to your account"}
              </p>
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                <GlassInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={isLoading}
                />
                <GlassInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading}
                />
                {emailMode === "create" && (
                  <GlassInput
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    disabled={isLoading}
                  />
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-full text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 active:scale-[0.98] disabled:opacity-50 mt-1"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isLoading ? "Processing..." : emailMode === "create" ? "Register" : "Sign In"}
                </button>
              </form>

              {/* Mode switch */}
              <p className="text-xs text-gray-500 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {emailMode === "create" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setEmailMode("login")}
                      className="text-white/80 underline hover:text-white transition-colors"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setEmailMode("create")}
                      className="text-white/80 underline hover:text-white transition-colors"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </p>

              <button
                onClick={() => setView("options")}
                className="text-xs text-gray-500 hover:text-white transition-colors text-center"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── View 5: Name Prompt (First-Time Signup) ── */}
          {view === "name_prompt" && (
            <motion.div
              key="name-prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-4"
            >
              <h3
                className="text-sm font-bold text-center text-primary uppercase tracking-widest"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Complete Profile
              </h3>
              <p className="text-xs text-gray-400 text-center -mt-2 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Please enter your full name to proceed to your Soundwave profile.
              </p>
              
              <form onSubmit={handleNamePromptSubmit} className="flex flex-col gap-3">
                <GlassInput
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-full text-sm font-medium text-[#0D0D0D] transition-all duration-300 hover:bg-[#b58c3c] hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] active:scale-[0.98] disabled:opacity-50 mt-1"
                  style={{
                    background: "#C9A84C",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.05em",
                  }}
                >
                  {isLoading ? "Saving..." : "Continue"}
                </button>
              </form>

              <button
                onClick={handleCancelNamePrompt}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-center"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Cancel and Log Out
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
