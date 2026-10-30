import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Layers,
  List,
  CheckCircle2,
  Sparkles,
  Compass,
  BookOpen,
  BarChart3,
  User,
  Lock,
  KeyRound,
} from "lucide-react";
import { MobileContainer } from "../components/layout/MobileContainer";
import { AppHeader } from "../components/navigation/AppHeader";
import { MobileBottomNav, type NavItem } from "../components/navigation/MobileBottomNav";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { InlineDataBar } from "../components/ui/InlineDataBar";
import { BabBadgeIcon } from "../components/ui/BabBadgeIcon";
import { BABS, store, useTheme, useLicense, bunyi } from "../lib/store";
import { MATERI, SOAL_PER_BAB } from "../data";
import type { HomeTab } from "./Home";

interface Props {
  bab: number;
  onBack: () => void;
  onLatihan: () => void;
  onOpenPaywall?: () => void;
  onJumpTab?: (tab: HomeTab) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: "beranda", label: "7 Bab", icon: Compass },
  { id: "materi", label: "Rangkuman", icon: BookOpen },
  { id: "rapor", label: "Rapor", icon: BarChart3 },
  { id: "profil", label: "Profil", icon: User },
];

export const MateriScreen: React.FC<Props> = ({
  bab,
  onBack,
  onLatihan,
  onOpenPaywall,
  onJumpTab,
}) => {
  const { theme, toggle } = useTheme();
  const { isBabUnlocked } = useLicense();
  const babUnlocked = isBabUnlocked(bab);
  const meta = BABS.find((b) => b.id === bab);
  const m = MATERI.find((x) => x.bab === bab);
  const semuaKartu = m?.kartu ?? [];

  const [filterTopik, setFilterTopik] = useState<"Semua" | "Topik A" | "Topik B">("Semua");
  const [viewMode, setViewMode] = useState<"kartu" | "list">("kartu");
  const [idx, setIdx] = useState(0);
  const [dibaca, setDibaca] = useState<number[]>(() => {
    const updated = store.materiRead.mark(bab, 0);
    return updated[bab] ?? [];
  });

  const kartuFiltered = semuaKartu
    .map((k, originalIdx) => ({ ...k, originalIdx }))
    .filter((k) => filterTopik === "Semua" || k.topik === filterTopik);

  const activeCard = kartuFiltered[idx] ?? kartuFiltered[0];
  const isActiveCardLocked = !babUnlocked && activeCard && activeCard.originalIdx >= 2;

  const pilihKartu = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(kartuFiltered.length - 1, nextIdx));
    setIdx(clamped);
    const card = kartuFiltered[clamped];
    if (card && (babUnlocked || card.originalIdx < 2)) {
      const updated = store.materiRead.mark(bab, card.originalIdx);
      setDibaca(updated[bab] ?? []);
    }
  };

  const markAllRead = () => {
    let last = store.materiRead.load();
    semuaKartu.forEach((_, i) => {
      if (babUnlocked || i < 2) {
        last = store.materiRead.mark(bab, i);
      }
    });
    setDibaca(last[bab] ?? []);
  };

  return (
    <MobileContainer hasBottomNav>
      <AppHeader
        title={`Bab ${bab} • Materi Lengkap`}
        subtitle={meta?.judul ?? ""}
        onBack={onBack}
        backLabel="Kembali ke Beranda"
        rightAction={<ThemeToggle theme={theme} onToggle={toggle} />}
      />

      <main className="flex-1 p-4 space-y-4">
        {/* Header Bab & Progres Baca */}
        <LivingCard variant="glow">
          <div className="flex items-start gap-3">
            <BabBadgeIcon bab={bab} warna={meta?.warna ?? "emerald"} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Pendamping: {meta?.maskot} ({meta?.peran})
                </p>
                {!babUnlocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Lock className="w-3 h-3" /> Preview Gratis (2 Kartu)
                  </span>
                )}
              </div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-white leading-snug mt-0.5">
                {m?.judul ?? meta?.judul}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {m?.subjudul ??
                  `Pelajari ${semuaKartu.length} topik inti sebelum mengerjakan ${(SOAL_PER_BAB[bab] ?? []).length || 35} soal.`}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
            <InlineDataBar
              label="Progres Membaca Materi"
              value={dibaca.length}
              max={semuaKartu.length}
              formatValue={(v) => `${v}/${semuaKartu.length} Kartu`}
              color="emerald"
            />
          </div>
        </LivingCard>

        {/* Filter Topik A / B & Mode Tampilan */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60">
            {(["Semua", "Topik A", "Topik B"] as const).map((t) => {
              const active = filterTopik === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    bunyi("klik");
                    setFilterTopik(t);
                    setIdx(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-slate-950"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60">
            <button
              onClick={() => {
                bunyi("klik");
                setViewMode("kartu");
              }}
              aria-label="Mode Kartu"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                viewMode === "kartu"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Kartu
            </button>
            <button
              onClick={() => {
                bunyi("klik");
                setViewMode("list");
                markAllRead();
              }}
              aria-label="Mode Daftar"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Semua
            </button>
          </div>
        </div>

        {/* MODE 1: KARTU GESER INTERAKTIF */}
        {viewMode === "kartu" && activeCard && (
          <>
            <div className="relative min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${filterTopik}-${idx}`}
                  initial={{ opacity: 0, x: 45 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -45 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                >
                  <LivingCard className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        {activeCard.topik ?? "Materi Inti"} • Kartu {idx + 1}/{kartuFiltered.length}
                      </span>
                      {isActiveCardLocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                          <Lock className="w-3.5 h-3.5" /> Khusus Member PRO
                        </span>
                      ) : (
                        dibaca.includes(activeCard.originalIdx) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sudah dibaca
                          </span>
                        )
                      )}
                    </div>

                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {activeCard.judul}
                    </h3>

                    {isActiveCardLocked ? (
                      <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-center space-y-2.5">
                        <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <Lock className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Kartu materi ke-3 hingga ke-{semuaKartu.length} serta{" "}
                          <strong>35 Soal Latihan Bab {bab}</strong> terkunci. Aktifkan Kode Voucher
                          atau Paket PRO untuk membuka seluruh materi Topik A &amp; B!
                        </p>
                        <TapButton
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            bunyi("klik");
                            if (onOpenPaywall) onOpenPaywall();
                            else onLatihan();
                          }}
                          className="mx-auto"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Buka Seluruh Materi &amp; Soal (PRO)</span>
                        </TapButton>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                          {activeCard.isi}
                        </p>

                        {activeCard.poin && activeCard.poin.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Poin Penting Sesuai Modul:
                            </p>
                            <ul className="space-y-1.5">
                              {activeCard.poin.map((p, pi) => (
                                <li
                                  key={pi}
                                  className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-100/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {activeCard.kataKunci && activeCard.kataKunci.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {activeCard.kataKunci.map((kw, ki) => (
                              <span
                                key={ki}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                              >
                                <Sparkles className="w-3 h-3" /> {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </LivingCard>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <TapButton
                variant="outline"
                className="flex-1"
                onClick={() => {
                  bunyi("klik");
                  pilihKartu(idx - 1);
                }}
                disabled={idx === 0}
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </TapButton>
              <div className="flex gap-1.5 px-1">
                {kartuFiltered.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      bunyi("klik");
                      pilihKartu(i);
                    }}
                    aria-label={`Kartu ${i + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === idx
                        ? "w-5 bg-emerald-500"
                        : "w-2 bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              <TapButton
                variant="outline"
                className="flex-1"
                onClick={() => {
                  bunyi("klik");
                  pilihKartu(idx + 1);
                }}
                disabled={idx === kartuFiltered.length - 1}
              >
                Berikutnya <ChevronRight className="w-4 h-4" />
              </TapButton>
            </div>
          </>
        )}

        {/* MODE 2: BACA SEMUA RINGKASAN SEKALIGUS */}
        {viewMode === "list" && (
          <div className="space-y-3">
            {kartuFiltered.map((k, i) => {
              const cardLocked = !babUnlocked && k.originalIdx >= 2;
              return (
                <LivingCard key={k.originalIdx} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {k.topik ?? "Materi"} • Bagian {i + 1}
                    </span>
                    {cardLocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                        <Lock className="w-3 h-3" /> PRO
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {k.judul}
                  </h3>
                  {cardLocked ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600 dark:text-slate-300">
                        Aktifkan Kode Voucher PRO untuk membaca bagian ini.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          bunyi("klik");
                          if (onOpenPaywall) onOpenPaywall();
                          else onLatihan();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0 cursor-pointer"
                      >
                        Buka PRO
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {k.isi}
                      </p>
                      {k.poin && k.poin.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {k.poin.map((p, pi) => (
                            <li
                              key={pi}
                              className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-100/80 dark:bg-slate-800/60 p-2 rounded-xl"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </LivingCard>
              );
            })}
          </div>
        )}

        {/* CTA Bawah */}
        <div className="grid grid-cols-2 gap-2 pt-2 pb-4">
          <TapButton variant="outline" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" /> Daftar 7 Bab
          </TapButton>
          <TapButton
            onClick={() => {
              bunyi("klik");
              onLatihan();
            }}
          >
            {babUnlocked ? (
              <>
                <Gamepad2 className="w-4 h-4" /> Kerjakan 35 Soal
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Buka 35 Soal (PRO)
              </>
            )}
          </TapButton>
        </div>
      </main>

      <MobileBottomNav
        items={NAV_ITEMS}
        activeId="materi"
        onChange={(id) => {
          bunyi("klik");
          if (onJumpTab) onJumpTab(id as HomeTab);
          else onBack();
        }}
      />
    </MobileContainer>
  );
};
