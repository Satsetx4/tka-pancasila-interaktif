import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Gamepad2,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  Award,
  Flame,
  Sparkles,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  Compass,
  BarChart3,
  User,
  Clock,
  ChevronRight,
  Lock,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { MobileContainer } from "../components/layout/MobileContainer";
import { AppHeader } from "../components/navigation/AppHeader";
import { MobileBottomNav, type NavItem } from "../components/navigation/MobileBottomNav";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ConfirmSheet } from "../components/ui/ConfirmSheet";
import { CountUp } from "../components/ui/CountUp";
import { InlineDataBar } from "../components/ui/InlineDataBar";
import { BabBadgeIcon } from "../components/ui/BabBadgeIcon";
import { PwaInstallBanner } from "../components/ui/PwaInstallBanner";
import { BABS, store, useTheme, useLicense, bunyi, scoreOf } from "../lib/store";
import { MATERI, SOAL_PER_BAB, totalSoal } from "../data";
import { fadeUp, springSnappy } from "../lib/motion";

export type HomeTab = "beranda" | "materi" | "rapor" | "profil";

interface Props {
  initialTab?: HomeTab;
  onTabChange?: (tab: HomeTab) => void;
  onMateri: (bab: number) => void;
  onLatihan: (bab: number) => void;
  onOpenPaywall: (bab?: number | null) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: "beranda", label: "7 Bab", icon: Compass },
  { id: "materi", label: "Rangkuman", icon: BookOpen },
  { id: "rapor", label: "Rapor", icon: BarChart3 },
  { id: "profil", label: "Profil", icon: User },
];

export const HomeScreen: React.FC<Props> = ({
  initialTab = "beranda",
  onTabChange,
  onMateri,
  onLatihan,
  onOpenPaywall,
}) => {
  const { theme, toggle } = useTheme();
  const { license, isPro, isBabUnlocked } = useLicense();
  const [tab, setTab] = useState<HomeTab>(initialTab);
  const [profile, setProfile] = useState(() => store.profile.load());
  const [prog, setProg] = useState(() => store.progress.load());
  const [sessions, setSessions] = useState(() => store.session.loadAll());
  const [materiRead, setMateriRead] = useState(() => store.materiRead.load());
  const [mute, setMute] = useState(() => store.mute.load());
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const gantiTab = (id: string) => {
    const next = id as HomeTab;
    bunyi("klik");
    setTab(next);
    onTabChange?.(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const simpanProfil = (patch: Partial<typeof profile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    store.profile.save(next);
  };

  const handleResetAll = () => {
    store.resetAll();
    setProfile(store.profile.load());
    setProg(store.progress.load());
    setSessions(store.session.loadAll());
    setMateriRead(store.materiRead.load());
    setConfirmResetOpen(false);
    bunyi("klik");
  };

  const jmlBabSelesai = Object.keys(prog.selesai).length;
  const totalBenarSemua = Object.values(prog.selesai).reduce((a, b) => a + b.benar, 0);
  const jmlSoalSemua = totalSoal();

  return (
    <MobileContainer hasBottomNav>
      <AppHeader
        title="TKA Pancasila Interaktif"
        subtitle="Kelas VI SD/MI • 7 Bab • 245 Soal Resmi"
        rightAction={
          <div className="flex items-center gap-1.5">
            {isPro ? (
              <button
                type="button"
                onClick={() => gantiTab("profil")}
                className="inline-flex items-center gap-1 h-9 px-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                title="Akses PRO Aktif"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PRO</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  bunyi("klik");
                  onOpenPaywall(null);
                }}
                className="inline-flex items-center gap-1 h-9 px-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold cursor-pointer hover:bg-amber-500/30 transition-colors"
                title="Masukkan Kode Voucher / Buka PRO"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Buka PRO</span>
              </button>
            )}
            <button
              onClick={() => {
                const m = !mute;
                setMute(m);
                store.mute.save(m);
              }}
              aria-label={mute ? "Nyalakan efek suara" : "Matikan efek suara"}
              title={mute ? "Suara mati" : "Suara aktif"}
              className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border transition-colors cursor-pointer bg-slate-200/60 border-slate-300/60 text-slate-600 hover:bg-slate-300/60 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700/60"
            >
              {mute ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
            </button>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        }
      />

      <main className="flex-1 p-4 space-y-4">
        <PwaInstallBanner />

        {/* TAB 1: BERANDA (7 BAB) */}
        {tab === "beranda" && (
          <>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <LivingCard variant="glow" className="relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <Sparkles className="w-3.5 h-3.5" /> Modul TKA Pendidikan Pancasila
                  </span>
                  {profile.name.trim() && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> {profile.name}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-2xl font-bold leading-tight mt-2.5 text-slate-900 dark:text-white">
                  {profile.name.trim()
                    ? `Semangat Belajar, ${profile.name}!`
                    : "Belajar & Taklukkan 245 Soal TKA!"}
                </h2>
                <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                  Pelajari rangkuman Topik A &amp; B bersama Bonar, Memey, Pigey, Sedi, Indi, Manda, dan Anisa lalu kumpulkan 7 lencana.
                </p>

                {/* Input Nama Cepat */}
                <div className="mt-3 relative">
                  <input
                    value={profile.name}
                    onChange={(e) => simpanProfil({ name: e.target.value })}
                    maxLength={32}
                    placeholder="Ketik nama panggilanmu di sini..."
                    aria-label="Nama siswa"
                    className="w-full h-11 px-3.5 rounded-xl text-sm font-medium outline-none border transition-colors bg-slate-100/90 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 dark:bg-slate-800/80 dark:border-slate-700 dark:text-white"
                  />
                </div>

                {/* 3 Kartu Statistik Taktil */}
                <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-100/90 dark:bg-slate-800/75 border border-slate-200/70 dark:border-slate-700/60 py-2.5 px-2">
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500/20" />
                      <CountUp to={prog.xp} className="font-display text-xl font-bold" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Total XP</p>
                  </div>
                  <div className="rounded-xl bg-slate-100/90 dark:bg-slate-800/75 border border-slate-200/70 dark:border-slate-700/60 py-2.5 px-2">
                    <div className="flex items-center justify-center gap-1 text-emerald-500">
                      <Award className="w-4 h-4" />
                      <span className="font-display text-xl font-bold">
                        <CountUp to={prog.badge.length} />/7
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Lencana</p>
                  </div>
                  <div className="rounded-xl bg-slate-100/90 dark:bg-slate-800/75 border border-slate-200/70 dark:border-slate-700/60 py-2.5 px-2">
                    <div className="flex items-center justify-center gap-1 text-sky-500">
                      <Flame className="w-4 h-4" />
                      <CountUp to={prog.streakTerbaik} className="font-display text-xl font-bold" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Beruntun</p>
                  </div>
                </div>

                {/* Inline Data Bar Progres Keseluruhan */}
                <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <InlineDataBar
                    label="Penguasaan Seluruh Soal"
                    sublabel={`(${jmlBabSelesai}/7 Bab selesai)`}
                    value={totalBenarSemua}
                    max={jmlSoalSemua}
                    formatValue={(v) => `${v}/${jmlSoalSemua} Soal`}
                    color="emerald"
                  />
                </div>
              </LivingCard>
            </motion.div>

            {/* Banner Aktivasi PRO (Jika belum PRO) */}
            {!isPro && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.5}>
                <LivingCard className="border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-500/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        <Sparkles className="w-3 h-3" /> Bab 1 Gratis • Bab 2–7 Member PRO
                      </span>
                      <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        Buka Full 7 Bab &amp; 245 Soal TKA Resmi
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Coba gratis seluruh latihan <strong>Bab 1 (35 Soal)</strong> sekarang! Sudah punya kode voucher atau ingin membuka Bab 2–7?
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <TapButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        bunyi("klik");
                        onOpenPaywall(null);
                      }}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Punya Kode Voucher</span>
                    </TapButton>
                    <TapButton
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        bunyi("klik");
                        onOpenPaywall(null);
                      }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Beli PRO (Rp20rb)</span>
                    </TapButton>
                  </div>
                </LivingCard>
              </motion.div>
            )}

            {/* Daftar 7 Bab */}
            <div className="space-y-3">
              {BABS.map((b, i) => {
                const babUnlocked = isBabUnlocked(b.id);
                const soalCount = (SOAL_PER_BAB[b.id] ?? []).length || 35;
                const done = prog.selesai[b.id];
                const punyaBadge = prog.badge.includes(b.id);
                const activeSession = sessions[b.id];
                const jmlSedangDijawab = activeSession ? Object.keys(activeSession.benarMap).length : 0;
                const kartuBab = MATERI.find((m) => m.bab === b.id)?.kartu ?? [];
                const dibacaCount = (materiRead[b.id] ?? []).length;

                return (
                  <motion.div
                    key={b.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={i + 1}
                  >
                    <LivingCard className="relative overflow-hidden">
                      <div className="flex items-start gap-3.5">
                        <BabBadgeIcon bab={b.id} warna={b.warna} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              BAB {b.id} • {soalCount} SOAL • {b.maskot}
                            </span>
                            {punyaBadge ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                <Trophy className="w-3 h-3" /> Lencana
                              </span>
                            ) : b.id === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                GRATIS PENUH
                              </span>
                            ) : babUnlocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                <ShieldCheck className="w-3 h-3" /> PRO AKTIF
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                <Lock className="w-3 h-3" /> PRO
                              </span>
                            )}
                          </div>
                          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-snug mt-0.5">
                            {b.judul}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {b.pendek}
                          </p>
                        </div>
                      </div>

                      {/* Bar Progres per Bab */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        {done ? (
                          <InlineDataBar
                            label="Skor Terbaik"
                            sublabel={`(${scoreOf(done.benar, done.total)} Nilai)`}
                            value={done.benar}
                            max={done.total}
                            formatValue={(v) => `${v}/${done.total} Benar`}
                            color={scoreOf(done.benar, done.total) >= 60 ? "emerald" : "amber"}
                          />
                        ) : jmlSedangDijawab > 0 ? (
                          <div className="flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-medium py-0.5">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Sesi tersimpan: Soal ke-{(activeSession?.idx ?? 0) + 1} ({jmlSedangDijawab}/{soalCount} terjawab)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-0.5">
                            <span>Materi dibaca: {dibacaCount}/{kartuBab.length} kartu</span>
                            <span>{babUnlocked ? "Siap dikerjakan" : "Preview 2 kartu gratis"}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <TapButton
                          variant="outline"
                          onClick={() => {
                            bunyi("klik");
                            onMateri(b.id);
                          }}
                        >
                          <BookOpen className="w-4 h-4 text-emerald-500" />
                          <span>
                            {babUnlocked ? `Materi (${kartuBab.length})` : "Preview Materi"}
                          </span>
                        </TapButton>
                        <TapButton
                          onClick={() => {
                            bunyi("klik");
                            onLatihan(b.id);
                          }}
                        >
                          {babUnlocked ? (
                            <>
                              <Gamepad2 className="w-4 h-4" />
                              <span>
                                {jmlSedangDijawab > 0
                                  ? `Lanjut (${jmlSedangDijawab}/${soalCount})`
                                  : done
                                    ? "Latihan Lagi"
                                    : "Mulai Latihan"}
                              </span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>Buka 35 Soal</span>
                            </>
                          )}
                        </TapButton>
                      </div>
                    </LivingCard>
                  </motion.div>
                );
              })}
            </div>

            {/* Panduan Singkat */}
            <LivingCard variant="glass">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Struktur Resmi 35 Soal per Bab
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
                  <b>I. Pilihan Ganda:</b> 10 Soal
                </div>
                <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
                  <b>II. PG Kompleks:</b> 5 Soal
                </div>
                <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
                  <b>III. Isian Singkat:</b> 5 Soal
                </div>
                <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
                  <b>IV. Menjodohkan:</b> 5 Soal
                </div>
                <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
                  <b>V. Benar / Salah:</b> 5 Soal
                </div>
                <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
                  <b>VI. Uraian:</b> 5 Soal
                </div>
              </div>
            </LivingCard>
          </>
        )}

        {/* TAB 2: KAMUS & RANGKUMAN MATERI CEPAT */}
        {tab === "materi" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="space-y-3"
          >
            <LivingCard variant="glow">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Rangkuman Lengkap Bab 1 – Bab 7
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pilih Bab di bawah ini untuk membuka kartu belajar Topik A &amp; Topik B lengkap beserta kata kunci ujian TKA.
              </p>
            </LivingCard>

            {BABS.map((b) => {
              const m = MATERI.find((x) => x.bab === b.id);
              const kartu = m?.kartu ?? [];
              const dibaca = (materiRead[b.id] ?? []).length;
              const unlocked = isBabUnlocked(b.id);
              return (
                <LivingCard
                  key={b.id}
                  isInteractive
                  onClick={() => {
                    bunyi("klik");
                    onMateri(b.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <BabBadgeIcon bab={b.id} warna={b.warna} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          BAB {b.id} • {kartu.length} TOPIK INTI
                        </p>
                        {!unlocked && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-500">
                            <Lock className="w-2.5 h-2.5" /> Preview
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                        {b.judul}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {m?.subjudul ?? b.pendek}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </div>
                  <div className="mt-2.5">
                    <InlineDataBar
                      label="Kartu Materi Dibaca"
                      value={dibaca}
                      max={kartu.length}
                      formatValue={(v) => `${v}/${kartu.length}`}
                      color="sky"
                    />
                  </div>
                </LivingCard>
              );
            })}
          </motion.div>
        )}

        {/* TAB 3: RAPOR & CAPAIAN */}
        {tab === "rapor" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="space-y-4"
          >
            <LivingCard variant="glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Rapor Capaian Belajar
                  </p>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {profile.name.trim() ? profile.name : "Siswa Kelas VI SD"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kelas {profile.kelas || "VI (Enam)"} {profile.sekolah ? `• ${profile.sekolah}` : ""}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <InlineDataBar
                  label="Total Soal Dikuasai"
                  value={totalBenarSemua}
                  max={jmlSoalSemua}
                  formatValue={(v) => `${v}/${jmlSoalSemua} Soal`}
                  color="emerald"
                />
                <InlineDataBar
                  label="Koleksi Lencana Bab"
                  value={prog.badge.length}
                  max={7}
                  formatValue={(v) => `${v}/7 Lencana`}
                  color="amber"
                />
              </div>
            </LivingCard>

            {/* Koleksi 7 Lencana */}
            <LivingCard>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Koleksi Lencana Pejuang Pancasila ({prog.badge.length}/7)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Raih minimal nilai 60 (21/35 benar) di setiap Bab untuk membuka lencana.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2.5">
                {BABS.map((b) => {
                  const unlockedBadge = prog.badge.includes(b.id);
                  const babUnlocked = isBabUnlocked(b.id);
                  const res = prog.selesai[b.id];
                  const nilai = res ? scoreOf(res.benar, res.total) : 0;
                  return (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        unlockedBadge
                          ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20"
                          : "bg-slate-100/60 border-slate-200/70 dark:bg-slate-800/40 dark:border-slate-800 opacity-85"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BabBadgeIcon bab={b.id} warna={unlockedBadge ? b.warna : "emerald"} size="sm" />
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                            {b.badge}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Bab {b.id} • {res ? `Nilai Terbaik: ${nilai} (${res.benar}/${res.total})` : "Belum dikerjakan"}
                          </p>
                        </div>
                      </div>
                      <TapButton
                        size="sm"
                        variant={unlockedBadge ? "outline" : "primary"}
                        onClick={() => onLatihan(b.id)}
                      >
                        {!babUnlocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5" /> PRO
                          </>
                        ) : unlockedBadge ? (
                          "Ulang"
                        ) : (
                          "Kejar"
                        )}
                      </TapButton>
                    </div>
                  );
                })}
              </div>
            </LivingCard>
          </motion.div>
        )}

        {/* TAB 4: PROFIL & PENGATURAN */}
        {tab === "profil" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="space-y-4"
          >
            {/* Status Lisensi & Voucher Neon DB */}
            <LivingCard variant="glow" className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Status Lisensi &amp; Akses Soal
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID Perangkat: <code className="font-mono">{store.device.getId()}</code>
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    isPro
                      ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  }`}
                >
                  {isPro ? "FULL PRO AKTIF" : "MODE GRATIS (BAB 1)"}
                </span>
              </div>

              {isPro && license ? (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Kode Voucher:</span>
                    <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {license.code}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Paket:</span>
                    <strong className="text-slate-900 dark:text-white">{license.label}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Kuota Perangkat:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {license.usedDevices} / {license.maxDevices} Perangkat
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Saat ini Anda menggunakan <strong>Akses Gratis (Bab 1 Penuh)</strong>. Masukkan kode voucher atau beli paket PRO untuk membuka Bab 2 s/d Bab 7 (total 245 Soal TKA).
                  </p>
                  <TapButton
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      bunyi("klik");
                      onOpenPaywall(null);
                    }}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Masukkan Kode Voucher / Beli PRO</span>
                  </TapButton>
                </div>
              )}
            </LivingCard>

            <LivingCard className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Identitas Siswa
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tersimpan otomatis di perangkatmu.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nama Lengkap / Panggilan
                  </label>
                  <input
                    value={profile.name}
                    onChange={(e) => simpanProfil({ name: e.target.value })}
                    maxLength={32}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full h-11 px-3.5 rounded-xl text-sm outline-none border bg-slate-100 border-slate-300 text-slate-900 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Kelas
                  </label>
                  <input
                    value={profile.kelas ?? "VI (Enam)"}
                    onChange={(e) => simpanProfil({ kelas: e.target.value })}
                    maxLength={20}
                    placeholder="VI (Enam)"
                    className="w-full h-11 px-3.5 rounded-xl text-sm outline-none border bg-slate-100 border-slate-300 text-slate-900 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nama Sekolah (Opsional)
                  </label>
                  <input
                    value={profile.sekolah ?? ""}
                    onChange={(e) => simpanProfil({ sekolah: e.target.value })}
                    maxLength={48}
                    placeholder="Contoh: SD Persahabatan"
                    className="w-full h-11 px-3.5 rounded-xl text-sm outline-none border bg-slate-100 border-slate-300 text-slate-900 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </LivingCard>

            <LivingCard className="space-y-3">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Preferensi &amp; Reset Data
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <TapButton
                  variant="outline"
                  onClick={() => {
                    const m = !mute;
                    setMute(m);
                    store.mute.save(m);
                  }}
                >
                  {mute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
                  <span>{mute ? "Suara: Mati" : "Suara: Aktif"}</span>
                </TapButton>
                <TapButton variant="outline" onClick={toggle}>
                  <span>Tema: {theme === "dark" ? "Gelap" : "Terang"}</span>
                </TapButton>
              </div>

              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                <TapButton
                  variant="danger"
                  fullWidth
                  onClick={() => setConfirmResetOpen(true)}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Data / Mulai dari Awal (0%)</span>
                </TapButton>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Menghapus nama profil, XP, lencana, dan riwayat jawaban di perangkat ini.
                </p>
              </div>
            </LivingCard>
          </motion.div>
        )}
      </main>

      <MobileBottomNav items={NAV_ITEMS} activeId={tab} onChange={gantiTab} />

      <ConfirmSheet
        open={confirmResetOpen}
        title="Mulai dari Awal (Reset Data)?"
        message="Seluruh XP, lencana Bab 1–7, sesi latihan yang tersimpan, serta profil nama pada perangkat ini akan dikosongkan kembali ke 0%."
        confirmLabel="Ya, Reset Bersih"
        danger
        onConfirm={handleResetAll}
        onClose={() => setConfirmResetOpen(false)}
      />
    </MobileContainer>
  );
};
