"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import ContactPopup from "@/components/ContactPopup";
import WishlistButton from "@/components/WishlistButton";
import Loading from "@/components/Loading";
import { FaChevronLeft, FaShoppingCart, FaCheck } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { user, setShowAuthModal } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const pendingEnquiry = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [product, setProduct] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // When user logs in after clicking Enquire Now, auto-open the contact popup
  useEffect(() => {
    if (user && pendingEnquiry.current) {
      pendingEnquiry.current = false;
      setIsPopupOpen(true);
    }
  }, [user]);

  const handleEnquireClick = () => {
    if (user) {
      setIsPopupOpen(true);
    } else {
      pendingEnquiry.current = true;
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      try {
        const docRef = doc(db, "products", params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pData: any = { id: docSnap.id, ...docSnap.data() };
          setProduct(pData);
          
          // Fetch related products
          const q = query(
            collection(db, "products"), 
            where("category", "==", pData.category), 
            limit(4)
          );
          const relSnap = await getDocs(q);
          setRelatedProducts(
            relSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.id !== pData.id)
              .slice(0, 3)
          );
        } else {
          notFound();
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-32 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors mb-8 font-bold uppercase tracking-wider text-sm">
          <FaChevronLeft /> Back to Products
        </Link>

        {/* Main Product Section */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-24">
          
          {/* Image Side */}
          <div className="w-full lg:w-1/2">
            <div className="w-full aspect-[4/3] relative rounded-3xl bg-[#111111] overflow-hidden flex items-center justify-center glass-card border border-white/5 shadow-2xl">
              <WishlistButton productId={product.id} className="absolute top-6 right-6 z-20" />
              {product.image && product.image !== "placeholder" ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-[#1a1a1a] to-primary/10 opacity-80 pointer-events-none" />
                  <span className="relative z-10 text-white/10 font-black tracking-widest uppercase rotate-[-20deg] text-5xl md:text-7xl text-center px-4 pointer-events-none">
                    {product.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Details Side */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider rounded-full">
                {product.category.replace("-", " ")}
              </span>
              <span className="px-4 py-1.5 border border-white/10 text-secondary text-sm font-bold uppercase tracking-wider rounded-full">
                {product.technology}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-wider leading-tight mb-4">
              {product.name}
            </h1>
            
            <p className="text-2xl text-secondary font-medium tracking-wide mb-8">
              {product.priceRangeText}
            </p>

            <div className="h-px w-full bg-white/10 mb-8" />

            <p className="text-lg text-secondary leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Add to Cart Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                addToCart({
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  priceRangeText: product.priceRangeText,
                  image: product.image,
                });
                if (!isInCart(product.id)) {
                  toast.success(`${product.name} added to cart`);
                }
              }}
              className="flex items-center justify-center gap-3 w-full md:w-auto mb-8 transition-all duration-300"
              style={{
                padding: "0.85rem 2.5rem",
                background: isInCart(product.id)
                  ? "rgba(201,168,76,0.15)"
                  : "transparent",
                border: "1px solid #C9A84C",
                color: "#C9A84C",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C";
                (e.currentTarget as HTMLButtonElement).style.color = "#0D0D0D";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isInCart(product.id)
                  ? "rgba(201,168,76,0.15)"
                  : "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#C9A84C";
              }}
            >
              {isInCart(product.id) ? (
                <><FaCheck className="text-base" /> In Cart</>
              ) : (
                <><FaShoppingCart className="text-base" /> Add to Cart</>
              )}
            </motion.button>

            {/* Specs Table */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-8 glass-card">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-6">Technical Specifications</h3>
              <div className="space-y-4">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-secondary font-medium mb-1 sm:mb-0">{key}</span>
                    <span className="text-white font-bold">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-8">Pairs Well With</h2>
            <div className="flex overflow-x-auto pb-8 -mx-6 px-6 gap-6 md:grid md:grid-cols-3 md:overflow-visible md:p-0 md:m-0 scrollbar-hide">
              {relatedProducts.map(related => (
                <Link href={`/products/${related.id}`} key={related.id} className="min-w-[280px] md:min-w-0">
                  <div className="glass-card rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(212,168,83,0.15)] hover:border-primary/50 border border-white/5 h-full flex flex-col">
                    <div className="w-full aspect-[4/3] relative bg-[#111111] overflow-hidden flex items-center justify-center">
                      <WishlistButton productId={related.id} className="absolute top-4 right-4 scale-75 md:scale-100 origin-top-right z-20" />
                      {related.image && related.image !== "placeholder" ? (
                        <img src={related.image} alt={related.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-[#1a1a1a] to-primary/10 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />
                          <span className="relative z-10 text-white/20 font-black tracking-widest uppercase rotate-[-20deg] text-xl pointer-events-none">SoundWave</span>
                        </>
                      )}
                    </div>
                    <div className="p-6">
                      <span className="text-primary text-xs font-bold uppercase tracking-wider block mb-2">
                        {related.category.replace("-", " ")}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                        {related.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Enquire Now Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-auto md:right-8 z-40">
        <button
          onClick={handleEnquireClick}
          className="w-full md:w-auto px-8 py-5 bg-primary text-background font-black text-lg md:text-xl uppercase tracking-widest rounded-2xl md:rounded-full shadow-[0_0_30px_rgba(212,168,83,0.3)] hover:scale-105 hover:bg-[#b58c3c] transition-all duration-300 md:writing-vertical-lr"
        >
          Enquire Now
        </button>
      </div>

      <ContactPopup 
        isOpen={isPopupOpen} 
        onClose={() => setIsPopupOpen(false)} 
        productName={product.name} 
      />
    </div>
  );
}
