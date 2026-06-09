"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

/* ── FAQ Data ── */
const faqCategories = [
  {
    id: "ordering",
    label: "Ordering & Pricing",
    items: [
      {
        q: "How does pricing work for custom builds?",
        a: "Our Build Your Sound configurator lets you choose your equipment type, technology, and tier. Tier ranges are: Essential (₹25,000–₹35,000), Premium (₹75,000–₹2,00,000), and APEX (₹2,00,000+). After you submit your configuration, our team will contact you within 24 hours to confirm the final price based on your exact specifications.",
      },
      {
        q: "Are the prices on the products page fixed?",
        a: "Yes — products listed on our Products page have fixed, final prices. Custom builds are priced after our team reviews your configuration and confirms the final specification with you.",
      },
      {
        q: "How do I place an order?",
        a: "Add products to your cart and click \"Enquire Now / Place Order\". You can confirm your order directly or choose to chat with our engineers first using the Talk to an Engineer option. Our team will then contact you to finalize everything — price, specifications, and delivery timeline.",
      },
      {
        q: "Do you accept online payments?",
        a: "Currently we confirm orders through our team and arrange payment directly — either via bank transfer, UPI, or in-person depending on your location. No online payment is taken through the website itself.",
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard products typically ship within 7–14 business days. Custom built systems may take 3–6 weeks depending on the complexity of your specifications and component availability. The exact timeline will be confirmed at order acceptance.",
      },
      {
        q: "Do you deliver across India?",
        a: "Yes, we deliver pan-India. Delivery charges are calculated based on your location and will be communicated at order confirmation before any payment is required.",
      },
    ],
  },
  {
    id: "warranty",
    label: "Warranty & Repairs",
    items: [
      {
        q: "What does the warranty cover?",
        a: "All SOUNDWAVE products come with a 1 year warranty from the date of delivery, covering manufacturing defects and component failure under normal use. It does not cover physical damage, water damage, misuse, or unauthorized modifications.",
      },
      {
        q: "What happens if something breaks after warranty?",
        a: "We offer professional repair services for out-of-warranty products. Component replacement charges apply at current market rates. Contact us for a repair assessment and quote — all charges are communicated before any work begins.",
      },
      {
        q: "Can I return a product?",
        a: "As all our products are premium custom-built equipment, we do not accept returns unless there is a manufacturing defect covered under warranty. If you believe your product has a defect, please contact us promptly within the warranty period and we will assess it.",
      },
    ],
  },
  {
    id: "technical",
    label: "Technical",
    items: [
      {
        q: "What is the difference between Solid State, Hybrid, and Class D amplifiers?",
        a: "Solid State amplifiers use transistors — they are reliable, powerful, and deliver consistent performance across all volume levels. Hybrid amplifiers combine vacuum tube warmth with solid state reliability, giving you the best of both worlds. Class D amplifiers are highly efficient with minimal heat output and are ideal for modern setups. For a more detailed comparison tailored to your use case, ask WAVE!",
      },
      {
        q: "Can I customize the color of my build?",
        a: "Yes — color and finish selection is available as Step 4 in our Build Your Sound configurator. We offer a range of premium finishes for custom orders.",
      },
    ],
  },
  {
    id: "wave",
    label: "WAVE AI Assistant",
    items: [
      {
        q: "What is the WAVE AI assistant?",
        a: "WAVE is SOUNDWAVE's built-in AI audio expert powered by Groq. It can help you understand audio concepts like Dolby Atmos, Hi-Fi, lossless audio, impedance, and room acoustics. It can compare products, recommend the right amplifier or speaker system for your room, help you plan a home theater, and answer virtually any sound-related question — for beginners and enthusiasts alike.",
      },
      {
        q: "How do I access WAVE?",
        a: "Look for the WAVE chat button at the bottom right of any page on the SOUNDWAVE website. Click it to start a conversation instantly — no account required.",
      },
      {
        q: "Can WAVE help me choose between products in my cart?",
        a: "Yes! WAVE can analyze the products you are considering and recommend which one best suits your needs, room size, listening habits, and budget. Just describe your setup and ask — WAVE will guide you.",
      },
      {
        q: "Is my conversation with WAVE private?",
        a: "Your chat messages are processed by Groq AI to generate responses — this is necessary for WAVE to function. We do not permanently store your chat history. Please do not share sensitive personal or payment information in the chat. See our Privacy Policy for full details.",
      },
      {
        q: "Can WAVE place an order for me?",
        a: "No — WAVE is an informational assistant only. To place an order, add products to your cart and use the Enquire Now button. WAVE can guide you to the right products but cannot process orders or payments.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & Support",
    items: [
      {
        q: "How do I create an account?",
        a: "Click LOGIN at the top right of the website. You can sign up using your phone number with OTP verification, or using your email address and password. Phone sign-up is the fastest method.",
      },
      {
        q: "Is my personal data safe?",
        a: "Yes. All data is stored securely on Firebase (Google Cloud infrastructure), encrypted in transit and at rest. We never sell your data to any third party. See our Privacy Policy for complete details.",
      },
      {
        q: "How can I contact support?",
        a: "WhatsApp: +91 95679 31330 (fastest — typically reply within 2 hours) / Email: soundwave31330@gmail.com / Instagram: @soundwave.gear. Or just ask WAVE for instant help with any product or audio question!",
      },
    ],
  },
];

/* ── Accordion Item ── */
function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        borderLeft: isOpen ? "3px solid #C9A84C" : "3px solid transparent",
        transition: "border-color 0.25s ease",
        paddingLeft: isOpen ? "1rem" : "0",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.15rem 0.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.97rem",
            fontWeight: 500,
            color: isOpen ? "#ffffff" : "rgba(255,255,255,0.82)",
            lineHeight: 1.5,
            transition: "color 0.2s",
          }}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          style={{
            flexShrink: 0,
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            border: `1px solid ${isOpen ? "#C9A84C" : "rgba(255,255,255,0.15)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isOpen ? "#C9A84C" : "rgba(255,255,255,0.4)",
            fontSize: "14px",
            fontWeight: 400,
            transition: "border-color 0.2s, color 0.2s",
          }}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.9rem",
                fontWeight: 400,
                color: "#86868b",
                lineHeight: 1.8,
                padding: "0 0.25rem 1.2rem",
              }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Category Group ── */
function CategoryGroup({ category, openId, setOpenId }: {
  category: typeof faqCategories[0];
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={{ marginBottom: "3rem" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)",
            letterSpacing: "0.14em",
            color: "#C9A84C",
            fontWeight: 600,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {category.label}
        </h2>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </div>

      <div>
        {category.items.map((item, idx) => {
          const id = `${category.id}-${idx}`;
          return (
            <AccordionItem
              key={id}
              question={item.q}
              answer={item.a}
              isOpen={openId === id}
              onToggle={() => setOpenId(openId === id ? null : id)}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500&display=swap');
      `}</style>

      <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "6rem" }}>

        {/* Hero */}
        <div
          style={{
            padding: "6rem 1.5rem 4rem",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
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
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.28em",
              color: "#C9A84C",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            Help Center
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2rem, 6vw, 3.8rem)",
              letterSpacing: "0.14em",
              color: "#ffffff",
              fontWeight: 600,
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: "1.2rem",
            }}
          >
            Frequently Asked Questions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.45)",
              maxWidth: "480px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Everything you need to know about SOUNDWAVE
          </motion.p>

          {/* Category quick-nav pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              justifyContent: "center",
              marginTop: "2.5rem",
            }}
          >
            {faqCategories.map(cat => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "980px",
                  padding: "0.4rem 1rem",
                  textDecoration: "none",
                  transition: "color 0.2s, border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#C9A84C";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
                  e.currentTarget.style.background = "rgba(201,168,76,0.06)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
              >
                {cat.label}
              </a>
            ))}
          </motion.div>
        </div>

        {/* FAQ Content */}
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "4rem 1.5rem 0" }}>
          {faqCategories.map(cat => (
            <div key={cat.id} id={cat.id}>
              <CategoryGroup category={cat} openId={openId} setOpenId={setOpenId} />
            </div>
          ))}

          {/* Still have questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            style={{
              marginTop: "2rem",
              padding: "2.5rem",
              background: "rgba(201,168,76,0.04)",
              border: "1px solid rgba(201,168,76,0.14)",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1.6rem",
                color: "#ffffff",
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginBottom: "0.6rem",
              }}
            >
              Still have a question?
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.45)",
                marginBottom: "1.5rem",
                lineHeight: 1.7,
              }}
            >
              Ask WAVE instantly, or reach out to our team directly.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
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
                  padding: "0.7rem 1.75rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(201,168,76,0.3)",
                  transition: "filter 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.filter = "brightness(1.1)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.45)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.filter = "brightness(1)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(201,168,76,0.3)";
                }}
              >
                Ask WAVE →
              </button>
              <Link
                href="/support"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.65)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "980px",
                  padding: "0.7rem 1.75rem",
                  textDecoration: "none",
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
              >
                Contact Support
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
