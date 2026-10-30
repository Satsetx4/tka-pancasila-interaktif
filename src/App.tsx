import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { store, type PersistedScreen, type QType } from "./lib/store";
import { HomeScreen } from "./screens/Home";
import { MateriScreen } from "./screens/Materi";
import { LatihanScreen } from "./screens/Latihan";
import { HasilScreen } from "./screens/Hasil";

export type Screen = PersistedScreen;

export default function App() {
  const [screen, setScreenState] = useState<Screen>(() => store.nav.load());

  const setScreen = (next: Screen) => {
    setScreenState(next);
    store.nav.save(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", store.theme.load() === "dark");
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {screen.name === "home" && (
        <HomeScreen
          initialTab={screen.tab ?? "beranda"}
          onTabChange={(tab) => setScreen({ name: "home", tab })}
          onMateri={(bab) => setScreen({ name: "materi", bab })}
          onLatihan={(bab) => setScreen({ name: "latihan", bab })}
        />
      )}

      {screen.name === "materi" && (
        <MateriScreen
          bab={screen.bab}
          onBack={() => setScreen({ name: "home", tab: "beranda" })}
          onLatihan={() => setScreen({ name: "latihan", bab: screen.bab })}
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
            setScreen({ name: "latihan", bab: screen.bab });
          }}
          onMateri={() => setScreen({ name: "materi", bab: screen.bab })}
        />
      )}
    </MotionConfig>
  );
}
