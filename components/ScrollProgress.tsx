"use client";

import { motion, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();

  if (pathname === "/welcome") return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50 shadow-[0_0_10px_rgba(212,168,83,0.8)]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
