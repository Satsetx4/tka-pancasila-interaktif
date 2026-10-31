import React, { useEffect, useState } from "react";
import { Download, Smartphone, WifiOff, X, Share2, PlusSquare, CheckCircle2 } from "lucide-react";
import { TapButton } from "./TapButton";
import { bunyi } from "../../lib/store";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "tka-pancasila:pwa-banner-dismissed:v1";

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const checkStandalone = () => {
      const standaloneMatch =
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as { standalone?: boolean }).standalone);
      setIsStandalone(standaloneMatch);
    };
    checkStandalone();

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
    };

    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    bunyi("klik");
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          bunyi("badge");
          setDeferredPrompt(null);
        }
      } catch {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    bunyi("klik");
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Indikator Mode Offline jika koneksi internet terputus */}
      {isOffline && (
        <div className="mb-3 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-600 dark:text-amber-300 font-semibold">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Mode Offline Aktif — Kamu tetap bisa membaca materi &amp; mengerjakan soal yang sudah terbuka tanpa kuota internet!
            </span>
          </div>
        </div>
      )}

      {/* Banner Install Aplikasi PWA (hanya tampil jika belum di-install ke layar utama) */}
      {!isStandalone && !dismissed && (
        <div className="mb-4 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center text-emerald-500 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xs sm:text-sm text-[var(--fg-primary)]">
                  Pasang Aplikasi TKA Pancasila di HP
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                  Bisa Offline
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--fg-secondary)] mt-0.5">
                Buka lebih cepat langsung dari layar utama HP &amp; tetap bisa belajar walau sinyal hilang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <TapButton
              variant="primary"
              size="sm"
              onClick={handleInstallClick}
              className="h-9 px-3.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Aplikasi</span>
            </TapButton>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup banner install"
              className="w-8 h-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Panduan Install untuk iOS Safari / Browser Mobile */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--fg-primary)]">
                    Cara Pasang Aplikasi di HP
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)]">
                    Tanpa perlu lewat Play Store / App Store
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--fg-secondary)]">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5">
                <div className="font-display font-bold text-sm text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>HP Android (Chrome / Samsung Browser)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>
                    Ketuk ikon <strong> titik tiga (⋮)</strong> di pojok kanan atas browser.
                  </li>
                  <li>
                    Pilih menu <strong>&ldquo;Instal aplikasi&rdquo;</strong> atau{" "}
                    <strong>&ldquo;Tambahkan ke layar utama&rdquo;</strong>.
                  </li>
                  <li>
                    Ketuk <strong>Instal</strong> — ikon <strong>TKA Pancasila</strong> langsung muncul di HP!
                  </li>
                </ol>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-1.5">
                <div className="font-display font-bold text-sm text-sky-400 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>
                    Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah layar Safari.
                  </li>
                  <li className="flex items-center gap-1 flex-wrap">
                    <span>Geser ke bawah lalu pilih</span>
                    <strong className="inline-flex items-center gap-1 text-[var(--fg-primary)]">
                      <PlusSquare className="w-3.5 h-3.5 text-sky-400" /> Tambahkan ke Layar Utama
                    </strong>
                    <span>(Add to Home Screen).</span>
                  </li>
                  <li>
                    Ketuk <strong>Tambah</strong> di pojok kanan atas.
                  </li>
                </ol>
              </div>
            </div>

            <TapButton
              variant="primary"
              onClick={() => setShowGuideModal(false)}
              className="w-full h-11 text-xs"
            >
              Mengerti, Siap Dipasang!
            </TapButton>
          </div>
        </div>
      )}
    </>
  );
};
