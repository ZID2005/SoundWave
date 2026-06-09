"use client";

import { motion, AnimatePresence, useAnimation, Variants } from "framer-motion";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

/* ─── Price Parsing & Formatting Helpers ─── */
function parsePriceText(priceText: string): number {
  if (!priceText) return 0;
  let cleaned = priceText.replace(/[₹\s]/g, "");
  if (cleaned.includes("-")) {
    cleaned = cleaned.split("-")[0];
  }
  cleaned = cleaned.split("/")[0];
  let multiplier = 1;
  if (cleaned.toLowerCase().endsWith("l")) {
    multiplier = 100000;
    cleaned = cleaned.substring(0, cleaned.length - 1);
  }
  cleaned = cleaned.replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed * multiplier;
}

function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted.replace(/\s/g, "");
}

/* ─── Premium Custom Icons ─── */
const ThinTrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const ThinCartIcon = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: "rgba(201, 168, 76, 0.3)" }}
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckCircleGoldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 11 12 14 22 4" /> {/* standard checkmark offset: */}
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ChatBubbleOutlineIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C13584" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

/* ─── Animated Price Component ─── */
function AnimatedPrice({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(displayValue);

  // Keep the ref updated with the current displayValue
  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    const startValue = displayValueRef.current;
    const endValue = value;
    if (startValue === endValue) return;

    const duration = 400; // ms
    let startTime: number | null = null;

    const animation = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = progress * (2 - progress); // Ease out quad
      const current = Math.round(startValue + (endValue - startValue) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }, [value]);

  return <span>{formatPrice(displayValue)}</span>;
}

/* ─── Summary Row with scale-flash animation ─── */
function SummaryRow({ 
  label, 
  value, 
  isPrice = false,
  isTotal = false 
}: { 
  label: string; 
  value: number; 
  isPrice?: boolean;
  isTotal?: boolean;
}) {
  const controls = useAnimation();
  
  useEffect(() => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.25, ease: "easeOut" }
    });
  }, [value, controls]);

  return (
    <div className="order-summary-row" style={isTotal ? { borderBottom: "none", paddingTop: "20px" } : {}}>
      <span className={isTotal ? "order-summary-total-lbl" : "order-summary-lbl"}>{label}</span>
      <motion.div animate={controls} style={{ display: "inline-block" }}>
        {isTotal ? (
          <span className="order-summary-total-val">
            <AnimatedPrice value={value} />
          </span>
        ) : (
          <span className="order-summary-val">
            {isPrice ? <AnimatedPrice value={value} /> : value}
          </span>
        )}
      </motion.div>
    </div>
  );
}

export default function CartPage() {
  const { items, removeFromCart, clearCart, itemCount, addToCart, decrementQuantity } = useCart();
  const { user, setShowAuthModal } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Modal flow states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"choose" | "confirm" | "engineer">("choose");
  const [confirmStep, setConfirmStep] = useState<"form" | "success">("form");
  const [slideDirection, setSlideDirection] = useState(1); // 1 = forward, -1 = backward
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Prevent SSR flash and handle hydration cleanly
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (items.length === 0) {
      const timer = setTimeout(() => {
        setIsEmpty(true);
      }, 450); // Delay empty state mount to allow exit transitions to finish
      return () => clearTimeout(timer);
    } else {
      setIsEmpty(false);
    }
  }, [items.length, mounted]);

  const handleRemove = (id: string, name: string) => {
    removeFromCart(id);
    toast.success(`${name} removed`);
  };

  const subtotal = items.reduce((total, item) => {
    return total + parsePriceText(item.priceRangeText) * item.quantity;
  }, 0);

  // Modal triggers
  const handleOrderClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSlideDirection(1);
    setModalStep("choose");
    setConfirmStep("form");
    setIsModalOpen(true);
  };

  const handleOverlayClick = () => {
    if (isSendingEmail) return; // Prevent closing overlay when email is sending
    setIsModalOpen(false);
  };

  const handleConfirmOrder = async () => {
    setIsSendingEmail(true);
    
    const emailPromise = (async () => {
      const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
      const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

      const templateParams = {
        customer_name: user?.displayName || user?.email || "Guest User",
        customer_phone: user?.phoneNumber || "N/A",
        customer_email: user?.email || "N/A",
        subject: `New Order — ${user?.displayName || user?.email || "Guest"} — ₹${subtotal.toLocaleString("en-IN")}`,
        order_items: items
          .map(
            (item) =>
              `• Name: ${item.name}\n  Category: ${item.category}\n  Quantity: ${item.quantity}\n  Unit Price: ${formatPrice(
                parsePriceText(item.priceRangeText)
              )}\n  Total: ${formatPrice(parsePriceText(item.priceRangeText) * item.quantity)}`
          )
          .join("\n\n"),
        grand_total: formatPrice(subtotal),
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        to_email: "soundwave31330@gmail.com",
      };

      if (serviceID && templateID && publicKey) {
        await emailjs.send(serviceID, templateID, templateParams, publicKey);
      } else {
        console.log("Mock EmailJS send since keys are missing:", templateParams);
      }
    })();

    try {
      // Force at least 1.5 seconds loading state to show progress animation
      await Promise.all([
        emailPromise,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      setIsSendingEmail(false);
      setConfirmStep("success");
      clearCart();
      toast.success("Order request sent successfully!");
    } catch (err) {
      console.error("EmailJS sending failed:", err);
      setIsSendingEmail(false);
      toast.error("Failed to submit order. Please try again.");
    }
  };

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
    exit: (idx: number) => ({
      x: "-100%",
      opacity: 0,
      transition: {
        delay: idx * 0.03, // Small staggering delay on exit for multiple deletions/clear all
        duration: 0.25,
        ease: "easeIn" as const,
      },
    }),
  };

  const slideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 320 : -320,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -320 : 320,
      opacity: 0,
      transition: {
        duration: 0.25,
        ease: "easeIn" as const,
      },
    }),
  };

  const checkmarkPathVariants: Variants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { duration: 0.8, ease: "easeInOut" as const }
    }
  };

  if (!mounted) {
    return (
      <div 
        className="cart-page-container" 
        style={{ minHeight: "100vh", backgroundColor: "#000000" }} 
      />
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

        .cart-page-container {
          min-height: 100vh;
          background-color: #000000;
          color: #ffffff;
          padding-top: 120px;
          padding-bottom: 120px;
          font-family: 'Inter', sans-serif;
        }

        /* Back to Products Link */
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          color: #86868b;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.3s ease;
          margin-bottom: 32px;
        }
        .back-link:hover {
          color: #C9A84C;
        }

        /* Two-Column Grid */
        .cart-layout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 48px;
          align-items: start;
        }

        /* Headers Row */
        .cart-headers-row {
          display: grid;
          grid-template-columns: 60px 1fr 120px 120px 40px;
          gap: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 8px;
        }
        .cart-header-lbl {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #86868b;
          text-transform: uppercase;
        }

        /* Cart Row */
        .cart-item-row {
          display: grid;
          grid-template-columns: 60px 1fr 120px 120px 40px;
          align-items: center;
          gap: 24px;
          padding: 24px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: transparent;
          transition: background 0.3s ease;
        }
        .cart-item-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        /* Product Details inside list */
        .prod-category {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #C9A84C;
          text-transform: uppercase;
          margin-bottom: 4px;
          display: block;
        }
        .prod-name {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          margin: 0;
          line-height: 1.4;
        }
        .cart-name-link {
          color: inherit;
          text-decoration: none;
          transition: color 0.3s ease;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cart-name-link:hover {
          color: #C9A84C;
        }
        .prod-unit-price {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #86868b;
          margin-top: 4px;
          display: block;
        }

        /* Qty Controls */
        .qty-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .qty-circle-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: transparent;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          transition: border-color 0.3s ease, color 0.3s ease;
        }
        .qty-circle-btn:hover {
          border-color: #C9A84C;
          color: #C9A84C;
        }
        .qty-value-display {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          width: 32px;
          text-align: center;
        }

        /* Item Total Price */
        .item-subtotal-display {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #ffffff;
          text-align: right;
        }

        /* Row Action Delete */
        .row-delete-btn {
          background: transparent;
          border: none;
          color: #86868b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          transition: color 0.3s ease;
          justify-self: end;
        }
        .row-delete-btn:hover {
          color: #ff4444;
        }

        /* Clear All Trigger */
        .clear-all-link {
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          color: #86868b;
          text-transform: uppercase;
          padding: 8px 0;
          transition: color 0.3s ease;
        }
        .clear-all-link:hover {
          color: #ff4444;
        }

        /* Glassmorphic Order Summary Card */
        .order-summary-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          border: 1px solid rgba(201, 168, 76, 0.2);
          padding: 28px;
          position: sticky;
          top: 100px;
        }
        .order-summary-title {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          color: #C9A84C;
          text-transform: uppercase;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .summary-divider-gold {
          height: 1px;
          background: rgba(201, 168, 76, 0.2);
          margin-bottom: 8px;
        }
        .order-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .order-summary-lbl {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #86868b;
        }
        .order-summary-val {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
        }
        .order-summary-total-lbl {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          color: #ffffff;
          font-size: 14px;
        }
        .order-summary-total-val {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 28px;
          color: #C9A84C;
        }
        .order-summary-note {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: #6b6b6b;
          font-style: italic;
          line-height: 1.5;
          margin-top: 20px;
          margin-bottom: 24px;
        }
        .order-summary-btn-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
          margin-bottom: 20px;
        }
        .enquire-order-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 52px;
          border-radius: 980px;
          border: none;
          background: #C9A84C;
          color: #000000;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          margin-bottom: 12px;
          transition: background 0.2s ease;
        }
        .continue-shop-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 48px;
          border-radius: 980px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: transparent;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
        }

        /* Empty State Pill CTA */
        .explore-products-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          padding: 0 32px;
          border-radius: 980px;
          border: 1px solid #C9A84C;
          background: transparent;
          color: #C9A84C;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .explore-products-btn:hover {
          background: #C9A84C;
          color: #000000;
        }

        /* ─── Drifting Aurora Blobs CSS ─── */
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }
        .blob-blue {
          width: 320px;
          height: 320px;
          background: rgba(30, 60, 120, 0.15);
          top: 15%;
          left: 10%;
          animation: blobAnimation1 25s infinite alternate ease-in-out;
        }
        .blob-gold {
          width: 260px;
          height: 260px;
          background: rgba(201, 168, 76, 0.08);
          bottom: 15%;
          right: 10%;
          animation: blobAnimation2 20s infinite alternate ease-in-out;
        }
        .blob-teal {
          width: 280px;
          height: 280px;
          background: rgba(0, 161, 179, 0.08);
          top: 40%;
          left: 30%;
          animation: blobAnimation3 22s infinite alternate ease-in-out;
        }

        @keyframes blobAnimation1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, -70px) scale(1.1); }
          66% { transform: translate(-40px, 50px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes blobAnimation2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-80px, 60px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes blobAnimation3 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-30px, -50px) scale(0.95); }
          66% { transform: translate(50px, -25px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        /* ─── Modal Styles ─── */
        .modal-overlay-bg {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .modal-card-container {
          position: relative;
          max-width: 480px;
          width: 90%;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 36px;
          overflow: hidden;
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }
        .modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: #86868b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          transition: color 0.2s ease;
          z-index: 12;
        }
        .modal-close-btn:hover {
          color: #ffffff;
        }
        .modal-step-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .step-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .step-dot.active {
          background: #C9A84C;
          box-shadow: 0 0 8px rgba(201, 168, 76, 0.6);
        }
        .modal-back-btn {
          background: transparent;
          border: none;
          color: #86868b;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 24px;
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s ease;
        }
        .modal-back-btn:hover {
          color: #ffffff;
        }

        /* Option cards (Step 1) */
        .option-card {
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: border-color 0.2s ease, background-color 0.2s ease;
          min-height: 156px;
        }
        .option-a {
          background: rgba(201, 168, 76, 0.08);
          border: 1px solid rgba(201, 168, 76, 0.3);
        }
        .option-a:hover {
          border-color: #C9A84C;
          background: rgba(201, 168, 76, 0.12);
        }
        .option-b {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .option-b:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }
        .option-icon-wrap {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 32px;
        }
        .option-title {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 6px 0;
        }
        .option-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #86868b;
          margin: 0;
          line-height: 1.35;
        }

        /* Connect buttons (Step 2b) */
        .connect-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          padding: 12px 18px;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.2s ease, background-color 0.2s ease;
          margin-bottom: 12px;
        }
        .connect-btn-whatsapp {
          background: rgba(37, 211, 102, 0.12);
          border: 1px solid rgba(37, 211, 102, 0.3);
          border-radius: 14px;
        }
        .connect-btn-whatsapp:hover {
          border-color: #25D366;
          background: rgba(37, 211, 102, 0.18);
        }
        .connect-btn-instagram {
          background: rgba(193, 53, 132, 0.1);
          border: 1px solid rgba(193, 53, 132, 0.3);
          border-radius: 14px;
        }
        .connect-btn-instagram:hover {
          border-color: #C13584;
          background: rgba(193, 53, 132, 0.15);
        }
        .connect-btn-email {
          background: rgba(201, 168, 76, 0.08);
          border: 1px solid rgba(201, 168, 76, 0.2);
          border-radius: 14px;
        }
        .connect-btn-email:hover {
          border-color: #C9A84C;
          background: rgba(201, 168, 76, 0.14);
        }
        .connect-btn-text-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .connect-btn-title {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }
        .connect-btn-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #86868b;
          margin: 2px 0 0 0;
        }

        /* Responsive Layouts */
        @media (max-width: 900px) {
          .cart-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }

        @media (max-width: 768px) {
          .cart-headers-row {
            display: none !important;
          }
          .cart-item-row {
            grid-template-columns: 60px 1fr auto !important;
            grid-template-rows: auto auto !important;
            row-gap: 16px !important;
            column-gap: 16px !important;
            padding: 20px 0 !important;
          }
          .cart-item-row-details {
            grid-column: 2 / 3 !important;
          }
          .cart-item-row-qty {
            grid-column: 2 / 3 !important;
            grid-row: 2 !important;
            justify-self: start !important;
          }
          .cart-item-row-total {
            grid-column: 3 / 4 !important;
            grid-row: 2 !important;
            align-self: center !important;
          }
          .cart-item-row-delete {
            grid-column: 3 / 4 !important;
            grid-row: 1 !important;
            justify-self: end !important;
            align-self: start !important;
          }
          .modal-card-container {
            width: 95% !important;
            padding: 24px !important;
          }
        }
      `}</style>

      <div className="cart-page-container">
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          
          {/* ─── PAGE HEADER ─── */}
          <div style={{ marginBottom: "56px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
              <Link href="/products" className="back-link">
                ← Back to Products
              </Link>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  margin: 0,
                }}
              >
                Your Selection
              </motion.p>
              
              <div style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "80px",
                    fontWeight: 300,
                    letterSpacing: "0.05em",
                    color: "#ffffff",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  CART
                </motion.h1>
                
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "#86868b",
                    fontStyle: "italic",
                    textTransform: "uppercase",
                  }}
                >
                  {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
                </motion.span>
              </div>
              
              {/* Drawing Gold Divider from Left to Right */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                style={{
                  width: "60px",
                  height: "1px",
                  background: "#C9A84C",
                  originX: 0,
                  marginTop: "12px",
                }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isEmpty ? (
              /* ─── EMPTY CART STATE ─── */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: "80px",
                  paddingBottom: "80px",
                  textAlign: "center",
                  gap: "24px",
                }}
              >
                <ThinCartIcon />
                <div>
                  <h2
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "17px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      color: "#ffffff",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    YOUR CART IS EMPTY
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      color: "#86868b",
                      margin: 0,
                    }}
                  >
                    Discover our premium audio collection
                  </p>
                </div>
                <Link href="/products" className="explore-products-btn">
                  EXPLORE PRODUCTS
                </Link>
              </motion.div>
            ) : (
              /* ─── Populated Cart Page (Two Column Layout) ─── */
              <motion.div
                key="cart-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="cart-layout-grid"
              >
                {/* LEFT COLUMN: Items List */}
                <div>
                  {/* Table headers row */}
                  <div className="cart-headers-row">
                    <div />
                    <div className="cart-header-lbl" style={{ textAlign: "left" }}>PRODUCT</div>
                    <div className="cart-header-lbl" style={{ textAlign: "center" }}>QTY</div>
                    <div className="cart-header-lbl" style={{ textAlign: "right" }}>PRICE</div>
                    <div />
                  </div>
                  
                  {/* Staggered Item Rows */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    <AnimatePresence initial={false}>
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          custom={idx}
                          variants={itemVariants}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                          layout
                          className="cart-item-row"
                        >
                          {/* Image Column */}
                          <div
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              background: "#1d1d1f",
                            }}
                          >
                            {item.image && item.image !== "placeholder" ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: "12px",
                                  color: "rgba(201,168,76,0.12)",
                                  letterSpacing: "0.2em",
                                }}
                              >
                                SW
                              </div>
                            )}
                          </div>

                          {/* Details Column */}
                          <div className="cart-item-row-details" style={{ minWidth: 0 }}>
                            <span className="prod-category">{item.category.replace("-", " ")}</span>
                            <h3 className="prod-name">
                              <Link href={`/products/${item.id}`} className="cart-name-link">
                                {item.name}
                              </Link>
                            </h3>
                            <span className="prod-unit-price">
                              {formatPrice(parsePriceText(item.priceRangeText))} each
                            </span>
                          </div>

                          {/* Qty Controls Column */}
                          <div className="cart-item-row-qty qty-container">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              className="qty-circle-btn"
                              onClick={() => decrementQuantity(item.id)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </motion.button>
                            <span className="qty-value-display">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              className="qty-circle-btn"
                              onClick={() => addToCart(item)}
                              aria-label="Increase quantity"
                            >
                              +
                            </motion.button>
                          </div>

                          {/* Item Total Price Column */}
                          <div className="cart-item-row-total item-subtotal-display">
                            <AnimatedPrice value={parsePriceText(item.priceRangeText) * item.quantity} />
                          </div>

                          {/* Remove Row Column */}
                          <div className="cart-item-row-delete">
                            <button
                              className="row-delete-btn"
                              onClick={() => handleRemove(item.id, item.name)}
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <ThinTrashIcon />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  {/* CLEAR ALL Link */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                    <button
                      className="clear-all-link"
                      onClick={() => {
                        clearCart();
                        toast.success("Cart cleared");
                      }}
                    >
                      CLEAR ALL
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: Order Summary Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  className="order-summary-card"
                >
                  <h2 className="order-summary-title">ORDER SUMMARY</h2>
                  <div className="summary-divider-gold" />
                  
                  <div style={{ marginBottom: "20px" }}>
                    <SummaryRow label="Products" value={items.length} />
                    <SummaryRow label="Total Items" value={itemCount} />
                    <SummaryRow label="Subtotal" value={subtotal} isPrice={true} />
                    <SummaryRow label="TOTAL" value={subtotal} isPrice={true} isTotal={true} />
                  </div>
                  
                  <p className="order-summary-note">
                    Final pricing confirmed at order. Taxes and delivery calculated separately.
                  </p>
                  
                  <div className="order-summary-btn-divider" />
                  
                  <motion.button
                    onClick={handleOrderClick}
                    className="enquire-order-btn"
                    whileHover={{ backgroundColor: "#b8852a" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    ENQUIRE NOW / PLACE ORDER
                    <FaArrowRight size={11} style={{ marginLeft: "8px" }} />
                  </motion.button>
                  
                  <motion.a
                    href="/products"
                    className="continue-shop-btn"
                    whileHover={{ borderColor: "#C9A84C", color: "#C9A84C" }}
                    whileTap={{ scale: 0.97 }}
                    style={{ textDecoration: "none" }}
                  >
                    CONTINUE SHOPPING
                  </motion.a>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── CHECKOUT DIALOG MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="checkout-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="modal-overlay-bg"
            onClick={handleOverlayClick}
          >
            {/* Drifting aurora blobs inside overlay */}
            <div className="aurora-blob blob-blue" />
            <div className="aurora-blob blob-gold" />
            <div className="aurora-blob blob-teal" />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="modal-card-container"
              onClick={(e) => e.stopPropagation()} // Prevent close on card click
            >
              {/* Shimmer top line runs left-to-right once on entrance */}
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: 0,
                  height: "1.5px",
                  width: "50%",
                  background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                  zIndex: 999,
                }}
              />

              {/* Progress Loading Bar (Step 2A Sending) */}
              {isSendingEmail && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", backgroundColor: "rgba(201,168,76,0.1)", overflow: "hidden", zIndex: 1000 }}>
                  <motion.div
                    initial={{ left: "-100%", width: "100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                    style={{
                      position: "absolute",
                      top: 0,
                      height: "100%",
                      width: "100%",
                      background: "#C9A84C",
                      boxShadow: "0 0 8px #C9A84C",
                    }}
                  />
                </div>
              )}

              {/* Close Button top-right */}
              {confirmStep !== "success" && (
                <button
                  className="modal-close-btn"
                  onClick={() => {
                    if (isSendingEmail) return;
                    setIsModalOpen(false);
                  }}
                  aria-label="Close modal"
                  disabled={isSendingEmail}
                >
                  <CloseIcon />
                </button>
              )}

              {/* Step indicator dots at top */}
              {confirmStep !== "success" && (
                <div className="modal-step-dots">
                  <div className={`step-dot ${modalStep === "choose" ? "active" : ""}`} />
                  <div className={`step-dot ${modalStep !== "choose" ? "active" : ""}`} />
                </div>
              )}

              {/* Sliding step wrapper */}
              <div style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
                  {/* STEP 1: Choose flow */}
                  {modalStep === "choose" && (
                    <motion.div
                      key="step-choose"
                      custom={slideDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ width: "100%", display: "flex", flexDirection: "column" }}
                    >
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.18em",
                          color: "#C9A84C",
                          textAlign: "center",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      >
                        YOUR ORDER
                      </span>
                      <h2
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "#ffffff",
                          textAlign: "center",
                          margin: "0 0 8px 0",
                          lineHeight: 1.3,
                        }}
                      >
                        How would you like to proceed?
                      </h2>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "13px",
                          color: "#86868b",
                          textAlign: "center",
                          margin: "0 0 16px 0",
                          lineHeight: 1.4,
                        }}
                      >
                        Choose how you&apos;d like to complete your order with our team.
                      </p>
                      
                      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "8px 0 16px 0" }} />

                      {/* Mini Summary Card */}
                      <div
                        style={{
                          backgroundColor: "#1d1d1f",
                          borderRadius: "12px",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ maxHeight: "104px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {items.map((item) => (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#e3e3e3" }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>
                                {item.name} <span style={{ color: "#86868b", fontSize: "11px" }}>x{item.quantity}</span>
                              </span>
                              <span style={{ fontWeight: 500, flexShrink: 0 }}>
                                {formatPrice(parsePriceText(item.priceRangeText) * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", fontWeight: "bold", color: "#C9A84C" }}>
                          <span>Total</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                      </div>

                      {/* Options Side-by-Side */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSlideDirection(1);
                            setModalStep("confirm");
                            setConfirmStep("form");
                          }}
                          className="option-card option-a"
                        >
                          <div className="option-icon-wrap">
                            <CheckCircleGoldIcon />
                          </div>
                          <h3 className="option-title">Confirm Order</h3>
                          <p className="option-subtitle">We&apos;ll send your order details to our team</p>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSlideDirection(1);
                            setModalStep("engineer");
                          }}
                          className="option-card option-b"
                        >
                          <div className="option-icon-wrap">
                            <ChatBubbleOutlineIcon />
                          </div>
                          <h3 className="option-title">Talk to Engineer</h3>
                          <p className="option-subtitle">Have questions? Connect with our team directly</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2A: Confirm Order Flow */}
                  {modalStep === "confirm" && (
                    <motion.div
                      key="step-confirm"
                      custom={slideDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ width: "100%", display: "flex", flexDirection: "column" }}
                    >
                      <AnimatePresence mode="wait">
                        {confirmStep === "form" ? (
                          /* ─── Confirm Form State ─── */
                          <motion.div
                            key="confirm-form-substate"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <h2
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "20px",
                                fontWeight: 600,
                                color: "#ffffff",
                                textAlign: "center",
                                margin: "0 0 16px 0",
                              }}
                            >
                              Confirm Your Order
                            </h2>

                            {/* Mini Summary Card */}
                            <div
                              style={{
                                backgroundColor: "#1d1d1f",
                                borderRadius: "12px",
                                padding: "14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                marginBottom: "16px",
                              }}
                            >
                              <div style={{ maxHeight: "104px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {items.map((item) => (
                                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#e3e3e3" }}>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>
                                      {item.name} <span style={{ color: "#86868b", fontSize: "11px" }}>x{item.quantity}</span>
                                    </span>
                                    <span style={{ fontWeight: 500, flexShrink: 0 }}>
                                      {formatPrice(parsePriceText(item.priceRangeText) * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", fontWeight: "bold", color: "#C9A84C" }}>
                                <span>Total</span>
                                <span>{formatPrice(subtotal)}</span>
                              </div>
                            </div>

                            <p
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "13px",
                                color: "#86868b",
                                lineHeight: 1.6,
                                margin: "0 0 24px 0",
                                textAlign: "center",
                              }}
                            >
                              Your order details including product specifications, quantity, and pricing will be sent to our team at <strong style={{ color: "#ffffff" }}>soundwave31330@gmail.com</strong>. We will contact you within 24 hours to confirm on {user?.phoneNumber ? "your registered number" : `your registered email: ${user?.email || ""}`}.
                            </p>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={handleConfirmOrder}
                              disabled={isSendingEmail}
                              className="place-order-btn"
                              style={{ height: "48px", cursor: isSendingEmail ? "not-allowed" : "pointer" }}
                            >
                              {isSendingEmail ? "SENDING ORDER..." : "SEND CONFIRMATION"}
                            </motion.button>
                          </motion.div>
                        ) : (
                          /* ─── Success Confirmation State ─── */
                          <motion.div
                            key="confirm-success-substate"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: "20px" }}
                          >
                            {/* Animated gold checkmark draws itself */}
                            <svg width="80" height="80" viewBox="0 0 80 80" style={{ marginBottom: "20px" }}>
                              <circle cx="40" cy="40" r="36" stroke="rgba(201, 168, 76, 0.2)" strokeWidth="2" fill="none" />
                              <motion.path
                                d="M26 40 L36 50 L56 30"
                                fill="none"
                                stroke="#C9A84C"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                variants={checkmarkPathVariants}
                                initial="hidden"
                                animate="visible"
                              />
                            </svg>

                            <h2
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "22px",
                                fontWeight: 600,
                                color: "#ffffff",
                                margin: "0 0 12px 0",
                              }}
                            >
                              Order Submitted!
                            </h2>

                            <p
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "14px",
                                color: "#86868b",
                                lineHeight: 1.6,
                                margin: "0 0 24px 0",
                                padding: "0 10px",
                              }}
                            >
                              Your order details have been sent to our team. We&apos;ll reach out to you shortly on {user?.phoneNumber ? "your registered number" : `your registered email: ${user?.email || ""}`}.
                            </p>

                            <Link
                              href="/products"
                              onClick={() => setIsModalOpen(false)}
                              className="explore-products-btn"
                              style={{
                                backgroundColor: "#C9A84C",
                                color: "#000000",
                                width: "100%",
                                height: "48px",
                                borderRadius: "980px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textDecoration: "none",
                                fontWeight: 600,
                              }}
                            >
                              BACK TO SHOPPING
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Back to Step 1 Button */}
                      {confirmStep === "form" && !isSendingEmail && (
                        <button
                          onClick={() => {
                            setSlideDirection(-1);
                            setModalStep("choose");
                          }}
                          className="modal-back-btn"
                        >
                          ← Back
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 2B: Talk to Engineer Flow */}
                  {modalStep === "engineer" && (
                    <motion.div
                      key="step-engineer"
                      custom={slideDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      style={{ width: "100%", display: "flex", flexDirection: "column" }}
                    >
                      <h2
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "#ffffff",
                          textAlign: "center",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Connect With Our Team
                      </h2>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "13px",
                          color: "#86868b",
                          textAlign: "center",
                          margin: "0 0 24px 0",
                          lineHeight: 1.4,
                        }}
                      >
                        Our audio engineers are ready to help you make the right choice.
                      </p>

                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/919567931330?text=${encodeURIComponent(`Hi, I have a query about my SOUNDWAVE order. Cart Total: ${formatPrice(subtotal)}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="connect-btn connect-btn-whatsapp"
                      >
                        <WhatsAppIcon />
                        <div className="connect-btn-text-container">
                          <span className="connect-btn-title">Chat on WhatsApp</span>
                          <span className="connect-btn-subtitle">+91 95679 31330</span>
                        </div>
                      </a>

                      {/* Instagram Button */}
                      <a
                        href="https://www.instagram.com/soundwave.gear?igsh=MXNxaTA0Mjh4ZWs0dQ=="
                        target="_blank"
                        rel="noopener noreferrer"
                        className="connect-btn connect-btn-instagram"
                      >
                        <InstagramIcon />
                        <div className="connect-btn-text-container">
                          <span className="connect-btn-title">Message on Instagram</span>
                          <span className="connect-btn-subtitle">@soundwave.gear</span>
                        </div>
                      </a>

                      {/* Email Button */}
                      <a
                        href="mailto:soundwave31330@gmail.com"
                        className="connect-btn connect-btn-email"
                      >
                        <EmailIcon />
                        <div className="connect-btn-text-container">
                          <span className="connect-btn-title">Send an Email</span>
                          <span className="connect-btn-subtitle">soundwave31330@gmail.com</span>
                        </div>
                      </a>

                      {/* Back to Step 1 Button */}
                      <button
                        onClick={() => {
                          setSlideDirection(-1);
                          setModalStep("choose");
                        }}
                        className="modal-back-btn"
                      >
                        ← Back
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
