"use client";

import { NavbarWhite } from "./NavbarWhite";
import { usePathname } from "next/navigation";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const footerHiddenPaths = [
    "/ai",
    "/content-generation-ai",
    "/api/auth/register",
  ];

  return !footerHiddenPaths.includes(pathname) ? (
    <NavbarWhite />
  ) : (
    <NavbarWhite />
  );
}
