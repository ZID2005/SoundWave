"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeadphones } from "react-icons/fa";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [isLoading, setIsLoading] = useState(false);
  
  // Track confirmation result
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const router = useRouter();

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch {}
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const getRecaptchaVerifier = (): RecaptchaVerifier => {
    // Always tear down the old one first to avoid "already rendered" errors
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = undefined;
    }

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        toast.error("reCAPTCHA expired. Please try again.");
      },
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    const formattedPhoneNumber = `+91${phoneNumber}`;

    try {
      const appVerifier = getRecaptchaVerifier();
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      confirmationResultRef.current = confirmationResult;
      toast.success("OTP sent successfully!");
      setStep("OTP");
    } catch (error: unknown) {
      console.error("Error sending OTP:", error);
      const err = error as { code?: string; message?: string };
      // Give a friendlier message for common errors
      if (err.code === "auth/invalid-phone-number") {
        toast.error("Invalid phone number format.");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please wait a moment and retry.");
      } else {
        toast.error(err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      if (!confirmationResultRef.current) throw new Error("No confirmation result available");
      
      await confirmationResultRef.current.confirm(otp);
      toast.success("Successfully logged in!");
      router.push("/");
    } catch (error: unknown) {
      console.error("Error verifying OTP:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-secondary/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="glass-card w-full max-w-md p-8 sm:p-12 rounded-3xl relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,168,83,0.3)]">
            <FaHeadphones className="text-2xl text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">SoundWave</h1>
        </div>

        <AnimatePresence mode="wait">
          {step === "PHONE" ? (
            <motion.div 
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-secondary text-sm">Enter your phone number to continue</p>
              </div>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
                  <div className="px-4 py-3 bg-white/5 border-r border-white/10 text-secondary font-medium select-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Phone number"
                    className="flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/30 w-full"
                    autoFocus
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading || phoneNumber.length < 10}
                  className="w-full py-3.5 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-[0_0_20px_rgba(212,168,83,0.2)] disabled:shadow-none"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="otp-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-2">Verify Phone</h2>
                <p className="text-secondary text-sm">
                  Enter the 6-digit code sent to <br/>
                  <span className="text-white font-medium">+91 {phoneNumber}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
                <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full bg-transparent px-4 py-3 text-center tracking-[0.5em] text-white outline-none placeholder:text-white/30 text-xl font-bold"
                    autoFocus
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3.5 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-[0_0_20px_rgba(212,168,83,0.2)] disabled:shadow-none"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>

                <button 
                  type="button"
                  onClick={() => setStep("PHONE")}
                  disabled={isLoading}
                  className="text-sm text-secondary hover:text-white transition-colors"
                >
                  Change phone number
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
