"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";

const GUEST_ONLY_PATHS = ["/welcome", "/login"];
const PROTECTED_PATHS = ["/dashboard", "/admin"];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prefetch key paths in production to make transitions/redirects instant
    if (process.env.NODE_ENV === "production") {
      router.prefetch("/welcome");
      router.prefetch("/");
    }
  }, [router]);

  useEffect(() => {
    if (!loading && mounted) {
      const isGuestOnly = GUEST_ONLY_PATHS.includes(pathname);
      const isProtected = PROTECTED_PATHS.includes(pathname);

      if (!user && isProtected) {
        router.push("/");
      } else if (user && isGuestOnly) {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router, mounted]);

  const isProtected = PROTECTED_PATHS.includes(pathname);
  const needsLoadingScreen = loading && isProtected;

  if (needsLoadingScreen) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="relative z-10 flex flex-col items-center gap-5">
          <Loading />
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#C9A84C",
              opacity: 0.7,
            }}
          >
            Loading
          </p>
        </div>
      </div>
    );
  }

  // Don't render protected content while auth is resolving / user missing
  if (!user && isProtected && (loading || !mounted)) return null;
  if (!user && isProtected && !loading) return null;

  return <>{children}</>;
}
