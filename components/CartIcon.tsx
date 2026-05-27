"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/context/CartContext";

export default function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Shopping cart, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
      className="relative flex items-center justify-center w-9 h-9 transition-colors duration-300"
      style={{ color: "#A8A8A8" }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.color = "#F5F5F5")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.color = "#A8A8A8")
      }
    >
      <FaShoppingCart className="text-xl" />

      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute -top-2.5 -right-2.5 flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold tabular-nums"
            style={{
              background: "#C9A84C",
              color: "#0D0D0D",
              fontSize: "0.6rem",
              letterSpacing: "0",
            }}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
