"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import PageTransition from "@/components/PageTransition";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWelcome = pathname === "/welcome";

  if (isWelcome) {
    return <main className="flex-grow flex flex-col">{children}</main>;
  }

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <PageTransition>
        <main className="flex-grow flex flex-col">{children}</main>
      </PageTransition>
      <Footer />
    </>
  );
}
