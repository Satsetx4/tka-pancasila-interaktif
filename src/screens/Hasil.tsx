import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, RotateCcw, BookOpen, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { MobileContainer } from "../components/layout/MobileContainer";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { BABS, badgeOf, maskotOf, bunyi, scoreOf } from "../lib/store";

interface Props { bab: number; benar: number; total: number; streak: number; onHome: () => void; onUlang: () => void; onMateri: () => void; }

export const HasilScreen: React.FC<Props> = ({ bab, benar, total, streak, onHome, onUlang, onMateri }) => {
  const skor = scoreOf(benar, total);
  const dapatBadge = skor >= 60;
  const meta = BABS.find((b) => b.id === bab);

  useEffect(() => {
    bunyi("badge");
    if (dapatBadge) {
      const t = setTimeout(() => {
        try {
          confetti({ particleCount: 120, spread: 75, origin: { y: 0.25 }, disableForReducedMotion: true });
        } catch { /* abaikan */ }
      }, 400);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <MobileContainer>
      <main className="flex-1 p-4 space-y-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <LivingCard variant="glow" className="text-center py-6">
            <p className="text-5xl">{dapatBadge ? "🏅" : "💪"}</p>
            <h2 className="font-display text-2xl font-bold mt-2 text-slate-900 dark:text-white">
              {dapatBadge ? "Keren! Badge didapat!" : "Bagus, lanjutkan!"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{maskotOf(bab)} bilang: {skor >= 85 ? "kamu luar biasa!" : skor >= 60 ? "pertahankan ya!" : "baca materi lalu coba lagi, pasti bisa!"}</p>
            <p className="font-display text-5xl font-bold mt-3 text-emerald-500">{skor}</p>
            <p className="text-sm text-slate-500">{benar} benar dari {total} soal • Streak terbaik {streak}x • +{benar * 10} XP</p>
            {dapatBadge && (
              <p className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold dark:bg-amber-950/50 dark:text-amber-300">
                <PartyPopper className="w-4 h-4" /> {badgeOf(bab)}
              </p>
            )}
            {!dapatBadge && <p className="text-xs text-slate-500 mt-2">Butuh nilai 60 untuk dapat badge {badgeOf(bab)}.</p>}
            <p className="text-[11px] text-slate-400 mt-1">Bab {bab} • {meta?.judul}</p>
          </LivingCard>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          <TapButton onClick={onUlang}><RotateCcw className="w-4 h-4" /> Main lagi</TapButton>
          <TapButton variant="outline" onClick={onMateri}><BookOpen className="w-4 h-4" /> Ulas materi</TapButton>
        </div>
        <TapButton variant="outline" fullWidth onClick={onHome}><Home className="w-4 h-4" /> Kembali ke 7 Bab</TapButton>
      </main>
    </MobileContainer>
  );
};
