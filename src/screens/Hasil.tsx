import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  RotateCcw,
  BookOpen,
  PartyPopper,
  Trophy,
  Award,
  Flame,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Compass,
} from "lucide-react";
import confetti from "canvas-confetti";
import { MobileContainer } from "../components/layout/MobileContainer";
import { AppHeader } from "../components/navigation/AppHeader";
import { MobileBottomNav, type NavItem } from "../components/navigation/MobileBottomNav";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { CountUp } from "../components/ui/CountUp";
import { InlineDataBar } from "../components/ui/InlineDataBar";
import {
  BABS,
  badgeOf,
  maskotOf,
  bunyi,
  scoreOf,
  store,
  useTheme,
  labelTipeSoal,
  type QType,
} from "../lib/store";
import { SOAL_PER_BAB } from "../data";

interface Props {
  bab: number;
  benar: number;
  total: number;
  streak: number;
  onHome: () => void;
  onRapor?: () => void;
  onUlang: () => void;
  onMateri: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: "beranda", label: "7 Bab", icon: Compass },
  { id: "materi", label: "Ulas Materi", icon: BookOpen },
  { id: "rapor", label: "Rapor", icon: BarChart3 },
  { id: "ulang", label: "Main Lagi", icon: RotateCcw },
];

export const HasilScreen: React.FC<Props> = ({
  bab,
  benar,
  total,
  streak,
  onHome,
  onRapor,
  onUlang,
  onMateri,
}) => {
  const { theme, toggle } = useTheme();
  const skor = scoreOf(benar, total);
  const dapatBadge = skor >= 60;
  const meta = BABS.find((b) => b.id === bab);
  const profile = store.profile.load();
  const savedRes = store.progress.load().selesai[bab];
  const [showReview, setShowReview] = useState(false);
  const soalList = SOAL_PER_BAB[bab] ?? [];

  useEffect(() => {
    bunyi("badge");
    if (dapatBadge) {
      const t = setTimeout(() => {
        try {
          confetti({
            particleCount: 110,
            spread: 75,
            origin: { y: 0.25 },
            disableForReducedMotion: true,
          });
        } catch {
          /* ignore */
        }
      }, 350);
      return () => clearTimeout(t);
    }
  }, [dapatBadge]);

  return (
    <MobileContainer hasBottomNav>
      <AppHeader
        title={`Hasil Latihan • Bab ${bab}`}
        subtitle={meta?.judul ?? ""}
        onBack={onHome}
        backLabel="Kembali ke Daftar Bab"
        rightAction={<ThemeToggle theme={theme} onToggle={toggle} />}
      />

      <main className="flex-1 p-4 space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          <LivingCard variant="glow" className="text-center py-6 space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              {dapatBadge ? <Trophy className="w-8 h-8 text-amber-500" /> : <Award className="w-8 h-8" />}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {profile.name.trim() ? `Hasil Belajar ${profile.name}` : `Evaluasi Bab ${bab}`}
              </p>
              <h2 className="font-display text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {dapatBadge ? "Luar Biasa! Lencana Terbuka!" : "Terus Semangat Berlatih!"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-4">
                {maskotOf(bab)} berkata:{" "}
                {skor >= 85
                  ? "Penguasaan materimu sangat matang!"
                  : skor >= 60
                    ? "Kamu sudah melampaui batas kelulusan lencana!"
                    : "Yuk baca kembali kartu materi Topik A & B lalu coba lagi!"}
              </p>
            </div>

            <div className="py-2">
              <div className="font-display text-5xl font-bold text-emerald-500">
                <CountUp to={skor} />
              </div>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Nilai Akhir ({benar} benar dari {total} soal)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center gap-1.5 font-semibold">
                <Flame className="w-4 h-4 text-sky-500" /> Streak: {streak}x
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center gap-1.5 font-semibold">
                <Star className="w-4 h-4 text-amber-500" /> +{benar * 10} XP
              </div>
            </div>

            {dapatBadge ? (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                  <PartyPopper className="w-4 h-4" /> Lencana: {badgeOf(bab)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Capai minimal nilai <b>60</b> (21/35 soal benar) untuk membuka lencana <b>{badgeOf(bab)}</b>.
              </p>
            )}
          </LivingCard>
        </motion.div>

        {/* Rincian Penguasaan per Tipe Soal */}
        {savedRes?.perTipe && (
          <LivingCard className="space-y-2.5">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
              Rincian Skor per Kategori Soal TKA
            </h3>
            <div className="space-y-2">
              {(["pg", "pgk", "isian", "jodoh", "bs", "uraian"] as QType[]).map((t) => {
                const stat = savedRes.perTipe?.[t];
                if (!stat) return null;
                const info = labelTipeSoal(t);
                return (
                  <InlineDataBar
                    key={t}
                    label={info.kode}
                    value={stat.benar}
                    max={stat.total}
                    formatValue={(v) => `${v}/${stat.total} Benar`}
                    color={stat.benar / (stat.total || 1) >= 0.6 ? "emerald" : "amber"}
                  />
                );
              })}
            </div>
          </LivingCard>
        )}

        {/* Akordeon Kunci & Pembahasan Lengkap 35 Soal */}
        <LivingCard className="space-y-3">
          <button
            onClick={() => {
              bunyi("klik");
              setShowReview((r) => !r);
            }}
            className="w-full flex items-center justify-between text-left font-display font-bold text-sm text-slate-900 dark:text-white cursor-pointer"
          >
            <span>Kunci & Pembahasan 35 Soal Bab {bab}</span>
            {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showReview && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800 max-h-[420px] overflow-y-auto pr-1">
              {soalList.map((s, i) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs space-y-1"
                >
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    Soal {i + 1} ({labelTipeSoal(s.tipe).nama})
                  </p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{s.tanya}</p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <b>Kunci:</b> {Array.isArray(s.kunci) ? s.kunci.join(", ") : s.kunci}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">{s.pembahasan}</p>
                </div>
              ))}
            </div>
          )}
        </LivingCard>

        <div className="grid grid-cols-2 gap-2">
          <TapButton onClick={onUlang}>
            <RotateCcw className="w-4 h-4" /> Coba Lagi
          </TapButton>
          <TapButton variant="outline" onClick={onMateri}>
            <BookOpen className="w-4 h-4" /> Ulas Materi
          </TapButton>
        </div>

        <TapButton variant="outline" fullWidth onClick={onHome}>
          <Home className="w-4 h-4" /> Kembali ke Daftar 7 Bab
        </TapButton>
      </main>

      <MobileBottomNav
        items={NAV_ITEMS}
        activeId="beranda"
        onChange={(id) => {
          bunyi("klik");
          if (id === "beranda") onHome();
          else if (id === "materi") onMateri();
          else if (id === "rapor") (onRapor ?? onHome)();
          else if (id === "ulang") onUlang();
        }}
      />
    </MobileContainer>
  );
};
