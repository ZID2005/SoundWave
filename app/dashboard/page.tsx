"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { updateProfile, signOut as firebaseSignOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShoppingCart,
  FaTrash,
  FaTimes,
  FaEdit,
  FaSignOutAlt,
  FaBoxOpen,
  FaClipboardList,
  FaHistory,
} from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";
import "./dashboard.css";

// Interface definitions
interface Order {
  id: string;
  product: string;
  amount: number;
  status: "Processing" | "Delivered" | "Cancelled";
  createdAt: Timestamp;
}

interface CustomOrder {
  id: string;
  type: string;
  technology: string;
  tier: string;
  finish: string;
  notes: string;
  status: string;
  createdAt: Timestamp;
}

interface SavedBuild {
  id: string;
  name: string;
  type: string;
  technology: string;
  tier: string;
  finish: string;
  notes: string;
  createdAt: Timestamp;
}

/* ── Price parsing helpers ── */
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ── CountUp Animation Component ── */
function CountUp({ end, duration = 1200 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
}

/* ── ScrollReveal Intersection Observer Component ── */
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
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { items, removeFromCart, clearCart } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [loading, setLoading] = useState(true);

  /* Form edit states */
  const [editName, setEditName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  /* Dialog and Modal states */
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isReorderingId, setIsReorderingId] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  /* Fetch user profile name and listings */
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch checkouts from orders collection
      const qOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
      const snapOrders = await getDocs(qOrders);
      const ordersList = snapOrders.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];
      // Sort orders descending
      ordersList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(ordersList);

      // 2. Fetch configurator custom orders
      const qCustom = query(collection(db, "customOrders"), where("userId", "==", user.uid));
      const snapCustom = await getDocs(qCustom);
      const customList = snapCustom.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CustomOrder[];
      customList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setCustomOrders(customList);

      // 3. Fetch saved builds
      const qBuilds = query(collection(db, "savedBuilds"), where("userId", "==", user.uid));
      const snapBuilds = await getDocs(qBuilds);
      const buildsList = snapBuilds.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SavedBuild[];
      buildsList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setSavedBuilds(buildsList);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setEditName(user.displayName || "");
      fetchData();
    }
  }, [user, fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0D0D0D" }}>
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  /* ── User Meta Helpers ── */
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const cleaned = name.trim();
    if (cleaned.startsWith("+")) return "P";
    if (cleaned.includes("@")) return cleaned.substring(0, 2).toUpperCase();
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getLoginMethod = (currentUser: typeof user) => {
    const providerId = currentUser.providerData?.[0]?.providerId || "";
    if (providerId.includes("phone")) return "Phone";
    if (providerId.includes("facebook")) return "Facebook";
    return "Email";
  };

  const getIdentifier = (currentUser: typeof user) => {
    const method = getLoginMethod(currentUser);
    if (method === "Phone") {
      const phone = currentUser.phoneNumber || "";
      if (phone.length <= 6) return phone;
      return phone.substring(0, 3) + "******" + phone.substring(phone.length - 4);
    }
    if (method === "Facebook") {
      return currentUser.displayName || currentUser.email || "Facebook Linked Account";
    }
    return currentUser.email || "Email address";
  };

  /* ── Save Name Function ── */
  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error("Please enter a display name.");
      return;
    }
    setIsSavingName(true);
    try {
      // 1. Update the local auth profile (very fast)
      await updateProfile(auth.currentUser!, { displayName: editName });
      
      // 2. Refresh the context user so components re-render with the new name instantly
      await refreshUser();

      // 3. Save to database in the background without blocking the UI
      setDoc(
        doc(db, "users", user.uid),
        {
          displayName: editName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => {
        console.error("Background user profile database sync failed:", err);
      });

      toast.success("Profile display name updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update name.");
    } finally {
      setIsSavingName(false);
    }
  };

  /* ── Checkout Cart Items ── */
  const cartTotal = items.reduce((total, item) => {
    return total + parsePriceText(item.priceRangeText) * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckoutLoading(true);
    try {
      const productsSummary = items
        .map((item) => `${item.name} (${item.quantity}x)`)
        .join(", ");

      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        product: productsSummary,
        amount: cartTotal,
        status: "Processing",
        createdAt: serverTimestamp(),
      });

      clearCart();
      toast.success("Checkout successful! Order placed.");
      await fetchData();
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  /* ── Reorder Saved Build ── */
  const handleReorderBuild = async (build: SavedBuild) => {
    setIsReorderingId(build.id);
    try {
      await addDoc(collection(db, "customOrders"), {
        userId: user.uid,
        userEmail: user.email || "",
        type: build.type,
        technology: build.technology,
        tier: build.tier,
        finish: build.finish,
        notes: build.notes || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast.success("Custom configuration order submitted!");
      await fetchData();
    } catch (error) {
      console.error("Error placing custom order:", error);
      toast.error("Failed to submit custom order.");
    } finally {
      setIsReorderingId(null);
    }
  };

  /* ── Delete Saved Build ── */
  const handleDeleteBuild = async (id: string) => {
    try {
      await deleteDoc(doc(db, "savedBuilds", id));
      toast.success("Configuration deleted.");
      setSavedBuilds((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error deleting configuration:", error);
      toast.error("Failed to delete configuration.");
    }
  };

  /* ── Logout Trigger ── */
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to log out.");
    }
  };

  /* ── Stats Calculations ── */
  const totalOrdersPlaced = orders.length + customOrders.length;
  
  const ordersDelivered =
    orders.filter((o) => o.status === "Delivered").length +
    customOrders.filter((co) => co.status.toLowerCase() === "delivered").length;
    
  const ordersPending =
    orders.filter((o) => o.status === "Processing").length +
    customOrders.filter(
      (co) =>
        co.status.toLowerCase() !== "delivered" && co.status.toLowerCase() !== "cancelled"
    ).length;

  const statsConfig = [
    { label: "Items in Cart", value: items.reduce((acc, i) => acc + i.quantity, 0), glowClass: "glow-cart", icon: <FaShoppingCart /> },
    { label: "Total Orders Placed", value: totalOrdersPlaced, glowClass: "glow-orders", icon: <FaClipboardList /> },
    { label: "Orders Delivered", value: ordersDelivered, glowClass: "glow-delivered", icon: <FaBoxOpen /> },
    { label: "Orders Pending", value: ordersPending, glowClass: "glow-pending", icon: <FaHistory /> },
  ];

  return (
    <div className="min-h-screen pt-32 pb-32 text-foreground font-sans relative overflow-hidden" style={{ backgroundColor: "#000000" }}>

      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      
      {/* Subtle gold radial glow behind the profile header area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.1)_0%,transparent_70%)] blur-[80px] pointer-events-none z-0" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Profile Header */}
        <ScrollReveal delay={100}>
          <div
            className="glass-dashboard-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative overflow-hidden"
          >
            <div className="flex items-center gap-6">
              {/* Initial Avatar with Rotating Ring */}
              <div className="avatar-ring-container">
                <div className="avatar-ring" />
                <div
                  className="flex items-center justify-center w-20 h-20 rounded-full font-black text-2xl border-2 border-primary/20 shadow-[0_0_20px_rgba(201,168,76,0.2)] relative z-10"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C 0%, #A37F2C 100%)",
                    color: "#0D0D0D",
                  }}
                >
                  {getInitials(user.displayName)}
                </div>
              </div>

              <div>
                {/* Full Name in Serif font */}
                <h1
                  className="text-3xl md:text-4xl font-light text-white tracking-wide uppercase font-serif mb-2 text-glow-white"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {user.displayName || "Soundwave Enthusiast"}
                </h1>
                
                {/* Method badge and Identifier details */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="shimmer-badge px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full tracking-wider uppercase text-glow-gold">
                    {getLoginMethod(user)} Account
                  </span>
                  <span className="text-zinc-300 text-sm tracking-wide font-medium">
                    {getIdentifier(user)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (nameInputRef.current) {
                  nameInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                  nameInputRef.current.focus();
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wider transition-all duration-500 hover:bg-primary hover:text-background hover:shadow-[0_0_15px_rgba(201,168,76,0.35)] text-glow-gold"
            >
              <FaEdit /> Edit Profile
            </button>
          </div>
        </ScrollReveal>

        {/* Stats Row */}
        <ScrollReveal delay={200}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {statsConfig.map((stat, idx) => (
              <div
                key={idx}
                className={`glass-dashboard-card stat-card ${stat.glowClass} p-6 relative overflow-hidden group`}
              >
                <div className="absolute top-4 right-4 text-xl text-primary/15 transition-all duration-300 group-hover:scale-110 group-hover:text-primary/50">
                  {stat.icon}
                </div>
                <p className="text-zinc-300 text-xs uppercase tracking-widest font-semibold mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {stat.label}
                </p>
                <h3 className="text-3xl md:text-4xl font-light text-primary tracking-wide stat-value font-serif text-shiny-gold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  <CountUp end={stat.value} />
                </h3>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Grid Section for Cart and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16 relative z-10">
          
          {/* My Cart Section (2 Cols width on large screens) */}
          <div className="lg:col-span-2 h-full">
            <ScrollReveal delay={300}>
              <div className="glass-dashboard-card p-8 flex flex-col h-full">
                <h2 className="text-2xl font-light text-white font-serif uppercase tracking-widest mb-6 flex items-center gap-3 text-glow-white">
                  <FaShoppingCart className="text-primary text-xl text-glow-gold" /> My Cart
                </h2>
                <div className="h-px bg-white/5 mb-6" />

                {items.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center py-16 text-center gap-6">
                    <FaShoppingCart className="text-6xl text-primary pulsing-cart text-glow-gold" />
                    <p className="text-zinc-300 text-base uppercase tracking-widest font-medium">
                      Your cart is empty
                    </p>
                    <Link
                      href="/products"
                      className="px-6 py-2.5 rounded-full border border-primary/50 text-primary text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-primary hover:text-background hover:shadow-[0_0_15px_rgba(201,168,76,0.25)] text-glow-gold"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between flex-grow">
                    {/* List items */}
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="cart-product-row flex items-center justify-between gap-4 p-4 rounded-xl border border-white/5"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Mock Image Placeholder */}
                            <div className="w-16 h-12 bg-black flex items-center justify-center rounded overflow-hidden shrink-0 border border-white/5">
                              {item.image && item.image !== "placeholder" ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">SW</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-white font-bold text-sm truncate">{item.name}</h4>
                              <p className="text-zinc-300 text-xs mt-0.5">{item.priceRangeText}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-zinc-300 text-xs font-medium">x{item.quantity}</span>
                            <button
                              onClick={() => {
                                removeFromCart(item.id);
                                toast.success(`${item.name} removed from cart`);
                              }}
                              className="text-white/40 hover:text-primary transition-colors p-2 hover:scale-110"
                              aria-label="Remove item"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total amount and checkout CTA */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Total Amount</p>
                        <h3 className="text-2xl font-bold text-shiny-gold font-serif">{formatPrice(cartTotal)}</h3>
                      </div>
                      <button
                        onClick={handleCheckout}
                        disabled={isCheckoutLoading}
                        className="px-8 py-3 rounded-full font-bold uppercase tracking-wider bg-primary text-background hover:bg-[#b58c3c] hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-glow-none"
                      >
                        {isCheckoutLoading ? "Processing..." : "Proceed to Checkout"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Account Settings */}
          <div className="h-full">
            <ScrollReveal delay={350}>
              <div className="glass-dashboard-card p-8 flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-2xl font-light text-white font-serif uppercase tracking-widest mb-6 flex items-center gap-3 text-glow-white">
                    Account Settings
                  </h2>
                  <div className="h-px bg-white/5 mb-6" />

                  <div className="space-y-5">
                    <div>
                      <label className="block text-zinc-300 text-xs uppercase tracking-widest font-semibold mb-2">
                        Display Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Enter name"
                          className="settings-input flex-grow p-3 text-white text-sm focus:outline-none"
                          disabled={isSavingName}
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={isSavingName}
                          className="px-4 rounded-xl bg-primary text-background font-bold text-xs uppercase tracking-wider hover:bg-[#b58c3c] active:scale-95 transition-all disabled:opacity-50 text-glow-none"
                        >
                          {isSavingName ? "..." : "Save"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-300 text-xs uppercase tracking-widest font-semibold mb-2">
                        Login Method
                      </label>
                      <input
                        type="text"
                        value={getLoginMethod(user)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-zinc-300 text-sm cursor-not-allowed font-medium"
                        style={{ opacity: 0.8 }}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-300 text-xs uppercase tracking-widest font-semibold mb-2">
                        Identifier
                      </label>
                      <input
                        type="text"
                        value={getIdentifier(user)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-zinc-300 text-sm cursor-not-allowed font-medium"
                        style={{ opacity: 0.8 }}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="btn-logout mt-8 w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* My Orders Section */}
        {/* My Orders Section */}
        <ScrollReveal delay={400}>
          <div className="glass-dashboard-card p-8 mb-16 relative z-10">
            <h2 className="text-2xl font-light text-white font-serif uppercase tracking-widest mb-6 flex items-center gap-3 text-glow-white">
              <FaClipboardList className="text-primary text-xl text-glow-gold" /> My Orders
            </h2>
            <div className="h-px bg-white/5 mb-6" />

            {orders.length === 0 ? (
              <div className="text-center py-16">
                <FaBoxOpen className="text-6xl text-primary/30 mx-auto mb-4 floating-box" />
                <p className="text-zinc-300 text-base uppercase tracking-widest mb-6 font-medium">
                  You haven&apos;t placed any orders yet.
                </p>
                <Link
                  href="/products"
                  className="inline-block px-8 py-3 bg-primary text-background font-bold uppercase tracking-wider rounded-full hover:bg-[#b58c3c] hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all duration-300 text-xs text-glow-none"
                >
                  Browse Collection
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-300 text-xs uppercase tracking-widest font-semibold">
                      <th className="py-4 px-4">Order ID</th>
                      <th className="py-4 px-4">Product(s)</th>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-4">Amount</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="py-4 px-4 font-mono text-xs text-white group-hover:text-primary transition-colors">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="py-4 px-4 font-semibold text-zinc-100 max-w-xs truncate">{order.product}</td>
                        <td className="py-4 px-4 text-zinc-300">
                          {order.createdAt?.toDate?.()
                            ? order.createdAt.toDate().toLocaleDateString()
                            : "Recently"}
                        </td>
                        <td className="py-4 px-4 font-semibold text-shiny-gold">{formatPrice(order.amount)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider border uppercase transition-all duration-300 ${
                              order.status === "Delivered"
                                ? "bg-green-950/20 text-green-400 border-green-900/30 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                                : order.status === "Cancelled"
                                ? "bg-red-950/20 text-red-400 border-red-900/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                                : "bg-primary/10 text-primary border-primary/20 shadow-[0_0_8px_rgba(201,168,76,0.1)] text-glow-gold"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-primary hover:underline font-bold text-xs uppercase tracking-wider text-glow-gold"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* My Saved Builds */}
        <ScrollReveal delay={450}>
          <div className="glass-dashboard-card p-8 relative z-10">
            <h2 className="text-2xl font-light text-white font-serif uppercase tracking-widest mb-6 flex items-center gap-3 text-glow-white">
              <FaHistory className="text-primary text-xl text-glow-gold" /> My Saved Builds
            </h2>
            <div className="h-px bg-white/5 mb-6" />

            {savedBuilds.length === 0 ? (
              <div className="text-center py-16">
                <FaBoxOpen className="text-6xl text-primary/30 mx-auto mb-4 floating-box" />
                <p className="text-zinc-300 text-base uppercase tracking-widest mb-6 font-medium">
                  No saved custom configurations.
                </p>
                <Link
                  href="/build-your-sound"
                  className="inline-block px-8 py-3 bg-primary text-background font-bold uppercase tracking-wider rounded-full hover:bg-[#b58c3c] hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all duration-300 text-xs text-glow-none"
                >
                  Build Your Sound
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedBuilds.map((build, idx) => (
                  <div
                    key={build.id}
                    className="p-6 rounded-2xl flex flex-col justify-between build-card-flip"
                    style={{
                      background: "rgba(255, 255, 255, 0.01)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      borderTop: "1.5px solid rgba(201, 168, 76, 0.15)",
                      animationDelay: `${idx * 100}ms`
                    }}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2 font-serif text-glow-white">
                        {build.name}
                      </h3>
                      <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-4 text-glow-gold">
                        {build.tier} Tier • {build.technology} {build.type}
                      </p>
                      <ul className="space-y-1.5 text-zinc-300 text-sm mb-6">
                        <li>
                          <span className="text-primary font-bold text-glow-gold mr-1">Finish:</span> {build.finish}
                        </li>
                        {build.notes && (
                          <li className="line-clamp-2">
                            <span className="text-primary font-bold text-glow-gold mr-1">Notes:</span> {build.notes}
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleReorderBuild(build)}
                        disabled={isReorderingId === build.id}
                        className="flex-grow py-2.5 rounded-full bg-primary text-background font-bold text-xs uppercase tracking-wider hover:bg-[#b58c3c] transition-all duration-300 disabled:opacity-50 text-glow-none"
                      >
                        {isReorderingId === build.id ? "Ordering..." : "Reorder"}
                      </button>
                      <button
                        onClick={() => handleDeleteBuild(build.id)}
                        className="px-4 py-2.5 rounded-full border border-white/10 text-white/55 hover:text-red-400 hover:border-red-900/30 transition-colors"
                        aria-label="Delete saved config"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

      </div>

      {/* ── Order Details Dialog Modal ── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg rounded-3xl p-8 border border-white/10 text-left overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(25,25,25,0.98) 0%, rgba(10,10,10,0.99) 100%)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
              }}
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>

              <h3 className="text-2xl font-light text-white font-serif uppercase tracking-widest mb-4 text-glow-white">
                Order Tracking
              </h3>
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-mono mb-6">
                ID: #{selectedOrder.id.toUpperCase()}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400 text-sm">Product</span>
                  <span className="text-white font-bold text-sm max-w-[280px] text-right">
                    {selectedOrder.product}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400 text-sm">Total Paid</span>
                  <span className="text-primary font-bold text-sm text-shiny-gold">
                    {formatPrice(selectedOrder.amount)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400 text-sm">Date</span>
                  <span className="text-zinc-200 text-sm">
                    {selectedOrder.createdAt?.toDate?.()
                      ? selectedOrder.createdAt.toDate().toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
              </div>

              {/* Progress Steps */}
              {selectedOrder.status !== "Cancelled" ? (
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-300 mb-6">
                    Delivery Status
                  </h4>
                  <div className="relative pt-6 pb-4">
                    {/* Track */}
                    <div className="absolute top-8 left-0 w-full h-1 bg-white/10 rounded-full" />
                    {/* Fill */}
                    <div
                      className="absolute top-8 left-0 h-1 bg-primary rounded-full transition-all duration-1000"
                      style={{
                        width: selectedOrder.status === "Delivered" ? "100%" : "40%",
                      }}
                    />
                    
                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {[
                        { step: "Processing", complete: true },
                        { step: "Shipped", complete: selectedOrder.status === "Delivered" },
                        { step: "Delivered", complete: selectedOrder.status === "Delivered" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mb-3 z-10 transition-all ${
                              item.complete
                                ? "bg-primary border-primary shadow-[0_0_8px_rgba(201,168,76,0.6)]"
                                : "bg-[#111111] border-white/20"
                            }`}
                          />
                          <span
                            className={`text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                              item.complete ? "text-primary text-glow-gold" : "text-white/30"
                            }`}
                          >
                            {item.step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-red-900/20 bg-red-950/10 text-center text-red-400 font-semibold text-sm">
                  This order was Cancelled. If you have questions, please reach out to support.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Logout Confirmation Dialog Modal ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-sm rounded-3xl p-8 border border-white/10 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.99) 100%)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
              }}
            >
              <h3 className="text-xl font-light text-white font-serif uppercase tracking-widest mb-4 text-glow-white">
                Confirm Log Out
              </h3>
              <p className="text-zinc-300 text-sm mb-8 leading-relaxed">
                Are you sure you want to log out of your Soundwave profile?
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-grow py-3 rounded-full border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="flex-grow py-3 rounded-full bg-primary text-background font-bold text-xs uppercase tracking-wider hover:bg-[#b58c3c] hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all text-glow-none"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
