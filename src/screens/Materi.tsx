import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import { MobileContainer } from "../components/layout/MobileContainer";
import { AppHeader } from "../components/navigation/AppHeader";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { BABS, maskotOf, bunyi } from "../lib/store";
import { MATERI, SOAL_PER_BAB } from "../data";

interface Props { bab: number; onBack: () => void; onLatihan: () => void; }

export const MateriScreen: React.FC<Props> = ({ bab, onBack, onLatihan }) => {
  const meta = BABS.find((b) => b.id === bab);
  const m = MATERI.find((x) => x.bab === bab);
  const kartu = m?.kartu ?? [];
  const [idx, setIdx] = useState(0);

  return (
    <MobileContainer>
      <AppHeader title={`Bab ${bab} • Materi`} subtitle={meta?.judul ?? ""} />
      <main className="flex-1 p-4 space-y-4">
        <LivingCard variant="glow">
          <p className="text-3xl">{maskotOf(bab).split(" ")[0]} <span className="text-sm font-bold text-slate-500">{maskotOf(bab)} nemenin kamu!</span></p>
          <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">
            Geser kartu sampai habis ({kartu.length} kartu), lalu tekan Main. Total {(SOAL_PER_BAB[bab] ?? []).length} soal menunggumu.
          </p>
        </LivingCard>

        <div className="relative min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <LivingCard>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">KARTU {idx + 1}/{kartu.length}</p>
                <h3 className="font-display text-lg font-bold mt-1 text-slate-900 dark:text-white">{kartu[idx]?.judul}</h3>
                <p className="text-[15px] leading-relaxed mt-2 text-slate-700 dark:text-slate-200">{kartu[idx]?.isi}</p>
              </LivingCard>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <TapButton variant="outline" className="flex-1" onClick={() => { bunyi("klik"); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0}>
            <ChevronLeft className="w-4 h-4" /> Kembali
          </TapButton>
          <div className="flex gap-1">
            {kartu.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i === idx ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />
            ))}
          </div>
          <TapButton variant="outline" className="flex-1" onClick={() => { bunyi("klik"); setIdx((i) => Math.min(kartu.length - 1, i + 1)); }} disabled={idx === kartu.length - 1}>
            Lanjut <ChevronRight className="w-4 h-4" />
          </TapButton>
        </div>

        <div className="grid grid-cols-2 gap-2 pb-4">
          <TapButton variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4" /> Beranda</TapButton>
          <TapButton onClick={() => { bunyi("klik"); onLatihan(); }}><Gamepad2 className="w-4 h-4" /> Gas Main!</TapButton>
        </div>
      </main>
    </MobileContainer>
  );
};
