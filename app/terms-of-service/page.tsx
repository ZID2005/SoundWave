"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="border-t border-white/[0.07] pt-10 mt-10"
    >
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)",
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

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", paddingLeft: "1.25rem", marginBottom: "0.5rem" }}>
      <span style={{ position: "absolute", left: 0, color: "#C9A84C", opacity: 0.65 }}>—</span>
      {children}
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{children}</strong>;
}

export default function TermsOfServicePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        .tos-link { color: #C9A84C; text-decoration: none; border-bottom: 1px solid rgba(201,168,76,0.3); transition: border-color 0.2s; }
        .tos-link:hover { border-color: #C9A84C; }
      `}</style>

      <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "6rem" }}>

        {/* Hero */}
        <div
          style={{
            padding: "6rem 1.5rem 3rem",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
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
            Terms of Service
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
            Please read these Terms of Service carefully before using the SOUNDWAVE website. By accessing or using our website, you agree to be bound by these terms. If you do not agree, please do not use our services.
          </motion.p>

          <Section title="1. Acceptance of Terms">
            <p>By visiting, browsing, or placing an enquiry through the SOUNDWAVE website, you confirm that you have read, understood, and agree to these Terms of Service. These terms apply to all visitors, users, and customers.</p>
          </Section>

          <Section title="2. Products">
            <p>
              All SOUNDWAVE products are <Highlight>premium, custom-built audio equipment</Highlight> crafted with care by our engineering team. Product images shown on the website are representative of the final product. Due to the nature of custom builds, the final product may vary slightly based on component availability and manufacturing tolerances — while maintaining the same quality and specifications.
            </p>
          </Section>

          <Section title="3. Pricing">
            <p>
              Prices listed on our Products page are <Highlight>fixed and final</Highlight>. For custom builds submitted through the Build Your Sound configurator, listed tier ranges are indicative only:
            </p>
            <div style={{ margin: "0.85rem 0", padding: "1rem 1.25rem", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: "10px" }}>
              <BulletItem><Highlight>Essential:</Highlight> ₹25,000 – ₹35,000</BulletItem>
              <BulletItem><Highlight>Premium:</Highlight> ₹75,000 – ₹2,00,000</BulletItem>
              <BulletItem><Highlight>APEX:</Highlight> ₹2,00,000 and above</BulletItem>
            </div>
            <p>
              Final pricing for custom builds is confirmed by our team after reviewing your configuration. <Highlight>No payment is taken until pricing is confirmed and agreed upon by both parties.</Highlight>
            </p>
          </Section>

          <Section title="4. Orders & Confirmation">
            <p>
              Submitting a cart enquiry or a custom build configuration does not constitute a confirmed order. All orders are confirmed only after our team contacts you, reviews the specifications, and both parties agree on the final price and delivery timeline. A confirmed order is one where both parties have explicitly agreed in writing (via WhatsApp, email, or otherwise).
            </p>
          </Section>

          <Section title="5. Custom Builds">
            <p>
              Custom configured systems are built to order and are unique to each customer&apos;s specifications. Once an order is <Highlight>confirmed and production begins</Highlight>, cancellation may not be possible, as components will have been sourced and assembly commenced. Please ensure you are satisfied with the confirmed specifications before approving production.
            </p>
          </Section>

          <Section title="6. WAVE AI Assistant">
            <p>WAVE is SOUNDWAVE&apos;s built-in AI audio assistant. Please note the following important limitations:</p>
            <div style={{ marginTop: "0.85rem" }}>
              <BulletItem>WAVE is powered by AI and provided for <Highlight>informational and guidance purposes only</Highlight></BulletItem>
              <BulletItem>WAVE&apos;s responses are generated by AI and may not always be perfectly accurate or up to date</BulletItem>
              <BulletItem>WAVE <Highlight>should not be used as the sole basis</Highlight> for making purchasing decisions — always confirm with our engineering team</BulletItem>
              <BulletItem>Do <Highlight>not share sensitive personal, financial, or payment information</Highlight> in the WAVE chat</BulletItem>
              <BulletItem>SOUNDWAVE is not liable for any decisions made based solely on WAVE AI responses</BulletItem>
            </div>
          </Section>

          <Section title="7. Warranty">
            <p>
              All SOUNDWAVE products come with a <Highlight>1 year warranty</Highlight> from the date of delivery, covering manufacturing defects and component failure under normal use.
            </p>
            <p style={{ marginTop: "0.75rem" }}>The warranty does <Highlight>not</Highlight> cover:</p>
            <div style={{ marginTop: "0.5rem" }}>
              <BulletItem>Physical damage from drops, impacts, or mishandling</BulletItem>
              <BulletItem>Water or moisture damage</BulletItem>
              <BulletItem>Misuse or operation outside specified parameters</BulletItem>
              <BulletItem>Unauthorized modifications or repairs</BulletItem>
            </div>
          </Section>

          <Section title="8. Repairs">
            <p>
              We offer professional repair services for out-of-warranty products. All repair charges will be communicated to you before any work begins. You will have the opportunity to approve or decline the quote. Component replacement charges apply at current market rates.
            </p>
          </Section>

          <Section title="9. Delivery">
            <p>
              Delivery timelines are communicated at the time of order confirmation. We deliver pan-India. Delivery charges are calculated based on your location and communicated before order finalisation. SOUNDWAVE is not liable for delays caused by courier partners, natural events, or circumstances beyond our control.
            </p>
          </Section>

          <Section title="10. Returns">
            <p>
              As all SOUNDWAVE products are premium custom-built equipment, we do not accept returns unless there is a verified manufacturing defect covered under warranty. If you believe your product has a manufacturing defect, please contact us within the warranty period.
            </p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              SOUNDWAVE shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or services. Our maximum liability in any circumstance is limited to the amount paid for the specific product in question.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms of Service are governed by the laws of India. Any disputes arising from these terms or the use of SOUNDWAVE services shall be subject to the exclusive jurisdiction of the courts in Kerala, India.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <BulletItem>
              Email: <a href="mailto:soundwave31330@gmail.com" className="tos-link">soundwave31330@gmail.com</a>
            </BulletItem>
            <BulletItem>
              WhatsApp: <a href="https://wa.me/919567931330" className="tos-link">+91 95679 31330</a>
            </BulletItem>
          </Section>

          <div style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link
              href="/"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.06em",
                textDecoration: "none",
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
