"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ delay }}
      className="border-t border-white/[0.07] pt-10 mt-10"
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(1.15rem, 2.5vw, 1.35rem)",
          letterSpacing: "0.12em",
          color: "#C9A84C",
          fontWeight: 600,
          marginBottom: "1rem",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontFamily: "'Inter', 'DM Sans', sans-serif",
          fontSize: "0.93rem",
          lineHeight: 1.85,
          color: "rgba(255,255,255,0.62)",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function PrivacyPolicyPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        .policy-link {
          color: #C9A84C;
          text-decoration: none;
          border-bottom: 1px solid rgba(201,168,76,0.3);
          transition: border-color 0.2s;
        }
        .policy-link:hover { border-color: #C9A84C; }
        .policy-li { position: relative; padding-left: 1.25rem; margin-bottom: 0.45rem; }
        .policy-li::before { content: "—"; position: absolute; left: 0; color: #C9A84C; opacity: 0.6; }
      `}</style>

      <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "6rem" }}>

        {/* Hero */}
        <div
          ref={heroRef}
          style={{
            padding: "6rem 1.5rem 3rem",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
          {/* ambient glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "500px", height: "300px",
            background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.28em",
              color: "#C9A84C",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            Legal Document
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
              letterSpacing: "0.18em",
              color: "#ffffff",
              fontWeight: 600,
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: "1.2rem",
            }}
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.04em",
            }}
          >
            Last updated: June 2026
          </motion.p>
        </div>

        {/* Content */}
        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem 0" }}>

          {/* Intro */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              lineHeight: 1.85,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            At SOUNDWAVE, we take your privacy seriously. This Privacy Policy explains in plain language what information we collect, why we collect it, how we store it, and your rights over that data. We are committed to being transparent and straightforward — no confusing legal jargon.
          </motion.p>

          <Section title="1. What We Collect">
            <p>When you use the SOUNDWAVE website, we may collect the following information:</p>
            <div style={{ marginTop: "0.75rem" }}>
              <div className="policy-li">Full name</div>
              <div className="policy-li">Phone number</div>
              <div className="policy-li">Email address</div>
              <div className="policy-li">Order details and cart contents</div>
              <div className="policy-li">Custom build configurations submitted via Build Your Sound</div>
              <div className="policy-li">Device type and browser information (collected automatically)</div>
              <div className="policy-li">AI chat conversation data from interactions with WAVE (processed, not permanently stored — see Section 5)</div>
            </div>
          </Section>

          <Section title="2. Why We Collect It" delay={0.05}>
            <p>We collect this information for the following purposes:</p>
            <div style={{ marginTop: "0.75rem" }}>
              <div className="policy-li">To process and confirm your orders</div>
              <div className="policy-li">To review and confirm custom build configurations with our engineering team</div>
              <div className="policy-li">To contact you regarding your enquiry, order status, or support request</div>
              <div className="policy-li">To improve and maintain the website and user experience</div>
              <div className="policy-li">To improve the quality and relevance of WAVE AI responses</div>
              <div className="policy-li">To send order confirmation emails via EmailJS</div>
              <div className="policy-li">To send WhatsApp notifications via CallMeBot when orders are placed</div>
            </div>
          </Section>

          <Section title="3. How We Store Your Data" delay={0.07}>
            <p>
              Your data is stored securely in <strong style={{ color: "rgba(255,255,255,0.85)" }}>Firebase</strong> — Google&apos;s cloud infrastructure — which is industry-standard and trusted by millions of applications worldwide. All data is encrypted both in transit (via HTTPS/TLS) and at rest. We do not store payment card details — we do not process any online payments.
            </p>
          </Section>

          <Section title="4. Cookies" delay={0.08}>
            <p>
              We use minimal functional cookies only — essential for authentication (keeping you logged in) and preserving your cart. We do <strong style={{ color: "rgba(255,255,255,0.85)" }}>not</strong> use tracking cookies, advertising cookies, or cross-site tracking of any kind.
            </p>
          </Section>

          <Section title="5. WAVE AI Chatbot" delay={0.09}>
            <p>
              WAVE is SOUNDWAVE&apos;s built-in AI audio assistant. When you send a message to WAVE, your message is transmitted to <strong style={{ color: "rgba(255,255,255,0.85)" }}>Groq AI servers</strong> to generate a response. This is necessary for WAVE to function.
            </p>
            <div style={{ marginTop: "0.85rem", padding: "1rem 1.25rem", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "10px" }}>
              <p style={{ marginBottom: 0 }}>
                ⚠ We do <strong style={{ color: "#C9A84C" }}>not permanently store your chat history</strong>. Conversations are transient. However, please do not share sensitive personal information, financial details, or passwords in the WAVE chat — treat it like any public AI assistant.
              </p>
            </div>
          </Section>

          <Section title="6. Third-Party Services" delay={0.1}>
            <p>We use the following third-party services to operate SOUNDWAVE:</p>
            <div style={{ marginTop: "0.75rem" }}>
              <div className="policy-li"><strong style={{ color: "rgba(255,255,255,0.8)" }}>Firebase (Google)</strong> — Database, authentication, and file storage</div>
              <div className="policy-li"><strong style={{ color: "rgba(255,255,255,0.8)" }}>Groq AI</strong> — Powers the WAVE chatbot. Messages are processed by Groq to generate responses</div>
              <div className="policy-li"><strong style={{ color: "rgba(255,255,255,0.8)" }}>CallMeBot</strong> — Sends WhatsApp notifications to our team when orders are placed</div>
              <div className="policy-li"><strong style={{ color: "rgba(255,255,255,0.8)" }}>EmailJS</strong> — Sends order confirmation and enquiry emails</div>
              <div className="policy-li"><strong style={{ color: "rgba(255,255,255,0.8)" }}>Instagram</strong> — Linked as a social media and support channel</div>
            </div>
            <p style={{ marginTop: "0.85rem" }}>
              Each third-party service has its own privacy policy governing how they handle data passed to them.
            </p>
          </Section>

          <Section title="7. We Do Not Sell Your Data" delay={0.11}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              SOUNDWAVE does not sell, rent, trade, or share your personal data with any third party for marketing or commercial purposes — ever. Your data is used solely to operate our business and serve you better.
            </p>
          </Section>

          <Section title="8. Your Rights" delay={0.12}>
            <p>You have the following rights regarding your personal data:</p>
            <div style={{ marginTop: "0.75rem" }}>
              <div className="policy-li">Request access to the data we hold about you</div>
              <div className="policy-li">Request correction of inaccurate data</div>
              <div className="policy-li">Request deletion of your account and associated data</div>
              <div className="policy-li">Withdraw consent to data processing at any time</div>
            </div>
            <p style={{ marginTop: "0.85rem" }}>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:soundwave.sarga@gmail.com" className="policy-link">soundwave.sarga@gmail.com</a>.
            </p>
          </Section>

          <Section title="9. Children's Privacy" delay={0.13}>
            <p>
              Our services are not directed at users under 18 years of age. We do not knowingly collect personal data from minors. If you believe we have inadvertently collected data from a minor, please contact us immediately and we will delete it.
            </p>
          </Section>

          <Section title="10. Applicable Law" delay={0.14}>
            <p>
              This Privacy Policy is governed by the laws of India, specifically the{" "}
              <strong style={{ color: "rgba(255,255,255,0.8)" }}>Information Technology Act 2000</strong> and the{" "}
              <strong style={{ color: "rgba(255,255,255,0.8)" }}>Digital Personal Data Protection Act 2023</strong>.
            </p>
          </Section>

          <Section title="11. Contact for Privacy Concerns" delay={0.15}>
            <div className="policy-li">
              Email: <a href="mailto:soundwave.sarga@gmail.com" className="policy-link">soundwave.sarga@gmail.com</a>
            </div>
            <div className="policy-li">
              WhatsApp: <a href="https://wa.me/919567931330" className="policy-link">+91 95679 31330</a>
            </div>
            <p style={{ marginTop: "1rem" }}>We aim to respond to all privacy-related requests within 5 business days.</p>
          </Section>

          {/* Back link */}
          <div style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link
              href="/"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.06em",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#C9A84C")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              ← Back to SOUNDWAVE
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
