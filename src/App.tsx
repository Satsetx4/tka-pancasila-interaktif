import { useEffect, useState } from "react";
import { store } from "./lib/store";
import { HomeScreen } from "./screens/Home";
import { MateriScreen } from "./screens/Materi";
import { LatihanScreen } from "./screens/Latihan";
import { HasilScreen } from "./screens/Hasil";

export type Screen =
  | { name: "home" }
  | { name: "materi"; bab: number }
  | { name: "latihan"; bab: number }
  | { name: "hasil"; bab: number; benar: number; total: number; streak: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", store.theme.load() === "dark");
  }, []);

  if (screen.name === "home") {
    return (
      <HomeScreen
        onMateri={(bab) => setScreen({ name: "materi", bab })}
        onLatihan={(bab) => setScreen({ name: "latihan", bab })}
      />
    );
  }
  if (screen.name === "materi") {
    return (
      <MateriScreen
        bab={screen.bab}
        onBack={() => setScreen({ name: "home" })}
        onLatihan={() => setScreen({ name: "latihan", bab: screen.bab })}
      />
    );
  }
  if (screen.name === "latihan") {
    return (
      <LatihanScreen
        bab={screen.bab}
        onKeluar={() => setScreen({ name: "home" })}
        onSelesai={(benar, total, streak) => {
          store.progress.finishBab(screen.bab, benar, total, streak);
          setScreen({ name: "hasil", bab: screen.bab, benar, total, streak });
        }}
      />
    );
  }
  return (
    <HasilScreen
      bab={screen.bab} benar={screen.benar} total={screen.total} streak={screen.streak}
      onHome={() => setScreen({ name: "home" })}
      onUlang={() => setScreen({ name: "latihan", bab: screen.bab })}
      onMateri={() => setScreen({ name: "materi", bab: screen.bab })}
    />
  );
}
