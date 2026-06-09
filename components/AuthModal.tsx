"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  getAdditionalUserInfo,
  signOut as firebaseSignOut,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

type AuthStep =
  | "method_choose"
  | "phone_entry"
  | "phone_otp"
  | "phone_name"
  | "email_login"
  | "email_signup";

/* ─── Premium Custom Icons ─── */
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#C9A84C" style={{ flexShrink: 0 }}>
    <path d="M20.01 15.38c-1.23-.11-2.42-.45-3.53-1.01a1 1 0 0 0-1 .17l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.2a1 1 0 0 0 .17-1A15.44 15.44 0 0 1 8.05 4.4a1 1 0 0 0-1-1H4.4a1 1 0 0 0-1 1C3.4 16.2 11.2 24 20.6 24a1 1 0 0 0 1-1v-6.6a1 1 0 0 0-1-1.02z" />
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Spinner = () => (
  <div className="spinner" />
);

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, authInitialMode, refreshUser } = useAuth();

  const [stepHistory, setStepHistory] = useState<AuthStep[]>(["method_choose"]);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  /* Form Fields */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);

  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* Reset modal states when it opens/closes */
  useEffect(() => {
    if (showAuthModal) {
      setStepHistory(["method_choose"]);
      setIsSignUpMode(authInitialMode === "create");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setPhone("");
      setOtp("");
      setOtpValues(Array(6).fill(""));
      setConfirmResult(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
      setCountdown(0);
    } else {
      // Clean up reCAPTCHA when modal closes
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
    }
  }, [showAuthModal, authInitialMode]);

  /* Timer logic for OTP Resend */
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  /* Prevent rendering if not open */
  if (!showAuthModal) return null;

  /* Step Nav Helpers */
  const navigateTo = (newStep: AuthStep) => {
    setStepHistory((prev) => [...prev, newStep]);
    setErrors({});
  };

  const navigateBack = async () => {
    const currentStep = stepHistory[stepHistory.length - 1];
    if (currentStep === "phone_name") {
      // Log out if user goes back from name entry screen
      try {
        await firebaseSignOut(auth);
        setFullName("");
      } catch (e) {
        console.error("Sign out error during back:", e);
      }
    }

    if (stepHistory.length > 1) {
      setStepHistory((prev) => prev.slice(0, -1));
    }
    setErrors({});
  };

  const currentStep = stepHistory[stepHistory.length - 1];

  /* ── helper to save profile details to firestore ── */
  const saveUserProfile = async (currentUser: User, name: string) => {
    const providerId = currentUser.providerData?.[0]?.providerId || "";
    let method = "Email";
    if (providerId.includes("phone")) method = "Phone";

    let identifier = currentUser.email || "";
    if (method === "Phone") identifier = currentUser.phoneNumber || "";

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

  /* ── map Firebase auth error codes to human-readable strings ── */
  const mapFirebaseError = (error: { code?: string; message?: string }): { field: string; message: string } => {
    const code = error.code || "";
    if (code === "auth/email-already-in-use") {
      return { field: "email", message: "Email is already registered." };
    }
    if (code === "auth/invalid-email") {
      return { field: "email", message: "Invalid email address." };
    }
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return { field: "password", message: "Incorrect email or password. Please try again." };
    }
    if (code === "auth/weak-password") {
      return { field: "password", message: "Password should be at least 6 characters." };
    }
    if (code === "auth/too-many-requests") {
      return { field: "general", message: "Too many attempts. Please try again later." };
    }
    if (code === "auth/invalid-phone-number") {
      return { field: "phone", message: "Invalid phone number." };
    }
    if (code === "auth/captcha-check-failed") {
      return { field: "general", message: "Security check failed. Please try again." };
    }
    return { field: "general", message: error.message || "Authentication failed." };
  };

  /* ── Input change wrapper that clears error for that input field ── */
  const handleInputChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (errors.general) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.general;
        return next;
      });
    }
  };

  /* ── Toggle Signup vs Login Mode in Step 1 ── */
  const handleToggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
  };

  /* ── Email / Password Auth Submit ── */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrors({ general: "Please fill in all fields." });
      return;
    }

    setIsLoading(true);
    try {
      if (currentStep === "email_signup") {
        if (!fullName.trim()) {
          setErrors({ fullName: "Full name is required." });
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrors({ confirmPassword: "Passwords do not match." });
          setIsLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });
        await refreshUser();
        saveUserProfile(cred.user, fullName).catch((err) => {
          console.error("Background user profile database sync failed:", err);
        });
        toast.success("Welcome to SOUNDWAVE!");
        setShowAuthModal(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back.");
        setShowAuthModal(false);
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Email auth error:", err);
      const mapped = mapFirebaseError(err);
      setErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Forgot Password Email Sender ── */
  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ email: "Please enter your email address first." });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Forgot password error:", err);
      const mapped = mapFirebaseError(err);
      setErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Phone OTP Send ── */
  const handleSendOtp = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setErrors({ phone: "Please enter a valid 10-digit mobile number." });
      return;
    }
    const fullPhone = `+91${digits}`;
    setIsLoading(true);
    try {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current!, {
        size: "invisible",
        callback: () => {},
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
      setCountdown(30);
      setOtpValues(Array(6).fill(""));
      setOtp("");
      navigateTo("phone_otp");
      toast.success("OTP sent to +91 " + digits);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("OTP send error:", err);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
      const mapped = mapFirebaseError(err);
      setErrors({ phone: mapped.message });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Trigger Phone OTP verification ── */
  const triggerVerifyOtp = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length < 6) {
      setErrors({ otp: "Please enter the 6-digit verification code." });
      return;
    }
    if (!confirmResult) {
      setErrors({ otp: "No active verification code request found." });
      return;
    }
    setIsLoading(true);
    try {
      const cred = await confirmResult.confirm(codeToVerify);
      const isNew = getAdditionalUserInfo(cred)?.isNewUser || !cred.user.displayName;
      if (isNew) {
        navigateTo("phone_name");
      } else {
        toast.success("Signed in successfully!");
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setErrors({ otp: "Incorrect code. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerifyOtp(otp);
  };

  /* ── 6-Digit OTP input field handlers ── */
  const handleOtpValueChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 1);
    const nextValues = [...otpValues];
    nextValues[index] = cleaned;
    setOtpValues(nextValues);

    const combinedOtp = nextValues.join("");
    setOtp(combinedOtp);

    // Auto-advance
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when fully populated
    if (combinedOtp.length === 6) {
      triggerVerifyOtp(combinedOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
        const nextValues = [...otpValues];
        nextValues[index - 1] = "";
        setOtpValues(nextValues);
        setOtp(nextValues.join(""));
      } else {
        const nextValues = [...otpValues];
        nextValues[index] = "";
        setOtpValues(nextValues);
        setOtp(nextValues.join(""));
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length > 0) {
      const nextValues = [...otpValues];
      for (let i = 0; i < 6; i++) {
        nextValues[i] = text[i] || "";
      }
      setOtpValues(nextValues);
      const combinedOtp = nextValues.join("");
      setOtp(combinedOtp);

      const focusIdx = Math.min(text.length - 1, 5);
      otpRefs.current[focusIdx]?.focus();

      if (combinedOtp.length === 6) {
        triggerVerifyOtp(combinedOtp);
      }
    }
  };

  /* ── Complete Profile (Name Prompt) Submit ── */
  const handleNamePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrors({ fullName: "Name is required." });
      return;
    }
    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { displayName: fullName });
        await refreshUser();

        saveUserProfile(currentUser, fullName).catch((err) => {
          console.error("Background user profile database sync failed:", err);
        });

        toast.success("Welcome to SOUNDWAVE!");
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error("Error updating profile display name:", error);
      setErrors({ fullName: "Failed to complete profile registration." });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Rendering of Slide-in inline error message ── */
  const renderError = (field: string) => (
    <AnimatePresence>
      {errors[field] && (
        <motion.p
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-xs text-[#ff4444] font-normal pl-1 select-none"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {errors[field]}
        </motion.p>
      )}
    </AnimatePresence>
  );

  /* Framer Motion Step Transition Variants */
  const stepVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Invisible recaptcha container */}
      <div ref={recaptchaRef} id="recaptcha-container" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');

        .auth-modal-card {
          width: 92%;
          max-width: 400px;
          background: rgba(28, 28, 30, 0.72);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 32px;
          box-sizing: border-box;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
        }

        @media (max-width: 640px) {
          .auth-modal-card {
            width: 96% !important;
            padding: 24px !important;
            border-radius: 24px !important;
          }
        }

        .auth-input {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          height: 50px;
          padding: 0 16px;
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: #ffffff;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .auth-input:focus {
          border: 1px solid rgba(201, 168, 76, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .phone-input-container {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          height: 50px;
          display: flex;
          align-items: center;
          overflow: hidden;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .phone-input-container:focus-within {
          border: 1px solid rgba(201, 168, 76, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .otp-box {
          width: 44px;
          height: 54px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 20px;
          text-align: center;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .otp-box:focus {
          border: 1px solid rgba(201, 168, 76, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
        }
        .otp-box.filled {
          border-color: rgba(201, 168, 76, 0.4);
        }

        .auth-btn-primary {
          background: linear-gradient(135deg, #C9A84C, #b8852a);
          color: #000000;
          border-radius: 980px;
          height: 50px;
          width: 100%;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3);
          transition: filter 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
        }
        .auth-btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          box-shadow: 0 4px 16px rgba(201, 168, 76, 0.45);
        }
        .auth-btn-primary:active:not(:disabled) {
          transform: scale(0.97);
        }
        .auth-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .method-btn {
          height: 52px;
          width: 100%;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 20px;
          border: none;
          cursor: pointer;
          outline: none;
          box-sizing: border-box;
          gap: 10px;
        }

        .method-btn-phone {
          background: rgba(201, 168, 76, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(201, 168, 76, 0.45);
          box-shadow: inset 0 1px 0 rgba(201, 168, 76, 0.2);
          color: #C9A84C;
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .method-btn-phone:hover {
          background: rgba(201, 168, 76, 0.25);
          border-color: rgba(201, 168, 76, 0.7);
        }

        .method-btn-email {
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: #ffffff;
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .method-btn-email:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .auth-close-btn {
          position: absolute;
          top: 32px;
          right: 32px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          z-index: 30;
          padding: 0;
          border-style: solid;
        }
        .auth-close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .auth-back-btn {
          position: absolute;
          top: 32px;
          left: 32px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          z-index: 30;
          padding: 0;
          border-style: solid;
        }
        .auth-back-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .auth-toggle-link {
          color: #C9A84C;
          font-weight: 500;
          margin-left: 4px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .auth-toggle-link:hover {
          color: #e5c158;
        }

        .spinner {
          border: 2.5px solid rgba(0, 0, 0, 0.15);
          border-top: 2.5px solid #000000;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => {
          if (currentStep !== "phone_name") {
            setShowAuthModal(false);
          }
        }}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      />

      {/* Glass card with entrance animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="auth-modal-card"
      >
        {/* Back arrow (left) */}
        {stepHistory.length > 1 && (
          <button
            onClick={navigateBack}
            className="auth-back-btn"
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}

        {/* Close button (right) */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="auth-close-btn"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto pr-1 mt-6 scrollbar-thin scrollbar-thumb-white/10">
          <AnimatePresence mode="wait" initial={false}>
            {/* STEP 1: Choose Method */}
            {currentStep === "method_choose" && (
              <motion.div
                key="step-choose"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full flex flex-col items-center"
              >
                {/* Logo */}
                <div
                  className="flex items-center justify-center w-16 h-16 rounded-full mb-5 overflow-hidden"
                  style={{
                    background: "rgba(201, 168, 76, 0.1)",
                    border: "1px solid rgba(201, 168, 76, 0.3)",
                    boxShadow: "0 0 20px rgba(201, 168, 76, 0.2)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
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

                {/* Brand Name */}
                <h2
                  className="text-white mb-2 text-center uppercase"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "22px",
                    letterSpacing: "0.15em",
                  }}
                >
                  Soundwave
                </h2>

                <p className="text-center mb-8" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 400, color: "rgba(255, 255, 255, 0.5)" }}>
                  {isSignUpMode ? "Create your account" : "Welcome back"}
                </p>

                {/* Buttons Stack */}
                <div className="flex flex-col gap-3 w-full mb-6">
                  <button
                    onClick={() => navigateTo("phone_entry")}
                    className="method-btn method-btn-phone"
                  >
                    <PhoneIcon />
                    <span className="font-medium text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Continue with Phone
                    </span>
                  </button>

                  <button
                    onClick={() => navigateTo(isSignUpMode ? "email_signup" : "email_login")}
                    className="method-btn method-btn-email"
                  >
                    <EmailIcon />
                    <span className="font-medium text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Continue with Email
                    </span>
                  </button>
                </div>

                {/* Footer Toggle */}
                <p className="text-center" style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                  {isSignUpMode ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={handleToggleMode}
                        className="auth-toggle-link"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      New to SOUNDWAVE?{" "}
                      <button
                        type="button"
                        onClick={handleToggleMode}
                        className="auth-toggle-link"
                      >
                        Create account
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            )}

            {/* STEP 2A: Phone Number Entry */}
            {currentStep === "phone_entry" && (
              <motion.div
                key="step-phone"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full flex flex-col pt-4"
              >
                <h3 className="text-white font-semibold mb-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: "18px" }}>
                  Your phone number
                </h3>
                <p className="mb-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(255, 255, 255, 0.5)" }}>
                  We&apos;ll send a verification code
                </p>

                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <div>
                    <div className="phone-input-container">
                      <div className="flex items-center justify-center bg-white/5 px-4 text-white/70 font-medium border-r border-white/10 select-none h-full" style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10), setPhone)}
                        placeholder="98765 43210"
                        disabled={isLoading}
                        maxLength={10}
                        inputMode="numeric"
                        className="flex-1 bg-transparent px-4 text-white text-sm focus:outline-none"
                        style={{ fontFamily: "'Inter', sans-serif", border: "none" }}
                      />
                    </div>
                    {renderError("phone")}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || phone.replace(/\D/g, "").length !== 10}
                    whileTap={!isLoading ? { scale: 0.97 } : undefined}
                    className="auth-btn-primary mt-2"
                  >
                    {isLoading ? <Spinner /> : "SEND OTP"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* STEP 3A: OTP Verification */}
            {currentStep === "phone_otp" && (
              <motion.div
                key="step-otp"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full flex flex-col pt-4"
              >
                <h3 className="text-white font-semibold mb-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: "18px" }}>
                  Enter verification code
                </h3>
                <p className="mb-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(255, 255, 255, 0.5)" }}>
                  Sent to +91 {phone.replace(/\D/g, "").substring(0, 3) + "******" + phone.replace(/\D/g, "").substring(phone.replace(/\D/g, "").length - 4)}
                </p>

                <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between gap-2 my-4">
                      {otpValues.map((val, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleOtpValueChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          disabled={isLoading}
                          className={`otp-box ${val ? "filled" : ""}`}
                        />
                      ))}
                    </div>
                    {renderError("otp")}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    whileTap={!isLoading ? { scale: 0.97 } : undefined}
                    className="auth-btn-primary"
                  >
                    {isLoading ? <Spinner /> : "VERIFY CODE"}
                  </motion.button>

                  <div className="text-center mt-2 select-none">
                    {countdown > 0 ? (
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                        Resend code in <span className="font-semibold text-white">{countdown}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="auth-toggle-link text-xs"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px" }}
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: Name Entry */}
            {currentStep === "phone_name" && (
              <motion.div
                key="step-name"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full flex flex-col pt-4"
              >
                <h3 className="text-white font-semibold mb-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: "18px" }}>
                  What&apos;s your name?
                </h3>
                <p className="mb-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(255, 255, 255, 0.5)" }}>
                  Just so we know what to call you
                </p>

                <form onSubmit={handleNamePromptSubmit} className="flex flex-col gap-4">
                  <div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value, setFullName)}
                      placeholder="Full Name"
                      disabled={isLoading}
                      required
                      className="auth-input"
                    />
                    {renderError("fullName")}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !fullName.trim()}
                    whileTap={!isLoading ? { scale: 0.97 } : undefined}
                    className="auth-btn-primary mt-2"
                  >
                    {isLoading ? <Spinner /> : "CONTINUE"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* STEP 2B: Email Login */}
            {currentStep === "email_login" && (
              <motion.div
                key="step-email-login"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full flex flex-col pt-4"
              >
                <h3 className="text-white font-semibold mb-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: "18px" }}>
                  Sign in with email
                </h3>

                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value, setEmail)}
                      placeholder="Email"
                      disabled={isLoading}
                      required
                      className="auth-input"
                    />
                    {renderError("email")}
                  </div>

                  <div>
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => handleInputChange("password", e.target.value, setPassword)}
                        placeholder="Password"
                        disabled={isLoading}
                        required
                        className="auth-input pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                    {renderError("password")}
                  </div>

                  {renderError("general")}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={!isLoading ? { scale: 0.97 } : undefined}
                    className="auth-btn-primary mt-2"
                  >
                    {isLoading ? <Spinner /> : "LOGIN WITH EMAIL"}
                  </motion.button>

                  <div className="flex flex-col gap-2.5 items-center mt-2">
                    <p className="text-center" style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => navigateTo("email_signup")}
                        className="auth-toggle-link"
                      >
                        Sign up
                      </button>
                    </p>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] transition-colors duration-200"
                      style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255, 255, 255, 0.4)", background: "none", border: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)"}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2B: Email Signup */}
            {currentStep === "email_signup" && (
              <motion.div
                key="step-email-signup"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full flex flex-col pt-4"
              >
                <h3 className="text-white font-semibold mb-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: "18px" }}>
                  Create your account
                </h3>

                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                  <div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value, setFullName)}
                      placeholder="Full Name"
                      disabled={isLoading}
                      required
                      className="auth-input"
                    />
                    {renderError("fullName")}
                  </div>

                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value, setEmail)}
                      placeholder="Email"
                      disabled={isLoading}
                      required
                      className="auth-input"
                    />
                    {renderError("email")}
                  </div>

                  <div>
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => handleInputChange("password", e.target.value, setPassword)}
                        placeholder="Password"
                        disabled={isLoading}
                        required
                        className="auth-input pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                    {renderError("password")}
                  </div>

                  <div>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value, setConfirmPassword)}
                        placeholder="Confirm Password"
                        disabled={isLoading}
                        required
                        className="auth-input pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                    {renderError("confirmPassword")}
                  </div>

                  {renderError("general")}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={!isLoading ? { scale: 0.97 } : undefined}
                    className="auth-btn-primary mt-2"
                  >
                    {isLoading ? <Spinner /> : "CREATE ACCOUNT"}
                  </motion.button>

                  <p className="text-center mt-2.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={navigateBack}
                      className="auth-toggle-link"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
