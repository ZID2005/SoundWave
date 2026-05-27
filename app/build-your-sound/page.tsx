"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { FaServer, FaVolumeUp, FaLayerGroup, FaCheckCircle, FaUpload } from "react-icons/fa";

type OrderType = "Amplifier" | "Speaker" | "Sound System" | null;
type TechType = string | null;
type TierType = "Essential" | "Premium" | "Reference" | null;
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
  { id: "Essential", price: "₹25K - ₹75K", features: ["Audiophile-grade components", "Standard finishes", "3-year warranty"] },
  { id: "Premium", price: "₹75K - ₹2L", features: ["Reference-grade components", "Premium wood finishes", "5-year warranty", "Custom tuning"] },
  { id: "Reference", price: "₹2L+", features: ["Cost-no-object components", "Exotic materials", "Lifetime support", "In-home acoustic calibration"] },
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
  const [buildName, setBuildName] = useState("");

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
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "customOrders"), {
        userId: user!.uid,
        userEmail: user!.email,
        type: formData.type,
        technology: formData.technology,
        tier: formData.tier,
        finish: formData.type === "Sound System" ? "N/A" : formData.finish,
        notes: formData.notes,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Order received! We'll contact you within 24 hours.");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to submit order. Please try again.");
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
      await addDoc(collection(db, "savedBuilds"), {
        userId: user.uid,
        name: name,
        type: formData.type,
        technology: formData.technology,
        tier: formData.tier,
        finish: formData.type === "Sound System" ? "N/A" : formData.finish,
        notes: formData.notes,
        createdAt: serverTimestamp(),
      });
      toast.success("Configuration saved to dashboard!");
      router.push("/dashboard");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      toast.success("File selected (Mocked for now)");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-32 flex flex-col items-center">
      <div className="container mx-auto px-6 max-w-4xl w-full">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest mb-4">Build Your Sound</h1>
          <p className="text-secondary tracking-widest uppercase">Custom Order Configurator</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-16">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                  step >= i ? "bg-primary text-background" : "bg-white/10 text-secondary"
                }`}
              >
                {step > i ? <FaCheckCircle /> : i}
              </div>
            ))}
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="relative min-h-[400px] bg-[#111111] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl glass-card overflow-hidden">
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
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 text-center">Step 1: Choose Equipment Type</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TYPE_OPTIONS.map((opt) => (
                      <div 
                        key={opt.id}
                        onClick={() => setFormData({ ...formData, type: opt.id as OrderType, technology: null })}
                        className={`cursor-pointer rounded-2xl p-8 text-center transition-all duration-300 border-2 ${
                          formData.type === opt.id 
                            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(212,168,83,0.2)]" 
                            : "border-white/5 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <opt.icon className={`text-5xl mx-auto mb-4 ${formData.type === opt.id ? "text-primary" : "text-white"}`} />
                        <h3 className="text-xl font-bold text-white mb-2">{opt.id}</h3>
                        <p className="text-secondary text-sm">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Choose Technology */}
              {step === 2 && formData.type && (
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 text-center">Step 2: Choose Technology</h2>
                  <p className="text-secondary text-center mb-8">Select the core architecture for your {formData.type.toLowerCase()}.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TECH_OPTIONS[formData.type].map((tech) => (
                      <div 
                        key={tech}
                        onClick={() => setFormData({ ...formData, technology: tech })}
                        className={`cursor-pointer rounded-xl p-6 text-center transition-all duration-300 border-2 ${
                          formData.technology === tech 
                            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(212,168,83,0.2)]" 
                            : "border-white/5 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <h3 className={`font-bold ${formData.technology === tech ? "text-primary" : "text-white"}`}>{tech}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Choose Tier */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 text-center">Step 3: Choose Tier</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TIER_OPTIONS.map((tier) => (
                      <div 
                        key={tier.id}
                        onClick={() => setFormData({ ...formData, tier: tier.id as TierType })}
                        className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 border-2 flex flex-col h-full ${
                          formData.tier === tier.id 
                            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(212,168,83,0.2)]" 
                            : "border-white/5 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">{tier.id}</h3>
                        <p className="text-primary font-bold mb-6">{tier.price}</p>
                        <ul className="space-y-3 mb-auto text-secondary text-sm">
                          {tier.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span> {feat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Choose Finish (Amp/Speaker only) */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 text-center">Step 4: Choose Finish</h2>
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
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 text-center">Step 5: Additional Details</h2>
                  
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
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-8 text-center">Step 6: Review Your Build</h2>
                  
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 mb-8">
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
            className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider transition-colors ${
              step === 1 || isSubmitting
                ? "opacity-0 cursor-default" 
                : "bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider transition-colors ${
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
                className="px-6 py-3 rounded-full font-bold uppercase tracking-wider border border-primary text-primary bg-transparent hover:bg-primary hover:text-background transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Config"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isSaving}
                className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider transition-all duration-300 ${
                  isSubmitting
                    ? "bg-primary/50 text-background/50 cursor-not-allowed"
                    : "bg-primary text-background hover:bg-[#b58c3c] hover:shadow-[0_0_20px_rgba(212,168,83,0.4)]"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
