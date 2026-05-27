"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import dynamic from "next/dynamic";

const WAVEChatbot = dynamic(() => import("@/components/WAVEChatbot"), { ssr: false });

export default function Footer() {
  const pathname = usePathname();
  const isExcluded = pathname === "/welcome" || pathname === "/dashboard";

  if (pathname === "/welcome") return null;
  return (
    <>
      <footer
        style={{
          backgroundColor: "#000000",
          borderTop: "1px solid #C9A84C",
          borderTopColor: "rgba(201, 168, 76, 0.45)",
          paddingTop: "5rem",
          paddingBottom: "3rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Thin gold top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #C9A84C 70%, transparent 100%)", opacity: 0.35 }} />

        <div className="container mx-auto px-6 md:px-12">
          {/* Brand tagline row */}
          <div className="mb-16 pb-12" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1.05rem",
                fontWeight: 400,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#A8A8A8",
              }}
            >
              Engineered for Those Who Hear More
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

            {/* Quick Links */}
            <div>
              <h3
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  marginBottom: "1.5rem",
                }}
              >
                Quick Links
              </h3>
              <ul className="space-y-4">
                {["Home", "About Us", "Contact", "FAQ"].map((item, i) => (
                  <li key={item}>
                    <Link
                      href={["/", "/about", "/contact", "/faq"][i]}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.85rem",
                        color: "#A8A8A8",
                        transition: "color 0.3s ease",
                        display: "inline-block",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#A8A8A8")}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  marginBottom: "1.5rem",
                }}
              >
                Categories
              </h3>
              <ul className="space-y-4">
                {[
                  { label: "Amplifiers", href: "/products?category=amplifiers" },
                  { label: "Speakers", href: "/products?category=speakers" },
                  { label: "Sound Systems", href: "/products?category=sound-systems" },
                  { label: "Premium Cables", href: "/products?category=cables" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.85rem",
                        color: "#A8A8A8",
                        transition: "color 0.3s ease",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#A8A8A8")}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  marginBottom: "1.5rem",
                }}
              >
                Contact Us
              </h3>
              <ul className="space-y-5">
                <li>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "#C9A84C",
                      display: "block",
                      marginBottom: "0.35rem",
                      opacity: 0.8,
                    }}
                  >
                    Email
                  </span>
                  <a
                    href="mailto:soundwave31330@gmail.com"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.85rem",
                      color: "#A8A8A8",
                      transition: "color 0.3s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#A8A8A8")}
                  >
                    soundwave31330@gmail.com
                  </a>
                </li>
                <li>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "0.35rem",
                      color: "#C9A84C",
                      opacity: 0.8,
                    }}
                  >
                    Phone
                  </span>
                  <a
                    href="tel:+919567931330"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.85rem",
                      color: "#A8A8A8",
                      transition: "color 0.3s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#A8A8A8")}
                  >
                    +91 95679 31330
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h3
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  marginBottom: "1.5rem",
                }}
              >
                Follow Us
              </h3>
              <div className="flex gap-3">
                {[
                  { Icon: FaFacebookF, href: "#", label: "Facebook" },
                  { Icon: FaXTwitter, href: "#", label: "Twitter" },
                  { Icon: FaInstagram, href: "#", label: "Instagram" },
                  { Icon: FaYoutube, href: "#", label: "YouTube" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="transition-all duration-300"
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      borderRadius: "50%",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#A8A8A8",
                      fontSize: "0.8rem",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "#C9A84C";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255, 255, 255, 0.1)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#A8A8A8";
                    }}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
            style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
          >
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                color: "#A8A8A8",
                letterSpacing: "0.05em",
              }}
            >
              © 2026 SoundWave. All rights reserved.
            </p>
            <div className="flex gap-6">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                    color: "#A8A8A8",
                    letterSpacing: "0.05em",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#C9A84C")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#A8A8A8")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* WAVE AI Chatbot — hidden on welcome & dashboard */}
      {!isExcluded && <WAVEChatbot />}

      {/* WhatsApp Floating Glass Button */}
      <a
        href="https://wa.me/919567931330"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        style={{
          width: "3.25rem",
          height: "3.25rem",
          borderRadius: "50%",
          background: "rgba(37, 211, 102, 0.18)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: "#25D366",
          fontSize: "1.45rem",
          boxShadow: [
            "inset 0 0 0 1px rgba(37,211,102,0.35)",
            "inset 0 1px 0 rgba(255,255,255,0.25)",
            "inset 0 -2px 8px rgba(37,211,102,0.2)",
            "0 4px 24px rgba(37,211,102,0.3)",
            "0 1px 3px rgba(0,0,0,0.5)",
          ].join(", "),
          position: "fixed",
        }}
      >
        {/* Inner glass highlight arc */}
        <span
          style={{
            position: "absolute",
            top: "6px",
            left: "10px",
            right: "10px",
            height: "40%",
            borderRadius: "50%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <FaWhatsapp />
      </a>
    </>
  );
}
