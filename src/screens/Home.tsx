import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Gamepad2, Volume2, VolumeX, Trophy, Star } from "lucide-react";
import { MobileContainer } from "../components/layout/MobileContainer";
import { AppHeader } from "../components/navigation/AppHeader";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { BABS, store, useTheme, bunyi } from "../lib/store";
import { SOAL_PER_BAB } from "../data";

interface Props { onMateri: (bab: number) => void; onLatihan: (bab: number) => void; }
const spring = { type: "spring" as const, stiffness: 320, damping: 28 };

export const HomeScreen: React.FC<Props> = ({ onMateri, onLatihan }) => {
  const { theme, toggle } = useTheme();
  const [nama, setNama] = useState(() => store.profile.load().name);
  const [prog, setProg] = useState(() => store.progress.load());
  const [mute, setMute] = useState(() => store.mute.load());
  const simpanNama = (v: string) => { setNama(v); store.profile.save({ name: v }); };

  return (
    <MobileContainer>
      <AppHeader title="TKA Pancasila Seru" subtitle="Kelas 6 SD • 7 Bab • 245 soal persis modul" rightAction={<ThemeToggle theme={theme} onToggle={toggle} />} />
      <main className="flex-1 p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <LivingCard variant="glow" className="relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Halo, Pejuang Pancasila! 🎉</p>
            <h2 className="font-display text-2xl font-bold leading-tight mt-1 text-slate-900 dark:text-white">Main sambil belajar,<br />kumpulin badge!</h2>
            <p className="text-sm mt-1.5 text-slate-600 dark:text-slate-400">Bonar, Memey, Pigey, Sedi, Indi, Manda & Anisa nemenin kamu dari Bab 1 sampai 7.</p>
            <input value={nama} onChange={(e) => simpanNama(e.target.value)} maxLength={24} placeholder="Nama kamu"
              className="mt-3 w-full h-11 px-3.5 rounded-xl text-sm outline-none border bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-white" />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 py-2">
                <p className="font-display text-xl font-bold text-amber-500">⭐ {prog.xp}</p><p className="text-[11px] text-slate-500">Total XP</p>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 py-2">
                <p className="font-display text-xl font-bold text-emerald-500">🏅 {prog.badge.length}/7</p><p className="text-[11px] text-slate-500">Badge</p>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 py-2">
                <p className="font-display text-xl font-bold text-sky-500">🔥 {prog.streakTerbaik}</p><p className="text-[11px] text-slate-500">Streak max</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <TapButton variant="outline" className="flex-1" onClick={() => { const m = !mute; setMute(m); store.mute.save(m); }}>
                {mute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}{mute ? "Suara mati" : "Suara nyala"}
              </TapButton>
              <TapButton variant="outline" className="flex-1" onClick={() => { if (confirm("Hapus semua XP & badge?")) { store.progress.save({ xp: 0, selesai: {}, badge: [], streakTerbaik: 0 }); setProg(store.progress.load()); } }}>
                <Trophy className="w-4 h-4" /> Reset
              </TapButton>
            </div>
          </LivingCard>
        </motion.div>

        <div className="space-y-3">
          {BABS.map((b, i) => {
            const soal = SOAL_PER_BAB[b.id] ?? [];
            const done = prog.selesai[b.id];
            const punyaBadge = prog.badge.includes(b.id);
            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 + i * 0.05 }}>
                <LivingCard>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl leading-none">{b.maskot.split(" ")[0]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-500">BAB {b.id} • {soal.length} SOAL • {b.maskot}</p>
                      <h3 className="font-display font-bold text-slate-900 dark:text-white leading-tight">{b.judul}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{b.pendek} {done ? `• Terakhir: ${done.benar}/${done.total} benar` : "• Belum dimainkan"}</p>
                    </div>
                    {punyaBadge && <span>🏅</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <TapButton variant="outline" onClick={() => { bunyi("klik"); onMateri(b.id); }}><BookOpen className="w-4 h-4" /> Materi</TapButton>
                    <TapButton onClick={() => { bunyi("klik"); onLatihan(b.id); }}><Gamepad2 className="w-4 h-4" /> Main {done ? "lagi" : ""}</TapButton>
                  </div>
                </LivingCard>
              </motion.div>
            );
          })}
        </div>

        <LivingCard variant="glass">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Star className="w-4 h-4" /> Cara main</p>
          <ul className="mt-2 text-sm space-y-1 text-slate-600 dark:text-slate-300">
            <li>1. Baca <b>Materi</b> dulu (kartu pendek).</li>
            <li>2. Tekan <b>Main</b>, jawab 35 soal Bab itu.</li>
            <li>3. Kunci & penjelasan langsung muncul tiap jawab.</li>
            <li>4. Benar = 10 XP. 3x beruntun = bonus meriah.</li>
            <li>5. Nilai ≥ 60 dapat badge Bab.</li>
          </ul>
        </LivingCard>
      </main>
    </MobileContainer>
  );
};
