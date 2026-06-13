"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, Variants, useScroll, useTransform, useInView } from "framer-motion";
import { FaCamera } from "react-icons/fa";
import { Outfit } from "next/font/google";
import ContactPopup from "@/components/ContactPopup";
import dynamic from "next/dynamic";

// Dynamic import with ssr:false prevents the WebGL Canvas from running during
// server-side rendering / hydration, which caused the black screen on first load.
const Beams = dynamic(() => import("@/components/Beams"), { ssr: false });

// Load Outfit font for body text
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// Animation variants
const textVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" }
  }
};

// Reusable elegant image placeholder
function ImagePlaceholder({ className = "", label = "Image — Admin to upload", height = "h-96", src = "" }: { className?: string; label?: string; height?: string; src?: string }) {
  return (
    <div 
      className={`relative overflow-hidden w-full ${height} flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-[#141414] to-neutral-950 border border-neutral-800/80 rounded-2xl group-hover:border-[#C9A84C]/30 transition-colors duration-700 ${className}`}
    >
      {src ? (
        <>
          <img 
            src={src} 
            alt={label} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </>
      ) : (
        <>
          {/* Decorative ambient grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Faint gold ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#C9A84C]/3 blur-[60px]" />
          
          {/* Code Comment: Image Slot for Admin */}
          {/* image-placeholder-slot: {label} */}
          
          <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
            <FaCamera className="w-8 h-8 text-[#C9A84C]/60 animate-pulse" />
            <span className="text-[0.65rem] tracking-[0.25em] font-semibold text-[#C9A84C] uppercase">
              {label}
            </span>
            <span className={`text-[0.55rem] tracking-[0.1em] text-neutral-500 uppercase ${outfit.className}`}>
              Image — Admin to upload
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// Reusable scroll-triggered counter
function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const startValue = 0;
      const endValue = value;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Custom smooth ease-out counting
        const easeOutQuad = (t: number) => t * (2 - t);
        const easedProgress = easeOutQuad(progress);
        
        setCount(Math.floor(easedProgress * (endValue - startValue) + startValue));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export default function AboutClient() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Parallax Scroll Hooks for Hero Section
  const { scrollY } = useScroll();
  const heroBgScale = useTransform(scrollY, [0, 800], [1.1, 0.95]);
  const heroBgOpacity = useTransform(scrollY, [0, 800], [1, 0.15]);
  const heroBgY = useTransform(scrollY, [0, 800], [0, 150]);
  const beamsOpacity = useTransform(scrollY, [0, 1000], [1.0, 0.4]);

  // Timeline Refs for Section 5
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInView = useInView(timelineRef, { once: true, margin: "-120px" });

  const timelineSteps = [
    {
      num: "01",
      title: "CONSULT",
      desc: "You share your space, acoustics, needs, and aesthetic vision."
    },
    {
      num: "02",
      title: "DESIGN",
      desc: "We engineer and model your perfect custom sound system."
    },
    {
      num: "03",
      title: "BUILD",
      desc: "Handcrafted with premium materials and rigorously quality tested."
    },
    {
      num: "04",
      title: "DELIVER",
      desc: "Carefully installed, calibrated, and tuned on-site at your location."
    }
  ];

  const categories = [
    {
      label: "Amplifiers",
      tag: "PURE POWER",
      desc: "Reference-grade Class-A designs built for maximum clarity, low distortion, and absolute sonic purity.",
      image: "/images/products/mid-base-21-amp-front.jpg"
    },
    {
      label: "Speakers",
      tag: "NATURAL ACOUSTICS",
      desc: "Handcrafted high-end enclosures calibrated to bring live-performance richness and texture into your room.",
      image: "/images/products/yamaha-3inch-bookshelf-front.jpg"
    },
    {
      label: "Sound Systems",
      tag: "BESPOKE ENVIRONMENT",
      desc: "Fully integrated home cinema setups and structural audio engineered specifically for your acoustics.",
      image: "/images/products/combo-pack.jpg"
    }
  ];

  return (
    <div className="w-full bg-[#000000] text-[#F5F5F5] min-h-screen overflow-hidden flex flex-col relative">
      
      {/* Full-page beams — fixed to viewport, scrolls behind all content */}
      <motion.div
        style={{ opacity: beamsOpacity }}
        className="fixed inset-0 pointer-events-none z-[1]"
      >
        <Beams
          beamNumber={14}
          beamWidth={0.85}
          beamHeight={28}
          lightColor="#C9A84C"
          speed={0.5}
          noiseIntensity={0.65}
          scale={0.15}
          rotation={30}
        />
      </motion.div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col w-full">
        
        {/* ─── SECTION 1: HERO ─────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative h-screen w-full flex flex-col justify-center items-center px-6 overflow-hidden">
          {/* Parallax Background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <motion.div
              style={{ scale: heroBgScale, opacity: heroBgOpacity, y: heroBgY }}
              className="w-full h-full relative"
            />
          </div>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center text-center max-w-4xl px-4">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-[0.7rem] tracking-[0.4em] font-semibold text-[#C9A84C] uppercase mb-6"
          >
            OUR STORY
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extralight text-white tracking-[0.18em] uppercase leading-tight"
          >
            CRAFTED FOR THOSE<br />WHO HEAR MORE
          </motion.h1>

          {/* Underline animates left-to-right on page load */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0.5 }}
            className="h-[1px] bg-[#C9A84C] mt-10 w-24 opacity-80"
          />
        </div>

        {/* Subtle bottom fade-out transition gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#000000] to-transparent pointer-events-none z-20" />
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 2: WHO WE ARE ───────────────────────────────────────── */}
      <section className="py-32 px-6 container mx-auto max-w-7xl relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Portrait image placeholder, slides in left */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group"
          >
            {/* image-placeholder-slot: Portrait layout - Speaker/Amplifier Setup */}
            <ImagePlaceholder height="h-[550px]" label="WHO WE ARE — SPEAKER/AMPLIFIER" src="/images/products/combo-pack.jpg" />
          </motion.div>

          {/* Right Column: Text content, fades in from right */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <span className="text-[0.65rem] tracking-[0.3em] font-semibold text-[#C9A84C] uppercase block">
                OUR IDENTITY
              </span>
              <h2 
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                className="text-4xl md:text-5xl font-light text-white tracking-wide uppercase leading-tight"
              >
                WHO WE ARE
              </h2>
            </div>
            
            <div className="w-12 h-[1px] bg-[#C9A84C]/80" />
            
            <div className={`space-y-6 text-neutral-400 leading-relaxed text-sm md:text-base ${outfit.className}`}>
              <p>
                SOUNDWAVE is a premium audio equipment brand built on one belief — that sound is an experience, not just a function.
              </p>
              <p>
                From custom amplifiers to complete home theater systems, every product we build is engineered with precision, passion, and purpose. We focus on materials that maximize acoustic honesty, leaving music exactly as the artists intended.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 3: OUR PHILOSOPHY ────────────────────────────────────── */}
      <section className="relative py-36 overflow-hidden bg-black/40">
        {/* Faint gold pulsing soundwave background */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
          <motion.svg
            className="w-full max-w-5xl h-64 text-[#C9A84C]/[0.03]"
            viewBox="0 0 800 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ 
              opacity: [0.3, 0.7, 0.3],
              scaleY: [0.95, 1.05, 0.95]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {/* Multi-layered smooth wave paths */}
            <path d="M10 100 C 150 15, 250 185, 400 100 C 550 15, 650 185, 790 100" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 100 C 100 40, 300 160, 400 100 C 500 40, 700 160, 790 100" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
            <path d="M10 100 C 180 5, 220 195, 400 100 C 580 5, 620 195, 790 100" stroke="currentColor" strokeWidth="0.5" />
          </motion.svg>
        </div>

        {/* Philosophy Content - Fades/scales up on scroll */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto text-center space-y-8 px-6"
        >
          {/* Small gold dash above */}
          <div className="w-8 h-[1px] bg-[#C9A84C] mx-auto" />
          
          <blockquote 
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            className="text-2xl sm:text-4xl lg:text-5xl font-light italic text-white leading-relaxed tracking-wide px-4"
          >
            &ldquo;We don&apos;t just build audio equipment.<br className="hidden md:inline" /> We engineer the way you experience sound.&rdquo;
          </blockquote>
          
          {/* Small gold dash below */}
          <div className="w-8 h-[1px] bg-[#C9A84C] mx-auto" />
        </motion.div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 4: WHAT WE OFFER ────────────────────────────────────── */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="space-y-16">
          {/* Heading - Left aligned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-3"
          >
            <span className="text-[0.65rem] tracking-[0.3em] font-semibold text-[#C9A84C] uppercase block">
              OUR SPECIALTIES
            </span>
            <h2 
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-3xl md:text-5xl font-light text-white tracking-wide uppercase"
            >
              WHAT WE BUILD
            </h2>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                className="group cursor-pointer"
              >
                {/* Gold border appears on hover */}
                <div className="h-full flex flex-col p-5 bg-[#141414] border border-neutral-900 rounded-2xl transition-all duration-500 hover:border-[#C9A84C]/40 hover:shadow-[0_12px_40px_rgba(201,168,76,0.06)]">
                  
                  {/* Image container: zooms on hover */}
                  <div className="overflow-hidden rounded-xl mb-6 relative">
                    <div className="transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                      {/* image-placeholder-slot: Card image - {cat.label} */}
                      <ImagePlaceholder height="h-60" label={`${cat.label} — placeholder`} src={cat.image} />
                    </div>
                  </div>
                  
                  {/* Label lifts up on hover */}
                  <div className="mt-auto space-y-3 transition-transform duration-500 group-hover:-translate-y-1">
                    <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#C9A84C] uppercase block">
                      {cat.tag}
                    </span>
                    <h3 
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      className="text-2xl font-light text-white tracking-wide uppercase transition-colors duration-300 group-hover:text-[#C9A84C]"
                    >
                      {cat.label}
                    </h3>
                    <p className={`text-xs text-neutral-400 leading-relaxed ${outfit.className}`}>
                      {cat.desc}
                    </p>
                  </div>

                  {/* Thin gold bottom marker on hover */}
                  <div className="w-0 group-hover:w-12 h-[1px] bg-[#C9A84C] mt-6 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 5: OUR PROCESS ──────────────────────────────────────── */}
      <section ref={timelineRef} className="py-32 px-6 container mx-auto max-w-7xl relative">
        <div className="space-y-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-3 text-center md:text-left"
          >
            <span className="text-[0.65rem] tracking-[0.3em] font-semibold text-[#C9A84C] uppercase block">
              WORKFLOW
            </span>
            <h2 
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-3xl md:text-5xl font-light text-white tracking-wide uppercase"
            >
              HOW WE WORK
            </h2>
          </motion.div>

          {/* Timeline Wrapper */}
          <div className="relative">
            
            {/* Desktop Horizontal Connecting Line (visible md+) */}
            <div className="hidden md:block absolute top-4 left-[10%] right-[10%] h-[1px] bg-neutral-800 z-0">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={timelineInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                style={{ originX: 0 }}
                className="h-full bg-[#C9A84C] origin-left"
              />
            </div>

            {/* Mobile Vertical Connecting Line (visible below md) */}
            <div className="md:hidden absolute left-4 top-0 bottom-0 w-[1px] bg-neutral-800 z-0">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={timelineInView ? { scaleY: 1 } : {}}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                style={{ originY: 0 }}
                className="w-full bg-[#C9A84C] origin-top"
              />
            </div>

            {/* Steps Container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-4 relative z-10">
              {timelineSteps.map((step, idx) => (
                <div key={step.num} className="group">
                  
                  {/* Desktop Layout Item */}
                  <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={timelineInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: idx * 0.35 + 0.2 }}
                    className="hidden md:flex flex-col items-center text-center space-y-5 px-3"
                  >
                    {/* Node Dot on the timeline */}
                    <div className="w-9 h-9 rounded-full bg-[#0D0D0D] border border-neutral-800 flex items-center justify-center transition-colors duration-500 group-hover:border-[#C9A84C]/60 z-10">
                      <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] transition-transform duration-500 group-hover:scale-125" />
                      </div>
                    </div>

                    <span 
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      className="text-4xl font-light text-[#C9A84C]/45 block tracking-wide"
                    >
                      {step.num}
                    </span>
                    
                    <h3 className="text-[0.75rem] tracking-[0.25em] font-semibold text-white uppercase">
                      {step.title}
                    </h3>
                    
                    <p className={`text-xs text-neutral-400 leading-relaxed max-w-[210px] ${outfit.className}`}>
                      {step.desc}
                    </p>
                  </motion.div>

                  {/* Mobile Layout Item */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={timelineInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: idx * 0.35 + 0.2 }}
                    className="md:hidden flex items-start gap-6 pl-1"
                  >
                    {/* Node Dot */}
                    <div className="w-6 h-6 rounded-full bg-[#0D0D0D] border border-[#C9A84C]/40 flex items-center justify-center shrink-0 z-10 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-3">
                        <span 
                          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                          className="text-2xl font-light text-[#C9A84C]/60 leading-none"
                        >
                          {step.num}
                        </span>
                        <h3 className="text-xs tracking-[0.2em] font-bold text-white uppercase">
                          {step.title}
                        </h3>
                      </div>
                      <p className={`text-xs text-neutral-400 leading-relaxed pt-1 ${outfit.className}`}>
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>

                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 6: WARRANTY & AFTER SALES ────────────────────────────── */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={textVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start"
        >
          {/* Left Column: Heading */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[0.65rem] tracking-[0.3em] font-semibold text-[#C9A84C] uppercase block">
              OUR GUARANTEE
            </span>
            <h2 
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-[#C9A84C] tracking-wide leading-tight uppercase"
            >
              WE STAND BEHIND<br className="hidden lg:inline" /> EVERY BUILD
            </h2>
          </div>

          {/* Right Column: Structured list */}
          <div className={`space-y-6 lg:col-span-7 ${outfit.className}`}>
            <div className="space-y-4">
              
              <div className="flex gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-colors">
                <span className="text-base shrink-0 pt-0.5">✅</span>
                <div>
                  <h4 className="text-xs font-semibold text-white tracking-wider uppercase">1 Year Warranty</h4>
                  <p className="text-[0.75rem] text-neutral-400/80 mt-1">Full structural and hardware warranty coverage on all new custom installations and individual audio units.</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-colors">
                <span className="text-base shrink-0 pt-0.5">✅</span>
                <div>
                  <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Covers</h4>
                  <p className="text-[0.75rem] text-neutral-400/80 mt-1">Defective parts, component failures during normal usage, internal connection degradation, and diagnostics.</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-colors">
                <span className="text-base shrink-0 pt-0.5">❌</span>
                <div>
                  <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Does Not Cover</h4>
                  <p className="text-[0.75rem] text-neutral-400/80 mt-1">Physical impact or dropping, water or moisture damage, electrical surges, user misuse, or modifications made by third parties.</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-colors">
                <span className="text-base shrink-0 pt-0.5">🔧</span>
                <div>
                  <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Out of Warranty?</h4>
                  <p className="text-[0.75rem] text-neutral-400/80 mt-1">We provide professional life-long servicing and adjustments for our builds. We only bill for replacement components used.</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-colors">
                <span className="text-base shrink-0 pt-0.5">📞</span>
                <div>
                  <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Contact Support</h4>
                  <div className="text-[0.75rem] text-neutral-400/90 mt-1 space-y-1">
                    <p>WhatsApp: <a href="https://wa.me/919567931330" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline">+91 95679 31330</a></p>
                    <p>Email: <a href="mailto:soundwave.sarga@gmail.com" className="text-[#C9A84C] hover:underline">soundwave.sarga@gmail.com</a></p>
                    <p>Instagram: <a href="https://www.instagram.com/soundwave.gear?igsh=MXNxaTA0Mjh4ZWs0dQ==" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline">@soundwave.gear</a></p>
                  </div>
                </div>
              </div>

            </div>

            <p className="text-[0.7rem] italic text-neutral-500 pl-4 border-l border-neutral-800">
              &ldquo;All repair charges are communicated transparently before any work begins.&rdquo;
            </p>
          </div>
        </motion.div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 7: NUMBERS / STATS STRIP ────────────────────────────── */}
      <section className="relative w-full py-16 bg-[#110e08] border-y border-[#C9A84C]/15 my-10">
        <div className="container mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#C9A84C]/10">
          
          <div className="flex flex-col items-center text-center justify-center p-3">
            <span 
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-4xl md:text-5xl font-light text-[#C9A84C] tracking-wide mb-1"
            >
              <AnimatedCounter value={120} suffix="+" />
            </span>
            <span className={`text-[0.55rem] tracking-[0.25em] font-semibold text-neutral-400 uppercase ${outfit.className}`}>
              Happy Customers
            </span>
          </div>

          <div className="flex flex-col items-center text-center justify-center p-3 pt-6 md:pt-3">
            <span 
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-4xl md:text-5xl font-light text-[#C9A84C] tracking-wide mb-1"
            >
              <AnimatedCounter value={100} suffix="+" />
            </span>
            <span className={`text-[0.55rem] tracking-[0.25em] font-semibold text-neutral-400 uppercase ${outfit.className}`}>
              Systems Built
            </span>
          </div>

          <div className="flex flex-col items-center text-center justify-center p-3 pt-6 md:pt-3">
            <span 
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-4xl md:text-5xl font-light text-[#C9A84C] tracking-wide mb-1"
            >
              <AnimatedCounter value={35} suffix="+" />
            </span>
            <span className={`text-[0.55rem] tracking-[0.25em] font-semibold text-neutral-400 uppercase ${outfit.className}`}>
              Years of Engineering
            </span>
          </div>

          <div className="flex flex-col items-center text-center justify-center p-3 pt-6 md:pt-3">
            <span 
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="text-4xl md:text-5xl font-light text-[#C9A84C] tracking-wide mb-1"
            >
              <AnimatedCounter value={100} suffix="%" />
            </span>
            <span className={`text-[0.55rem] tracking-[0.25em] font-semibold text-neutral-400 uppercase ${outfit.className}`}>
              Custom Built to Order
            </span>
          </div>

        </div>
      </section>

      {/* Gold Divider */}
      <div className="gold-divider mx-auto max-w-5xl" />

      {/* ─── SECTION 8: CONTACT CTA ──────────────────────────────────────── */}
      <section className="relative py-36 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Subtle animated gold radial glow background */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.5, 0.35],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,_rgba(201,168,76,0.08)_0%,_transparent_70%)] blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-12 px-4">
          <h2 
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            className="text-3xl md:text-5xl lg:text-6xl font-light text-white tracking-wide uppercase leading-tight"
          >
            Ready to engineer<br />your perfect sound?
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/build-your-sound" className="btn-gold w-full sm:w-auto text-[0.75rem]">
              BUILD YOUR SOUND
            </Link>
            
            <button 
              onClick={() => setIsContactOpen(true)}
              className="btn-gold w-full sm:w-auto text-[0.75rem] border-white text-white hover:bg-white hover:text-[#0D0D0D]"
            >
              CONTACT US
            </button>
          </div>
        </div>
      </section>

      </div>

      {/* Contact Inquiry Popup Modal */}
      <ContactPopup 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        productName="General SOUNDWAVE Custom Inquiry" 
      />

    </div>
  );
}
