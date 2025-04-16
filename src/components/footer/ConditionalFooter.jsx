// src/components/footer/ConditionalFooter.js
"use client"; // Make this component run on the client side only

import { Footer } from './Footer';
import { usePathname } from 'next/navigation';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const footerHiddenPaths = ['/ai','/content-generation-ai'];

  // Show the footer only if the pathname is not in the list of paths to hide it
  return !footerHiddenPaths.includes(pathname) ? <Footer /> : null;
}
