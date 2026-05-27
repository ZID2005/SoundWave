"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaShoppingCart, FaTrash, FaArrowLeft } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, removeFromCart, clearCart, itemCount } = useCart();

  const handleRemove = (id: string, name: string) => {
    removeFromCart(id);
    toast.success(`${name} removed from cart`);
  };

  return (
    <div className="min-h-screen pt-32 pb-24" style={{ backgroundColor: "transparent" }}>
      <div className="container mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="mb-14">
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.62rem",
              fontWeight: 500,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#C9A84C",
              marginBottom: "1rem",
            }}
          >
            Your Selection
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 300,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#F5F5F5",
            }}
          >
            Cart
          </h1>
          <div
            style={{
              height: "1px",
              width: "3rem",
              background: "#C9A84C",
              opacity: 0.5,
              marginTop: "1rem",
            }}
          />
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-6"
          >
            <FaShoppingCart
              style={{ fontSize: "4rem", color: "#2A2A2A" }}
            />
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 300,
                letterSpacing: "0.1em",
                color: "#6B6B6B",
                textTransform: "uppercase",
              }}
            >
              Your cart is empty
            </p>
            <Link
              href="/products"
              className="flex items-center gap-2 mt-4 transition-colors duration-300"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#C9A84C",
                padding: "0.6rem 1.8rem",
                border: "1px solid rgba(201,168,76,0.5)",
              }}
            >
              <FaArrowLeft />
              Browse Products
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Items list */}
            <div className="flex-grow">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-6 mb-6 p-5"
                    style={{
                      background: "#141414",
                      border: "1px solid #1F1F1F",
                    }}
                  >
                    {/* Product image / placeholder */}
                    <div
                      className="shrink-0 w-24 h-20 flex items-center justify-center overflow-hidden"
                      style={{ background: "#0D0D0D" }}
                    >
                      {item.image && item.image !== "placeholder" ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: "0.7rem",
                            color: "rgba(255,255,255,0.08)",
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                          }}
                        >
                          SW
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.6rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "#C9A84C",
                          display: "block",
                          marginBottom: "0.3rem",
                        }}
                      >
                        {item.category.replace("-", " ")}
                      </span>
                      <Link
                        href={`/products/${item.id}`}
                        className="block truncate transition-colors duration-300 hover:text-[#C9A84C]"
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: "1.15rem",
                          fontWeight: 400,
                          letterSpacing: "0.04em",
                          color: "#F5F5F5",
                        }}
                      >
                        {item.name}
                      </Link>
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: "0.95rem",
                          color: "#A8A8A8",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {item.priceRangeText}
                      </span>
                    </div>

                    {/* Qty & remove */}
                    <div className="shrink-0 flex items-center gap-4">
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.75rem",
                          letterSpacing: "0.1em",
                          color: "#6B6B6B",
                        }}
                      >
                        ×{item.quantity}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleRemove(item.id, item.name)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="p-2 transition-colors duration-300"
                        style={{ color: "#3A3A3A" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color = "#C9A84C")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color = "#3A3A3A")
                        }
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Clear all */}
              <button
                onClick={() => {
                  clearCart();
                  toast.success("Cart cleared");
                }}
                className="mt-2 transition-colors duration-300"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#3A3A3A",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#6B6B6B")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = "#3A3A3A")
                }
              >
                Clear All
              </button>
            </div>

            {/* Summary panel */}
            <div
              className="lg:w-80 shrink-0 h-fit p-8"
              style={{ background: "#141414", border: "1px solid #1F1F1F" }}
            >
              <h2
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.62rem",
                  fontWeight: 500,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  marginBottom: "1.5rem",
                }}
              >
                Order Summary
              </h2>

              <div
                style={{ height: "1px", background: "#1F1F1F", marginBottom: "1.5rem" }}
              />

              <div className="flex justify-between items-center mb-2">
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8rem",
                    color: "#6B6B6B",
                    letterSpacing: "0.05em",
                  }}
                >
                  Items
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8rem",
                    color: "#A8A8A8",
                  }}
                >
                  {itemCount}
                </span>
              </div>

              <div
                style={{
                  height: "1px",
                  background: "#1F1F1F",
                  margin: "1.5rem 0",
                }}
              />

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.72rem",
                  color: "#6B6B6B",
                  letterSpacing: "0.05em",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                Pricing is bespoke and varies by configuration. An expert will
                contact you to finalise your order.
              </p>

              <Link
                href="/products"
                className="block w-full text-center transition-all duration-300 mb-4"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  padding: "0.75rem 1.5rem",
                  border: "1px solid rgba(201,168,76,0.5)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#C9A84C";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#0D0D0D";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C";
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
