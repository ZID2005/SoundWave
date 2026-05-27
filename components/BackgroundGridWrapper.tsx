"use client";

import { usePathname } from "next/navigation";
import Aurora from "@/components/Aurora";

export default function BackgroundGridWrapper() {
  const pathname = usePathname();
  const shouldDisableBackground = pathname === "/welcome" || pathname === "/dashboard";

  if (shouldDisableBackground) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      <Aurora
        colorStops={["#3A3016", "#0D0D0D", "#2C2C2C"]}
        amplitude={1.2}
        blend={0.6}
        speed={0.3}
      />
    </div>
  );
}

