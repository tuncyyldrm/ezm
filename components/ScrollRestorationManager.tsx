"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRestorationManager() {
  const pathname = usePathname();

  useEffect(() => {
    const query = window.location.search;
    const fullUrlKey = `scroll_pos_${pathname}${query}`;

    const savedPosition = sessionStorage.getItem(fullUrlKey);

    if (savedPosition !== null) {
      const targetY = parseInt(savedPosition, 10);

      if (!Number.isNaN(targetY) && targetY > 0) {
        let attempts = 0;
        const maxAttempts = 60;

        const restoreScroll = () => {
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;

          if (maxScroll >= targetY) {
            window.scrollTo(0, targetY);
            return;
          }

          if (attempts < maxAttempts) {
            attempts++;
            requestAnimationFrame(restoreScroll);
            return;
          }

          window.scrollTo(
            0,
            Math.max(0, Math.min(targetY, maxScroll))
          );
        };

        requestAnimationFrame(restoreScroll);
      }
    }

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleSaveScroll = () => {
      if (saveTimeout !== null) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(() => {
        sessionStorage.setItem(
          fullUrlKey,
          String(window.scrollY)
        );

        saveTimeout = null;
      }, 100);
    };

    window.addEventListener("scroll", handleSaveScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleSaveScroll);

      if (saveTimeout !== null) {
        clearTimeout(saveTimeout);
      }
    };
  }, [pathname]);

  return null;
}