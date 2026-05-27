"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import "../dashboard/dashboard.css";

interface UpcomingProduct {
  name: string;
  category: string;
  image: string;
  teaser: string;
  releaseDate: string;
  code: string;
}

// ==========================================
// ADMIN CONFIGURATION: UPCOMING PRODUCTS LIST
// ==========================================
// To add or update products, edit the array below.
// Fields to configure:
// 1. name: Display name of the product
// 2. category: "Amplifier", "Speaker", "Cable", or "Sound System"
// 3. image: Absolute path or Unsplash URL for the product showcase
// 4. teaser: Short description teaser (1-2 lines)
// 5. releaseDate: Release timestamp (YYYY-MM-DDTHH:mm:ss) for the countdown
// 6. code: Model number or identifier
// ==========================================
const upcomingProducts = [
  {
    name: "AURA-9 Floorstanding Speakers",
    category: "Speaker",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop",
    teaser: "Experience the next level of acoustic precision. Designed for pure High-Fidelity environments.",
    releaseDate: "2026-09-15T00:00:00",
    code: "# SW-AURA9"
  },
  {
    name: "CHRONOS Tube Amplifier",
    category: "Amplifier",
    image: "https://images.unsplash.com/photo-1618609378039-b572f64c5b42?q=80&w=800&auto=format&fit=crop",
    teaser: "Warm, analog harmonics meet modern power engineering. A masterpiece of thermal sound reproduction.",
    releaseDate: "2026-11-01T00:00:00",
    code: "# SW-CHRONOS"
  },
  {
    name: "VALKYRIE OCC Silver Cables",
    category: "Cable",
    image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=800&auto=format&fit=crop",
    teaser: "Zero resistance. Absolute transparency. Connect your components with pure silver conductors.",
    releaseDate: "2026-08-20T00:00:00",
    code: "# SW-VALKYRIE"
  },
  {
    name: "ODYSSEY Spatial Sound System",
    category: "Sound System",
    image: "https://images.unsplash.com/photo-1545016803-a63d59a721d1?q=80&w=800&auto=format&fit=crop",
    teaser: "True 3D spatial audio immersion. Complete 9.2.4 configuration with zero acoustic distortion.",
    releaseDate: "2026-12-25T00:00:00",
    code: "# SW-ODYSSEY"
  }
];


/* ── Pulsing Audio Soundwave Component ── */
const SoundwavePulse = () => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-12 my-6">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: [10, 35, 10],
          }}
          transition={{
            duration: 1.0 + (i % 5) * 0.25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
          style={{ height: 10 }}
        />
      ))}
    </div>
  );
};

/* ── ScrollReveal Component ── */
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-1000 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function NextWavePage() {
  const [activeImage, setActiveImage] = useState<number | null>(0);
  const [selectedProduct, setSelectedProduct] = useState<UpcomingProduct | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [contactInput, setContactInput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOpenNotify = (product: UpcomingProduct) => {
    setSelectedProduct(product);
    setShowPopup(true);
    setContactInput("");
    setIsSubmitted(false);
  };

  const handleSubmitNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim()) {
      toast.error("Please enter your email or phone number.");
      return;
    }
    setIsSubmitted(true);
    toast.success("Successfully registered for updates!");
  };

  return (
    <div className="min-h-screen bg-[#000000] pt-32 pb-32 text-foreground font-sans relative overflow-hidden">
      
      {/* Background radial highlights */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.08)_0%,transparent_70%)] blur-[80px] pointer-events-none z-0" />

      <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
        
        {/* Page Hero Section */}
        <ScrollReveal delay={100}>
          <div className="mb-16">
            <h1
              className="text-4xl md:text-5xl font-light text-white tracking-widest uppercase font-serif mb-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Next Wave
            </h1>
            <p className="text-zinc-300 text-sm md:text-base tracking-wide max-w-md mx-auto font-medium">
              Something powerful is coming. Stay ahead of the sound.
            </p>
            <SoundwavePulse />
          </div>
        </ScrollReveal>

        {/* Upcoming Products Accordion Showcase (HoverExpand_002 layout) */}
        <ScrollReveal delay={200}>
          <div className="flex w-full flex-col gap-3">
            {upcomingProducts.map((product, index) => {
              const isExpanded = activeImage === index;
              return (
                <motion.div
                  key={index}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300"
                  initial={{ height: "3.5rem", width: "100%" }}
                  animate={{
                    height: isExpanded ? "21rem" : "3.5rem",
                    backgroundColor: isExpanded ? "rgba(18, 18, 18, 0.65)" : "rgba(13, 13, 13, 0.45)",
                    borderColor: isExpanded ? "rgba(201, 168, 76, 0.35)" : "rgba(255, 255, 255, 0.04)",
                    boxShadow: isExpanded ? "0 10px 40px rgba(201, 168, 76, 0.12)" : "0 4px 15px rgba(0, 0, 0, 0.3)",
                  }}
                  style={{
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  onClick={() => setActiveImage(index)}
                  onHoverStart={() => setActiveImage(index)}
                >
                  {/* Header Row: Always visible */}
                  <div className="h-[3.5rem] flex items-center justify-between px-6 z-20 relative pointer-events-none border-b border-white/5">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-primary">{product.code}</span>
                      <h3
                        className="text-white font-serif text-sm md:text-base uppercase tracking-wider"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 text-[9px] font-semibold tracking-widest border border-primary/30 text-primary rounded-full uppercase">
                        {product.category}
                      </span>
                      {!isExpanded && (
                        <span className="text-[9px] text-zinc-400 tracking-widest uppercase hidden md:inline">
                          Click to expand
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content: Visible when expanded */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="absolute inset-0 flex flex-col md:flex-row gap-6 p-6 pt-20 z-10"
                      >
                        {/* Left Column: Image Area */}
                        <div className="relative w-full md:w-1/2 h-40 md:h-full rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-black/40">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          
                          {/* COMING SOON stamp overlay */}
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/90 border border-dashed border-primary text-primary font-black uppercase text-[10px] rounded tracking-widest shadow-xl rotate-[12deg] select-none text-glow-gold">
                            COMING SOON
                          </div>
                        </div>

                        {/* Right Column: Descriptions & Controls */}
                        <div className="flex flex-col justify-between flex-grow text-left">
                          <div className="space-y-3">
                            <span className="inline-block px-3 py-1 text-[9px] font-semibold tracking-wider border border-primary/20 text-primary bg-primary/5 rounded-full uppercase">
                              {product.category}
                            </span>
                            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-medium">
                              {product.teaser}
                            </p>
                          </div>
                          <div className="mt-4">
                            {/* Notify Trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNotify(product);
                              }}
                              className="w-full md:w-auto px-6 py-2.5 rounded-full border border-primary/50 text-primary text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-primary hover:text-background hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] active:scale-95"
                            >
                              Notify Me
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>

      {/* ── Notify Me Popup dialog modal ── */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-sm rounded-3xl p-8 border border-white/10 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.99) 100%)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
              }}
            >
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>

              {!isSubmitted ? (
                <form onSubmit={handleSubmitNotify} className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-light text-white font-serif uppercase tracking-widest text-glow-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      Be the first to know
                    </h3>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      Get notified when the <span className="text-primary font-bold text-glow-gold">{selectedProduct?.name}</span> launches.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      placeholder="Email or Phone Number"
                      className="w-full p-3.5 text-white text-xs focus:outline-none font-medium"
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderBottom: "2px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "12px",
                      }}
                    />
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-primary text-background font-bold text-xs uppercase tracking-wider hover:bg-[#b58c3c] hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] active:scale-95 transition-all duration-300"
                    >
                      Notify Me
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5 py-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary text-lg shadow-[0_0_20px_rgba(201,168,76,0.2)]">
                    ✓
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-light text-white font-serif uppercase tracking-widest text-glow-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      You&apos;re on the list!
                    </h3>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      You&apos;re on the list. We&apos;ll reach out when it drops.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="px-6 py-2 rounded-full border border-white/10 text-white hover:bg-white/5 transition-all text-[10px] uppercase tracking-wider text-glow-none"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
