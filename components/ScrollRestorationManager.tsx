"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollRestorationManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();

    // Path + query parametrelerine göre benzersiz storage anahtarı
    const scrollKey = `scroll_pos_${pathname}${query ? `?${query}` : ""}`;

    // Daha önce kaydedilmiş scroll pozisyonunu al
    const savedPosition = sessionStorage.getItem(scrollKey);

    if (savedPosition !== null) {
      const targetY = parseInt(savedPosition, 10);

      if (!Number.isNaN(targetY) && targetY > 0) {
        let attempts = 0;
        const maxAttempts = 60;

        // İçerik yüksekliği oluşana kadar scroll'u geri yüklemeyi bekle
        const restoreScroll = () => {
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;

          // Sayfa hedef pozisyona ulaşabilecek kadar uzunsa
          if (maxScroll >= targetY) {
            window.scrollTo(0, targetY);
            return;
          }

          // İçerik henüz yüklenmediyse beklemeye devam et
          if (attempts < maxAttempts) {
            attempts++;

            requestAnimationFrame(restoreScroll);
            return;
          }

          // Maksimum bekleme süresi dolduysa mevcut maksimum konuma git
          window.scrollTo(0, Math.max(0, Math.min(targetY, maxScroll)));
        };

        requestAnimationFrame(restoreScroll);
      }
    }

    // Scroll sırasında sessionStorage'a sürekli yazmak yerine
    // 100 ms debounce kullanıyoruz.
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleSaveScroll = () => {
      if (saveTimeout !== null) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(() => {
        sessionStorage.setItem(scrollKey, String(window.scrollY));
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
  }, [pathname, searchParams]);

  return null;
}