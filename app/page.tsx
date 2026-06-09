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
  // also trigger if user already passed welcome (session already seen)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (hasEntered) { setReady(true); return; }
    // If welcome gate was already dismissed in this session, animate immediately
    const alreadySeen = typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem("sw_welcomed") === "1";
    if (alreadySeen) setReady(true);
  }, [hasEntered]);

  return (
    <h1
      aria-label="SOUNDWAVE"
      style={{
        fontFamily: "'Bebas Neue', 'Impact', ui-sans-serif, system-ui, sans-serif",
        fontSize: "clamp(4rem, 11vw, 10rem)",
        fontWeight: 400,
        letterSpacing: "0.08em",
        lineHeight: 0.9,
        color: "#ffffff",
        display: "flex",
        justifyContent: "center",
        marginBottom: 0,
        userSelect: "none",
      }}
    >
      {letters.map((letter, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: ready ? undefined : 0,
            transform: ready ? undefined : "translateY(40px) scale(0.85)",
            filter: ready ? undefined : "blur(8px)",
            animation: ready
              ? `sw-letter-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.055}s forwards`
              : "none",
          }}
        >
          {letter}
        </span>
      ))}
    </h1>
  );
}

/* ─── Scroll-reveal wrapper ──────────────────────────────────────────────── */
function RevealSection({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.3s ease ${delay}s, transform 0.3s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
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
export default function Home() {
  const { hasEntered } = useWelcome();
  const [heroReady, setHeroReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [homeProducts, setHomeProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [newModalProduct, setNewModalProduct] = useState<any | null>(null);

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
        } else {
          setHomeProducts(dummyProducts.slice(0, 3));
        }
      } catch {
        setHomeProducts(dummyProducts.slice(0, 3));
      }
    }
    fetchHomeProducts();
  }, []);

  return (
    <>
      {/* ── Keyframe styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

        @keyframes sw-letter-in {
          from { opacity: 0; transform: translateY(40px) scale(0.85); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    filter: blur(0);   }
        }
        @keyframes hero-label-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-divider-in {
          to { transform: scaleX(1); }
        }
        @keyframes hero-fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(calc(-50% - 12px), 0, 0); }
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

        /* Why-card hover */
        .sw-why-card {
          border: 1px solid rgba(255,255,255,0.08);
          transition: border-color 0.2s ease;
        }
        .sw-why-card:hover {
          border-color: rgba(255,255,255,0.2);
        }

        /* CTA link */
        .sw-cta-link {
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
        }
        .sw-cta-link:hover { gap: 10px; }

        /* Outlined hero button */
        .sw-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 24px;
          border: 1px solid rgba(255,255,255,0.5);
          background: transparent;
          color: #ffffff;
          border-radius: 980px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .sw-btn-outline:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.8);
        }

        /* Filled gold hero button */
        .sw-btn-filled {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 24px;
          background: #C9A84C;
          color: #000000;
          border-radius: 980px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        .sw-btn-filled:hover { background: #b8962f; }

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
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              width: "100%",
              maxWidth: "900px",
            }}
          >
            {/* Label */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: "32px",
                opacity: heroReady ? undefined : 0,
                transform: heroReady ? undefined : "translateY(12px)",
                animation: heroReady ? "hero-label-in 0.6s ease 0.05s forwards" : "none",
              }}
            >
              Premium Audio Equipment
            </p>

            {/* Title — letter-by-letter stagger */}
            <SoundwaveTitle />

            {/* Gold divider — draws left to right */}
            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                height: "1px",
                background: "#C9A84C",
                marginTop: "32px",
                marginBottom: "32px",
                transformOrigin: "left center",
                transform: heroReady ? "scaleX(0)" : "scaleX(0)",
                animation: heroReady
                  ? "hero-divider-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards"
                  : "none",
              }}
            />

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "17px",
                fontWeight: 400,
                color: "#86868b",
                lineHeight: 1.6,
                letterSpacing: "-0.016em",
                maxWidth: "520px",
                marginBottom: "40px",
                opacity: heroReady ? undefined : 0,
                transform: heroReady ? undefined : "translateY(14px)",
                animation: heroReady ? "hero-fade-in 0.6s ease 0.85s forwards" : "none",
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
                transform: heroReady ? undefined : "translateY(14px)",
                animation: heroReady ? "hero-fade-in 0.6s ease 1.1s forwards" : "none",
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
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2 — WHY SOUNDWAVE
        ══════════════════════════════════════════════════════════════════════ */}
        <section style={{ backgroundColor: "#111111", paddingTop: "96px", paddingBottom: "96px", overflow: "hidden" }}>

          {/* Heading */}
          <RevealSection style={{ textAlign: "center", marginBottom: "60px", padding: "0 24px" }}>
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
          </RevealSection>

          {/* Marquee */}
          <div
            className="marquee-wrap"
            style={{
              position: "relative",
              overflow: "hidden",
              maskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, white 15%, white 85%, transparent)",
              paddingTop: "8px",
              paddingBottom: "8px",
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
                    borderRadius: "28px",
                    background: "#1d1d1f",
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
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3 — PRODUCTS
        ══════════════════════════════════════════════════════════════════════ */}
        <section style={{ backgroundColor: "#000000", paddingTop: "96px", paddingBottom: "96px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

            {/* Heading */}
            <RevealSection style={{ textAlign: "center", marginBottom: "60px" }}>
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
                  fontSize: "clamp(2.2rem, 5vw, 4rem)",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                Our Collection
              </h2>
            </RevealSection>

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
                  <RevealSection key={p.id} delay={i * 0.05}>
                    {isNew ? (
                      <div style={{ cursor: "pointer" }} onClick={() => setNewModalProduct(p)}>
                        {cardInner}
                      </div>
                    ) : (
                      <Link href={`/products/${p.id}`} style={{ textDecoration: "none", display: "block" }}>
                        {cardInner}
                      </Link>
                    )}
                  </RevealSection>
                );
              })}
            </div>

            {/* View all link */}
            <RevealSection style={{ textAlign: "center", marginTop: "48px" }}>
              <Link href="/products" className="sw-cta-link">
                View All Products <span aria-hidden="true">→</span>
              </Link>
            </RevealSection>
          </div>
        </section>

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
        <section style={{ backgroundColor: "#111111", paddingTop: "96px", paddingBottom: "96px" }}>
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
            <RevealSection>
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
            </RevealSection>

            {/* Text — right */}
            <RevealSection delay={0.05}>
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
                ].map((spec) => (
                  <li
                    key={spec}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      color: "#C9A84C",
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

              <Link href="/products/bluetooth-pro-preamp" className="sw-cta-link">
                Enquire Now <span aria-hidden="true">→</span>
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 5 — STATS STRIP
        ══════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            backgroundColor: "#111111",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "60px 24px",
          }}
        >
          <RevealSection>
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
              }}
            >
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "0 20px",
                    borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "56px",
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
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#86868b",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 6 — BUILD YOUR SOUND CTA
        ══════════════════════════════════════════════════════════════════════ */}
        <section style={{ backgroundColor: "#000000", paddingTop: "96px", paddingBottom: "96px" }}>
          <RevealSection style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", padding: "0 24px" }}>
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
              Bespoke Configuration
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "#ffffff",
                textTransform: "uppercase",
                lineHeight: 1.1,
                marginBottom: "24px",
              }}
            >
              Design Your Dream<br />Sound System
            </h2>

            <div
              style={{
                width: "100%",
                height: "1px",
                background: "rgba(255,255,255,0.08)",
                marginBottom: "24px",
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
                marginBottom: "40px",
              }}
            >
              Work with our engineers to build a system perfectly matched to your space,
              acoustics, and listening preferences.
            </p>

            <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/build-your-sound" className="sw-btn-filled">
                Start Building
              </Link>
              <Link href="/products" className="sw-btn-outline">
                Browse Products
              </Link>
            </div>
          </RevealSection>
        </section>

      </div>
    </>
  );
}
