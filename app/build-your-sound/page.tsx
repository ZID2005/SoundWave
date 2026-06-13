"use client";


import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { FaServer, FaVolumeUp, FaLayerGroup, FaUpload, FaCrown, FaFilePdf, FaTimes, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import LampContainer from "@/components/LampContainer";
import emailjs from "@emailjs/browser";

type OrderType = "Amplifier" | "Speaker" | "Sound System" | null;
type TechType = string | null;
type TierType = "Essential" | "Premium" | "APEX" | null;
type FinishType = string | null;

interface FormData {
  type: OrderType;
  technology: TechType;
  tier: TierType;
  finish: FinishType;
  notes: string;
}

const TOTAL_STEPS = 6;

const TYPE_OPTIONS = [
  { id: "Amplifier", icon: FaServer, desc: "Power your passive speakers" },
  { id: "Speaker", icon: FaVolumeUp, desc: "High-fidelity transducers" },
  { id: "Sound System", icon: FaLayerGroup, desc: "Complete all-in-one solutions" },
];

const TECH_OPTIONS: Record<string, string[]> = {
  "Amplifier": ["Tube", "Solid State", "Hybrid", "Class D"],
  "Speaker": ["2-Way", "3-Way", "Full Range", "Planar Magnetic"],
  "Sound System": ["Stereo 2.0", "Surround 5.1", "Surround 7.1", "Custom Multi-Room"],
};

const TIER_OPTIONS = [
  {
    id: "Essential",
    price: "₹25,000 – ₹35,000",
    desc: "Entry level, quality sound",
    features: ["Audiophile-grade components", "Standard finishes", "3-year warranty"],
  },
  {
    id: "Premium",
    price: "₹75,000 – ₹2,00,000",
    desc: "High performance audio",
    features: ["APEX-grade components", "Premium wood finishes", "5-year warranty", "Custom tuning"],
  },
  {
    id: "APEX",
    price: "₹2,00,000+",
    desc: "The absolute pinnacle of sound engineering",
    features: ["Cost-no-object components", "Exotic materials", "Lifetime support", "In-home acoustic calibration"],
  },
];

const FINISH_OPTIONS = [
  { id: "Matte Black", color: "#1a1a1a" },
  { id: "Brushed Silver", color: "#e0e0e0" },
  { id: "Walnut Wood", color: "#5c4033" },
  { id: "Custom", color: "linear-gradient(45deg, #ff0000, #00ff00, #0000ff)" }, // Placeholder multi-color
];

export default function BuildYourSoundPage() {
  const router = useRouter();
  const { user, setShowAuthModal } = useAuth();
  const pendingAction = useRef<"submit" | "save" | null>(null);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [buildName, setBuildName] = useState("");
  const [showPdfSuccessDialog, setShowPdfSuccessDialog] = useState(false);
  const [downloadedBuildName, setDownloadedBuildName] = useState("");
  const [isFadingOutPage, setIsFadingOutPage] = useState(false);
  const [phase, setPhase] = useState<"intro" | "reveal">("intro");

  // Cinematic success experience states
  const [showCinematicSuccess, setShowCinematicSuccess] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [randomQuote, setRandomQuote] = useState("");
  const [countdown, setCountdown] = useState(8);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showCinematicSuccess) {
      setCountdown(8);
      
      // Auto redirect after 8 seconds
      redirectTimerRef.current = setTimeout(() => {
        setIsFadingOutPage(true);
        setTimeout(() => {
          router.push("/");
        }, 800);
      }, 8000);

      // Countdown progress update
      const startTime = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, 8 - elapsed);
        setCountdown(remaining);
        if (remaining <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }
      }, 30);
    }

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showCinematicSuccess, router]);

  const handleBackToHome = () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsFadingOutPage(true);
    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  // Cinematic intro: lamp fills screen, then collapses after 1.8s
  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 3500);
    return () => clearTimeout(t);
  }, []);

  const [formData, setFormData] = useState<FormData>({
    type: null,
    technology: null,
    tier: null,
    finish: null,
    notes: "",
  });

  // When user logs in, auto-retry pending action
  useEffect(() => {
    if (user && pendingAction.current) {
      if (pendingAction.current === "submit") {
        pendingAction.current = null;
        doSubmit();
      } else if (pendingAction.current === "save") {
        pendingAction.current = null;
        handleSaveConfig();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNext = () => {
    // Skip finish step if Sound System is selected
    if (step === 3 && formData.type === "Sound System") {
      setDirection(1);
      setStep(5);
      return;
    }
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    // Skip finish step if Sound System is selected
    if (step === 5 && formData.type === "Sound System") {
      setDirection(-1);
      setStep(3);
      return;
    }
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.type !== null;
      case 2: return formData.technology !== null;
      case 3: return formData.tier !== null;
      case 4: return formData.finish !== null;
      case 5: return true; // Optional notes
      case 6: return true;
      default: return false;
    }
  };

  const doSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    const priceRangeMap: Record<string, string> = {
      Essential: "₹25,000 – ₹35,000",
      Premium: "₹75,000 – ₹2,00,000",
      APEX: "₹2,00,000+",
    };
    const priceRange = formData.tier ? (priceRangeMap[formData.tier] || "N/A") : "N/A";
    const name = buildName.trim() || `Custom ${formData.type || "Build"}`;

    // 1. Save order to Firebase Firestore FIRST — always before notifications
    const savePromise = (async () => {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/custom-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          type: formData.type,
          technology: formData.technology,
          tier: formData.tier,
          finish: formData.type === "Sound System" ? "N/A" : formData.finish,
          notes: formData.notes,
          buildName: name,
          fileUrl: fileUrl,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit custom order.");
      }
      return response.json();
    })();

    // 2. Send admin email via EmailJS — Template 1 (Custom Build Admin)
    //    Sends to soundwave.sarga@gmail.com. No customer email sent — customer gets WhatsApp.
    const emailPromise = (async () => {
      try {
        const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
        const adminTemplateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || ""; // Template 1 — template_s2dh4cg
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

        if (!serviceID || !adminTemplateID || !publicKey) {
          console.log("EmailJS keys missing — skipping admin email notification.");
          setEmailSent(false);
          return;
        }

        // All fields use "N/A" fallback — never pass undefined to EmailJS
        const dateStr = new Date().toLocaleDateString("en-IN");
        const requirementsText =
          `Type: ${formData.type || "N/A"} | Technology: ${formData.technology || "N/A"}` +
          ` | Finish: ${formData.type === "Sound System" ? "N/A" : (formData.finish || "N/A")}` +
          ` | Notes: ${formData.notes || "None"}` +
          ` | Reference Image: ${fileUrl || "None"}`;

        const adminParams = {
          customer_name: user?.displayName || user?.email || "Guest User",
          customer_phone: user?.phoneNumber || "N/A",
          customer_email: user?.email || "Phone login",
          submitted_at: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          product_type: formData.type || "N/A",
          technology: formData.technology || "N/A",
          tier: formData.tier || "N/A",
          price_range: priceRange,
          color: (formData.type === "Sound System" ? "N/A" : formData.finish) || "N/A",
          special_notes: formData.notes || "None",
          reference_images: fileUrl || "None provided",
          // Template 1 subject/body variables — must be present
          date: dateStr,
          requirements: requirementsText,
          budget: priceRange,
          // WhatsApp reply link variable
          customer_phone_number: user?.phoneNumber || "",
          // Legacy fallback fields
          name: user?.displayName || user?.email || "Guest User",
          email: user?.email || "Phone login",
          phone: user?.phoneNumber || "N/A",
          to_email: "soundwave.sarga@gmail.com",
        };

        await emailjs.send(serviceID, adminTemplateID, adminParams, { publicKey });
        console.log("✅ Template 1 admin email sent (Custom Build)");
        setEmailSent(true);
      } catch (err) {
        console.error("❌ Admin email (Template 1) failed:", err);
        setEmailSent(false);
      }
    })();

    // 3. Send customer confirmation via WhatsApp (Twilio) — skip silently if no phone
    const whatsappPromise = (async () => {
      try {
        const response = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "custom_build",
            customerPhone: user?.phoneNumber || "",
            customerName: user?.displayName || user?.email || "Customer",
            buildDetails: {
              type: formData.type || "N/A",
              technology: formData.technology || "N/A",
              tier: formData.tier || "N/A",
              finish: (formData.type === "Sound System" ? "N/A" : formData.finish) || "N/A",
              notes: formData.notes || "None",
            },
          }),
        });

        if (!response.ok) throw new Error("Customer WhatsApp API failed");
        const resData = await response.json();
        setWhatsappSent(!!resData.whatsappSuccess);
      } catch (err) {
        // Never block user flow for notification failures
        console.error("Customer WhatsApp dispatch failed (non-blocking):", err);
        setWhatsappSent(false);
      }
    })();

    // Choose random quote
    const quotes = [
      "Sound is the vocabulary of nature.",
      "Music gives color to the air of the moment.",
      "Without music, life would be a mistake.",
      "The music is not in the notes, but in the silence between.",
      "One good thing about music — when it hits you, you feel no pain."
    ];
    const chosenQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setRandomQuote(chosenQuote);

    try {
      // Firestore save is critical and will throw on failure.
      // Email + WhatsApp run in parallel and fail gracefully (never throw).
      await Promise.all([savePromise, emailPromise, whatsappPromise]);

      // Successfully complete submission — trigger cinematic success screen
      setShowCinematicSuccess(true);
    } catch (err) {
      console.error("Custom order submission failed:", err);
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSaveConfig = async () => {
    if (!user) {
      pendingAction.current = "save";
      setShowAuthModal(true);
      return;
    }
    setIsSaving(true);
    try {
      const name = buildName.trim() || `Custom ${formData.type || "Build"}`;
      
      // Save configuration to Firestore with 1.5s timeout protection
      let buildId = "local-" + Math.random().toString(36).substring(2, 10);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/saved-builds", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            type: formData.type,
            technology: formData.technology,
            tier: formData.tier,
            finish: formData.type === "Sound System" ? "N/A" : formData.finish,
            notes: formData.notes,
            buildName: name,
            fileUrl: fileUrl,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save configuration.");
        }

        const data = await res.json();
        buildId = data.id;
        toast.success("Configuration saved to database!");
      } catch (err) {
        console.error("Firestore save failed:", err);
        toast.error("Database connection offline. Generating spec sheet locally...");
      }

      // Dynamic PDF Generation and Download
      try {
        const { pdf } = await import("@react-pdf/renderer");
        const { BuildSpecDocument } = await import("@/components/BuildSpecDocument");

        const dateString = new Date().toLocaleDateString("en-IN");
        
        const buildData = {
          id: buildId,
          name: name,
          type: formData.type || "Build",
          technology: formData.technology || "N/A",
          tier: formData.tier || "Essential",
          finish: formData.type === "Sound System" ? "N/A" : (formData.finish || "N/A"),
          notes: formData.notes,
        };

        const docBlob = await pdf(
          <BuildSpecDocument
            build={buildData}
            dateString={dateString}
            userEmail={user.email || "N/A"}
            userName={user.displayName || "Soundwave Enthusiast"}
          />
        ).toBlob();

        const url = URL.createObjectURL(docBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `SoundWave_Spec_${name.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setDownloadedBuildName(name);
        setShowPdfSuccessDialog(true);
        toast.success("Specification sheet PDF downloaded!");

        // Wait for user to read success screen before redirecting to dashboard
        setTimeout(() => {
          setShowPdfSuccessDialog(false);
          router.push("/dashboard");
        }, 3800);
      } catch (pdfError) {
        console.error("Error generating specification PDF:", pdfError);
        toast.error("Specs saved, but PDF export failed. Redirecting to dashboard...");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      // Not logged in — open auth modal; doSubmit will auto-run once user signs in
      pendingAction.current = "submit";
      setShowAuthModal(true);
      return;
    }
    doSubmit();
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      
      if (!user) {
        toast.error("Please login to upload reference files.");
        setFileName(null);
        return;
      }

      const toastId = toast.loading("Uploading reference image...");
      
      try {
        const idToken = await user.getIdToken();
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
          body: uploadFormData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setFileUrl(data.url);
          toast.success("Image uploaded successfully!", { id: toastId });
        } else {
          toast.error(data.error || "Failed to upload image.", { id: toastId });
          setFileName(null);
          setFileUrl(null);
        }
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Failed to upload image.", { id: toastId });
        setFileName(null);
        setFileUrl(null);
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #020617 0%, #070714 20%, #000000 100%)"
      }}
    >
      {/* Google Fonts: Cormorant Garamond + Outfit + Playfair Display */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800;900&display=swap');
        
        .glass-form-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 70px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(6, 182, 212, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.1);
        }
        .config-option-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .config-option-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
        .config-option-card.selected {
          border-color: #C9A84C;
          background: rgba(201, 168, 76, 0.08);
          box-shadow: 0 0 25px rgba(201, 168, 76, 0.18);
        }
        @keyframes tickerScrollLeftToRight {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes auroraGoldDrift {
          0% { transform: translate3d(-10vw, -10vh, 0) scale(1); }
          50% { transform: translate3d(10vw, 10vh, 0) scale(1.1); }
          100% { transform: translate3d(-10vw, -10vh, 0) scale(1); }
        }
        @keyframes auroraBlueDrift {
          0% { transform: translate3d(10vw, 10vh, 0) scale(1.1); }
          50% { transform: translate3d(-10vw, -10vh, 0) scale(0.9); }
          100% { transform: translate3d(10vw, 10vh, 0) scale(1.1); }
        }
        @keyframes auroraTealDrift {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) translate3d(5vw, 0, 0) rotate(0deg); }
          100% { transform: translate3d(0, 0, 0) rotate(360deg) translate3d(5vw, 0, 0) rotate(-360deg); }
        }
        .aurora-blob {
          will-change: transform;
        }
        .ticker-text {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
      `}} />

      {/* ── Cinematic Lamp Banner (collapses after intro) ─────────────────── */}
      <motion.div
        initial={{ height: "100vh" }}
        animate={{ height: phase === "intro" ? "100vh" : "200px" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="w-full flex-shrink-0 overflow-hidden"
        style={{ position: "relative", zIndex: 10 }}
      >
        <LampContainer>
          {/* Content fades out as lamp collapses */}
          <motion.div
            animate={{
              opacity: phase === "intro" ? 1 : 0,
              y: phase === "intro" ? 0 : -40,
              scale: phase === "intro" ? 1 : 0.85,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <motion.h1
              initial={{ opacity: 0.5, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700,
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                letterSpacing: "0.25em",
                color: "#C9A84C",
                textTransform: "uppercase",
                lineHeight: 1.1,
                marginBottom: "0.6rem",
                textAlign: "center",
              }}
            >
              Build Your Sound
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.8, ease: "easeInOut" }}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 400,
                fontSize: "0.72rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#67e8f9",
                textAlign: "center",
              }}
            >
              Custom Order Configurator
            </motion.p>
          </motion.div>
        </LampContainer>
      </motion.div>

      {/* ── Form content slides in after lamp collapses ───────────────────── */}
      <AnimatePresence>
        {phase === "reveal" && (
          <motion.div
            key="form-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center w-full pb-32 overflow-hidden"
          >
            {/* Background Tech Grid */}
            <div 
              className="absolute inset-0 pointer-events-none z-0 opacity-15"
              style={{
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }}
            />

            {/* Pill Nav Light Reflection (Cyan Beam) */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none z-0"
              style={{
                background: "radial-gradient(circle at top, rgba(6, 182, 212, 0.18) 0%, rgba(6, 182, 212, 0.03) 60%, transparent 100%)",
                filter: "blur(50px)",
              }}
            />

            {/* Brand Gold Accent Glow */}
            <div 
              className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[450px] h-[350px] rounded-full pointer-events-none z-0"
              style={{
                background: "radial-gradient(circle, rgba(201, 168, 76, 0.08) 0%, transparent 80%)",
                filter: "blur(60px)",
              }}
            />


            {/* Section heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
              className="text-center pt-10 pb-2 relative z-10"
            >
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  letterSpacing: "0.2em",
                  color: "#C9A84C",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                  marginBottom: "0.4rem",
                }}
              >
                Configure Your Build
              </h2>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 400,
                  fontSize: "0.68rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#67e8f9",
                }}
              >
                Step {step} of {TOTAL_STEPS}
              </p>
            </motion.div>

      <div className="container mx-auto px-6 max-w-4xl w-full pt-8 relative z-10">

        {/* Progress Bar */}
        <div className="mb-16">
          {/* Step circles with connecting line */}
          <div className="relative flex items-center justify-between mb-4">
            {/* Background track line */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "1rem",
                right: "1rem",
                height: "1px",
                background: "rgba(201,168,76,0.2)",
                transform: "translateY(-50%)",
                zIndex: 0,
              }}
            />
            {/* Gold filled progress line */}
            <motion.div
              style={{
                position: "absolute",
                top: "50%",
                left: "1rem",
                height: "1px",
                background: "#C9A84C",
                transform: "translateY(-50%)",
                zIndex: 0,
                transformOrigin: "left",
              }}
              initial={{ width: 0 }}
              animate={{ width: `calc(${((step - 1) / (TOTAL_STEPS - 1)) * 100}% * ((100% - 2rem) / 100%))` }}
              transition={{ duration: 0.35 }}
            />
            {[1, 2, 3, 4, 5, 6].map(i => {
              const isActive = i === step;
              const isCompleted = step > i;
              return (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.3s ease",
                    background: isActive
                      ? "#C9A84C"
                      : isCompleted
                      ? "transparent"
                      : "rgba(30,28,26,0.9)",
                    border: isActive
                      ? "2px solid #C9A84C"
                      : isCompleted
                      ? "2px solid #C9A84C"
                      : "1.5px solid rgba(201,168,76,0.35)",
                    boxShadow: isActive
                      ? "0 0 12px rgba(201,168,76,0.5)"
                      : "none",
                  }}
                >
                  {isCompleted ? (
                    /* Gold checkmark SVG */
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 6.5L5.5 9.5L10.5 3.5" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        color: isActive ? "#fff" : "rgba(201,168,76,0.55)",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {i}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="relative min-h-[400px] glass-form-card rounded-3xl p-8 md:p-12 overflow-hidden z-10">


          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", duration: 0.3 }}
              className="w-full"
            >
              
              {/* STEP 1: Choose Type */}
              {step === 1 && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 700,
                      fontSize: "1.65rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#D4AF6A",
                      textAlign: "center",
                      marginBottom: "2rem",
                    }}
                  >Step 1: Choose Equipment Type</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TYPE_OPTIONS.map((opt) => (
                      <div 
                        key={opt.id}
                        onClick={() => setFormData({ ...formData, type: opt.id as OrderType, technology: null })}
                        className={`cursor-pointer rounded-2xl p-8 text-center config-option-card ${
                          formData.type === opt.id ? "selected" : ""
                        }`}
                      >
                        <opt.icon className={`text-5xl mx-auto mb-4 ${formData.type === opt.id ? "text-primary" : "text-white"}`} />
                        <h3
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                            fontSize: "1.05rem",
                            color: formData.type === opt.id ? "#C9A84C" : "#fff",
                            marginBottom: "0.4rem",
                          }}
                        >{opt.id}</h3>
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 300,
                            fontSize: "0.82rem",
                            color: "#8A8A96",
                          }}
                        >{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Choose Technology */}
              {step === 2 && formData.type && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 700,
                      fontSize: "1.65rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#D4AF6A",
                      textAlign: "center",
                      marginBottom: "2rem",
                    }}
                  >Step 2: Choose Technology</h2>
                  <p className="text-secondary text-center mb-8">Select the core architecture for your {formData.type.toLowerCase()}.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TECH_OPTIONS[formData.type].map((tech) => (
                      <div 
                        key={tech}
                        onClick={() => setFormData({ ...formData, technology: tech })}
                        className={`cursor-pointer rounded-xl p-6 text-center config-option-card ${
                          formData.technology === tech ? "selected" : ""
                        }`}
                      >
                        <h3
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                            color: formData.technology === tech ? "#C9A84C" : "#fff",
                          }}
                        >{tech}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Choose Tier */}
              {step === 3 && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 700,
                      fontSize: "1.65rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#D4AF6A",
                      textAlign: "center",
                      marginBottom: "2rem",
                    }}
                  >Step 3: Choose Your Tier</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TIER_OPTIONS.map((tier) => {
                      const isSelected = formData.tier === tier.id;
                      const isApex = tier.id === "APEX";
                      const isPremium = tier.id === "Premium";

                      const borderColor = isSelected
                        ? isApex ? "#FFD700" : isPremium ? "#C9A84C" : "#C0C0C0"
                        : isApex ? "rgba(255,215,0,0.3)" : isPremium ? "rgba(201,168,76,0.3)" : "rgba(192,192,192,0.2)";

                      const bgColor = isSelected
                        ? isApex ? "rgba(255,215,0,0.07)" : isPremium ? "rgba(201,168,76,0.08)" : "rgba(192,192,192,0.06)"
                        : "rgba(255,255,255,0.03)";

                      const shadow = isSelected
                        ? isApex
                          ? "0 0 30px rgba(255,215,0,0.35), 0 0 60px rgba(255,215,0,0.12)"
                          : isPremium
                          ? "0 0 20px rgba(201,168,76,0.25)"
                          : "0 0 15px rgba(192,192,192,0.12)"
                        : "none";

                      const accentColor = isApex ? "#FFD700" : isPremium ? "#C9A84C" : "#C0C0C0";

                      return (
                        <div
                          key={tier.id}
                          onClick={() => setFormData({ ...formData, tier: tier.id as TierType })}
                          className="cursor-pointer rounded-2xl p-6 flex flex-col h-full relative overflow-hidden transition-all duration-300"
                          style={{
                            border: `2px solid ${borderColor}`,
                            background: bgColor,
                            boxShadow: shadow,
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                          }}
                        >
                          {/* APEX shimmer overlay when selected */}
                          {isApex && isSelected && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "hidden",
                                borderRadius: "inherit",
                                pointerEvents: "none",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "60%",
                                  height: "100%",
                                  background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.18), transparent)",
                                  animation: "apexShimmerMove 2.5s ease-in-out infinite",
                                }}
                              />
                            </div>
                          )}

                          {/* APEX: PINNACLE TIER badge + crown */}
                          {isApex && (
                            <div className="flex items-center justify-between mb-3">
                              <span
                                style={{
                                  background: "linear-gradient(90deg, #C9A84C, #FFD700)",
                                  color: "#000",
                                  fontSize: "0.52rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.18em",
                                  textTransform: "uppercase",
                                  padding: "0.2rem 0.7rem",
                                  borderRadius: "999px",
                                  display: "inline-block",
                                }}
                              >
                                PINNACLE TIER
                              </span>
                              <FaCrown style={{ color: "#FFD700", fontSize: "1.1rem" }} />
                            </div>
                          )}

                          <h3
                            className="text-xl font-bold uppercase tracking-widest mb-1"
                            style={{ color: accentColor }}
                          >
                            {tier.id}
                          </h3>
                          <p className="font-bold text-sm mb-1" style={{ color: accentColor }}>
                            {tier.price}
                          </p>
                          <p className="text-secondary text-xs mb-5 italic">{tier.desc}</p>

                          <ul className="space-y-3 mb-auto text-secondary text-sm">
                            {tier.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span style={{ color: accentColor }} className="mt-1 flex-shrink-0">•</span>
                                {feat}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                  {/* Shimmer keyframe for APEX card */}
                  <style>{`
                    @keyframes apexShimmerMove {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(280%); }
                    }
                  `}</style>
                </div>
              )}

              {/* STEP 4: Choose Finish (Amp/Speaker only) */}
              {step === 4 && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 700,
                      fontSize: "1.65rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#D4AF6A",
                      textAlign: "center",
                      marginBottom: "2rem",
                    }}
                  >Step 4: Choose Finish</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    {FINISH_OPTIONS.map((finish) => (
                      <div 
                        key={finish.id}
                        onClick={() => setFormData({ ...formData, finish: finish.id })}
                        className={`cursor-pointer flex flex-col items-center gap-4 transition-all duration-300 ${
                          formData.finish === finish.id ? "scale-110" : "hover:scale-105"
                        }`}
                      >
                        <div 
                          className={`w-24 h-24 rounded-full border-4 shadow-xl ${
                            formData.finish === finish.id ? "border-primary shadow-primary/20" : "border-white/10"
                          }`}
                          style={{ background: finish.color }}
                        />
                        <span className={`font-bold text-sm uppercase tracking-wider ${
                          formData.finish === finish.id ? "text-primary" : "text-white"
                        }`}>{finish.id}</span>
                      </div>
                    ))}
                  </div>

                  {formData.finish && (
                    <div className="bg-black/50 rounded-xl p-8 border border-white/5 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-secondary text-sm uppercase tracking-widest mb-4">Preview</p>
                        <div 
                          className="w-48 h-32 rounded-lg shadow-2xl mx-auto border border-white/10"
                          style={{ background: FINISH_OPTIONS.find(f => f.id === formData.finish)?.color }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Additional Notes */}
              {step === 5 && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 700,
                      fontSize: "1.65rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#D4AF6A",
                      textAlign: "center",
                      marginBottom: "2rem",
                    }}
                  >Step 5: Additional Details</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-bold uppercase tracking-wider text-sm mb-2">Special Requirements (Optional)</label>
                      <textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors min-h-[150px]"
                        placeholder="Tell us about your listening room, specific dimensions, or any unique acoustic challenges..."
                      />
                    </div>

                    <div>
                      <label className="block text-white font-bold uppercase tracking-wider text-sm mb-2">Reference Images (Optional)</label>
                      <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-primary/50 transition-colors text-center cursor-pointer bg-white/5">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                        <FaUpload className="text-3xl text-secondary mx-auto mb-4" />
                        {fileName ? (
                          <p className="text-primary font-bold">{fileName}</p>
                        ) : (
                          <p className="text-secondary">Click or drag images of your room/setup</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Review */}
              {step === 6 && (
                <div>
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 700,
                      fontSize: "1.65rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#D4AF6A",
                      textAlign: "center",
                      marginBottom: "2rem",
                    }}
                  >Step 6: Review Your Build</h2>
                  
                  <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-8 space-y-6 mb-8">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-secondary uppercase tracking-widest text-sm">Type</span>
                      <span className="text-white font-bold text-lg">{formData.type}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-secondary uppercase tracking-widest text-sm">Technology</span>
                      <span className="text-white font-bold text-lg">{formData.technology}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-secondary uppercase tracking-widest text-sm">Tier</span>
                      <span className="text-primary font-bold text-lg">{formData.tier}</span>
                    </div>
                    {formData.type !== "Sound System" && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-secondary uppercase tracking-widest text-sm">Finish</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-bold text-lg">{formData.finish}</span>
                          <div 
                            className="w-6 h-6 rounded-full border border-white/20"
                            style={{ background: FINISH_OPTIONS.find(f => f.id === formData.finish)?.color }}
                          />
                        </div>
                      </div>
                    )}
                    {formData.notes && (
                      <div className="pt-2">
                        <span className="text-secondary uppercase tracking-widest text-sm block mb-2">Notes</span>
                        <p className="text-white/80 bg-black/50 p-4 rounded-xl text-sm leading-relaxed">{formData.notes}</p>
                      </div>
                    )}
                    <div className="pt-4 border-t border-white/5 mt-4">
                      <label className="block text-secondary uppercase tracking-widest text-xs mb-2">Configuration Name</label>
                      <input
                        type="text"
                        value={buildName}
                        onChange={(e) => setBuildName(e.target.value)}
                        placeholder="e.g. My Custom Tube Amp"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    </div>
                  </div>

                  <p className="text-secondary text-xs text-center mb-3" style={{ color: "#A8A8A8", letterSpacing: "0.02em" }}>
                    Based on your selected tier — Essential: ₹25,000–₹35,000 / Premium: ₹75,000–₹2,00,000 / Apex: ₹2,00,000+. Final pricing will be confirmed by our team.
                  </p>
                  <p className="text-secondary text-sm text-center mb-8">
                    Upon submission, our master engineers will review your configuration and contact you to finalize the design.
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontSize: "0.78rem",
              opacity: step === 1 || isSubmitting ? 0 : 1,
              cursor: step === 1 || isSubmitting ? "default" : "pointer",
              pointerEvents: step === 1 || isSubmitting ? "none" : "auto",
            }}
            className="px-8 py-3 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
              }}
              className={`px-8 py-3 rounded-full transition-colors ${
                isStepValid()
                  ? "bg-primary text-background hover:bg-[#b58c3c]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              Next Step
            </button>
          ) : (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSaveConfig}
                disabled={isSubmitting || isSaving}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontSize: "0.78rem",
                }}
                className="px-6 py-3 rounded-full border border-primary text-primary bg-transparent hover:bg-primary hover:text-background transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Config"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isSaving}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontSize: "0.78rem",
                }}
                className={`px-8 py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-primary/50 text-background/50 cursor-not-allowed"
                    : "bg-primary text-background hover:bg-[#b58c3c] hover:shadow-[0_0_20px_rgba(212,168,83,0.4)]"
                }`}
              >
                {isSubmitting && (
                  <svg className="animate-spin h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isSubmitting ? "Sending..." : "Submit Order"}</span>
              </button>
            </div>
          )}
        </div>

      </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Full screen cinematic success experience */}
      <AnimatePresence>
        {showCinematicSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000000] overflow-hidden p-4"
            style={{ willChange: "opacity" }}
          >
            {/* Aurora background — GPU-promoted blobs */}
            <div
              className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
              style={{ filter: "blur(60px)", WebkitFilter: "blur(60px)" }}
            >
              <div
                className="absolute w-[80vw] h-[80vw] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(201, 168, 76, 0.12) 0%, transparent 70%)",
                  top: "-10vh", left: "-10vw",
                  transform: "translate3d(0,0,0)",
                  willChange: "transform",
                  animation: "auroraGoldDrift 25s infinite ease-in-out"
                }}
              />
              <div
                className="absolute w-[80vw] h-[80vw] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(30, 60, 120, 0.1) 0%, transparent 70%)",
                  bottom: "-10vh", right: "-10vw",
                  transform: "translate3d(0,0,0)",
                  willChange: "transform",
                  animation: "auroraBlueDrift 25s infinite ease-in-out"
                }}
              />
              <div
                className="absolute w-[80vw] h-[80vw] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(0, 161, 179, 0.06) 0%, transparent 70%)",
                  top: "20vh", left: "20vw",
                  transform: "translate3d(0,0,0)",
                  willChange: "transform",
                  animation: "auroraTealDrift 25s infinite ease-in-out"
                }}
              />
            </div>

            {/* Center glassmorphic card */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-[520px] rounded-[28px] border p-12 flex flex-col items-center justify-center"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                borderColor: "rgba(255, 255, 255, 0.15)",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 24px 70px rgba(0, 0, 0, 0.7)",
                willChange: "transform, opacity",
              }}
            >
              {/* Animated checkmark */}
              <div className="flex justify-center mb-6">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
                  <motion.circle
                    cx="50" cy="50" r="40"
                    stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, delay: 0.55, ease: "easeInOut" }}
                    style={{ willChange: "stroke-dashoffset" }}
                  />
                  <motion.path
                    d="M35 52 L47 64 L65 38"
                    stroke="#C9A84C" strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 1.25, ease: "easeOut" }}
                    style={{ willChange: "stroke-dashoffset" }}
                  />
                </svg>
              </div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "32px",
                  color: "#ffffff",
                  letterSpacing: "0.08em",
                  textAlign: "center",
                  fontWeight: 600,
                  marginBottom: "16px",
                  lineHeight: 1.2,
                  willChange: "transform, opacity",
                }}
              >
                Your Build Has Been Submitted
              </motion.h2>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.7,
                  textAlign: "center",
                  marginBottom: "28px",
                  willChange: "opacity",
                }}
              >
                Our engineers will review your configuration and reach out to you within 24 hours to confirm pricing and next steps.
              </motion.p>

              {/* Status pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
                className="flex flex-wrap gap-3 justify-center items-center mb-8"
                style={{ willChange: "opacity" }}
              >
                {whatsappSent && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.25)" }}
                  >
                    <FaWhatsapp className="text-[#25D366] text-sm" />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#86868b", fontWeight: 500 }}>
                      WhatsApp notification sent
                    </span>
                  </div>
                )}
                {emailSent && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: "rgba(201, 168, 76, 0.1)", border: "1px solid rgba(201, 168, 76, 0.25)" }}
                  >
                    <FaEnvelope className="text-[#C9A84C] text-sm" />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#86868b", fontWeight: 500 }}>
                      Email confirmation sent
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Thin gold divider */}
              <div className="w-full flex justify-center mb-6">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.45, delay: 1.1, ease: "easeInOut" }}
                  style={{
                    height: "1px",
                    background: "linear-gradient(to right, transparent, #C9A84C 20%, #C9A84C 80%, transparent)",
                    width: "100%",
                    maxWidth: "360px",
                    transformOrigin: "left",
                    willChange: "transform",
                  }}
                />
              </div>

              {/* Quote */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "18px",
                  color: "rgba(255, 255, 255, 0.4)",
                  textAlign: "center",
                  marginBottom: "36px",
                  lineHeight: 1.5,
                  maxWidth: "400px",
                  willChange: "opacity",
                }}
              >
                &ldquo;{randomQuote}&rdquo;
              </motion.p>

              {/* BACK TO HOME button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3, ease: "easeOut" }}
                onClick={handleBackToHome}
                style={{
                  borderRadius: "980px",
                  backgroundColor: "#C9A84C",
                  color: "#000000",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "16px 40px",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 14px rgba(201, 168, 76, 0.3)",
                  willChange: "opacity",
                }}
                className="hover:scale-[1.03] active:scale-[0.98]"
              >
                Back to Home
              </motion.button>
            </motion.div>

            {/* Scrolling audio quote ticker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="w-full mt-12 relative overflow-hidden flex justify-center"
              style={{
                maxWidth: "600px",
                maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                willChange: "opacity",
              }}
            >
              <div className="whitespace-nowrap py-2 select-none pointer-events-none" style={{ width: "100%", overflow: "hidden" }}>
                <div
                  className="inline-flex gap-8 ticker-text"
                  style={{ animation: "tickerScrollLeftToRight 30s linear infinite", display: "inline-flex", willChange: "transform" }}
                >
                  <span>ENGINEERED FOR THOSE WHO HEAR MORE</span>
                  <span>◆</span>
                  <span>PURE SOUND. ZERO COMPROMISE.</span>
                  <span>◆</span>
                  <span>CUSTOM BUILT. PERSONALLY YOURS.</span>
                  <span>◆</span>
                  <span>APEX TIER AUDIO ENGINEERING</span>
                  <span>◆</span>
                  <span>YOUR SOUND. YOUR RULES.</span>
                  <span>◆</span>
                  {/* Loop elements */}
                  <span>ENGINEERED FOR THOSE WHO HEAR MORE</span>
                  <span>◆</span>
                  <span>PURE SOUND. ZERO COMPROMISE.</span>
                  <span>◆</span>
                  <span>CUSTOM BUILT. PERSONALLY YOURS.</span>
                  <span>◆</span>
                  <span>APEX TIER AUDIO ENGINEERING</span>
                  <span>◆</span>
                  <span>YOUR SOUND. YOUR RULES.</span>
                  <span>◆</span>
                </div>
              </div>
            </motion.div>

            {/* Subtle countdown bar indicator */}
            <div
              className="absolute bottom-0 left-0 h-1 bg-[#C9A84C]"
              style={{ width: `${(countdown / 8) * 100}%`, transition: "width 30ms linear", willChange: "width" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Download Success Dialog Modal */}
      <AnimatePresence>
        {showPdfSuccessDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPdfSuccessDialog(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md rounded-3xl p-8 border border-white/10 text-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(20, 20, 25, 0.55) 0%, rgba(10, 10, 12, 0.65) 100%)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Gold light glow at top */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full pointer-events-none z-0 animate-pulse"
                style={{
                  background: "radial-gradient(circle, rgba(201, 168, 76, 0.15) 0%, transparent 80%)",
                  filter: "blur(20px)",
                  animationDuration: "4s",
                }}
              />

              <button
                onClick={() => setShowPdfSuccessDialog(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
              >
                <FaTimes />
              </button>

              <div className="relative z-10 flex flex-col items-center">
                {/* PDF Icon with animated ring */}
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-primary/20 bg-primary/5 mb-6">
                  <div className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-25" style={{ animationDuration: '2s' }} />
                  <FaFilePdf className="text-3xl text-primary text-glow-gold" />
                </div>

                <h3 
                  className="text-2xl font-light text-white font-serif uppercase tracking-widest mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#C9A84C" }}
                >
                  Configuration Saved
                </h3>
                
                <p className="text-white text-xs uppercase tracking-widest font-semibold mb-4">
                  {downloadedBuildName}
                </p>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  Your custom build has been saved to your dashboard. The specification sheet has also been generated and downloaded.
                </p>

                <button
                  onClick={() => setShowPdfSuccessDialog(false)}
                  className="px-8 py-2.5 rounded-full bg-primary text-background font-bold text-xs uppercase tracking-wider hover:bg-[#b58c3c] hover:shadow-[0_0_15px_rgba(201,168,76,0.35)] transition-all duration-300 text-glow-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-screen page fade transition overlay */}
      <AnimatePresence>
        {isFadingOutPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-background pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
