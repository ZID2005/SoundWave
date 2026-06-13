"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return { ref, inView };
}

/* ── Contact Card ── */
function ContactCard({
  icon,
  iconBg,
  borderColor,
  title,
  detail,
  subtext,
  btnLabel,
  btnHref,
  btnColor,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconBg: string;
  borderColor: string;
  title: string;
  detail: string;
  subtext: string;
  btnLabel: string;
  btnHref: string;
  btnColor: string;
  delay?: number;
}) {
  const { ref, inView } = useReveal();
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ delay }}
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${borderColor}`,
        borderRadius: "18px",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        flex: 1,
        minWidth: "240px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.25rem",
        }}
      >
        {icon}
      </div>

      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 600, color: "#ffffff", margin: 0 }}>
        {title}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", fontWeight: 500, color: "rgba(255,255,255,0.75)", margin: 0 }}>
        {detail}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.6, margin: 0 }}>
        {subtext}
      </p>

      <a
        href={btnHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: "0.5rem",
          display: "inline-block",
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#000000",
          background: btnColor,
          border: "none",
          borderRadius: "980px",
          padding: "0.65rem 1.4rem",
          textDecoration: "none",
          cursor: "pointer",
          transition: "filter 0.2s, box-shadow 0.2s",
          alignSelf: "flex-start",
          boxShadow: `0 4px 14px rgba(0,0,0,0.3)`,
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}
      >
        {btnLabel}
      </a>
    </motion.div>
  );
}

/* ── Quick FAQ item ── */
function QuickFaq({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "1rem 0" }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", fontWeight: 500, color: "#ffffff", marginBottom: "0.3rem" }}>{q}</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.84rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{a}</p>
    </div>
  );
}

/* ── Page ── */
export default function SupportPage() {
  const waveRef = useReveal();
  const cardsRef = useReveal();
  const faqRef = useReveal();
  const warrantyRef = useReveal();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');

        @keyframes waveAnim {
          0%   { transform: scaleY(1); }
          25%  { transform: scaleY(1.8); }
          50%  { transform: scaleY(0.6); }
          75%  { transform: scaleY(1.4); }
          100% { transform: scaleY(1); }
        }
        .wave-bar {
          display: inline-block;
          width: 3px;
          height: 14px;
          border-radius: 2px;
          background: #C9A84C;
          margin: 0 1.5px;
          animation: waveAnim 1.2s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .wave-bar:nth-child(2) { animation-delay: 0.15s; height: 10px; }
        .wave-bar:nth-child(3) { animation-delay: 0.3s;  height: 18px; }
        .wave-bar:nth-child(4) { animation-delay: 0.1s;  height: 12px; }
        .wave-bar:nth-child(5) { animation-delay: 0.25s; height: 8px; }
      `}</style>

      <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "0" }}>

        {/* ── Hero ── */}
        <div style={{
          padding: "6rem 1.5rem 3.5rem",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "600px", height: "350px",
            background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", letterSpacing: "0.28em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "1rem" }}
          >
            We&apos;re here to help
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.2rem, 7vw, 4rem)",
              letterSpacing: "0.18em",
              color: "#ffffff",
              fontWeight: 600,
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: "1rem",
            }}
          >
            Support
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.4)", maxWidth: "400px", margin: "0 auto", lineHeight: 1.7 }}
          >
            Start with WAVE for instant help, or reach our team directly.
          </motion.p>
        </div>

        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 1.5rem" }}>

          {/* ── Section 1: WAVE Banner ── */}
          <motion.div
            ref={waveRef.ref}
            variants={fadeUp}
            initial="hidden"
            animate={waveRef.inView ? "visible" : "hidden"}
            style={{
              margin: "3.5rem 0 3rem",
              padding: "2rem 2.5rem",
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            {/* Left: icon + text */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flex: 1, minWidth: "220px" }}>
              {/* Animated wave bars */}
              <div style={{ display: "flex", alignItems: "flex-end", height: "28px", flexShrink: 0 }}>
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", margin: "0 0 0.3rem" }}>
                  Ask WAVE First
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.84rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.65, margin: 0 }}>
                  WAVE is our AI audio expert — available 24/7 to answer any question about our products, audio concepts, and your setup.
                </p>
              </div>
            </div>

            {/* Right: CTA */}
            <button
              onClick={() => {
                const btn = document.getElementById("wave-chatbot-toggle");
                if (btn) btn.click();
              }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#000000",
                background: "linear-gradient(135deg, #C9A84C, #b8852a)",
                border: "none",
                borderRadius: "980px",
                padding: "0.75rem 1.75rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
                whiteSpace: "nowrap",
                transition: "filter 0.2s, box-shadow 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.5)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(201,168,76,0.35)";
              }}
            >
              Chat with WAVE →
            </button>
          </motion.div>

          {/* ── Section 2: Contact Cards ── */}
          <motion.div
            ref={cardsRef.ref}
            initial={{ opacity: 0, y: 12 }}
            animate={cardsRef.inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "0.75rem" }}
          >
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
              letterSpacing: "0.14em",
              color: "#C9A84C",
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}>
              Reach Our Team
            </p>
          </motion.div>

          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "4rem" }}>
            {/* WhatsApp */}
            <ContactCard
              delay={0}
              iconBg="rgba(37,211,102,0.15)"
              borderColor="rgba(37,211,102,0.2)"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              }
              title="Chat on WhatsApp"
              detail="+91 95679 31330"
              subtext="Fastest response — typically within 2 hours"
              btnLabel="Open WhatsApp"
              btnHref="https://wa.me/919567931330"
              btnColor="#25D366"
            />

            {/* Email */}
            <ContactCard
              delay={0.08}
              iconBg="rgba(201,168,76,0.12)"
              borderColor="rgba(201,168,76,0.2)"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#C9A84C">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              }
              title="Send an Email"
              detail="soundwave.sarga@gmail.com"
              subtext="We respond within 24 hours"
              btnLabel="Send Email"
              btnHref="mailto:soundwave.sarga@gmail.com"
              btnColor="#C9A84C"
            />

            {/* Instagram */}
            <ContactCard
              delay={0.16}
              iconBg="rgba(193,53,132,0.12)"
              borderColor="rgba(193,53,132,0.2)"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#C13584">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              }
              title="Message on Instagram"
              detail="@soundwave.gear"
              subtext="Follow us for product updates and new launches"
              btnLabel="Open Instagram"
              btnHref="https://www.instagram.com/soundwave.gear?igsh=MXNxaTA0Mjh4ZWs0dQ=="
              btnColor="linear-gradient(135deg, #C13584, #833AB4)"
            />
          </div>

          {/* ── Divider ── */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "4rem" }} />

          {/* ── Section 3: Quick FAQ ── */}
          <motion.div
            ref={faqRef.ref}
            variants={fadeUp}
            initial="hidden"
            animate={faqRef.inView ? "visible" : "hidden"}
            style={{ marginBottom: "4rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                letterSpacing: "0.14em",
                color: "#C9A84C",
                fontWeight: 600,
                textTransform: "uppercase",
                margin: 0,
              }}>
                Common Questions
              </p>
              <Link
                href="/faq"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8rem",
                  color: "#C9A84C",
                  letterSpacing: "0.06em",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(201,168,76,0.3)",
                  transition: "border-color 0.2s",
                  paddingBottom: "1px",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#C9A84C"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"}
              >
                View all FAQs →
              </Link>
            </div>

            <QuickFaq
              q="How do I place an order?"
              a="Add products to your cart, click Enquire Now, and our team will contact you to confirm price, specs, and delivery."
            />
            <QuickFaq
              q="How long does delivery take?"
              a="Standard products: 7–14 business days. Custom builds: 3–6 weeks depending on specifications."
            />
            <QuickFaq
              q="What does the warranty cover?"
              a="1 year warranty on all products, covering manufacturing defects and component failure under normal use."
            />
          </motion.div>

        </div>

        {/* ── Section 4: Warranty Strip (full width) ── */}
        <motion.div
          ref={warrantyRef.ref}
          variants={fadeUp}
          initial="hidden"
          animate={warrantyRef.inView ? "visible" : "hidden"}
          style={{
            background: "#111111",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "3.5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(1.6rem, 5vw, 2.6rem)",
              letterSpacing: "0.14em",
              color: "#C9A84C",
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            1 Year Warranty on All Products
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.92rem",
              color: "rgba(255,255,255,0.42)",
              lineHeight: 1.75,
              maxWidth: "520px",
              margin: "0 auto 1.5rem",
            }}
          >
            Every SOUNDWAVE product is backed by a full one-year warranty covering manufacturing defects and component failure under normal use. We stand behind our craftsmanship.
          </p>
          <Link
            href="/terms-of-service"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.06em",
              textDecoration: "none",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              paddingBottom: "1px",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#C9A84C";
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
          >
            View full warranty terms →
          </Link>
        </motion.div>

      </div>
    </>
  );
}
