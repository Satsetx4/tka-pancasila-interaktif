import { useEffect, useState } from "react";

/* ============ Tipe soal Pancasila SD (6 tipe) ============ */

export type QType = "pg" | "pgk" | "isian" | "jodoh" | "bs" | "uraian";

export interface Soal {
  id: string;
  bab: number;
  tipe: QType;
  tanya: string;
  opsi?: string[];
  kunci: string | string[];
  pembahasan: string;
}

export interface MateriKartu { judul: string; isi: string }
export interface MateriBab { bab: number; judul: string; kartu: MateriKartu[] }

/* ============ Meta 7 Bab ============ */

export interface BabMeta {
  id: number;
  judul: string;
  pendek: string;
  maskot: string;
  badge: string;
  warna: string;
  dot: string;
}

export const BABS: BabMeta[] = [
  { id: 1, judul: "Belajar Pancasila dengan Menyenangkan", pendek: "Satu kesatuan sila", maskot: "🦁 Bonar", badge: "Pahlawan Persatuan", warna: "emerald", dot: "bg-emerald-500" },
  { id: 2, judul: "Mengamalkan Pancasila untuk Bahagia Bersama", pendek: "Pandangan hidup", maskot: "🐰 Memey", badge: "Bintang Kebaikan", warna: "amber", dot: "bg-amber-500" },
  { id: 3, judul: "Norma, Hak & Kewajiban", pendek: "Aturan main bareng", maskot: "🐧 Pigey", badge: "Ksatria Jujur", warna: "sky", dot: "bg-sky-500" },
  { id: 4, judul: "Belajar Bermusyawarah", pendek: "Mufakat bareng", maskot: "🐨 Sedi", badge: "Juru Runding", warna: "violet", dot: "bg-violet-500" },
  { id: 5, judul: "Menghormati Budaya & Agama", pendek: "Beda itu indah", maskot: "🦊 Indi", badge: "Duta Toleransi", warna: "rose", dot: "bg-rose-500" },
  { id: 6, judul: "Provinsiku Bagian NKRI", pendek: "38 provinsi", maskot: "🐢 Manda", badge: "Penjelajah Nusantara", warna: "cyan", dot: "bg-cyan-500" },
  { id: 7, judul: "Gotong Royong Persatuan", pendek: "Kerja bareng", maskot: "🐝 Anisa", badge: "Pahlawan Gotong Royong", warna: "lime", dot: "bg-lime-500" },
];

export const badgeOf = (bab: number) => BABS.find((b) => b.id === bab)?.badge ?? "Badge";
export const maskotOf = (bab: number) => BABS.find((b) => b.id === bab)?.maskot ?? "🎉";

/* ============ Storage lokal (tanpa login) ============ */

const K_PROFILE = "tka-pancasila:profile:v1";
const K_PROGRESS = "tka-pancasila:progress:v1";
const K_THEME = "tka-pancasila:theme:v1";
const K_MUTE = "tka-pancasila:mute:v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* HP penuh/privat: tetap jalan */ }
}

export interface Progress {
  xp: number;
  selesai: Record<number, { benar: number; total: number; tanggal: string }>;
  badge: number[];
  streakTerbaik: number;
}

export const store = {
  profile: {
    load(): { name: string } { return read(K_PROFILE, { name: "" }); },
    save(p: { name: string }) { write(K_PROFILE, p); },
  },
  progress: {
    load(): Progress { return read<Progress>(K_PROGRESS, { xp: 0, selesai: {}, badge: [], streakTerbaik: 0 }); },
    save(p: Progress) { write(K_PROGRESS, p); },
    addXP(n: number) {
      const p = store.progress.load();
      p.xp += n;
      store.progress.save(p);
      return p.xp;
    },
    finishBab(bab: number, benar: number, total: number, streak: number) {
      const p = store.progress.load();
      p.selesai[bab] = { benar, total, tanggal: new Date().toISOString() };
      if (!p.badge.includes(bab) && total > 0 && benar / total >= 0.6) p.badge.push(bab);
      p.streakTerbaik = Math.max(p.streakTerbaik, streak);
      p.xp += benar * 10;
      store.progress.save(p);
      return p;
    },
  },
  theme: {
    load(): "dark" | "light" {
      const t = read<string>(K_THEME, "dark");
      return t === "light" ? "light" : "dark";
    },
    save(t: "dark" | "light") { write(K_THEME, t); },
  },
  mute: {
    load(): boolean { return read<boolean>(K_MUTE, false); },
    save(m: boolean) { write(K_MUTE, m); },
  },
};

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0b0f17" : "#f1f5f9");
    store.theme.save(theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

/* ============ Suara meriah tanpa file (WebAudio beep) ============ */

let audioCtx: AudioContext | null = null;
export function bunyi(jenis: "benar" | "salah" | "badge" | "klik") {
  if (store.mute.load()) return;
  try {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx ?? new AC();
    const ctx = audioCtx;
    const main = (freq: number, t0: number, dur = 0.15) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.12, ctx.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur);
    };
    if (jenis === "benar") { main(660, 0); main(880, 0.09); }
    else if (jenis === "salah") { main(220, 0, 0.25); }
    else if (jenis === "badge") { main(523, 0); main(659, 0.1); main(784, 0.2, 0.25); }
    else { main(500, 0, 0.07); }
  } catch { /* abaikan */ }
}

/* ============ Penilaian ============ */

export function norm(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.…_]+$/g, "");
}

export function nilaiSoal(soal: Soal, jawab: string | string[] | null): boolean {
  if (jawab == null) return false;
  if (soal.tipe === "pg" || soal.tipe === "jodoh" || soal.tipe === "bs") {
    const k = Array.isArray(soal.kunci) ? soal.kunci[0] : soal.kunci;
    return norm(String(jawab as string)) === norm(String(k));
  }
  if (soal.tipe === "pgk") {
    const kunci = (Array.isArray(soal.kunci) ? soal.kunci : [soal.kunci]).map(norm).sort();
    const j = (Array.isArray(jawab) ? jawab : [jawab]).map(norm).sort();
    return JSON.stringify(kunci) === JSON.stringify(j);
  }
  if (soal.tipe === "isian") {
    const k = norm(Array.isArray(soal.kunci) ? soal.kunci[0] : soal.kunci);
    const j = norm(String(jawab));
    if (!j) return false;
    if (j === k) return true;
    // toleransi: mengandung kata kunci utama (>4 huruf)
    const kata = k.split(" ").filter((w) => w.length > 4);
    return kata.length > 0 && kata.some((w) => j.includes(w));
  }
  // uraian: nilai mandiri — anggap benar jika isi > 10 karakter (anak menilai sendiri dengan contoh)
  if (soal.tipe === "uraian") return String(jawab).trim().length >= 10;
  return false;
}

export function hurufKeIndex(h: string) { return "ABCDE".indexOf(h.toUpperCase()); }

export function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
export function scoreOf(b: number, t: number) { return t <= 0 ? 0 : Math.round((b / t) * 100); }
