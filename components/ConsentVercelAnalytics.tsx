"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const CONSENT_EVENT = "analytics-consent-changed";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return localStorage.getItem("cookie_consent_accepted") === "true";
}

function getServerSnapshot() {
  return false;
}

export default function ConsentVercelAnalytics() {
  const hasConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pathname = usePathname();

  if (!hasConsent || pathname.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  return <Analytics />;
}
