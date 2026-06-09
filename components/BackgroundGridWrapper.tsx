"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
const Aurora = dynamic(() => import("@/components/Aurora"), { ssr: false });

export default function BackgroundGridWrapper() {
  const pathname = usePathname();
  const shouldDisableBackground = pathname === "/welcome" || pathname === "/dashboard";

  if (shouldDisableBackground) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      <Aurora
        colorStops={["#3A3016", "#000000", "#2C2C2C"]}
        amplitude={1.2}
        blend={0.6}
        speed={0.3}
      />
    </div>
  );
}

