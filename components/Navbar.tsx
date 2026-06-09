"use client";

import { usePathname } from "next/navigation";
import StaggeredMenu from "@/components/StaggeredMenu";

const navLinks = [
  { name: "Home",            href: "/" },
  { name: "Products",        href: "/products" },
  { name: "Build Your Sound",href: "/build-your-sound" },
  { name: "Next Wave",       href: "/next-wave" },
  { name: "About",           href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === "/welcome") return null;

  return (
    <StaggeredMenu
      items={navLinks.map(l => ({ label: l.name, link: l.href }))}
      colors={['#0F0C14', '#171320', '#1C1726']}
      accentColor="#C9A84C"
      menuButtonColor="#C9A84C"
      openMenuButtonColor="#C9A84C"
    />
  );
}
