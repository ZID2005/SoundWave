"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface WishlistButtonProps {
  product: {
    id: string;
    name: string;
    category: string;
    priceRangeText: string;
    image?: string;
  };
  className?: string;
}

export default function WishlistButton({ product, className = "" }: WishlistButtonProps) {
  const { addToCart, removeFromCart, isInCart } = useCart();

  // mounted prevents hydration mismatch:
  // server always renders empty heart, client shows real cart state after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const inCart = mounted && isInCart(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCart(product.id)) {
      removeFromCart(product.id);
      toast.success(`${product.name} removed from cart`);
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        category: product.category,
        priceRangeText: product.priceRangeText,
        image: product.image,
      });
      toast.success(`${product.name} added to cart! 🛒`);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      onClick={handleClick}
      className={`p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-all shadow-xl z-20 ${className}`}
      aria-label={inCart ? "Remove from cart" : "Add to cart"}
    >
      {inCart ? (
        <FaHeart className="text-primary text-xl" />
      ) : (
        <FaRegHeart className="text-white text-xl hover:text-primary transition-colors" />
      )}
    </motion.button>
  );
}
