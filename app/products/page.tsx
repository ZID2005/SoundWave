"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaTimes } from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import WishlistButton from "@/components/WishlistButton";

const CATEGORIES = ["All", "Amplifiers", "Speakers", "Sound Systems", "Cables"];
const TECHNOLOGIES = ["All", "Tube", "Solid State", "Hybrid", "Digital"];
const PRICE_RANGES = [
  { label: "All", value: "all" },
  { label: "Under ₹50K", value: "under-50k" },
  { label: "₹50K - ₹1L", value: "50k-1l" },
  { label: "₹1L - ₹3L", value: "1l-3l" },
  { label: "₹3L+", value: "3l+" },
];

// ── Module-level cache: persists across route changes within same session ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let productsCache: any[] | null = null;

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get("category");
  
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTech, setSelectedTech] = useState<string>("All");
  const [selectedPrice, setSelectedPrice] = useState<string>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>(productsCache ?? []);
  const [loading, setLoading] = useState(productsCache === null);

  useEffect(() => {
    // If we already have cached data, skip fetching entirely
    if (productsCache !== null) return;

    async function fetchProducts() {
      try {
        const snap = await getDocs(collection(db, "products"));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        productsCache = data;
        setProducts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Initialize category from URL if present
  useEffect(() => {
    if (urlCategory) {
      const match = CATEGORIES.find(c => c.toLowerCase().replace(" ", "-") === urlCategory.toLowerCase());
      if (match) setSelectedCategory(match);
    }
  }, [urlCategory]);

  // Update URL when category changes (optional, but good UX)
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "All") {
      router.push("/products", { scroll: false });
    } else {
      router.push(`/products?category=${cat.toLowerCase().replace(" ", "-")}`, { scroll: false });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === "All" || product.category === selectedCategory.toLowerCase().replace(" ", "-");
    const matchTech = selectedTech === "All" || product.technology === selectedTech.toLowerCase().replace(" ", "-");
    const matchPrice = selectedPrice === "all" || product.priceRange === selectedPrice;
    return matchCategory && matchTech && matchPrice;
  });

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Category Filter */}
      <div>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>Category</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: "0.4rem 1rem",
                border: selectedCategory === cat ? "1px solid #C9A84C" : "1px solid #1F1F1F",
                background: selectedCategory === cat ? "rgba(201,168,76,0.1)" : "transparent",
                color: selectedCategory === cat ? "#C9A84C" : "#6B6B6B",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Technology Filter */}
      <div>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>Technology</h3>
        <div className="flex flex-wrap gap-2">
          {TECHNOLOGIES.map(tech => (
            <button
              key={tech}
              onClick={() => setSelectedTech(tech)}
              style={{
                padding: "0.4rem 1rem",
                border: selectedTech === tech ? "1px solid #C9A84C" : "1px solid #1F1F1F",
                background: selectedTech === tech ? "rgba(201,168,76,0.1)" : "transparent",
                color: selectedTech === tech ? "#C9A84C" : "#6B6B6B",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>Price Range</h3>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map(price => (
            <button
              key={price.value}
              onClick={() => setSelectedPrice(price.value)}
              style={{
                textAlign: "left",
                padding: "0.6rem 1rem",
                border: selectedPrice === price.value ? "1px solid rgba(201,168,76,0.4)" : "1px solid #1F1F1F",
                background: selectedPrice === price.value ? "rgba(201,168,76,0.07)" : "transparent",
                color: selectedPrice === price.value ? "#C9A84C" : "#6B6B6B",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.8rem",
                letterSpacing: "0.05em",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {price.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-24" style={{ backgroundColor: "transparent" }}>
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-14 flex justify-between items-end">
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "1rem" }}>Catalogue</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F5F5F5" }}>Our Products</h1>
            <div style={{ height: "1px", width: "3rem", background: "#C9A84C", opacity: 0.5, marginTop: "1rem" }} />
          </div>
          
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2"
            style={{ padding: "0.5rem 1.25rem", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C", background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em" }}
          >
            <FaFilter /> Filters
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <FilterContent />
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="py-20 text-center text-primary font-bold tracking-widest uppercase animate-pulse">Loading Products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <p className="text-xl text-secondary">No products found matching your criteria.</p>
                <button 
                  onClick={() => {
                    handleCategoryChange("All");
                    setSelectedTech("All");
                    setSelectedPrice("all");
                  }}
                  className="mt-6 px-6 py-2 border border-primary text-primary hover:bg-primary hover:text-background transition-colors rounded-full uppercase tracking-wider text-sm font-bold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Link href={`/products/${product.id}`} key={product.id}>
                    <div
                      className="group card-hover h-full flex flex-col"
                      style={{ background: "#141414", border: "1px solid #1F1F1F" }}
                    >
                      {/* Image Area 4:3 */}
                      <div className="w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center" style={{ background: "#0D0D0D" }}>
                        <WishlistButton productId={product.id} className="absolute top-4 right-4 z-20" />
                        {product.image && product.image !== "placeholder" ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                        ) : (
                          <>
                            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
                            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "2rem", fontWeight: 300, color: "rgba(255,255,255,0.06)", letterSpacing: "0.3em", textTransform: "uppercase" }}>SoundWave</span>
                          </>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="mb-auto">
                          <span
                            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9A84C", display: "inline-block", marginBottom: "0.75rem" }}
                          >
                            {product.category.replace("-", " ")}
                          </span>
                          <h3
                            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.4rem", fontWeight: 400, letterSpacing: "0.04em", color: "#F5F5F5", lineHeight: 1.3, transition: "color 0.3s ease" }}
                            className="group-hover:text-[#C9A84C] transition-colors duration-300 mb-2"
                          >
                            {product.name}
                          </h3>
                        </div>
                        <div className="mt-5 pt-4 flex justify-between items-center" style={{ borderTop: "1px solid #1F1F1F" }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.1rem", fontWeight: 400, color: "#C9A84C", letterSpacing: "0.05em" }}>
                            {product.priceRangeText}
                          </span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B6B", border: "1px solid #1F1F1F", padding: "0.2rem 0.6rem" }}>
                            {product.technology}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-white/10 rounded-t-3xl z-50 md:hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest">Filters</h2>
                  <button 
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-background transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
                <FilterContent />
                
                <button 
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full mt-8 py-4 bg-primary text-background font-bold tracking-widest uppercase rounded-xl"
                >
                  View {filteredProducts.length} Products
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pt-32 flex justify-center">
        <div className="text-primary tracking-widest uppercase animate-pulse font-bold">Loading...</div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
