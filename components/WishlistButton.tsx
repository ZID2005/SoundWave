"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({ productId, className = "" }: WishlistButtonProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWishlist() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "wishlists"),
          where("userId", "==", user.uid),
          where("productId", "==", productId)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsWishlisted(true);
          setDocId(snapshot.docs[0].id);
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      } finally {
        setLoading(false);
      }
    }
    checkWishlist();
  }, [user, productId]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if this is inside a Link
    
    if (!user) {
      toast.error("Please login to save to wishlist");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isWishlisted && docId) {
        // Remove from wishlist
        await deleteDoc(doc(db, "wishlists", docId));
        setIsWishlisted(false);
        setDocId(null);
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        const docRef = await addDoc(collection(db, "wishlists"), {
          userId: user.uid,
          productId,
          addedAt: serverTimestamp()
        });
        setIsWishlisted(true);
        setDocId(docRef.id);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={toggleWishlist}
      className={`p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-all shadow-xl z-20 ${className}`}
      disabled={loading}
      aria-label="Toggle Wishlist"
    >
      {isWishlisted ? (
        <FaHeart className="text-primary text-xl" />
      ) : (
        <FaRegHeart className="text-white text-xl hover:text-primary transition-colors" />
      )}
    </motion.button>
  );
}
