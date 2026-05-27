"use client";

import { motion } from "framer-motion";

export default function Loading() {
  const barVariants = {
    initial: { height: 10 },
    animate: {
      height: [10, 40, 10],
      transition: {
        duration: 1,
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="flex justify-center items-center h-full w-full min-h-[200px]">
      <div className="flex items-end gap-1.5 h-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            variants={barVariants}
            initial="initial"
            animate="animate"
            transition={{
              delay: i * 0.15,
            }}
            className="w-1.5 bg-[#C9A84C] rounded-sm"
          />
        ))}
      </div>
    </div>
  );
}
