import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag, Lightbulb, PartyPopper } from "lucide-react";
import { MobileContainer } from "../components/layout/MobileContainer";
import { AppHeader } from "../components/navigation/AppHeader";
import { LivingCard } from "../components/ui/LivingCard";
import { TapButton } from "../components/ui/TapButton";
import { BABS, nilaiSoal, hurufKeIndex, bunyi, norm, type Soal } from "../lib/store";
import { SOAL_PER_BAB } from "../data";

interface Props { bab: number; onKeluar: () => void; onSelesai: (benar: number, total: number, streakTerbaik: number) => void; }
const HURUF = ["A", "B", "C", "D", "E"];

function Confetti() {
  const parts = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: (i * 37) % 300 - 150, delay: (i % 6) * 0.04, emoji: ["🎉", "⭐", "✨", "🎊"][i % 4],
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {parts.map((p, i) => (
        <motion.span key={i} initial={{ y: -20, x: p.x, opacity: 1, scale: 1 }}
          animate={{ y: 320, opacity: 0, scale: 0.6, rotate: 180 }}
          transition={{ duration: 1.1, delay: p.delay }}
          className="absolute left-1/2 top-6 text-xl">{p.emoji}</motion.span>
      ))}
    </div>
  );
}

export const LatihanScreen: React.FC<Props> = ({ bab, onKeluar, onSelesai }) => {
  const meta = BABS.find((b) => b.id === bab);
  const soalList = useMemo(() => SOAL_PER_BAB[bab] ?? [], [bab]);
  const total = soalList.length;
  const [idx, setIdx] = useState(0);
  const [jawab, setJawab] = useState<Record<string, string | string[]>>({});
  const [benarMap, setBenarMap] = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);
  const [streakMax, setStreakMax] = useState(0);
  const [xp, setXp] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pgkPilih, setPgkPilih] = useState<string[]>([]);
  const [isianVal, setIsianVal] = useState("");
  const [uraianVal, setUraianVal] = useState("");

  const soal: Soal | undefined = soalList[idx];
  const sudahJawab = soal ? soal.id in benarMap : false;
  const benar = soal ? Object.values(benarMap).filter(Boolean).length : 0;

  const catat = (s: Soal, j: string | string[], ok: boolean) => {
    setJawab((p) => ({ ...p, [s.id]: j }));
    setBenarMap((p) => ({ ...p, [s.id]: ok }));
    if (ok) {
      const ns = streak + 1;
      setStreak(ns); setStreakMax((m) => Math.max(m, ns));
      const bonus = ns >= 3 ? 5 : 0;
      setXp((x) => x + 10 + bonus);
      bunyi("benar");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
      if (ns === 3) bunyi("badge");
    } else { setStreak(0); bunyi("salah"); }
  };

  const pilihPG = (s: Soal, huruf: string) => {
    if (s.id in benarMap) return;
    catat(s, huruf, nilaiSoal(s, huruf));
  };

  const cekPGK = (s: Soal) => {
    if (s.id in benarMap || pgkPilih.length === 0) return;
    catat(s, [...pgkPilih].sort(), nilaiSoal(s, [...pgkPilih].sort()));
  };

  const cekIsian = (s: Soal) => {
    if (s.id in benarMap || !isianVal.trim()) return;
    catat(s, isianVal.trim(), nilaiSoal(s, isianVal.trim()));
  };

  const next = () => {
    setPgkPilih([]); setIsianVal(""); setUraianVal("");
    if (idx >= total - 1) onSelesai(benar, total, streakMax);
    else setIdx((i) => i + 1);
  };
  const prev = () => { setPgkPilih([]); setIsianVal(""); setUraianVal(""); setIdx((i) => Math.max(0, i - 1)); };

  // sinkron input saat pindah soal yang sudah dijawab
  const jmlTerjawab = Object.keys(benarMap).length;

  if (!soal) return <MobileContainer><p className="p-6">Soal Bab {bab} belum ada.</p></MobileContainer>;

  const kunciTeks = (s: Soal) => Array.isArray(s.kunci) ? s.kunci.join(", ") : s.kunci;

  return (
    <MobileContainer>
      <AppHeader title={`Bab ${bab} • Main`} subtitle={meta?.judul ?? ""} />
      <main className="flex-1 p-4 space-y-3 relative">
        {showConfetti && <Confetti />}
        {/* progress */}
        <LivingCard>
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>SOAL {idx + 1}/{total} • ⭐ {xp} XP • 🔥 {streak}</span>
            <span>✅ {benar} benar</span>
          </div>
          <div className="mt-2 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400"
              animate={{ width: `${((idx + 1) / total) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 26 }} />
          </div>
          <p className="text-[11px] mt-1.5 text-slate-500">Terjawab: {jmlTerjawab}/{total} • Tipe: {soal.tipe.toUpperCase()}</p>
        </LivingCard>

        <AnimatePresence mode="wait">
          <motion.div key={soal.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }}>
            <LivingCard variant="glow">
              <p className="text-[11px] font-bold text-slate-500">{soal.id.toUpperCase()} • {maskotFor(soal.tipe)}</p>
              <h3 className="text-[17px] font-semibold leading-relaxed mt-1 text-slate-900 dark:text-white whitespace-pre-line">{soal.tanya}</h3>

              {/* PG & JODOH & BS pakai tombol huruf */}
              {(soal.tipe === "pg" || soal.tipe === "jodoh" || soal.tipe === "bs") && (
                <div className="mt-3 space-y-2">
                  {(soal.opsi ?? (soal.tipe === "bs" ? ["Benar", "Salah"] : [])).map((op, i) => {
                    const huruf = HURUF[i];
                    const kunci = Array.isArray(soal.kunci) ? soal.kunci[0] : soal.kunci;
                    const isKunci = norm(huruf) === norm(String(kunci)) || norm(op) === norm(String(kunci));
                    const dipilih = jawab[soal.id] === huruf;
                    let cls = "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60";
                    if (sudahJawab) {
                      if (isKunci) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40";
                      else if (dipilih) cls = "border-rose-500 bg-rose-50 dark:bg-rose-950/40";
                    }
                    return (
                      <button key={i} disabled={sudahJawab} onClick={() => pilihPG(soal, huruf)}
                        className={`w-full text-left p-3 rounded-xl border-2 text-[15px] leading-relaxed font-medium transition-all flex items-start gap-2 ${cls} disabled:cursor-default`}>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold shrink-0 mt-0.5">{soal.tipe === "bs" ? (i === 0 ? "B" : "S") : huruf}</span>
                        {op}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PG KOMPLEKS */}
              {soal.tipe === "pgk" && (
                <div className="mt-3 space-y-2">
                  {(soal.opsi ?? []).map((op, i) => {
                    const huruf = HURUF[i];
                    const on = pgkPilih.includes(huruf);
                    const kunciArr = (Array.isArray(soal.kunci) ? soal.kunci : [soal.kunci]).map((k) => norm(String(k)));
                    const isKunci = kunciArr.includes(norm(huruf));
                    let cls = on ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40" : "border-slate-300 dark:border-slate-700";
                    if (sudahJawab) {
                      if (isKunci) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40";
                      else if (on) cls = "border-rose-500 bg-rose-50 dark:bg-rose-950/40";
                    }
                    return (
                      <button key={i} disabled={sudahJawab}
                        onClick={() => setPgkPilih((p) => (p.includes(huruf) ? p.filter((x) => x !== huruf) : [...p, huruf]))}
                        className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${cls}`}>
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold mr-2 ${on ? "bg-sky-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>{on ? "✓" : huruf}</span>
                        {op}
                      </button>
                    );
                  })}
                  {!sudahJawab && (
                    <TapButton fullWidth onClick={() => cekPGK(soal)} disabled={pgkPilih.length === 0}>
                      <Flag className="w-4 h-4" /> Cek jawaban ({pgkPilih.length} dipilih)
                    </TapButton>
                  )}
                </div>
              )}

              {/* ISIAN */}
              {soal.tipe === "isian" && (
                <div className="mt-3 space-y-2">
                  {!sudahJawab ? (
                    <>
                      <input value={isianVal} onChange={(e) => setIsianVal(e.target.value)}
                        placeholder="Ketik jawabanmu di sini..."
                        className="w-full h-12 px-3.5 rounded-xl text-[15px] outline-none border-2 bg-white border-slate-300 focus:border-sky-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <TapButton fullWidth onClick={() => cekIsian(soal)} disabled={!isianVal.trim()}>
                        <Flag className="w-4 h-4" /> Cek jawaban
                      </TapButton>
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                      Jawabanmu: <b>{String(jawab[soal.id])}</b>
                    </div>
                  )}
                </div>
              )}

              {/* URAIAN */}
              {soal.tipe === "uraian" && (
                <div className="mt-3 space-y-2">
                  {!sudahJawab ? (
                    <>
                      <textarea value={uraianVal} onChange={(e) => setUraianVal(e.target.value)} rows={3}
                        placeholder="Tulis jawabanmu minimal 1 kalimat..."
                        className="w-full p-3 rounded-xl text-[15px] outline-none border-2 bg-white border-slate-300 focus:border-violet-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <TapButton fullWidth onClick={() => { if (uraianVal.trim().length >= 10) catat(soal, uraianVal.trim(), true); }} disabled={uraianVal.trim().length < 10}>
                        <PartyPopper className="w-4 h-4" /> Saya sudah menulis (≥10 huruf)
                      </TapButton>
                      <p className="text-[11px] text-slate-500">Tulis dulu, lalu cocokkan dengan contoh jawaban. Nilai jujur ya! 🤗</p>
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                      Tulisanmu: <i>{String(jawab[soal.id]).slice(0, 200)}</i>
                    </div>
                  )}
                </div>
              )}

              {/* Pembahasan langsung */}
              {sudahJawab && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 p-3 rounded-xl text-sm ${benarMap[soal.id] ? "bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800" : "bg-amber-50 border border-amber-300 dark:bg-amber-950/30 dark:border-amber-800"}`}>
                  <p className="font-bold">{benarMap[soal.id] ? "🎉 Betul! +10 XP" : "💪 Belum tepat, tidak apa-apa!"}</p>
                  <p className="mt-1"><Lightbulb className="inline w-4 h-4" /> Kunci: <b>{kunciTeks(soal)}</b></p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{soal.pembahasan}</p>
                </motion.div>
              )}
            </LivingCard>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2 pb-4">
          <TapButton variant="outline" onClick={prev} disabled={idx === 0}><ChevronLeft className="w-4 h-4" /> Sebelumnya</TapButton>
          <TapButton onClick={next}>{idx >= total - 1 ? "Lihat hasil 🏁" : "Berikutnya"} <ChevronRight className="w-4 h-4" /></TapButton>
        </div>
        <TapButton variant="ghost" fullWidth onClick={onKeluar}>Keluar ke beranda</TapButton>
      </main>
    </MobileContainer>
  );
};

function maskotFor(tipe: string) {
  switch (tipe) {
    case "pg": return "Pilih 1 jawaban";
    case "pgk": return "Boleh pilih lebih dari 1";
    case "isian": return "Ketik jawaban singkat";
    case "jodoh": return "Pasangkan yang tepat";
    case "bs": return "Benar atau Salah?";
    default: return "Tulis dengan kalimatmu";
  }
}

// pakai hurufKeIndex agar tidak unused (validasi kunci huruf)
void hurufKeIndex;
