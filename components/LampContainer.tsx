"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface LampContainerProps {
  children: ReactNode;
  className?: string;
}

export default function LampContainer({ children, className }: LampContainerProps) {
  return (
    <div
      data-name="lamp-container"
      className={cn(
        "relative flex h-full flex-col items-center justify-center overflow-hidden bg-transparent w-full z-0",
        className
      )}
    >
      <div
        data-name="lamp-inner-container"
        className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0"
      >
        {/* Left conic gradient beam */}
        <motion.div
          data-name="lamp-left-gradient"
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] text-white"
          style={{
            background: "conic-gradient(from 70deg at center top, #06b6d4, transparent, transparent)",
          }}
        >
          <div
            className="absolute w-full left-0 h-40 bottom-0 z-20"
            style={{ background: "linear-gradient(to top, #020617, transparent)" }}
          />
          <div
            className="absolute w-40 h-full left-0 bottom-0 z-20"
            style={{ background: "linear-gradient(to right, #020617, transparent)" }}
          />
        </motion.div>

        {/* Right conic gradient beam */}
        <motion.div
          data-name="lamp-right-gradient"
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] text-white"
          style={{
            background: "conic-gradient(from 290deg at center top, transparent, transparent, #06b6d4)",
          }}
        >
          <div
            className="absolute w-40 h-full right-0 bottom-0 z-20"
            style={{ background: "linear-gradient(to left, #020617, transparent)" }}
          />
          <div
            className="absolute w-full right-0 h-40 bottom-0 z-20"
            style={{ background: "linear-gradient(to top, #020617, transparent)" }}
          />
        </motion.div>

        {/* Background blur mask */}
        <div
          data-name="lamp-blur-bg"
          className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 blur-2xl"
          style={{ backgroundColor: "#020617" }}
        />

        {/* Transparent blur overlay */}
        <div
          data-name="lamp-blur-overlay"
          className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"
        />

        {/* Large cyan glow */}
        <div
          data-name="lamp-glow-large"
          className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full opacity-50 blur-3xl"
          style={{ backgroundColor: "#06b6d4" }}
        />

        {/* Small animated cyan glow */}
        <motion.div
          data-name="lamp-glow-small"
          initial={{ width: "8rem" }}
          animate={{ width: "16rem" }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-auto z-30 h-36 -translate-y-[6rem] rounded-full blur-2xl"
          style={{ backgroundColor: "#22d3ee" }}
        />

        {/* Animated horizontal lamp line */}
        <motion.div
          data-name="lamp-line"
          initial={{ width: "15rem", opacity: 0 }}
          animate={{ width: "30rem", opacity: 0.6 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-auto z-50 h-px -translate-y-[7rem] blur-[0.5px]"
          style={{ backgroundColor: "#22d3ee" }}
        />

        {/* Top mask to hide beam overflow */}
        <div
          data-name="lamp-top-mask"
          className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem]"
          style={{ backgroundColor: "#020617" }}
        />
      </div>

      {/* Content area */}
      <div
        data-name="lamp-content"
        className="relative z-50 flex -translate-y-80 flex-col items-center px-5"
      >
        {children}
      </div>
    </div>
  );
}
