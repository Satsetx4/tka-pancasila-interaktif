import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import {
  store,
  type LicenseInfo,
  type PersistedScreen,
  type QType,
  type Soal,
} from "./lib/store";
import { HomeScreen } from "./screens/Home";
import { MateriScreen } from "./screens/Materi";
import { LatihanScreen } from "./screens/Latihan";
import { HasilScreen } from "./screens/Hasil";
import { AdminPage } from "./screens/AdminPage";
import { PaywallModal } from "./components/ui/PaywallModal";

export type Screen = PersistedScreen;

function isAdminRoute() {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname.toLowerCase();
  const h = window.location.hash.toLowerCase();
  return p === "/admin" || p.startsWith("/admin/") || h === "#/admin" || h === "#admin";
}

export default function App() {
  const [isAdmin] = useState<boolean>(() => isAdminRoute());
  const [screen, setScreenState] = useState<Screen>(() => {
    const saved = store.nav.load();
    if (saved.name === "latihan" && !store.license.isBabUnlocked(saved.bab)) {
      return { name: "home", tab: "beranda" };
    }
    return saved;
  });

  const [paywallBab, setPaywallBab] = useState<number | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const setScreen = (next: Screen) => {
    setScreenState(next);
    store.nav.save(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPaywall = (bab?: number | null) => {
    setPaywallBab(bab ?? null);
    setPaywallOpen(true);
  };

  const handleStartLatihan = (bab: number) => {
    if (!store.license.isBabUnlocked(bab)) {
      openPaywall(bab);
      return;
    }
    setScreen({ name: "latihan", bab });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", store.theme.load() === "dark");
  }, []);

  // Sinkronisasi lisensi & bank soal Bab 2-7 dari Neon Postgres saat boot (hanya di aplikasi siswa)
  useEffect(() => {
    if (isAdmin) return;
    const savedLic = store.license.load();
    if (!savedLic?.accessToken) return;

    const deviceId = store.device.getId();
    fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify",
        accessToken: savedLic.accessToken,
        deviceId,
      }),
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          store.license.clear();
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as {
          ok?: boolean;
          accessToken?: string;
          license?: Omit<LicenseInfo, "accessToken">;
          soalByBab?: Record<number, Soal[]>;
        };
        if (data.ok && data.license && data.accessToken) {
          store.license.saveUnlocked(
            { ...data.license, accessToken: data.accessToken },
            data.soalByBab
          );
        }
      })
      .catch(() => {
        /* Pertahankan cache lokal saat offline */
      });
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <MotionConfig reducedMotion="user">
        <AdminPage />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {screen.name === "home" && (
        <HomeScreen
          initialTab={screen.tab ?? "beranda"}
          onTabChange={(tab) => setScreen({ name: "home", tab })}
          onMateri={(bab) => setScreen({ name: "materi", bab })}
          onLatihan={handleStartLatihan}
          onOpenPaywall={openPaywall}
        />
      )}

      {screen.name === "materi" && (
        <MateriScreen
          bab={screen.bab}
          onBack={() => setScreen({ name: "home", tab: "beranda" })}
          onLatihan={() => handleStartLatihan(screen.bab)}
          onOpenPaywall={() => openPaywall(screen.bab)}
          onJumpTab={(tab) => setScreen({ name: "home", tab })}
        />
      )}

      {screen.name === "latihan" && (
        <LatihanScreen
          bab={screen.bab}
          onKeluar={() => setScreen({ name: "home", tab: "beranda" })}
          onMateri={() => setScreen({ name: "materi", bab: screen.bab })}
          onSelesai={(
            benar: number,
            total: number,
            streak: number,
            perTipe?: Record<QType, { benar: number; total: number }>
          ) => {
            store.progress.finishBab(screen.bab, benar, total, streak, perTipe);
            store.session.clear(screen.bab);
            setScreen({ name: "hasil", bab: screen.bab, benar, total, streak });
          }}
        />
      )}

      {screen.name === "hasil" && (
        <HasilScreen
          bab={screen.bab}
          benar={screen.benar}
          total={screen.total}
          streak={screen.streak}
          onHome={() => setScreen({ name: "home", tab: "beranda" })}
          onRapor={() => setScreen({ name: "home", tab: "rapor" })}
          onUlang={() => {
            store.session.clear(screen.bab);
            handleStartLatihan(screen.bab);
          }}
          onMateri={() => setScreen({ name: "materi", bab: screen.bab })}
        />
      )}

      <PaywallModal
        open={paywallOpen}
        targetBab={paywallBab}
        onClose={() => setPaywallOpen(false)}
        onUnlocked={(unlockedBab) => {
          if (unlockedBab && unlockedBab >= 2) {
            setScreen({ name: "latihan", bab: unlockedBab });
          }
        }}
      />
    </MotionConfig>
  );
}
