"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView, Variants } from "framer-motion";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import WishlistButton from "@/components/WishlistButton";
import Loading from "@/components/Loading";
import { FaShoppingCart, FaCheck, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";
import { dummyProducts, getProductById, getRelatedFromCache } from "@/lib/products";

/* ─── Scroll-progress hook ──────────────────────────────────────────────── */
function useScrollProgress(ref: React.RefObject<HTMLDivElement>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const trackable = ref.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(Math.max(0, Math.min(1, scrolled / trackable)));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [ref]);
  return progress;
}

/* ─── Reveal-on-scroll wrapper ──────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  y = 20,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.55s ease-out ${delay}s, transform 0.55s ease-out ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Panel feature data — per product ─────────────────────────────────── */
type PanelFeature = { title: string; desc: string; highlight: boolean };
type Panel = { id: string; label: string; heading: string; features: PanelFeature[] };

const PANELS_MAP: Record<string, Panel[]> = {
  "yamaha-3inch-bookshelf-speaker": [
    {
      id: "front",
      label: "01  DRIVERS",
      heading: "Open Drivers View",
      features: [
        { title: "Yamaha Woofer", desc: "Premium 3-inch Yamaha woofer driver engineered for precise mid-bass response", highlight: true },
        { title: "High-Frequency Tweeter", desc: "Integrated high-frequency dome tweeter delivering crisp, detailed treble", highlight: false },
        { title: "50W RMS Power", desc: "50 Watts RMS continuous power handling capability for clean, distortion-free output", highlight: true },
        { title: "Optimized Porting", desc: "Precision front-firing bass port for extended low-frequency response", highlight: false },
      ],
    },
    {
      id: "grille",
      label: "02  GRILLE",
      heading: "Acoustic Grilles",
      features: [
        { title: "Removable Design", desc: "Detachable black fabric grilles that easily snap on or off for styling preference", highlight: false },
        { title: "Acoustic Transparency", desc: "Premium acoustically transparent black cloth that preserves pristine sound wave projection", highlight: true },
        { title: "Minimalist Aesthetic", desc: "Clean front presentation when covered, hiding the drivers for an elegant decor blend", highlight: false },
        { title: "Dust Protection", desc: "Keeps drivers and ports safe from dust and external elements", highlight: false },
      ],
    },
    {
      id: "rear",
      label: "03  REAR",
      heading: "Rear Terminal View",
      features: [
        { title: "Spring Terminals", desc: "★ Color-coded red/black spring terminals for secure and reliable speaker wire connections", highlight: true },
        { title: "Walnut Wood Veneer", desc: "Premium handcrafted walnut wood cabinets offering a stunning, timeless aesthetic", highlight: true },
        { title: "Class-D Crossover", desc: "★ Custom crossover network specifically built and tuned for Class-D digital amplifiers", highlight: false },
        { title: "Stereo Imaging", desc: "A perfectly matched acoustic pair designed for wide and detailed stereo soundstage representation", highlight: false },
      ],
    },
  ],
  "bluetooth-pro-preamp": [
    {
      id: "front",
      label: "01  FRONT",
      heading: "Front Panel",
      features: [
        { title: "Bass + Triple Mid EQ", desc: "Dedicated analog Bass and Triple Mid tone stack for precise frequency shaping", highlight: false },
        { title: "Gain Control", desc: "Professional-grade OP-Amp with precision master gain for studio-level headroom", highlight: true },
        { title: "Input Selector Switch", desc: "Selected switch front panel for seamless source routing with dedicated power socket", highlight: false },
        { title: "0.5 Bluetooth + Aux + FM", desc: "Integrated 0.5 Bluetooth receiver alongside auxiliary and FM inputs", highlight: false },
      ],
    },
    {
      id: "rear",
      label: "02  REAR",
      heading: "Rear Panel",
      features: [
        { title: "Gold Plated RCA Sockets", desc: "Premium gold-plated RCA connectors with phono support for maximum signal integrity", highlight: true },
        { title: "Phono Connector", desc: "Dedicated phono input compatible with turntables and studio equipment", highlight: false },
        { title: "Power Socket", desc: "IEC power inlet connected to the special-grade CRGO toroidal transformer", highlight: false },
        { title: "Aux Output", desc: "Clean line-level auxiliary output for downstream amplifier or recording chain", highlight: false },
      ],
    },
    {
      id: "top",
      label: "03  TOP / INTERNAL",
      heading: "Internal View",
      features: [
        { title: "Special Grade CRGO Transformer", desc: "90 kHz ultra-wide bandwidth CRGO toroidal transformer — noise-free power delivery", highlight: true },
        { title: "Special Grade SCHACH Caps", desc: "Premium SCHACH electrolytic capacitors for crystal-clear, distortion-free audio", highlight: true },
        { title: "Professional OP-Amp Stage", desc: "High-performance solid-state op-amp circuitry engineered for professional signal path", highlight: true },
        { title: "Shielded Steel Chassis", desc: "Heavy-duty steel enclosure eliminating electromagnetic interference", highlight: false },
      ],
    },
  ],
  "mid-base-21-amplifier": [
    {
      id: "front",
      label: "01  FRONT",
      heading: "Front Panel",
      features: [
        { title: "Master Volume Knob", desc: "Large precision-machined volume knob for smooth, low-noise analog level control", highlight: false },
        { title: "Selector Mode Switch", desc: "Multi-mode input selector: Bluetooth, RCA Aux — seamless source switching", highlight: false },
        { title: "Inbuilt Bluetooth", desc: "Integrated Bluetooth receiver for wireless audio streaming from any device", highlight: true },
        { title: "Low-Pass Volume Control", desc: "Dedicated sub-bass low-pass volume control for precise subwoofer output tuning", highlight: true },
      ],
    },
    {
      id: "rear",
      label: "02  REAR",
      heading: "Rear Panel",
      features: [
        { title: "Banana Speaker Binding Posts", desc: "High-current banana-plug speaker terminals — 2 stereo channels + 1 sub output", highlight: true },
        { title: "Gold RCA Aux Input", desc: "Gold-plated stereo RCA input for CD players, DACs, or any line-level source", highlight: false },
        { title: "Speaker Protection Circuit", desc: "★ Active protection relay guards connected speakers against DC offset and startup transients", highlight: true },
        { title: "IEC Power Inlet & Rocker Switch", desc: "Standard IEC C14 power connector with illuminated red rocker switch", highlight: false },
      ],
    },
    {
      id: "side",
      label: "03  SIDE",
      heading: "Side View",
      features: [
        { title: "Premium Walnut Wood Cheeks", desc: "Hand-finished solid walnut side panels for a warm, distinctive premium aesthetic", highlight: true },
        { title: "Ventilation Slots", desc: "Precision-cut steel ventilation grilles on the chassis for passive thermal management", highlight: false },
        { title: "MOSFET Power Stage", desc: "Dual-channel MOSFET output transistors delivering clean, high-current amplification", highlight: true },
        { title: "Special Grade SCHACH Caps", desc: "Premium SCHACH electrolytic capacitors in the signal path for ultra-low distortion", highlight: true },
      ],
    },
  ],
  "amplifier-21": [
    {
      id: "front",
      label: "01  FRONT",
      heading: "Front Interface Controls",
      features: [
        { title: "Stereo 100W/Ch", desc: "Stereo amplifier stage delivering 100 Watts per channel for high-fidelity audio reproduction", highlight: true },
        { title: "Tone Controls", desc: "Dedicated Bass & Treble controls paired with low-pass filtering and master gain control", highlight: true },
        { title: "Bluetooth & Aux", desc: "Built-in 0.5 Bluetooth receiver with auxiliary input for versatile playback options", highlight: false },
        { title: "Green LCD Display", desc: "Front-panel backlit LCD screen showing status and playback modes", highlight: false },
      ],
    },
    {
      id: "rear",
      label: "02  REAR",
      heading: "Rear Inputs & Speaker Terminals",
      features: [
        { title: "200W Subwoofer Out", desc: "Dedicated high-power subwoofer channel output terminals delivering 200 Watts RMS", highlight: true },
        { title: "Gold Plated RCA", desc: "Premium gold-plated RCA inputs for crystal-clear analog signal transmission", highlight: false },
        { title: "Heavy Duty Terminals", desc: "Robust spring-loaded binding posts for secure and low-resistance speaker hookups", highlight: true },
        { title: "Power Input", desc: "Standard IEC AC mains power inlet for secure, noise-free current flow", highlight: false },
      ],
    },
    {
      id: "internal",
      label: "03  INTERNAL / TOP",
      heading: "Audiophile-Grade Topology",
      features: [
        { title: "Soft Start Control", desc: "Sophisticated soft start power controller circuitry preventing power line inrush spikes", highlight: true },
        { title: "3-Channel Protection", desc: "Inbuilt active speaker protection circuit safeguarding all three output channels", highlight: true },
        { title: "Linear Power Supply", desc: "Heavy-duty copper transformer and filter capacitors for stable voltage delivery", highlight: false },
        { title: "Solid Steel Chassis", desc: "Durable metal casing offering shielding against electromagnetic interference", highlight: false },
      ],
    },
  ],
  "class-d-amplifier": [
    {
      id: "front",
      label: "01  FRONT",
      heading: "Front Interface Controls",
      features: [
        { title: "Volume Knob", desc: "Large center dial for precise and low-noise master volume adjustment", highlight: true },
        { title: "Bass & Treble Knobs", desc: "Dedicated analog controls to easily shape your low-end and high-frequency response", highlight: true },
        { title: "Inbuilt Bluetooth", desc: "Integrated 0.5 Bluetooth receiver for instant and reliable wireless streaming", highlight: false },
        { title: "Chassis Design", desc: "Elegant textured black finish with official SoundWave styling cues", highlight: false },
      ],
    },
    {
      id: "rear",
      label: "02  REAR",
      heading: "Rear Connectivity Panel",
      features: [
        { title: "RCA Stereo Input", desc: "Red and White RCA jacks for connecting CD players, DACs, or auxiliary sources", highlight: false },
        { title: "Speaker Spring Terminals", desc: "Color-coded red/black spring clip outputs for quick and secure speaker wire hookups", highlight: true },
        { title: "Red Toggle Switch", desc: "Heavy-duty power switch with a protective red rubber cap for easy operation", highlight: true },
        { title: "DC Power Barrel Jack", desc: "Standard DC input barrel connector for powering the highly-efficient amplifier stage", highlight: false },
      ],
    },
    {
      id: "internal",
      label: "03  INTERNAL / TOPOLOGY",
      heading: "Efficient Class D Performance",
      features: [
        { title: "50W + 50W Output", desc: "Highly efficient Class D digital circuitry delivering crisp 50W per channel", highlight: true },
        { title: "Side Ventilation", desc: "Built-in chassis air vents designed for optimal thermal management and reliability", highlight: false },
        { title: "Built-in Speaker Protection", desc: "Active protection circuitry that prevents annoying pops or damage to connected speakers", highlight: true },
        { title: "Ultra-Compact Footprint", desc: "Desktop-friendly design that brings big sound to small spaces without clutter", highlight: false },
      ],
    },
  ],
};

// Generic fallback panels for products without a specific mapping
const PANELS_DEFAULT: Panel[] = [
  {
    id: "front",
    label: "01  FRONT",
    heading: "Front Panel",
    features: [
      { title: "Volume Control", desc: "Precision analog gain with smooth taper", highlight: false },
      { title: "Source Selector", desc: "Multi-source input switching", highlight: false },
      { title: "Power Indicator", desc: "LED status indicator", highlight: false },
      { title: "Controls", desc: "Precision front-panel controls", highlight: false },
    ],
  },
  {
    id: "rear",
    label: "02  REAR",
    heading: "Rear Panel",
    features: [
      { title: "RCA Inputs", desc: "Stereo high-fidelity connections", highlight: false },
      { title: "Speaker Outputs", desc: "High-current binding posts", highlight: false },
      { title: "Power Inlet", desc: "IEC power connector", highlight: false },
      { title: "Ground Terminal", desc: "Chassis ground binding post", highlight: false },
    ],
  },
  {
    id: "internal",
    label: "03  INTERNAL",
    heading: "Internal View",
    features: [
      { title: "Power Supply", desc: "Custom shielded linear transformer", highlight: false },
      { title: "Signal Path", desc: "High-performance solid-state circuitry", highlight: false },
      { title: "Shielded Design", desc: "Eliminates electromagnetic interference", highlight: false },
      { title: "Build Quality", desc: "Premium component construction", highlight: false },
    ],
  },
];


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
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckCircleGoldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
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

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { user, setShowAuthModal } = useAuth();
  const { addToCart, isInCart } = useCart();
  
  // Modal flow states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"choose" | "confirm" | "engineer">("choose");
  const [confirmStep, setConfirmStep] = useState<"form" | "success">("form");
  const [slideDirection, setSlideDirection] = useState(1); // 1 = forward, -1 = backward
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const pendingEnquiry = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [product, setProduct] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && pendingEnquiry.current) {
      pendingEnquiry.current = false;
      setSlideDirection(1);
      setModalStep("choose");
      setConfirmStep("form");
      setIsModalOpen(true);
    }
  }, [user]);

  const handleEnquireClick = useCallback(() => {
    if (user) {
      setSlideDirection(1);
      setModalStep("choose");
      setConfirmStep("form");
      setIsModalOpen(true);
    } else {
      pendingEnquiry.current = true;
      setShowAuthModal(true);
    }
  }, [user, setShowAuthModal]);

  const handleOverlayClick = () => {
    if (isSendingEmail) return;
    setIsModalOpen(false);
  };

  const handleConfirmOrder = async () => {
    if (!product) return;
    setIsSendingEmail(true);
    
    const subtotal = parsePriceText(product.priceRangeText);
    
    // 1. Send admin email via EmailJS — Template 2 (Product Order Admin)
    //    Sends to soundwave.sarga@gmail.com. No customer email — customer gets WhatsApp only.
    const emailPromise = (async () => {
      const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
      const orderTemplateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_2_ID || ""; // Template 2 — template_vgucfwt
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

      // All fields use "N/A" fallback — never pass undefined to EmailJS
      const templateParams = {
        customer_name: user?.displayName || user?.email || "Guest User",
        customer_phone: user?.phoneNumber || "N/A",
        customer_email: user?.email || "Phone login",
        submitted_at: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        // Order items as plain text and as HTML rows (single product)
        order_items_list: `• ${product.name || "N/A"} x1 — ${formatPrice(subtotal)}`,
        order_items_html:
          `<tr style="border-bottom:1px solid #222;">` +
          `<td style="color:#fff;font-size:13px;padding:12px 8px;width:35%;">${product.name || "N/A"}</td>` +
          `<td style="color:#888;font-size:13px;padding:12px 8px;width:20%;">${(product.category || "").replace("-", " ")}</td>` +
          `<td style="color:#fff;font-size:13px;padding:12px 8px;width:10%;text-align:center;">1</td>` +
          `<td style="color:#888;font-size:13px;padding:12px 8px;width:17%;text-align:right;">${formatPrice(subtotal)}</td>` +
          `<td style="color:#C9A84C;font-size:13px;font-weight:600;padding:12px 8px;width:18%;text-align:right;">${formatPrice(subtotal)}</td>` +
          `</tr>`,
        total_amount: String(subtotal),
        // WhatsApp reply link
        customer_phone_number: user?.phoneNumber || "",
        // Legacy fallback fields
        name: user?.displayName || user?.email || "Guest User",
        email: user?.email || "Phone login",
        phone: user?.phoneNumber || "N/A",
        date: new Date().toLocaleDateString("en-IN"),
        requirements: `Product: ${product.name || "N/A"} | Category: ${product.category || "N/A"} | Qty: 1 | Price: ${formatPrice(subtotal)}`,
        tier: "Product Enquiry",
        budget: formatPrice(subtotal).replace("₹", ""),
        to_email: "soundwave.sarga@gmail.com",
        message: `🎛️ NEW PRODUCT ENQUIRY — SOUNDWAVE\n\n` +
          `👤 Customer: ${user?.displayName || user?.email || "Guest User"}\n` +
          `📧 Email: ${user?.email || "Phone login"}\n` +
          `📞 Phone: ${user?.phoneNumber || "N/A"}\n\n` +
          `📦 PRODUCT: ${product.name || "N/A"}\n` +
          `🏷️ Category: ${product.category || "N/A"}\n` +
          `💰 Price: ${formatPrice(subtotal)}\n\n` +
          `📅 Submitted: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      };

      if (serviceID && orderTemplateID && publicKey) {
        await emailjs.send(serviceID, orderTemplateID, templateParams, { publicKey });
        console.log("✅ Template 2 admin email sent (Product Enquiry)");
      } else {
        console.log("EmailJS keys missing — skipping product enquiry admin email:", templateParams);
      }
    })();

    // 2. Send customer confirmation via WhatsApp (Twilio) — skip silently if no phone
    const whatsappPromise = (async () => {
      try {
        const response = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "product_order",
            customerPhone: user?.phoneNumber || "",
            customerName: user?.displayName || user?.email || "Customer",
            orderDetails: {
              items: [{
                name: product.name || "N/A",
                quantity: 1,
                price: formatPrice(subtotal),
              }],
              totalAmount: String(subtotal),
            },
          }),
        });

        if (!response.ok) throw new Error("Customer WhatsApp API failed");
        const resData = await response.json();
        console.log("Customer WhatsApp result:", resData.whatsappSuccess ? "✅ Sent" : "⚠️ Skipped (no phone)");
      } catch (err) {
        // Never block user flow for notification failures
        console.error("Customer WhatsApp dispatch failed (non-blocking):", err);
      }
    })();

    try {
      // Force at least 1.5 seconds loading state to show progress animation
      await Promise.all([
        emailPromise,
        whatsappPromise,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      setIsSendingEmail(false);
      setConfirmStep("success");
      toast.success("Inquiry sent successfully!");
    } catch (err) {
      console.error("Product enquiry failed:", err);
      setIsSendingEmail(false);
      toast.error("Failed to submit inquiry. Please try again.");
    }
  };

  // Framer Motion Animation Variants
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

  useEffect(() => {
    async function fetchProduct() {
      try {
        const cached = getProductById(params.id);
        if (cached) {
          setProduct(cached);
          setRelatedProducts(getRelatedFromCache(cached.category, cached.id));
          setLoading(false);
          return;
        }
        const docRef = doc(db, "products", params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pData: any = { id: docSnap.id, ...docSnap.data() };
          setProduct(pData);
          const relSnap = await getDocs(
            query(collection(db, "products"), where("category", "==", pData.category), limit(4))
          );
          setRelatedProducts(
            relSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== pData.id).slice(0, 3)
          );
        } else {
          const staticProd = dummyProducts.find(p => p.id === params.id);
          if (staticProd) {
            setProduct(staticProd);
            setRelatedProducts(
              dummyProducts.filter(p => p.category === staticProd.category && p.id !== staticProd.id).slice(0, 3)
            );
          } else { notFound(); }
        }
      } catch (error) {
        console.error("Firestore product fetch failed, trying static fallback:", error);
        const staticProd = dummyProducts.find(p => p.id === params.id);
        if (staticProd) {
          setProduct(staticProd);
          setRelatedProducts(
            dummyProducts.filter(p => p.category === staticProd.category && p.id !== staticProd.id).slice(0, 3)
          );
        } else { notFound(); }
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.id]);

  /* ── Hero parallax — rAF, no React state ── */
  const heroRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (heroImgRef.current) {
          heroImgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* ── Sticky scroll section ── */
  const stickyWrapRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useScrollProgress(stickyWrapRef);
  const panelIndex = scrollProgress < 0.33 ? 0 : scrollProgress < 0.66 ? 1 : 2;

  /* ── Mobile panel tabs (for sticky section on mobile) ── */
  const [mobilePanelIdx, setMobilePanelIdx] = useState(0);

  /* ── Tilt on panel change ── */
  const [tilt, setTilt] = useState(0);
  const prevPanelIdx = useRef(panelIndex);
  useEffect(() => {
    if (panelIndex !== prevPanelIdx.current) {
      setTilt(-6);
      const t = setTimeout(() => setTilt(0), 400);
      prevPanelIdx.current = panelIndex;
      return () => clearTimeout(t);
    }
  }, [panelIndex]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loading />
      </div>
    );
  }
  if (!product) return null;

  const PANELS = PANELS_MAP[product.id] ?? PANELS_DEFAULT;
  const inCart = isInCart(product.id);
  const hasImages = product.images && product.images.length > 1;
  const heroImg = product.images?.[0] || (product.image !== "placeholder" ? product.image : null);
  const words = product.name.split(" ");

  /* ────────────────────────────── JSX ──────────────────────────────────── */
  return (
    <>
      {/* ── Scoped styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cormorant+Garamond:wght@300;400;600&display=swap');

        /* Apple-token button (radius: 980px) */
        .pd-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; height: 52px;
          border-radius: 980px; border: none;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
        }
        .pd-btn--gold  { background: #C9A84C; color: #000; }
        .pd-btn--gold:hover { background: #b8852a; }
        .pd-btn--outline {
          background: transparent; color: #C9A84C;
          border: 1px solid rgba(201,168,76,0.45) !important;
        }
        .pd-btn--outline:hover { background: #C9A84C; color: #000; }
        .pd-btn--incart { background: rgba(201,168,76,0.12); color: #C9A84C; border: 1px solid rgba(201,168,76,0.35) !important; }

        /* Apple-token badge (radius: 36px) */
        .pd-badge {
          display: inline-flex; align-items: center;
          padding: 4px 14px; border-radius: 36px;
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3);
          color: #C9A84C; font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
        }

        /* Back link */
        .pd-back {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.6); text-decoration: none;
          transition: color 0.2s ease;
        }
        .pd-back:hover { color: #C9A84C; }

        /* Section label */
        .pd-label {
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase; color: #C9A84C;
        }
        .pd-rule { height: 1px; background: rgba(201,168,76,0.2); }

        /* Spec row */
        .pd-spec-row {
          display: flex; justify-content: space-between; align-items: baseline;
          gap: 24px; padding: 15px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s ease; border-radius: 4px;
        }
        .pd-spec-row:last-child { border-bottom: none; }
        .pd-spec-row:hover { background: rgba(255,255,255,0.02); padding-left: 8px; padding-right: 8px; }
        .pd-spec-key { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 400; color: #86868b; flex-shrink: 0; }
        .pd-spec-val { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: #fff; text-align: right; }

        /* Scroll indicator */
        @keyframes pd-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(8px); opacity: 0.4; }
        }
        .pd-scroll-indicator { animation: pd-bounce 1.8s ease-in-out infinite; }

        /* Hero name word animation — CSS keyframe, no framer overhead */
        @keyframes pd-word-in {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pd-word {
          display: inline-block;
          margin-right: 0.22em;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.6rem, 7vw, 4.5rem);
          font-weight: 400;
          color: #ffffff;
          letter-spacing: 0.05em;
          opacity: 0;
          animation: pd-word-in 0.5s ease-out forwards;
          will-change: opacity, transform;
        }

        /* Related card */
        .pd-card {
          display: flex; flex-direction: column;
          background: #111; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; overflow: hidden; text-decoration: none;
          transition: border-color 0.25s ease, transform 0.25s ease;
          height: 100%;
        }
        .pd-card:hover { border-color: rgba(201,168,76,0.3); transform: translateY(-4px); }
        .pd-card:hover .pd-card-img { transform: scale(1.03); }
        .pd-card-img { width: 100%; height: 100%; transition: transform 0.25s ease; }

        /* Feature dot */
        .pd-feat-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #C9A84C; flex-shrink: 0; margin-top: 6px;
        }

        /* Progress track */
        .pd-progress-track {
          width: 1px; background: rgba(201,168,76,0.2);
          position: relative; flex-shrink: 0;
        }

        /* Mobile tab */
        .pd-mob-tab {
          flex: 1; padding: 8px 0;
          background: none; border: none; border-bottom: 2px solid transparent;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; color: #86868b;
          cursor: pointer; transition: color 0.2s, border-color 0.2s;
        }
        .pd-mob-tab--active { color: #C9A84C; border-bottom-color: #C9A84C; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — Cinematic Hero (100vh)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{ position: "relative", height: "100vh", overflow: "hidden", backgroundColor: "#000" }}
      >
        {/* Parallax image wrapper — moved by rAF via heroImgRef */}
        <div
          ref={heroImgRef}
          style={{
            position: "absolute", inset: 0,
            willChange: "transform",
          }}
        >
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            style={{ width: "100%", height: "110%" }}
          >
            {heroImg ? (
              <img
                src={heroImg}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%", height: "100%",
                  background: "radial-gradient(ellipse at 60% 40%, rgba(201,168,76,0.12) 0%, #000 65%)",
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)" }} />

        {/* Back button — top left */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ position: "absolute", top: "88px", left: "32px", zIndex: 10 }}
        >
          <Link href="/products" className="pd-back">
            <FaArrowLeft size={10} />
            Products
          </Link>
        </motion.div>

        {/* Wishlist — top right */}
        <div style={{ position: "absolute", top: "88px", right: "32px", zIndex: 10 }}>
          <WishlistButton product={product} />
        </div>

        {/* Bottom hero text */}
        <div
          style={{
            position: "absolute", bottom: "80px", left: 0, right: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
            padding: "0 24px", textAlign: "center",
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <span className="pd-badge">{product.category.replace("-", " ")}</span>
          </motion.div>

          {/* Product name — CSS keyframe word-by-word, no framer overhead */}
          <h1 style={{ margin: 0, lineHeight: 1.05 }}>
            {words.map((word: string, wi: number) => (
              <span
                key={wi}
                className="pd-word"
                style={{ animationDelay: `${0.7 + wi * 0.13}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Price */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            style={{
              margin: 0,
              fontFamily: "'Inter', sans-serif",
              fontSize: "24px",
              fontWeight: 500,
              color: "#C9A84C",
            }}
          >
            {product.priceRangeText}
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <div
          className="pd-scroll-indicator"
          style={{
            position: "absolute", bottom: "28px", left: "50%",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}
        >
          <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.35)" }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — Scroll-driven image + feature reveal (300vh)
          Only shown for products with multiple images
      ═══════════════════════════════════════════════════════════════════ */}
      {hasImages ? (
        <>
          {/* ── Desktop sticky scroll ── */}
          <div
            ref={stickyWrapRef}
            style={{ height: "300vh", position: "relative" }}
            className="hidden md:block"
          >
            <div
              style={{
                position: "sticky", top: 0, height: "100vh",
                backgroundColor: "#000",
                display: "flex", alignItems: "stretch",
              }}
            >
              {/* Left — image */}
              <div style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }}>
                {product.images.map((imgUrl: string, idx: number) => (
                  <motion.img
                    key={idx}
                    src={imgUrl}
                    alt={PANELS[idx]?.label ?? `View ${idx}`}
                    animate={{
                      opacity: panelIndex === idx ? 1 : 0,
                      rotateY: panelIndex === idx ? tilt : 0,
                    }}
                    transition={{ opacity: { duration: 0.5 }, rotateY: { duration: 0.4, ease: "easeOut" } }}
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: "contain",
                      padding: "48px",
                      perspective: "1000px",
                    }}
                  />
                ))}

                {/* Image label */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={panelIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    style={{
                      position: "absolute", bottom: "40px", left: "48px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "11px", fontWeight: 400,
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "#86868b",
                    }}
                  >
                    {PANELS[panelIndex]?.heading}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Center — progress indicator: proper 72px column, labels left of track */}
              <div
                style={{
                  flex: "0 0 72px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  alignSelf: "stretch",
                  padding: "48px 0",
                }}
              >
                {/* Track line — right edge of this column */}
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "48px",
                    bottom: "48px",
                    width: "1px",
                    background: "rgba(201,168,76,0.18)",
                  }}
                >
                  {/* Traveling dot */}
                  <div
                    style={{
                      position: "absolute",
                      top: `${scrollProgress * 100}%`,
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "7px", height: "7px",
                      borderRadius: "50%",
                      background: "#C9A84C",
                      boxShadow: "0 0 10px rgba(201,168,76,0.55)",
                      transition: "top 0.12s linear",
                    }}
                  />
                </div>

                {/* Step labels — stacked, right-aligned to track */}
                <div
                  style={{
                    position: "absolute",
                    top: "48px",
                    bottom: "48px",
                    right: "10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {PANELS.map((panel, i) => (
                    <div
                      key={panel.id}
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "9px",
                        fontWeight: 500,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: panelIndex === i ? "#C9A84C" : "rgba(255,255,255,0.18)",
                        transition: "color 0.3s ease",
                        whiteSpace: "nowrap",
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        transform: "rotate(180deg)",
                      }}
                    >
                      {panel.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — feature content */}
              <div
                style={{
                  flex: "0 0 calc(50% - 65px)",
                  display: "flex", flexDirection: "column",
                  justifyContent: "center",
                  padding: "48px 64px 48px 0",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={panelIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {/* Heading */}
                    <h2
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "28px", fontWeight: 600, color: "#fff",
                        marginBottom: "40px", marginTop: 0,
                      }}
                    >
                      {PANELS[panelIndex]?.heading}
                    </h2>

                    {/* Features */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                      {PANELS[panelIndex]?.features.map((feat, fi) => (
                        <motion.div
                          key={feat.title}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: fi * 0.08, ease: "easeOut" }}
                          style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
                        >
                          <div className="pd-feat-dot" style={feat.highlight ? { background: "#C9A84C", boxShadow: "0 0 8px rgba(201,168,76,0.6)" } : {}} />
                          <div>
                            <p style={{ margin: "0 0 4px 0", fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 600, color: feat.highlight ? "#C9A84C" : "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                              {feat.title}
                              {feat.highlight && <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Premium</span>}
                            </p>
                            <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 400, color: "#86868b", lineHeight: 1.6 }}>
                              {feat.desc}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Mobile tab gallery ── */}
          <div className="md:hidden" style={{ backgroundColor: "#000", padding: "48px 20px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "32px" }}>
                  {PANELS.map((panel, i) => (
                <button
                  key={panel.id}
                  onClick={() => setMobilePanelIdx(i)}
                  className={`pd-mob-tab${mobilePanelIdx === i ? " pd-mob-tab--active" : ""}`}
                >
                  {panel.heading.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Image */}
            <div style={{ borderRadius: "14px", overflow: "hidden", background: "#111", marginBottom: "28px", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={product.images[mobilePanelIdx]}
                alt={PANELS[mobilePanelIdx].heading}
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: "24px" }}
              />
            </div>

            {/* Features */}
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: "22px", fontWeight: 600, color: "#fff", marginBottom: "24px", marginTop: 0 }}>
              {PANELS[mobilePanelIdx].heading}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {PANELS[mobilePanelIdx].features.map(feat => (
                <div key={feat.title} style={{ display: "flex", gap: "14px" }}>
                  <div className="pd-feat-dot" style={feat.highlight ? { background: "#C9A84C", boxShadow: "0 0 8px rgba(201,168,76,0.5)" } : {}} />
                  <div>
                    <p style={{ margin: "0 0 3px 0", fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: feat.highlight ? 600 : 500, color: feat.highlight ? "#C9A84C" : "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                      {feat.title}
                      {feat.highlight && <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "20px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Premium</span>}
                    </p>
                    <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#86868b", lineHeight: 1.6 }}>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — Product Details + Specs + Cart (Apple section-gap: 89px)
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: "#0a0a0a", padding: "89px 24px" }}>
        <div
          style={{
            maxWidth: "1100px", margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "64px",
            alignItems: "start",
          }}
          className="pd-s3-grid"
        >
          <style>{`
            @media (max-width: 768px) {
              .pd-s3-grid { grid-template-columns: 1fr !important; }
              .modal-card-container {
                width: 95% !important;
                padding: 24px !important;
              }
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
          `}</style>

          {/* Left — Specs */}
          <Reveal>
            <p className="pd-label" style={{ marginBottom: "12px" }}>Full Specifications</p>
            <div className="pd-rule" style={{ marginBottom: "8px" }} />
            <div>
              {Object.entries(product.specs).map(([key, value], i) => {
                const strVal = String(value);
                const isPremium = strVal.startsWith("★");
                const displayVal = isPremium ? strVal.replace(/^★\s*/, "") : strVal;
                return (
                  <Reveal key={key} delay={i * 0.05}>
                    <div className="pd-spec-row" style={isPremium ? { borderLeft: "2px solid rgba(201,168,76,0.5)", paddingLeft: "10px", marginLeft: "-10px" } : {}}>
                      <span className="pd-spec-key" style={isPremium ? { color: "#C9A84C" } : {}}>
                        {isPremium && <span style={{ marginRight: "5px" }}>★</span>}{key}
                      </span>
                      <span className="pd-spec-val" style={isPremium ? { color: "#C9A84C", textShadow: "0 0 12px rgba(201,168,76,0.3)" } : {}}>
                        {displayVal}
                      </span>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Reveal>

          {/* Right — Product summary + CTA */}
          <Reveal delay={0.1}>
            {/* Badges */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              <span className="pd-badge">{product.category.replace("-", " ")}</span>
              <span className="pd-badge">{product.technology}</span>
            </div>

            {/* Name */}
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "24px", fontWeight: 600, color: "#fff",
                lineHeight: 1.3, margin: "0 0 12px 0",
              }}
            >
              {product.name}
            </h2>

            {/* Price */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "32px", fontWeight: 500, color: "#C9A84C",
                margin: "0 0 20px 0",
              }}
            >
              {product.priceRangeText}
            </p>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", marginBottom: "20px" }} />

            {/* Description */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px", fontWeight: 400, color: "#86868b",
                lineHeight: 1.75, margin: "0 0 32px 0",
              }}
            >
              {product.description}
            </p>

            {/* Add to Cart — Apple 980px pill */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                addToCart({
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  priceRangeText: product.priceRangeText,
                  image: product.image,
                });
                if (!inCart) toast.success(`${product.name} added to cart`);
              }}
              className={`pd-btn ${inCart ? "pd-btn--incart" : "pd-btn--gold"}`}
              style={{ marginBottom: "12px" }}
            >
              {inCart ? <><FaCheck size={13} /> In Cart</> : <><FaShoppingCart size={13} /> Add to Cart</>}
            </motion.button>

            {/* Enquire Now — outlined */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEnquireClick}
              className="pd-btn pd-btn--outline"
            >
              Enquire Now
            </motion.button>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — PAIRS WELL WITH
      ═══════════════════════════════════════════════════════════════════ */}
      {relatedProducts.length > 0 && (
        <section style={{ backgroundColor: "#111111", padding: "89px 24px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <Reveal>
              <p className="pd-label" style={{ marginBottom: "12px" }}>Pairs Well With</p>
              <div className="pd-rule" style={{ marginBottom: "36px" }} />
            </Reveal>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "20px",
              }}
            >
              {relatedProducts.map((related, i) => (
                <Reveal key={related.id} delay={i * 0.1}>
                  <Link href={`/products/${related.id}`} className="pd-card">
                    {/* Image */}
                    <div
                      style={{
                        height: "200px",
                        background: "#1d1d1f",
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: "14px 14px 0 0",
                      }}
                    >
                      <div className="pd-card-img" style={{ width: "100%", height: "100%", position: "relative" }}>
                        {related.image && related.image !== "placeholder" ? (
                          <img
                            src={related.image}
                            alt={related.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
                            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", fontWeight: 300, color: "rgba(201,168,76,0.1)", letterSpacing: "0.3em", textTransform: "uppercase", userSelect: "none" }}>
                              SoundWave
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
                        <WishlistButton product={related} className="scale-75 origin-top-right" />
                      </div>
                    </div>

                    {/* Text — Apple card padding: 28px */}
                    <div style={{ padding: "20px 20px 24px" }}>
                      <p style={{ margin: "0 0 6px 0", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C" }}>
                        {related.category.replace("-", " ")}
                      </p>
                      <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 500, color: "#fff", lineHeight: 1.3 }}>
                        {related.name}
                      </h3>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

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
                        PRODUCT ENQUIRY
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
                        Choose how you&apos;d like to enquire about this product with our team.
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
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#e3e3e3" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>
                            {product.name} <span style={{ color: "#86868b", fontSize: "11px" }}>x1</span>
                          </span>
                          <span style={{ fontWeight: 500, flexShrink: 0 }}>
                            {product.priceRangeText}
                          </span>
                        </div>
                        <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", fontWeight: "bold", color: "#C9A84C" }}>
                          <span>Total</span>
                          <span>{product.priceRangeText}</span>
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
                          <p className="option-subtitle">We&apos;ll send your enquiry details to our team</p>
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
                              Confirm Your Enquiry
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
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#e3e3e3" }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>
                                  {product.name} <span style={{ color: "#86868b", fontSize: "11px" }}>x1</span>
                                </span>
                                <span style={{ fontWeight: 500, flexShrink: 0 }}>
                                  {product.priceRangeText}
                                </span>
                              </div>
                              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "'Inter', sans-serif", fontWeight: "bold", color: "#C9A84C" }}>
                                  <span>Total</span>
                                  <span>{product.priceRangeText}</span>
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
                              Your enquiry details for this product will be sent to our team at <strong style={{ color: "#ffffff" }}>soundwave.sarga@gmail.com</strong>. We will contact you within 24 hours to confirm on {user?.phoneNumber ? "your registered number" : `your registered email: ${user?.email || ""}`}.
                            </p>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={handleConfirmOrder}
                              disabled={isSendingEmail}
                              className="pd-btn pd-btn--gold"
                              style={{ height: "48px", cursor: isSendingEmail ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "normal" }}
                            >
                              {isSendingEmail ? "SENDING ENQUIRY..." : "SEND CONFIRMATION"}
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
                              Enquiry Submitted!
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
                              Your enquiry details have been sent to our team. We&apos;ll reach out to you shortly on {user?.phoneNumber ? "your registered number" : `your registered email: ${user?.email || ""}`}.
                            </p>

                            <button
                              onClick={() => setIsModalOpen(false)}
                              className="pd-btn pd-btn--gold"
                              style={{
                                backgroundColor: "#C9A84C",
                                color: "#000000",
                                width: "100%",
                                height: "48px",
                                borderRadius: "980px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 600,
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              CLOSE
                            </button>
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
                        href={`https://wa.me/919567931330?text=${encodeURIComponent(`Hi, I have a query about the SOUNDWAVE ${product.name}. Price: ${product.priceRangeText}`)}`}
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
                        href={`mailto:soundwave.sarga@gmail.com?subject=${encodeURIComponent(`Inquiry: ${product.name}`)}`}
                        className="connect-btn connect-btn-email"
                      >
                        <EmailIcon />
                        <div className="connect-btn-text-container">
                          <span className="connect-btn-title">Send an Email</span>
                          <span className="connect-btn-subtitle">soundwave.sarga@gmail.com</span>
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
