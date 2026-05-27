"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import CartIcon from "@/components/CartIcon";
import { StarButton } from "@/components/StarButton";
import { ShinyButton } from "@/components/ShinyButton";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Build Your Sound", href: "/build-your-sound" },
  { name: "Next Wave", href: "/next-wave" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, setShowAuthModal, setAuthInitialMode } = useAuth();
  const getFirstName = (name: string | null | undefined) => {
    if (!name) return "User";
    const cleaned = name.trim();
    if (cleaned.startsWith("+")) {
      return "User " + cleaned.slice(-4);
    }
    if (cleaned.includes("@")) {
      return cleaned.split("@")[0];
    }
    return cleaned.split(/\s+/)[0];
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === "/welcome") return null;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl py-4 border-b"
          : "bg-transparent py-7"
      }`}
      style={
        scrolled
          ? {
              backgroundColor: "rgba(13, 13, 13, 0.75)",
              borderBottomColor: "#1F1F1F",
            }
          : {}
      }
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">

        {/* Logo — left */}
        <Link
          href="/"
          className="z-50 relative tracking-[0.25em] uppercase"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.3rem",
            fontWeight: 600,
            color: "#C9A84C",
            letterSpacing: "0.3em",
          }}
        >
          SOUNDWAVE
        </Link>

        {/* Desktop Navigation — center */}
        <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative group transition-colors duration-300"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: pathname === link.href ? "#F5F5F5" : "#A8A8A8",
              }}
            >
              {link.name}
              {/* Thin gold underline on active */}
              {pathname === link.href && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute -bottom-1.5 left-0 right-0"
                  style={{ height: "1px", background: "#C9A84C", opacity: 0.7 }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
              )}
              {/* Hover underline */}
              <span
                className="absolute -bottom-1.5 left-0 right-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                style={{ height: "1px", background: "#C9A84C", display: "block" }}
              />
            </Link>
          ))}
        </nav>

        {/* Desktop User Section — right */}
        <div className="hidden md:flex items-center gap-4 relative">
          {/* Cart Icon */}
          <CartIcon />

          {user ? (
            <Link href="/dashboard">
              <ShinyButton
                style={
                  {
                    "--shiny-cta-padding": "0.45rem 1.15rem",
                    "--shiny-cta-font-size": "0.75rem",
                  } as React.CSSProperties
                }
              >
                {getFirstName(user.displayName || user.email || user.phoneNumber)}
              </ShinyButton>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              {/* Login */}
              <StarButton
                onClick={() => { setAuthInitialMode("login"); setShowAuthModal(true); }}
                duration={3}
                lightWidth={100}
                lightColor="#FAFAFA"
                backgroundColor="currentColor"
                borderWidth={2}
                className="bg-[#111111]"
              >
                Login
              </StarButton>

              {/* Sign Up */}
              <StarButton
                onClick={() => { setAuthInitialMode("create"); setShowAuthModal(true); }}
                duration={3.6}
                lightWidth={110}
                lightColor="#FAFAFA"
                backgroundColor="currentColor"
                borderWidth={2}
                className="bg-[#111111]"
              >
                Sign Up
              </StarButton>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden z-50 relative"
          style={{ color: "#A8A8A8", fontSize: "1.25rem" }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
              className="fixed inset-0 z-40 flex flex-col justify-center items-center gap-10"
              style={{ backgroundColor: "#0D0D0D" }}
            >
              {/* Gold top accent line */}
              <div className="absolute top-0 left-0 right-0" style={{ height: "1px", background: "linear-gradient(90deg, transparent, #C9A84C, transparent)", opacity: 0.5 }} />

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "2rem",
                    fontWeight: 500,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: pathname === link.href ? "#C9A84C" : "#F5F5F5",
                  }}
                >
                  {link.name}
                </Link>
              ))}

              <div style={{ height: "1px", width: "3rem", background: "#1F1F1F" }} />

              {/* Cart in mobile drawer */}
              <CartIcon />

              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShinyButton
                    style={
                      {
                        "--shiny-cta-padding": "0.55rem 1.4rem",
                        "--shiny-cta-font-size": "0.85rem",
                      } as React.CSSProperties
                    }
                  >
                    {getFirstName(user.displayName || user.email || user.phoneNumber)}
                  </ShinyButton>
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <StarButton
                    onClick={() => { setAuthInitialMode("login"); setShowAuthModal(true); setMobileMenuOpen(false); }}
                    duration={3}
                    lightWidth={100}
                    lightColor="#FAFAFA"
                    backgroundColor="currentColor"
                    borderWidth={2}
                    className="bg-[#111111]"
                  >
                    Login
                  </StarButton>
                  <StarButton
                    onClick={() => { setAuthInitialMode("create"); setShowAuthModal(true); setMobileMenuOpen(false); }}
                    duration={3.6}
                    lightWidth={110}
                    lightColor="#FAFAFA"
                    backgroundColor="currentColor"
                    borderWidth={2}
                    className="bg-[#111111]"
                  >
                    Sign Up
                  </StarButton>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
