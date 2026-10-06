"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "ezmoto_install_prompt_dismissed";

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const showIosPrompt = () => {
      setIsVisible(true);
      setShowIosInstructions(true);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setInstallEvent(null);
      localStorage.setItem(DISMISSED_KEY, "true");
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isIos) {
      const timer = window.setTimeout(showIosPrompt, 3500);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt as EventListener
        );
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setIsVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        dismiss();
      } else {
        setInstallEvent(null);
        setIsVisible(false);
      }
    } catch (error) {
      console.error("EZM OTO yükleme penceresi açılamadı:", error);
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="EZM OTO uygulama kısayolu"
      className="fixed bottom-40 left-3 right-3 z-50 mx-auto max-w-sm rounded-2xl border border-blue-100 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700"
        >
          EZM
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">
            EZM OTO&apos;yu ana ekranınıza ekleyin
          </h2>
          {showIosInstructions ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Safari&apos;de <strong>Paylaş</strong> düğmesine, ardından{" "}
              <strong>Ana Ekrana Ekle</strong> seçeneğine dokunun.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Kataloğa telefonunuzdan tek dokunuşla ulaşmak için EZM OTO&apos;yu
              yükleyin.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Yükleme önerisini kapat"
          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {installEvent ? (
        <button
          type="button"
          onClick={install}
          className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Uygulamayı Yükle
        </button>
      ) : showIosInstructions ? (
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Anladım
        </button>
      ) : null}
    </aside>
  );
}
