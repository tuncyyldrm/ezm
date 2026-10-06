"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function subscribeToInstallState(callback: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);

  return () => {
    displayMode.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function getInstallState() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallAppCard() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const [message, setMessage] = useState("");
  const isInstalled = useSyncExternalStore(
    subscribeToInstallState,
    getInstallState,
    () => false
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallEvent(null);
      setMessage("EZM OTO ana ekranınıza eklendi.");
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setMessage("EZM OTO ana ekranınıza ekleniyor.");
      }
      setInstallEvent(null);
    } catch (error) {
      console.error("EZM OTO yükleme seçeneği açılamadı:", error);
      setMessage("Yükleme penceresi açılamadı. Tarayıcı menüsünden ana ekrana eklemeyi deneyin.");
    }
  };

  return (
    <section
      aria-labelledby="install-app-title"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6"
    >
      <div>
        <h2 id="install-app-title" className="font-semibold text-slate-900">
          EZM OTO&apos;ya kolayca ulaşın
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          İsterseniz kataloğu cihazınızın ana ekranına ekleyebilirsiniz.
        </p>
        {message && (
          <p aria-live="polite" className="mt-2 text-xs text-slate-600">
            {message}
          </p>
        )}
        {showInstructions && !isInstalled && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            iPhone veya iPad&apos;de Safari&apos;de Paylaş düğmesine, ardından Ana
            Ekrana Ekle seçeneğine dokunun. Android&apos;de Chrome menüsünden
            Uygulamayı Yükle veya Ana ekrana ekle seçeneğini kullanın.
          </p>
        )}
      </div>

      {!isInstalled && (
        <div className="mt-3 flex shrink-0 flex-col gap-2 sm:mt-0 sm:flex-row">
          {installEvent && (
            <button
              type="button"
              onClick={install}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Uygulamayı Yükle
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowInstructions((visible) => !visible)}
            aria-expanded={showInstructions}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {showInstructions ? "Bilgiyi Gizle" : "Nasıl Eklenir?"}
          </button>
        </div>
      )}
    </section>
  );
}
