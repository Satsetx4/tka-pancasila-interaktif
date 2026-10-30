import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Lightbulb,
  CheckCircle2,
  XCircle,
  BookOpen,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  FileText,
  Compass,
  Flame,
  Star,
} from "lucide-react";
import { MobileContainer } from "../components/layout/MobileContainer";
import { AppHeader } from "../components/navigation/AppHeader";
import { MobileBottomNav, type NavItem } from "../components/navigation/MobileBottomNav";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ConfirmSheet } from "../components/ui/ConfirmSheet";
import {
  BABS,
  nilaiSoal,
  labelTipeSoal,
  bunyi,
  norm,
  store,
  useTheme,
  type Soal,
  type QType,
} from "../lib/store";
import { SOAL_PER_BAB } from "../data";

interface Props {
  bab: number;
  onKeluar: () => void;
  onMateri: () => void;
  onSelesai: (
    benar: number,
    total: number,
    streakTerbaik: number,
    perTipe?: Record<QType, { benar: number; total: number }>
  ) => void;
}

const HURUF = ["A", "B", "C", "D", "E"];

const NAV_ITEMS: NavItem[] = [
  { id: "beranda", label: "7 Bab", icon: Compass },
  { id: "materi", label: "Materi Bab", icon: BookOpen },
  { id: "peta", label: "Peta Soal", icon: LayoutGrid },
  { id: "ulang", label: "Ulang Sesi", icon: RotateCcw },
];

export const LatihanScreen: React.FC<Props> = ({
  bab,
  onKeluar,
  onMateri,
  onSelesai,
}) => {
  const { theme, toggle } = useTheme();
  const meta = BABS.find((b) => b.id === bab);
  const soalList = useMemo(() => SOAL_PER_BAB[bab] ?? [], [bab]);
  const total = soalList.length;

  // Muat sesi latihan yang tersimpan di localStorage agar aman saat refresh
  const saved = useMemo(() => store.session.load(bab), [bab]);

  const [idx, setIdx] = useState<number>(() =>
    saved && saved.idx < total ? saved.idx : 0
  );
  const [jawab, setJawab] = useState<Record<string, string | string[]>>(
    () => saved?.jawab ?? {}
  );
  const [benarMap, setBenarMap] = useState<Record<string, boolean>>(
    () => saved?.benarMap ?? {}
  );
  const [streak, setStreak] = useState<number>(() => saved?.streak ?? 0);
  const [streakMax, setStreakMax] = useState<number>(() => saved?.streakMax ?? 0);
  const [xp, setXp] = useState<number>(() => saved?.xp ?? 0);

  const [pgkPilih, setPgkPilih] = useState<string[]>(() => {
    const s0 = soalList[saved && saved.idx < total ? saved.idx : 0];
    const ans = s0 ? saved?.jawab?.[s0.id] : undefined;
    return Array.isArray(ans) ? ans : [];
  });
  const [isianVal, setIsianVal] = useState(() => {
    const s0 = soalList[saved && saved.idx < total ? saved.idx : 0];
    const ans = s0 ? saved?.jawab?.[s0.id] : undefined;
    return typeof ans === "string" ? ans : "";
  });
  const [uraianVal, setUraianVal] = useState(() => {
    const s0 = soalList[saved && saved.idx < total ? saved.idx : 0];
    const ans = s0 ? saved?.jawab?.[s0.id] : undefined;
    return typeof ans === "string" ? ans : "";
  });
  const [uraianRevealed, setUraianRevealed] = useState(() => {
    const s0 = soalList[saved && saved.idx < total ? saved.idx : 0];
    return Boolean(s0 && saved?.benarMap && s0.id in saved.benarMap);
  });

  const [showGrid, setShowGrid] = useState(false);
  const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);

  const soal: Soal | undefined = soalList[idx];
  const sudahJawab = soal ? soal.id in benarMap : false;
  const benar = Object.values(benarMap).filter(Boolean).length;
  const jmlTerjawab = Object.keys(benarMap).length;

  // Simpan sesi otomatis ke localStorage setiap kali state berubah
  useEffect(() => {
    if (total === 0) return;
    store.session.save(bab, {
      bab,
      idx,
      jawab,
      benarMap,
      streak,
      streakMax,
      xp,
      updatedAt: new Date().toISOString(),
    });
  }, [bab, idx, jawab, benarMap, streak, streakMax, xp, total]);

  const pindahKeSoal = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, nextIdx));
    setIdx(clamped);
    const target = soalList[clamped];
    if (!target) return;
    const prevAns = jawab[target.id];
    setPgkPilih(Array.isArray(prevAns) ? prevAns : []);
    setIsianVal(typeof prevAns === "string" ? prevAns : "");
    setUraianVal(typeof prevAns === "string" ? prevAns : "");
    setUraianRevealed(target.id in benarMap);
  };

  const catat = (s: Soal, j: string | string[], ok: boolean) => {
    setJawab((p) => ({ ...p, [s.id]: j }));
    setBenarMap((p) => ({ ...p, [s.id]: ok }));
    if (ok) {
      const ns = streak + 1;
      setStreak(ns);
      setStreakMax((m) => Math.max(m, ns));
      const bonus = ns >= 3 ? 5 : 0;
      setXp((x) => x + 10 + bonus);
      bunyi("benar");
      if (ns === 3 || ns === 5 || ns === 10) bunyi("badge");
    } else {
      setStreak(0);
      bunyi("salah");
    }
  };

  const pilihPG = (s: Soal, huruf: string) => {
    if (s.id in benarMap) return;
    catat(s, huruf, nilaiSoal(s, huruf));
  };

  const cekPGK = (s: Soal) => {
    if (s.id in benarMap || pgkPilih.length === 0) return;
    const sorted = [...pgkPilih].sort();
    catat(s, sorted, nilaiSoal(s, sorted));
  };

  const cekIsian = (s: Soal) => {
    if (s.id in benarMap || !isianVal.trim()) return;
    catat(s, isianVal.trim(), nilaiSoal(s, isianVal.trim()));
  };

  const hitungPerTipe = () => {
    const map: Record<QType, { benar: number; total: number }> = {
      pg: { benar: 0, total: 0 },
      pgk: { benar: 0, total: 0 },
      isian: { benar: 0, total: 0 },
      jodoh: { benar: 0, total: 0 },
      bs: { benar: 0, total: 0 },
      uraian: { benar: 0, total: 0 },
    };
    for (const s of soalList) {
      map[s.tipe].total += 1;
      if (benarMap[s.id]) map[s.tipe].benar += 1;
    }
    return map;
  };

  const next = () => {
    bunyi("klik");
    if (idx >= total - 1) {
      onSelesai(benar, total, streakMax, hitungPerTipe());
    } else {
      pindahKeSoal(idx + 1);
    }
  };

  const prev = () => {
    bunyi("klik");
    pindahKeSoal(idx - 1);
  };

  const handleRestart = () => {
    store.session.clear(bab);
    setIdx(0);
    setJawab({});
    setBenarMap({});
    setStreak(0);
    setStreakMax(0);
    setXp(0);
    setPgkPilih([]);
    setIsianVal("");
    setUraianVal("");
    setUraianRevealed(false);
    setConfirmRestartOpen(false);
    bunyi("klik");
  };

  if (!soal) {
    return (
      <MobileContainer>
        <AppHeader title={`Bab ${bab}`} onBack={onKeluar} />
        <div className="p-6 text-center space-y-3">
          <p className="text-sm text-slate-500">Soal Bab {bab} tidak ditemukan.</p>
          <TapButton onClick={onKeluar}>Kembali ke Beranda</TapButton>
        </div>
      </MobileContainer>
    );
  }

  const infoTipe = labelTipeSoal(soal.tipe);
  const kunciTeks = (s: Soal) => (Array.isArray(s.kunci) ? s.kunci.join(", ") : s.kunci);

  return (
    <MobileContainer hasBottomNav>
      <AppHeader
        title={`Bab ${bab} • Soal ${idx + 1}/${total}`}
        subtitle={meta?.judul ?? ""}
        onBack={onKeluar}
        backLabel="Simpan & Keluar ke Beranda"
        rightAction={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                bunyi("klik");
                setShowGrid((g) => !g);
              }}
              aria-label="Peta Nomor Soal"
              title="Peta 35 Soal"
              className={`flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border transition-colors cursor-pointer ${
                showGrid
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-200/60 border-slate-300/60 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-300"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        }
      />

      <main className="flex-1 p-4 space-y-3.5 relative">
        {/* Bar Status & Progres */}
        <LivingCard className="p-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500/20" /> {xp} XP
              </span>
              <span className="inline-flex items-center gap-1 text-sky-500">
                <Flame className="w-3.5 h-3.5" /> {streak}x Beruntun
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {benar}/{jmlTerjawab} Benar
            </span>
          </div>

          <div className="mt-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"
              animate={{ width: `${((idx + 1) / total) * 100}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Terjawab: {jmlTerjawab} dari {total} soal</span>
            <button
              onClick={() => setShowGrid((g) => !g)}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {showGrid ? "Tutup Peta Soal" : "Pilih Nomor Soal"}
            </button>
          </div>
        </LivingCard>

        {/* Peta Nomor Soal (1 - 35) */}
        <AnimatePresence>
          {showGrid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <LivingCard className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Peta Navigasi 35 Soal
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Ketuk nomor untuk melompat
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {soalList.map((s, i) => {
                    const answered = s.id in benarMap;
                    const ok = benarMap[s.id];
                    const active = i === idx;
                    let cls =
                      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                    if (answered) {
                      cls = ok
                        ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/50 dark:text-emerald-300"
                        : "bg-rose-500/20 text-rose-700 border-rose-500/50 dark:text-rose-300";
                    }
                    if (active) {
                      cls += " ring-2 ring-emerald-500 font-bold";
                    }
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          bunyi("klik");
                          pindahKeSoal(i);
                          setShowGrid(false);
                        }}
                        className={`h-9 rounded-lg border text-xs font-medium transition-all cursor-pointer ${cls}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </LivingCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kartu Soal Utama */}
        <AnimatePresence mode="wait">
          <motion.div
            key={soal.id}
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.18 }}
          >
            <LivingCard variant="glow" className="space-y-3">
              {/* Badge Tipe Soal */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <Sparkles className="w-3 h-3" /> {infoTipe.kode}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {infoTipe.petunjuk}
                </span>
              </div>

              {/* Kotak Stimulus Bacaan (Khusus Soal Model TKA Berbasis Stimulus di Bab 6 & 7) */}
              {soal.stimulus && (
                <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border-l-4 border-emerald-500 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Stimulus Bacaan TKA
                  </p>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 italic">
                    {soal.stimulus}
                  </p>
                </div>
              )}

              {/* Pertanyaan */}
              <h3 className="text-base font-semibold leading-relaxed text-slate-900 dark:text-white whitespace-pre-line">
                {soal.tanya}
              </h3>

              {/* 1. PILIHAN GANDA, MENJODOHKAN, & BENAR/SALAH */}
              {(soal.tipe === "pg" || soal.tipe === "jodoh" || soal.tipe === "bs") && (
                <div className="pt-1 space-y-2">
                  {(soal.opsi ?? (soal.tipe === "bs" ? ["Benar", "Salah"] : [])).map((op, i) => {
                    const badgeHuruf = soal.tipe === "bs" ? (i === 0 ? "B" : "S") : HURUF[i];
                    const kunci = Array.isArray(soal.kunci) ? soal.kunci[0] : soal.kunci;
                    const isKunci =
                      norm(HURUF[i]) === norm(String(kunci)) ||
                      norm(op) === norm(String(kunci));
                    const dipilih =
                      norm(String(jawab[soal.id] ?? "")) === norm(HURUF[i]) ||
                      norm(String(jawab[soal.id] ?? "")) === norm(op);

                    let cls =
                      "border-slate-300/90 dark:border-slate-700/90 bg-white hover:border-emerald-500/50 dark:bg-slate-800/60";
                    let badgeCls =
                      "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";

                    if (sudahJawab) {
                      if (isKunci) {
                        cls =
                          "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100";
                        badgeCls = "bg-emerald-500 text-white";
                      } else if (dipilih) {
                        cls =
                          "border-rose-500 bg-rose-50/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100";
                        badgeCls = "bg-rose-500 text-white";
                      }
                    }

                    return (
                      <motion.button
                        key={i}
                        whileTap={sudahJawab ? undefined : { scale: 0.985 }}
                        disabled={sudahJawab}
                        onClick={() => pilihPG(soal, soal.tipe === "bs" ? op : HURUF[i])}
                        className={`w-full text-left p-3 rounded-xl border-2 text-sm leading-relaxed font-medium transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${cls}`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 mt-0.5 transition-colors ${badgeCls}`}
                        >
                          {badgeHuruf}
                        </span>
                        <span className="flex-1">{op}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* 2. PILIHAN GANDA KOMPLEKS (PGK) */}
              {soal.tipe === "pgk" && (
                <div className="pt-1 space-y-2">
                  {(soal.opsi ?? []).map((op, i) => {
                    const huruf = HURUF[i];
                    const on = pgkPilih.includes(huruf);
                    const kunciArr = (
                      Array.isArray(soal.kunci) ? soal.kunci : [soal.kunci]
                    ).map((k) => norm(String(k)));
                    const isKunci = kunciArr.includes(norm(huruf));

                    let cls = on
                      ? "border-sky-500 bg-sky-50/90 dark:bg-sky-950/40"
                      : "border-slate-300/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60";
                    let boxCls = on
                      ? "bg-sky-500 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";

                    if (sudahJawab) {
                      if (isKunci) {
                        cls = "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40";
                        boxCls = "bg-emerald-500 text-white";
                      } else if (on) {
                        cls = "border-rose-500 bg-rose-50/90 dark:bg-rose-950/40";
                        boxCls = "bg-rose-500 text-white";
                      }
                    }

                    return (
                      <motion.button
                        key={i}
                        whileTap={sudahJawab ? undefined : { scale: 0.985 }}
                        disabled={sudahJawab}
                        onClick={() =>
                          setPgkPilih((p) =>
                            p.includes(huruf)
                              ? p.filter((x) => x !== huruf)
                              : [...p, huruf]
                          )
                        }
                        className={`w-full text-left p-3 rounded-xl border-2 text-sm leading-relaxed transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${cls}`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 mt-0.5 ${boxCls}`}
                        >
                          {huruf}
                        </span>
                        <span className="flex-1">{op}</span>
                      </motion.button>
                    );
                  })}
                  {!sudahJawab && (
                    <TapButton
                      fullWidth
                      onClick={() => cekPGK(soal)}
                      disabled={pgkPilih.length === 0}
                    >
                      <Flag className="w-4 h-4" /> Kunci Jawaban ({pgkPilih.length} dipilih)
                    </TapButton>
                  )}
                </div>
              )}

              {/* 3. ISIAN SINGKAT */}
              {soal.tipe === "isian" && (
                <div className="pt-1 space-y-2.5">
                  {!sudahJawab ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        cekIsian(soal);
                      }}
                      className="space-y-2.5"
                    >
                      <input
                        value={isianVal}
                        onChange={(e) => setIsianVal(e.target.value)}
                        placeholder="Ketik jawaban singkatmu di sini..."
                        className="w-full h-12 px-3.5 rounded-xl text-sm font-medium outline-none border-2 bg-white border-slate-300 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <TapButton
                        type="submit"
                        fullWidth
                        disabled={!isianVal.trim()}
                      >
                        <Flag className="w-4 h-4" /> Periksa Jawaban
                      </TapButton>
                    </form>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm">
                      Jawabanmu: <b className="text-slate-900 dark:text-white">{String(jawab[soal.id])}</b>
                    </div>
                  )}
                </div>
              )}

              {/* 4. URAIAN (2 Langkah Evaluasi Jujur) */}
              {soal.tipe === "uraian" && (
                <div className="pt-1 space-y-2.5">
                  {!sudahJawab ? (
                    <>
                      <textarea
                        value={uraianVal}
                        onChange={(e) => setUraianVal(e.target.value)}
                        rows={3}
                        disabled={uraianRevealed}
                        placeholder="Tulis jawaban uraianmu secara lengkap (minimal 1 kalimat)..."
                        className="w-full p-3 rounded-xl text-sm outline-none border-2 bg-white border-slate-300 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white disabled:opacity-75"
                      />
                      {!uraianRevealed ? (
                        <TapButton
                          fullWidth
                          onClick={() => {
                            if (uraianVal.trim().length >= 10) {
                              bunyi("klik");
                              setUraianRevealed(true);
                            }
                          }}
                          disabled={uraianVal.trim().length < 10}
                        >
                          <Lightbulb className="w-4 h-4" /> Buka Kunci & Bandingkan Jawaban
                        </TapButton>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 space-y-2.5"
                        >
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Kunci Jawaban Resmi Modul:
                          </p>
                          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100 font-medium">
                            {kunciTeks(soal)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Cocokkan dengan jawabanmu di atas secara jujur. Apakah poin utamanya sudah sesuai?
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <TapButton
                              variant="outline"
                              onClick={() => catat(soal, uraianVal.trim(), false)}
                            >
                              <XCircle className="w-4 h-4 text-rose-500" /> Belum Lengkap
                            </TapButton>
                            <TapButton
                              onClick={() => catat(soal, uraianVal.trim(), true)}
                            >
                              <CheckCircle2 className="w-4 h-4" /> Sudah Sesuai!
                            </TapButton>
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm">
                      Jawaban uraianmu: <i className="text-slate-800 dark:text-slate-200">"{String(jawab[soal.id])}"</i>
                    </div>
                  )}
                </div>
              )}

              {/* Pembahasan Langsung */}
              {sudahJawab && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 p-3.5 rounded-xl text-sm border ${
                    benarMap[soal.id]
                      ? "bg-emerald-500/10 border-emerald-500/30 text-slate-800 dark:text-slate-100"
                      : "bg-amber-500/10 border-amber-500/30 text-slate-800 dark:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {benarMap[soal.id] ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Tepat sekali! +10 XP
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-amber-700 dark:text-amber-300">
                          Belum tepat, yuk simak pembahasannya!
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <Lightbulb className="inline w-3.5 h-3.5 mr-1 text-amber-500" />
                    Kunci Jawaban: <b>{kunciTeks(soal)}</b>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {soal.pembahasan}
                  </p>
                </motion.div>
              )}
            </LivingCard>
          </motion.div>
        </AnimatePresence>

        {/* Navigasi Soal Sebelumnya / Berikutnya */}
        <div className="grid grid-cols-2 gap-2 pb-4">
          <TapButton variant="outline" onClick={prev} disabled={idx === 0}>
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </TapButton>
          <TapButton onClick={next}>
            <span>{idx >= total - 1 ? "Selesai & Lihat Hasil" : "Soal Berikutnya"}</span>
            <ChevronRight className="w-4 h-4" />
          </TapButton>
        </div>
      </main>

      <MobileBottomNav
        items={NAV_ITEMS}
        activeId={showGrid ? "peta" : "beranda"}
        onChange={(id) => {
          bunyi("klik");
          if (id === "beranda") onKeluar();
          else if (id === "materi") onMateri();
          else if (id === "peta") setShowGrid((g) => !g);
          else if (id === "ulang") setConfirmRestartOpen(true);
        }}
      />

      <ConfirmSheet
        open={confirmRestartOpen}
        title="Ulangi Latihan Bab Ini dari Nomor 1?"
        message={`Progres jawabanmu saat ini (${jmlTerjawab}/${total} soal) di Bab ${bab} akan direset kembali ke Soal 1.`}
        confirmLabel="Ya, Ulang dari 1"
        danger
        onConfirm={handleRestart}
        onClose={() => setConfirmRestartOpen(false)}
      />
    </MobileContainer>
  );
};
