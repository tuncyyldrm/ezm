"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import CookieBanner from "@/components/CookieBanner";
import ScrollRestorationManager from "@/components/ScrollRestorationManager";
import ScrollToTop from "@/components/ScrollToTop";

export default function StorefrontShell({
  children,
  header,
  footer,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Ana içeriğe geç
      </a>
      {header}
      <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden">
        {children}
      </main>
      {footer}
      <ScrollToTop />
      <ScrollRestorationManager />
      <CookieBanner />
    </>
  );
}
