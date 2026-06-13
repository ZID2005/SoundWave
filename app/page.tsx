"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaTools, FaGem, FaHeadset, FaVolumeUp, FaShieldAlt } from "react-icons/fa";
import { useWelcome } from "@/context/WelcomeContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { dummyProducts } from "@/lib/products";
import { isNewProduct, NewBadge, NewProductModal } from "@/components/NewProductModal";

/* ─── Scroll-reveal hook ─────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Staggered letter reveal ────────────────────────────────────────────── */
function SoundwaveTitle() {
  const letters = "SOUNDWAVE".split("");
  const { hasEntered } = useWelcome();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (hasEntered) { setReady(true); return; }
    const alreadySeen = typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem("sw_welcomed") === "1";
    if (alreadySeen) setReady(true);
  }, [hasEntered]);

  return (
    <h1
      aria-label="SOUNDWAVE"
      className="hero-title"
    >
      {letters.map((letter, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: ready ? undefined : 0,
            transform: ready ? undefined : "translateY(40px)",
            animation: ready
              ? `sw-letter-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.05}s forwards`
              : "none",
          }}
        >
          {letter}
        </span>
      ))}
    </h1>
  );
}

/* ─── Scroll Section wrapper using IntersectionObserver ─────────────────── */
function ScrollSection({
  children,
  className = "",
  style = {},
  id,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  const { ref, visible } = useInView(0.15);
  return (
    <section
      ref={ref}
      id={id}
      className={`${className} ${visible ? "is-visible" : ""}`}
      style={{
        position: "relative",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}


/* ─── Why SoundWave card data ─────────────────────────────────────────────── */
const WHY_CARDS = [
  { Icon: FaTools, title: "CUSTOM BUILT", desc: "Every system engineered precisely for your space and acoustics." },
  { Icon: FaGem, title: "PREMIUM COMPONENTS", desc: "Audiophile-grade parts sourced from world's finest manufacturers." },
  { Icon: FaHeadset, title: "EXPERT SUPPORT", desc: "Our engineers guide you before, during, and after every purchase." },
  { Icon: FaVolumeUp, title: "PURE SOUND", desc: "Zero compromise on frequency response and acoustic precision." },
  { Icon: FaShieldAlt, title: "WARRANTY ASSURED", desc: "Every custom build backed by our comprehensive quality guarantee." },
];

/* ─── Stats data ──────────────────────────────────────────────────────────── */
const STATS = [
  { number: "120+", label: "Happy Customers" },
  { number: "100+", label: "Systems Built" },
  { number: "35+", label: "Years of Engineering" },
  { number: "40+", label: "Premium Brands" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
// HERO BACKGROUND IMAGE — replace src here (e.g., close-up of amplifier knobs and dials, warm dramatic lighting)
const HERO_BG_SRC = "/images/hero-bg.jpg";

// STATS BACKGROUND IMAGE — replace src here (e.g., speaker driver close-up, black and gold tones)
const STATS_BG_SRC = "/images/hero-bg.jpg";

// CTA BACKGROUND IMAGE — replace src here (e.g., full sound system setup shot, dark room with warm speaker glow)
const CTA_BG_SRC = "/images/cta-bg.png";

export default function Home() {
  const { hasEntered } = useWelcome();
  const [heroReady, setHeroReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [homeProducts, setHomeProducts] = useState<any[]>(dummyProducts.slice(0, 3));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [newModalProduct, setNewModalProduct] = useState<any | null>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (hasEntered) { setHeroReady(true); return; }
    const alreadySeen = typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem("sw_welcomed") === "1";
    if (alreadySeen) setHeroReady(true);
  }, [hasEntered]);

  // Fetch latest 3 products from Firestore for the home page grid
  useEffect(() => {
    async function fetchHomeProducts() {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(3));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setHomeProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch {
        // Fallback is already handled by the initial state
      }
    }
    fetchHomeProducts();
  }, []);

  const mobileMult = isMobile ? 0.5 : 1.0;
  const wWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const wHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  const tX1 = mousePos.x * wWidth * 0.02 * mobileMult;
  const tY1 = mousePos.y * wHeight * 0.02 * mobileMult;

  return (
    <>
      {/* ── Keyframe styles ── */}
      {/* eslint-disable-next-line react/no-danger */}
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

        @keyframes sw-letter-in {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes hero-label-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-divider-in {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes hero-fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(calc(-50% - 12px), 0, 0); }
        }
        @keyframes hero-zoom {
          from { transform: scale(1.08); }
          to   { transform: scale(1); }
        }
        @keyframes pulse-line {
          0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
        @keyframes slide-dot {
          0% { top: 0%; opacity: 0; }
          30% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes cta-ken-burns {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .bg-shimmer {
          background: linear-gradient(90deg, #111111 25%, #1a1a1a 50%, #111111 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .animate-marquee {
          display: flex;
          animation: marquee 34s linear infinite;
        }
        .marquee-wrap:hover .animate-marquee {
          animation-duration: 72s;
        }

        /* Card hover — scale only, no glow */
        .sw-product-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .sw-product-card:hover {
          transform: scale(1.02);
          border-color: rgba(255,255,255,0.2);
        }

        /* Why-card hover with lift and border change */
        .sw-why-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
        }
        .sw-why-card:hover {
          transform: translateY(-4px);
          border-color: rgba(201,168,76,0.3);
        }

        /* CTA link with animated left-to-right underline */
        .sw-cta-link-underline {
          color: #C9A84C;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: gap 0.2s ease;
          position: relative;
        }
        .sw-cta-link-underline:hover {
          gap: 10px;
        }
        .sw-cta-link-underline::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: #C9A84C;
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sw-cta-link-underline:hover::after {
          transform: scaleX(1);
        }

        /* Outlined hero button */
        .sw-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 28px;
          border: 1px solid rgba(255,255,255,0.4);
          background: transparent;
          color: #ffffff;
          border-radius: 9999px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .sw-btn-outline:hover {
          border-color: #C9A84C;
          color: #C9A84C;
        }

        /* Filled gold hero button */
        .sw-btn-filled {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 28px;
          background: #C9A84C;
          color: #000000;
          border-radius: 9999px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s ease, box-shadow 0.2s ease;
        }
        .sw-btn-filled:hover {
          background: #b8852a;
          box-shadow: rgba(201,168,76,0.4) 1px 6px 14px 0;
        }

        /* Product "Add to Cart" outlined pill */
        .sw-cart-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 20px;
          border: 1px solid rgba(255,255,255,0.3);
          background: transparent;
          color: #ffffff;
          border-radius: 980px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.2s ease, background 0.2s ease;
          cursor: pointer;
        }
        .sw-cart-btn:hover {
          border-color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.06);
        }

        /* Responsive Hero Title */
        .hero-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 56px;
          font-weight: 400;
          letter-spacing: -0.05em;
          line-height: 0.9;
          color: #ffffff;
          display: flex;
          justify-content: center;
          margin-bottom: 0;
          user-select: none;
        }
        @media (min-width: 768px) {
          .hero-title {
            font-size: 120px;
          }
        }

        /* Scroll reveal animation elements */
        .reveal-item {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .is-visible .reveal-item {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-card {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .is-visible .reveal-card {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-left {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .is-visible .reveal-left {
          opacity: 1;
          transform: translateX(0);
        }

        .reveal-right {
          opacity: 0;
          transform: translateX(60px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .is-visible .reveal-right {
          opacity: 1;
          transform: translateX(0);
        }

        .featured-bullet {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .is-visible .featured-bullet {
          opacity: 1;
          transform: translateY(0);
        }

        .cta-bg-image {
          animation: cta-ken-burns 8s ease-in-out infinite alternate;
        }
      `}</style>

      <div style={{ width: "100%", overflow: "hidden" }}>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            backgroundColor: "#000000",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background Parallax Image Stack */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, backgroundColor: "#000000" }}>
            
            {/* HERO BACKGROUND IMAGE — replace with amplifier/speaker image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0.55,
                transform: `translate(${tX1}px, ${tY1 + scrollY * 0.1 * mobileMult}px) scale(1.1)`,
                transition: "transform 0.1s ease-out",
              }}
            >
              {HERO_BG_SRC ? (
                <div style={{ position: "absolute", inset: 0, animation: "hero-zoom 2s ease-out forwards" }}>
                  <Image
                    src={HERO_BG_SRC}
                    alt="SoundWave Hero Background"
                    fill
                    style={{ objectFit: "cover", objectPosition: "center" }}
                    priority
                  />
                </div>
              ) : (
                <div className="bg-shimmer" style={{ width: "100%", height: "100%" }} />
              )}
            </div>

            {/* Vignette Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.70) 100%)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
            
            {/* Second Overlay (bottom fade) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 50%, #000000 100%)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              width: "100%",
              maxWidth: "900px",
              position: "relative",
              zIndex: 10,
              transform: `translateY(${-scrollY * 0.4 * mobileMult}px)`,
              transition: "transform 0.05s ease-out",
            }}
          >
            {/* Label */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: "32px",
                opacity: heroReady ? undefined : 0,
                transform: heroReady ? undefined : "translateY(12px)",
                animation: heroReady ? "hero-label-in 0.6s ease 0s forwards" : "none",
              }}
            >
              Premium Audio Equipment
            </p>

            {/* Title — letter-by-letter stagger */}
            <SoundwaveTitle />

            {/* Gold divider — draws from center outward */}
            <div
              style={{
                width: "80px",
                height: "1px",
                background: "#C9A84C",
                marginTop: "32px",
                marginBottom: "32px",
                transformOrigin: "center",
                transform: heroReady ? "scaleX(0)" : "scaleX(0)",
                animation: heroReady
                  ? "hero-divider-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards"
                  : "none",
              }}
            />

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "17px",
                fontWeight: 300,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.8,
                letterSpacing: "-0.016em",
                maxWidth: "480px",
                marginBottom: "40px",
                opacity: heroReady ? undefined : 0,
                transform: heroReady ? undefined : "translateY(14px)",
                animation: heroReady ? "hero-fade-in 0.6s ease 1.4s forwards" : "none",
              }}
            >
              Engineered for those who hear more. Pure acoustic precision, crafted without compromise.
            </p>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                justifyContent: "center",
                opacity: heroReady ? undefined : 0,
                transform: heroReady ? undefined : "translateY(20px)",
                animation: heroReady ? "hero-fade-in 0.6s ease 1.6s forwards" : "none",
              }}
            >
              <Link href="/products" className="sw-btn-outline">
                Explore Products
              </Link>
              <Link href="/build-your-sound" className="sw-btn-filled">
                Build Your Sound
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              zIndex: 20,
              opacity: scrollY > 100 ? 0 : 1,
              transition: "opacity 0.4s ease-out",
            }}
          >
            <div style={{ position: "relative", width: "1px", height: "48px", background: "rgba(201, 168, 76, 0.3)" }}>
              <div
                style={{
                  position: "absolute",
                  left: "-2px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#C9A84C",
                  animation: "slide-dot 1.5s infinite linear",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "9px",
                fontWeight: 600,
                color: "#86868b",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginTop: "4px",
              }}
            >
              Scroll
            </span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2 — WHY SOUNDWAVE
        ══════════════════════════════════════════════════════════════════════ */}
        <ScrollSection
          style={{
            backgroundColor: "#0a0a0a",
            paddingTop: "96px",
            paddingBottom: "96px",
            overflow: "hidden",
            transform: undefined, // Let the component handle it or override below
            transition: undefined
          }}
          className="sw-section-2"
        >
          {/* Custom style override for Section 2 scroll transition */}
          <style suppressHydrationWarning>{`
            .sw-section-2 {
              transform: translateY(40px);
              transition: opacity 0.8s ease-out, transform 0.8s ease-out !important;
            }
            .sw-section-2.is-visible {
              transform: translateY(0);
            }
          `}</style>

          {/* Heading */}
          <div className="reveal-item" style={{ textAlign: "center", marginBottom: "60px", padding: "0 24px", transitionDelay: "0s" }}>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: "16px",
              }}
            >
              Our Promise
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "#ffffff",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Why SoundWave
            </h2>
          </div>

          {/* Marquee */}
          <div
            className="marquee-wrap reveal-item"
            style={{
              position: "relative",
              overflow: "hidden",
              maskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
              paddingTop: "8px",
              paddingBottom: "8px",
              transitionDelay: "0.2s",
            }}
          >
            <div className="animate-marquee" style={{ gap: "24px" }}>
              {[...WHY_CARDS, ...WHY_CARDS].map(({ Icon, title, desc }, idx) => (
                <div
                  key={idx}
                  className="sw-why-card"
                  style={{
                    width: "320px",
                    flexShrink: 0,
                    borderRadius: "16px",
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.07)",
                    padding: "32px 28px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Icon
                    style={{
                      fontSize: "28px",
                      color: "#C9A84C",
                      marginBottom: "20px",
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#ffffff",
                      marginBottom: "12px",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#86868b",
                      lineHeight: 1.6,
                      maxWidth: "260px",
                    }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3 — PRODUCTS
        ══════════════════════════════════════════════════════════════════════ */}
        <ScrollSection style={{ backgroundColor: "#000000", paddingTop: "96px", paddingBottom: "96px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

            {/* Heading */}
            <div className="reveal-item" style={{ textAlign: "center", marginBottom: "60px", transitionDelay: "0s" }}>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  marginBottom: "16px",
                }}
              >
                What We Offer
              </p>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "48px",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                Our Collection
              </h2>
            </div>

            {/* Product grid — live from Firestore */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {homeProducts.map((p, i) => {
                const isNew = isNewProduct(p);
                const cardInner = (
                  <div
                    className="sw-product-card"
                    style={{ borderRadius: "28px", background: "#1d1d1f", overflow: "hidden" }}
                  >
                    {/* Image */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#141414", overflow: "hidden" }}>
                      {p.image && p.image !== "placeholder" ? (
                        <Image
                          src={p.images?.[0] || p.image}
                          alt={p.name}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 70%)" }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 300, color: "rgba(201,168,76,0.1)", letterSpacing: "0.35em", textTransform: "uppercase" }}>SoundWave</span>
                        </div>
                      )}
                      {/* NEW badge overlay */}
                      {isNew && (
                        <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 10 }}>
                          <NewBadge />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "24px 28px 28px" }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#86868b", marginBottom: "8px" }}>
                        {p.category?.replace("-", " ") ?? "Product"}
                      </p>
                      <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: "19px", fontWeight: 600, letterSpacing: "-0.015em", color: "#ffffff", marginBottom: "6px" }}>
                        {p.name}
                      </h3>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: 400, color: "#C9A84C", marginBottom: "20px" }}>
                        {p.priceRangeText ?? p.price}
                      </p>
                      <button className="sw-cart-btn">{isNew ? "View New Arrival" : "View Product"}</button>
                    </div>
                  </div>
                );

                return (
                  <div
                    key={p.id}
                    className="reveal-card"
                    style={{
                      transitionDelay: `${(i + 1) * 0.15}s`,
                    }}
                  >
                    {isNew ? (
                      <div style={{ cursor: "pointer" }} onClick={() => setNewModalProduct(p)}>
                        {cardInner}
                      </div>
                    ) : (
                      <Link href={`/products/${p.id}`} style={{ textDecoration: "none", display: "block" }}>
                        {cardInner}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* View all link */}
            <div className="reveal-item" style={{ textAlign: "center", marginTop: "48px", transitionDelay: "0.4s" }}>
              <Link href="/products" className="sw-cta-link-underline">
                View All Products <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </ScrollSection>

        {/* ── New Product Modal ── */}
        {newModalProduct && (
          <NewProductModal
            product={newModalProduct}
            onClose={() => setNewModalProduct(null)}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 4 — FEATURED / CATEGORY
        ══════════════════════════════════════════════════════════════════════ */}
        <ScrollSection style={{ backgroundColor: "#0a0a0a", paddingTop: "96px", paddingBottom: "96px" }}>
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "60px",
              alignItems: "center",
            }}
          >
            {/* Image — left */}
            <div className="reveal-left" style={{ transitionDelay: "0s" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1/1",
                  borderRadius: "28px",
                  overflow: "hidden",
                  background: "#1d1d1f",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Image
                  src="/images/products/bluetooth-pro-preamp-front.png"
                  alt="Horizon Acoustic Series"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            </div>

            {/* Text — right */}
            <div className="reveal-right" style={{ transitionDelay: "0.1s" }}>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  marginBottom: "20px",
                }}
              >
                Featured Setup
              </p>

              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(2rem, 4vw, 3.5rem)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "#ffffff",
                  lineHeight: 1.1,
                  textTransform: "uppercase",
                  marginBottom: "28px",
                }}
              >
                Bluetooth<br />
                <span style={{ fontStyle: "italic", fontWeight: 400, color: "#ffffff" }}>
                  Pre Amplifier
                </span>
              </h2>

              <div
                style={{
                  width: "100%",
                  height: "1px",
                  background: "rgba(255,255,255,0.08)",
                  marginBottom: "28px",
                }}
              />

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "17px",
                  fontWeight: 400,
                  color: "#86868b",
                  lineHeight: 1.65,
                  letterSpacing: "-0.016em",
                  marginBottom: "28px",
                  maxWidth: "460px",
                }}
              >
                Professional-grade Bluetooth pre-amplifier with a dedicated Bass + Triple Mid tone stack,
                gold-plated RCA phono connectors, and a special-grade CRGO transformer at 90 kHz bandwidth.
                Built for the serious audiophile.
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  "★ Professional Grade OP-Amp with Gain Control",
                  "★ Gold Plated RCA Socket with Phono Connector",
                  "★ Special Grade CRGO Transformer — 90 kHz",
                ].map((spec, i) => (
                  <li
                    key={spec}
                    className="featured-bullet"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      color: "#C9A84C",
                      transitionDelay: `${0.4 + i * 0.15}s`,
                    }}
                  >
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "#C9A84C",
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    {spec.replace(/^★\s*/, "")}
                  </li>
                ))}
              </ul>

              <Link href="/products/bluetooth-pro-preamp" className="sw-cta-link-underline">
                Enquire Now <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </ScrollSection>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 5 — STATS STRIP
        ══════════════════════════════════════════════════════════════════════ */}
        <ScrollSection
          style={{
            backgroundColor: "#000000",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "60px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* STATS BACKGROUND IMAGE — replace with dark speaker/studio image */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <Image
              src={STATS_BG_SRC}
              alt="Stats background"
              fill
              style={{ objectFit: "cover", objectPosition: "center", opacity: 0.07 }}
            />
          </div>

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: isMobile ? "24px 0" : "0",
              position: "relative",
              zIndex: 1,
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="reveal-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "16px 20px",
                  borderRight: !isMobile && i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  borderBottom: isMobile && i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  transitionDelay: `${(i + 1) * 0.1}s`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "72px",
                    fontWeight: 400,
                    color: "#C9A84C",
                    lineHeight: 1,
                    marginBottom: "12px",
                  }}
                >
                  {stat.number}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b6b6b",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </ScrollSection>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 6 — BUILD YOUR SOUND CTA
        ══════════════════════════════════════════════════════════════════════ */}
        <ScrollSection
          style={{
            backgroundColor: "#000000",
            paddingTop: "96px",
            paddingBottom: "96px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* CTA BACKGROUND IMAGE — replace with home theater/sound system image */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, backgroundColor: "#000000" }}>
            {CTA_BG_SRC ? (
              <>
                <Image
                  src={CTA_BG_SRC}
                  alt="CTA background"
                  fill
                  className="cta-bg-image"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.80)" }} />
              </>
            ) : (
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.80)" }} />
            )}
          </div>

          <div
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              textAlign: "center",
              padding: "0 24px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <p
              className="reveal-item"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: "20px",
                transitionDelay: "0s",
              }}
            >
              Bespoke Configuration
            </p>
            <h2
              className="reveal-item"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "#ffffff",
                textTransform: "uppercase",
                lineHeight: 1.1,
                marginBottom: "24px",
                transitionDelay: "0.1s",
              }}
            >
              Design Your Dream<br />Sound System
            </h2>

            <div
              className="reveal-item"
              style={{
                width: "100%",
                height: "1px",
                background: "rgba(255,255,255,0.08)",
                marginBottom: "24px",
                transitionDelay: "0.2s",
              }}
            />

            <p
              className="reveal-item"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "17px",
                fontWeight: 400,
                color: "#86868b",
                lineHeight: 1.65,
                letterSpacing: "-0.016em",
                marginBottom: "40px",
                transitionDelay: "0.3s",
              }}
            >
              Work with our engineers to build a system perfectly matched to your space,
              acoustics, and listening preferences.
            </p>

            <div
              className="reveal-item"
              style={{
                display: "flex",
                gap: "24px",
                justifyContent: "center",
                flexWrap: "wrap",
                transitionDelay: "0.4s",
              }}
            >
              <Link href="/build-your-sound" className="sw-btn-filled">
                Start Building
              </Link>
              <Link href="/products" className="sw-btn-outline">
                Browse Products
              </Link>
            </div>
          </div>
        </ScrollSection>

      </div>
    </>
  );
}
