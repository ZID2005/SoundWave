"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaTimes, FaArrowRight, FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

/* ─── Cutout corner SVG ─────────────────────────────────────────────────── */
// Creates the concave "bite" illusion at a card corner
export function CutoutCorner({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0 28C0 12.536 12.536 0 28 0H0V28Z" fill="currentColor" />
    </svg>
  );
}

/* ─── isNewProduct helper ───────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNewProduct(product: any): boolean {
  if (!product) return false;
  // Firestore Timestamp has .toDate()
  const raw = product.createdAt;
  if (!raw) return false;
  const createdAt: Date =
    typeof raw.toDate === "function" ? raw.toDate() : new Date(raw);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return createdAt > sevenDaysAgo;
}

/* ─── NEW badge ─────────────────────────────────────────────────────────── */
export function NewBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: "36px",
        background: "linear-gradient(135deg, #C9A84C 0%, #e6c060 100%)",
        color: "#000000",
        fontFamily: "'Inter', sans-serif",
        fontSize: small ? "9px" : "10px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        boxShadow: "0 0 14px rgba(201,168,76,0.45)",
      }}
    >
      New
    </span>
  );
}

/* ─── NEW badge for card overlay (top-left corner) ─────────────────────── */
export function NewCardBadge() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 15,
      }}
    >
      {/* The inset label with cutout corners */}
      <div
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #C9A84C 0%, #e6c060 100%)",
          padding: "5px 14px 5px 10px",
          borderRadius: "0 0 12px 0",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#000",
          }}
        >
          New Arrival
        </span>
        {/* Bottom-right cutout to make it look inset */}
        <CutoutCorner
          className="absolute -bottom-[28px] -right-px rotate-180"
          style={{ color: "transparent" } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

/* ─── New Product Modal ─────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NewProductModal({
  product,
  onClose,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  onClose: () => void;
}) {
  const { addToCart, isInCart } = useCart();
  const overlayRef = useRef<HTMLDivElement>(null);
  const inCart = isInCart(product.id);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 9000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "520px",
            background: "#111111",
            borderRadius: "20px",
            border: "1px solid rgba(201,168,76,0.2)",
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(201,168,76,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Image section ── */}
          <div
            style={{
              position: "relative",
              height: "260px",
              background: "#1d1d1f",
              overflow: "hidden",
            }}
          >
            {product.image && product.image !== "placeholder" ? (
              <motion.img
                src={product.images?.[0] || product.image}
                alt={product.name}
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.1) 0%, transparent 65%)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "2rem",
                    fontWeight: 300,
                    color: "rgba(201,168,76,0.12)",
                    letterSpacing: "0.4em",
                    textTransform: "uppercase",
                  }}
                >
                  SoundWave
                </span>
              </div>
            )}

            {/* Dark gradient at bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "80px",
                background: "linear-gradient(to top, #111111, transparent)",
              }}
            />

            {/* ── NEW inset label — bottom-left with cutout corners ── */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
              }}
            >
              <div
                style={{
                  position: "relative",
                  background: "linear-gradient(135deg, #C9A84C 0%, #e8c96a 100%)",
                  padding: "6px 18px 6px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "0 14px 0 0",
                }}
              >
                {/* Pulse dot */}
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#000",
                    flexShrink: 0,
                    animation: "np-pulse 1.8s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#000000",
                  }}
                >
                  New Arrival
                </span>
                {/* Top-right cutout */}
                <CutoutCorner
                  className="absolute -top-[28px] -right-px"
                  style={{ color: "rgba(201,168,76,1)", transform: "rotate(90deg)" } as React.CSSProperties}
                />
                {/* Bottom-right cutout */}
                <CutoutCorner
                  className="absolute -right-[28px] -bottom-px"
                  style={{ color: "linear-gradient(135deg, #C9A84C, #e8c96a)" } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Close button — top right */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.2)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.5)")}
            >
              <FaTimes size={11} />
            </button>
          </div>

          {/* ── Card content ── */}
          <div style={{ padding: "24px 28px 28px" }}>
            {/* Badges */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
              <NewBadge />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: "36px",
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#C9A84C",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {product.category?.replace("-", " ")}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: "36px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#86868b",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {product.technology}
              </span>
            </div>

            {/* Name */}
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "28px",
                fontWeight: 400,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                marginBottom: "10px",
              }}
            >
              {product.name}
            </h2>

            {/* Price */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "20px",
                fontWeight: 500,
                color: "#C9A84C",
                marginBottom: "14px",
              }}
            >
              {product.priceRangeText}
            </p>

            {/* Description — 2 line clamp */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                color: "#86868b",
                lineHeight: 1.65,
                marginBottom: "24px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.description}
            </p>

            {/* Thin gold divider */}
            <div
              style={{
                height: "1px",
                background: "rgba(201,168,76,0.15)",
                marginBottom: "20px",
              }}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Add to Cart */}
              <button
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
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "980px",
                  border: inCart ? "1px solid rgba(201,168,76,0.3)" : "none",
                  background: inCart ? "rgba(201,168,76,0.12)" : "#C9A84C",
                  color: inCart ? "#C9A84C" : "#000000",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!inCart) (e.currentTarget as HTMLButtonElement).style.background = "#b8852a";
                }}
                onMouseLeave={(e) => {
                  if (!inCart) (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C";
                }}
              >
                <FaShoppingCart size={12} />
                {inCart ? "In Cart" : "Add to Cart"}
              </button>

              {/* View Product */}
              <Link
                href={`/products/${product.id}`}
                onClick={onClose}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "980px",
                  border: "1px solid rgba(201,168,76,0.35)",
                  background: "transparent",
                  color: "#C9A84C",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#C9A84C";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#000";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C";
                }}
              >
                View Product
                <FaArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* ── Pinned "just added" strip at very bottom ── */}
          <div
            style={{
              padding: "10px 28px",
              background: "rgba(201,168,76,0.05)",
              borderTop: "1px solid rgba(201,168,76,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#C9A84C",
                flexShrink: 0,
                animation: "np-pulse 1.8s ease-in-out infinite",
              }}
            />
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                fontWeight: 400,
                color: "#86868b",
                letterSpacing: "0.04em",
              }}
            >
              Just added to our catalogue — available now
            </p>
          </div>
        </motion.div>

        {/* Keyframes */}
        <style>{`
          @keyframes np-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.7); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
