"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import ShinyText from "@/components/ShinyText";

const MagicRings = dynamic(() => import("@/components/MagicRings"), { ssr: false });

export default function WelcomePage() {
  const router = useRouter();
  const [fading, setFading] = useState(false);

  const handleEnter = () => {
    if (fading) return;
    setFading(true);
    sessionStorage.setItem("soundwave_entered", "true");
    setTimeout(() => {
      router.push("/");
    }, 700);
  };

  return (
    <motion.div
      className="relative w-screen h-screen overflow-hidden cursor-pointer select-none"
      style={{ backgroundColor: "#000000" }}
      onClick={handleEnter}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {/* MagicRings — updated to new palette */}
      <div className="absolute inset-0 z-0">
        <MagicRings
          color="#C9A84C"
          colorTwo="#A8A8A8"
          ringCount={6}
          speed={0.85}
          attenuation={10}
          lineThickness={1.8}
          baseRadius={0.32}
          radiusStep={0.11}
          scaleRate={0.09}
          opacity={0.9}
          blur={0}
          noiseAmount={0.06}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={false}
          mouseInfluence={0.2}
          hoverScale={1.15}
          parallax={0.04}
          clickBurst={false}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Centered content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5"
        >
          {/* Logo Emblem */}
          <div style={{ position: "relative", width: "120px", height: "120px" }}>
            <Image
              src="/images/logo.png"
              alt="SoundWave Logo Emblem"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          {/* SOUNDWAVE title */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              fontWeight: 300,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#F5F5F5",
              textAlign: "center",
              textShadow: "0 0 80px rgba(201,168,76,0.2), 0 0 160px rgba(201,168,76,0.08)",
              lineHeight: 1,
            }}
          >
            <ShinyText
              text="SOUNDWAVE"
              speed={3.5}
              color="#C9A84C"
              shineColor="#F5F5F5"
              spread={70}
            />
          </h1>

          {/* Thin gold line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "3.5rem",
              height: "1px",
              background: "#C9A84C",
              opacity: 0.5,
            }}
          />

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
              fontWeight: 300,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#A8A8A8",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Engineered for Those Who Hear More
          </p>
        </motion.div>
      </div>

      {/* Bottom: click/tap hint — subtle pulse only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 3, delay: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-0 right-0 flex justify-center z-10 pointer-events-none"
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "#6B6B6B",
          }}
        >
          Click anywhere to enter
        </span>
      </motion.div>
    </motion.div>
  );
}
