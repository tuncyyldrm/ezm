"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
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

export default function ConsentGoogleAnalytics({
  gaId,
  siteHost,
}: {
  gaId: string;
  siteHost: string;
}) {
  const hasConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pathname = usePathname();
  const isExpectedHost =
    typeof window !== "undefined" &&
    window.location.hostname.toLowerCase() === siteHost.toLowerCase();

  if (!gaId || !hasConsent || !isExpectedHost || pathname.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
