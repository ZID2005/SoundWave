"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaBroadcastTower } from "react-icons/fa";
import Loading from "@/components/Loading";
import GoBackButton from "@/components/GoBackButton";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: "#000000" }}>
      {/* Background elements */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex justify-center items-center">
        <Loading />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center max-w-lg w-full"
        style={{ background: "#141414", border: "1px solid #1F1F1F", padding: "4rem 3rem", position: "relative" }}
      >
        {/* Corner accents */}
        <div style={{ position: "absolute", top: "1rem", left: "1rem", width: "1.5rem", height: "1.5rem", borderTop: "1px solid rgba(201,168,76,0.35)", borderLeft: "1px solid rgba(201,168,76,0.35)" }} />
        <div style={{ position: "absolute", top: "1rem", right: "1rem", width: "1.5rem", height: "1.5rem", borderTop: "1px solid rgba(201,168,76,0.35)", borderRight: "1px solid rgba(201,168,76,0.35)" }} />
        <div style={{ position: "absolute", bottom: "1rem", left: "1rem", width: "1.5rem", height: "1.5rem", borderBottom: "1px solid rgba(201,168,76,0.35)", borderLeft: "1px solid rgba(201,168,76,0.35)" }} />
        <div style={{ position: "absolute", bottom: "1rem", right: "1rem", width: "1.5rem", height: "1.5rem", borderBottom: "1px solid rgba(201,168,76,0.35)", borderRight: "1px solid rgba(201,168,76,0.35)" }} />

        <FaBroadcastTower style={{ fontSize: "2rem", color: "#C9A84C", opacity: 0.5, margin: "0 auto 2rem" }} />
        
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5F5F5", marginBottom: "1rem" }}>Signal Lost</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#6B6B6B", lineHeight: 1.8, letterSpacing: "0.03em", marginBottom: "2.5rem" }}>The frequency you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GoBackButton label="Go Back" />
          <Link 
            href="/"
            className="btn-gold"
          >
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
