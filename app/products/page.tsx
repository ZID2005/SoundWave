"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaTimes } from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import WishlistButton from "@/components/WishlistButton";
import { dummyProducts, setSharedProductsCache } from "@/lib/products";
import { isNewProduct, NewCardBadge, NewProductModal } from "@/components/NewProductModal";
import { SWPagination } from "@/components/SWPagination";

const ITEMS_PER_PAGE = 3;

const CATEGORIES = ["All", "Amplifiers", "Speakers", "Sound Systems", "Cables"];
const TECHNOLOGIES = ["All", "Tube", "Solid State", "Hybrid", "Digital"];
const PRICE_RANGES = [
  { label: "All", value: "all" },
  { label: "Under ₹50K", value: "under-50k" },
  { label: "₹50K – ₹1L", value: "50k-1l" },
  { label: "₹1L – ₹3L", value: "1l-3l" },
  { label: "₹3L+", value: "3l+" },
];

// ── Module-level cache: persists across route changes within same session ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let productsCache: any[] | null = null;

/* ─── Skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "240px",
          background: "#1d1d1f",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="sw-shimmer" />
      </div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ height: "11px", width: "60px", background: "#1d1d1f", borderRadius: "4px", position: "relative", overflow: "hidden" }}>
          <div className="sw-shimmer" />
        </div>
        <div style={{ height: "17px", width: "75%", background: "#1d1d1f", borderRadius: "4px", position: "relative", overflow: "hidden" }}>
          <div className="sw-shimmer" />
        </div>
        <div style={{ height: "14px", width: "45%", background: "#1d1d1f", borderRadius: "4px", marginTop: "4px", position: "relative", overflow: "hidden" }}>
          <div className="sw-shimmer" />
        </div>
      </div>
    </div>
  );
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [newModalProduct, setNewModalProduct] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (productsCache !== null) return;

    async function fetchProducts() {
      try {
        const snap = await getDocs(collection(db, "products"));
        if (snap.empty) {
          productsCache = dummyProducts;
          setSharedProductsCache(dummyProducts);
          setProducts(dummyProducts);
        } else {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          productsCache = data;
          setSharedProductsCache(data);
          setProducts(data);
        }
      } catch (e) {
        console.error("Firestore fetch failed, falling back to dummyProducts:", e);
        productsCache = dummyProducts;
        setSharedProductsCache(dummyProducts);
        setProducts(dummyProducts);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (urlCategory) {
      const match = CATEGORIES.find(c => c.toLowerCase().replace(" ", "-") === urlCategory.toLowerCase());
      if (match) setSelectedCategory(match);
    }
  }, [urlCategory]);

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

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 whenever filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCurrentPage(1); }, [selectedCategory, selectedTech, selectedPrice]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ─── Filter pill (CATEGORY / TECHNOLOGY) ────────────────────────────── */
  const FilterPill = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`sw-filter-pill${active ? " sw-filter-pill--active" : ""}`}
    >
      {label}
    </button>
  );

  /* ─── Price range row ─────────────────────────────────────────────────── */
  const PriceRow = ({
    label,
    active,
    onClick,
    isLast,
  }: {
    label: string;
    value: string;
    active: boolean;
    onClick: () => void;
    isLast: boolean;
  }) => (
    <div>
      <button
        onClick={onClick}
        className={`sw-price-row${active ? " sw-price-row--active" : ""}`}
      >
        <span className="sw-price-arrow">{active ? "▸" : "\u00a0"}</span>
        {label}
      </button>
      {!isLast && <div className="sw-price-sep" />}
    </div>
  );

  /* ─── Sidebar filter content ──────────────────────────────────────────── */
  const FilterContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* CATEGORY */}
      <div>
        <div className="sw-filter-section-head">
          <span className="sw-filter-section-label">Category</span>
          <div className="sw-filter-section-rule" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" }}>
          {CATEGORIES.map(cat => (
            <FilterPill
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onClick={() => handleCategoryChange(cat)}
            />
          ))}
        </div>
      </div>

      {/* TECHNOLOGY */}
      <div>
        <div className="sw-filter-section-head">
          <span className="sw-filter-section-label">Technology</span>
          <div className="sw-filter-section-rule" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" }}>
          {TECHNOLOGIES.map(tech => (
            <FilterPill
              key={tech}
              label={tech}
              active={selectedTech === tech}
              onClick={() => setSelectedTech(tech)}
            />
          ))}
        </div>
      </div>

      {/* PRICE RANGE */}
      <div>
        <div className="sw-filter-section-head">
          <span className="sw-filter-section-label">Price Range</span>
          <div className="sw-filter-section-rule" />
        </div>
        <div style={{ marginTop: "20px" }}>
          {PRICE_RANGES.map((price, idx) => (
            <PriceRow
              key={price.value}
              label={price.label}
              value={price.value}
              active={selectedPrice === price.value}
              onClick={() => setSelectedPrice(price.value)}
              isLast={idx === PRICE_RANGES.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Scoped styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

        /* shimmer animation */
        @keyframes sw-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .sw-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
          animation: sw-shimmer 1.8s ease-in-out infinite;
        }

        /* header fade-in */
        @keyframes sw-header-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sw-header-animate {
          animation: sw-header-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
          opacity: 0;
        }
        .sw-divider-animate {
          animation: sw-divider-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards;
          transform: scaleX(0);
          transform-origin: left center;
        }
        @keyframes sw-divider-in {
          to { transform: scaleX(1); }
        }

        /* card stagger */
        @keyframes sw-card-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── sidebar slide-in ── */
        @keyframes sw-sidebar-in {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sw-sidebar {
          animation: sw-sidebar-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        /* ── filter section header ── */
        .sw-filter-section-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sw-filter-section-label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C9A84C;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .sw-filter-section-rule {
          flex: 1;
          height: 1px;
          background: rgba(201,168,76,0.15);
        }

        /* ── filter pill (CATEGORY / TECH) ── */
        .sw-filter-pill {
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #6b6b6b;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
          line-height: 1.6;
        }
        .sw-filter-pill:hover {
          color: #ffffff;
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.07);
        }
        .sw-filter-pill--active {
          background: rgba(201,168,76,0.15) !important;
          border-color: #C9A84C !important;
          color: #ffffff !important;
        }

        /* ── price range list ── */
        .sw-price-row {
          display: flex;
          align-items: center;
          gap: 7px;
          width: 100%;
          padding: 0;
          background: none;
          border: none;
          color: #6b6b6b;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          text-align: left;
          padding: 5px 0;
          transition: color 0.15s ease;
        }
        .sw-price-row:hover {
          color: #ffffff;
        }
        .sw-price-row--active {
          color: #C9A84C !important;
        }
        .sw-price-arrow {
          font-size: 9px;
          width: 10px;
          display: inline-block;
          flex-shrink: 0;
          color: #C9A84C;
          transition: opacity 0.15s ease;
        }
        .sw-price-sep {
          height: 1px;
          background: rgba(255,255,255,0.04);
          margin: 0;
        }

        /* ── legacy classes kept for mobile drawer ── */
        .sw-filter-label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C9A84C;
          margin-bottom: 12px;
        }
        .sw-filter-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          width: 100%;
        }

        /* product card */
        .sw-product-card {
          background: #111111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.25s ease, transform 0.25s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
        }
        .sw-product-card:hover {
          border-color: rgba(201,168,76,0.3);
          transform: translateY(-4px);
        }
        .sw-product-card:hover .sw-card-img-inner {
          transform: scale(1.02);
        }

        /* card image inner — scales on hover */
        .sw-card-img-inner {
          width: 100%;
          height: 100%;
          transition: transform 0.25s ease;
          position: relative;
        }

        /* mobile filter drawer */
        .sw-mobile-filter-header {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #ffffff;
        }

        /* empty state box icon */
        .sw-empty-icon {
          width: 48px;
          height: 48px;
          border: 1.5px solid rgba(201,168,76,0.5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
        }

        /* clear filters btn */
        .sw-clear-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 24px;
          border: 1px solid rgba(201,168,76,0.5);
          border-radius: 8px;
          background: transparent;
          color: #C9A84C;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
          margin-top: 20px;
        }
        .sw-clear-btn:hover {
          background: rgba(201,168,76,0.08);
          border-color: #C9A84C;
        }

        /* mobile filter apply btn */
        .sw-mobile-apply-btn {
          width: 100%;
          padding: 14px;
          margin-top: 32px;
          background: #C9A84C;
          color: #000000;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .sw-mobile-apply-btn:hover {
          background: #b8962f;
        }

        /* mobile filter toggle */
        .sw-mobile-filter-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid rgba(201,168,76,0.35);
          border-radius: 8px;
          background: transparent;
          color: #C9A84C;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .sw-mobile-filter-toggle:hover {
          border-color: #C9A84C;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#000000",
          paddingTop: "120px",
          paddingBottom: "96px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {/* ── Page Header ── */}
          <div
            className="sw-header-animate"
            style={{
              marginBottom: "48px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#86868b",
                  marginBottom: "14px",
                }}
              >
                Catalogue
              </p>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
                  fontWeight: 300,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  lineHeight: 1,
                  marginBottom: "20px",
                }}
              >
                Our Products
              </h1>
              <div
                className="sw-divider-animate"
                style={{
                  height: "1px",
                  width: "60px",
                  background: "#C9A84C",
                }}
              />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="sw-mobile-filter-toggle md:hidden"
            >
              <FaFilter size={10} />
              Filters
            </button>
          </div>

          {/* ── Main layout: sidebar + grid ── */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              alignItems: "flex-start",
            }}
          >
            {/* ── Desktop Sidebar ── */}
            <aside
              className="sw-sidebar hidden md:block"
              style={{
                width: "200px",
                flexShrink: 0,
                position: "sticky",
                top: "80px",
              }}
            >
              <FilterContent />
            </aside>

            {/* ── Product Grid ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Loading skeletons */}
              {loading ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (

                /* Empty state */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: "80px",
                    paddingBottom: "80px",
                    textAlign: "center",
                  }}
                >
                  <div className="sw-empty-icon">
                    {/* Outlined box icon */}
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l8-6 8 6v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                      <path d="M9 21V11h4v10" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "17px",
                      fontWeight: 400,
                      color: "#86868b",
                    }}
                  >
                    No products found
                  </p>
                  <button
                    className="sw-clear-btn"
                    onClick={() => {
                      handleCategoryChange("All");
                      setSelectedTech("All");
                      setSelectedPrice("all");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (

                /* Product cards */
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "28px",
                  }}
                  className="sw-product-grid"
                >
                  <style>{`
                    @media (max-width: 1024px) {
                      .sw-product-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    }
                    @media (max-width: 640px) {
                      .sw-product-grid { grid-template-columns: 1fr !important; }
                    }
                  `}</style>

                  {paginatedProducts.map((product, i) => {
                    const isNew = isNewProduct(product);
                    return isNew ? (
                      /* ── NEW product: click opens modal ── */
                      <div
                        key={product.id}
                        className="sw-product-card"
                        onClick={() => setNewModalProduct(product)}
                        style={{
                          opacity: 0,
                          animation: `sw-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.07}s forwards`,
                          cursor: "pointer",
                        }}
                      >
                      {/* Image area */}
                      <div
                        style={{
                          height: "260px",
                          background: "#1d1d1f",
                          position: "relative",
                          overflow: "hidden",
                          borderRadius: "14px 14px 0 0",
                          flexShrink: 0,
                        }}
                      >
                        <div className="sw-card-img-inner">
                          {product.image && product.image !== "placeholder" ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <>
                              {/* Subtle radial glow for placeholder */}
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)",
                                  pointerEvents: "none",
                                }}
                              />
                              {/* Watermark */}
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                                    fontSize: "1.6rem",
                                    fontWeight: 300,
                                    color: "rgba(201,168,76,0.08)",
                                    letterSpacing: "0.35em",
                                    textTransform: "uppercase",
                                    userSelect: "none",
                                  }}
                                >
                                  SoundWave
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* NEW badge — top-left */}
                        {isNew && <NewCardBadge />}

                        {/* Wishlist button — top right */}
                        <WishlistButton
                          productId={product.id}
                          className="absolute top-2 right-2 z-20"
                        />
                      </div>

                      {/* Card content */}
                      <div
                        style={{
                          padding: "16px 16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                        }}
                      >
                        {/* Category label */}
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "11px",
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: "6px",
                          }}
                        >
                          {product.category.replace("-", " ")}
                        </p>

                        {/* Product name */}
                        <h3
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "17px",
                            fontWeight: 500,
                            color: "#ffffff",
                            lineHeight: 1.3,
                            marginBottom: "12px",
                            flex: 1,
                          }}
                        >
                          {product.name}
                        </h3>

                        {/* Price + technology row */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#C9A84C",
                            }}
                          >
                            {product.priceRangeText}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "11px",
                              fontWeight: 500,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "#86868b",
                            }}
                          >
                            {product.technology}
                          </span>
                        </div>
                       </div>
                    </div>
                    ) : (
                      /* ── Normal product: click navigates directly ── */
                      <Link
                        href={`/products/${product.id}`}
                        key={`norm-${product.id}`}
                        className="sw-product-card"
                        style={{
                          opacity: 0,
                          animation: `sw-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.07}s forwards`,
                        }}
                      >
                        <div style={{ height: "260px", background: "#1d1d1f", position: "relative", overflow: "hidden", borderRadius: "14px 14px 0 0", flexShrink: 0 }}>
                          <div className="sw-card-img-inner">
                            {product.image && product.image !== "placeholder" ? (
                              <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                              <>
                                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.6rem", fontWeight: 300, color: "rgba(201,168,76,0.08)", letterSpacing: "0.35em", textTransform: "uppercase", userSelect: "none" }}>SoundWave</span>
                                </div>
                              </>
                            )}
                          </div>
                          <WishlistButton productId={product.id} className="absolute top-2 right-2 z-20" />
                        </div>
                        <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "6px" }}>{product.category.replace("-", " ")}</p>
                          <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: "17px", fontWeight: 500, color: "#ffffff", lineHeight: 1.3, marginBottom: "12px", flex: 1 }}>{product.name}</h3>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "17px", fontWeight: 400, color: "#C9A84C" }}>{product.priceRangeText}</span>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{product.technology}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

          </div>{/* end sidebar+grid flex row */}

          {/* ── Pagination — full-width, centered below sidebar+grid ── */}
          {totalPages > 1 && (
            <div style={{ marginTop: "48px" }}>
              <SWPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* ── New Product Modal ── */}
        {newModalProduct && (
          <NewProductModal
            product={newModalProduct}
            onClose={() => setNewModalProduct(null)}
          />
        )}

        {/* ── Mobile Filter Drawer ── */}
        <AnimatePresence>
          {mobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFilterOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.85)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  zIndex: 50,
                }}
                className="md:hidden"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "#111111",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px 20px 0 0",
                  zIndex: 51,
                  maxHeight: "85vh",
                  overflowY: "auto",
                }}
                className="md:hidden"
              >
                <div style={{ padding: "24px" }}>
                  {/* Handle bar */}
                  <div
                    style={{
                      width: "36px",
                      height: "3px",
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: "99px",
                      margin: "0 auto 24px auto",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "28px",
                    }}
                  >
                    <span className="sw-mobile-filter-header">Filters</span>
                    <button
                      onClick={() => setMobileFilterOpen(false)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#86868b",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>

                  <FilterContent />

                  <button
                    className="sw-mobile-apply-btn"
                    onClick={() => setMobileFilterOpen(false)}
                  >
                    View {filteredProducts.length} Product{filteredProducts.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#000000",
            paddingTop: "140px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#86868b",
            }}
          >
            Loading...
          </p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
