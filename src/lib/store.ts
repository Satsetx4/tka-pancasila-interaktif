import { useEffect, useState } from "react";

/* ============ Tipe soal Pancasila SD (6 tipe) ============ */

export type QType = "pg" | "pgk" | "isian" | "jodoh" | "bs" | "uraian";

export interface Soal {
  id: string;
  bab: number;
  tipe: QType;
  stimulus?: string;
  tanya: string;
  opsi?: string[];
  kunci: string | string[];
  pembahasan: string;
}

export interface MateriKartu {
  topik?: string;
  judul: string;
  isi: string;
  poin?: string[];
  kataKunci?: string[];
}

export interface MateriBab {
  bab: number;
  judul: string;
  subjudul?: string;
  kartu: MateriKartu[];
}

/* ============ Meta 7 Bab (Bebas Emoji Mentah) ============ */

export interface BabMeta {
  id: number;
  judul: string;
  pendek: string;
  maskot: string;
  peran: string;
  badge: string;
  warna: "emerald" | "amber" | "sky" | "violet" | "rose" | "cyan" | "lime";
  dot: string;
}

export const BABS: BabMeta[] = [
  {
    id: 1,
    judul: "Belajar Pancasila dengan Menyenangkan",
    pendek: "Hubungan nilai sila & praktik sehari-hari",
    maskot: "Bonar",
    peran: "Ketua Kelompok",
    badge: "Pahlawan Persatuan",
    warna: "emerald",
    dot: "bg-emerald-500",
  },
  {
    id: 2,
    judul: "Mengamalkan Pancasila untuk Kebahagiaan Bersama",
    pendek: "Dasar negara, pandangan hidup & karya",
    maskot: "Memey",
    peran: "Penggerak Kebaikan",
    badge: "Bintang Kebaikan",
    warna: "amber",
    dot: "bg-amber-500",
  },
  {
    id: 3,
    judul: "Mengenal Norma, Hak, dan Kewajiban",
    pendek: "4 Norma, 10 Hak Anak (KHA) & Jujur",
    maskot: "Pigey",
    peran: "Teladan Kejujuran",
    badge: "Ksatria Jujur",
    warna: "sky",
    dot: "bg-sky-500",
  },
  {
    id: 4,
    judul: "Belajar Bermusyawarah",
    pendek: "Mufakat, data lapangan & kepala dingin",
    maskot: "Sedi",
    peran: "Sahabat Mufakat",
    badge: "Juru Runding",
    warna: "violet",
    dot: "bg-violet-500",
  },
  {
    id: 5,
    judul: "Menghormati Perbedaan Budaya dan Agama",
    pendek: "Toleransi, Pasal 28E & Pasar Tanah Kongsi",
    maskot: "Indi",
    peran: "Sahabat Budaya",
    badge: "Duta Toleransi",
    warna: "rose",
    dot: "bg-rose-500",
  },
  {
    id: 6,
    judul: "Provinsiku Bagian dari Wilayah NKRI",
    pendek: "38 Provinsi, otonomi khusus & Porsenitas",
    maskot: "Manda",
    peran: "Duta Nusantara",
    badge: "Penjelajah Nusantara",
    warna: "cyan",
    dot: "bg-cyan-500",
  },
  {
    id: 7,
    judul: "Menjaga Persatuan dengan Gotong Royong",
    pendek: "Bela negara, 3 dimensi & tradisi daerah",
    maskot: "Anisa",
    peran: "Inspirasi Semangat",
    badge: "Pahlawan Gotong Royong",
    warna: "lime",
    dot: "bg-lime-500",
  },
];

export const badgeOf = (bab: number) => BABS.find((b) => b.id === bab)?.badge ?? "Lencana";
export const maskotOf = (bab: number) => BABS.find((b) => b.id === bab)?.maskot ?? "Sahabat";

/* ============ Storage lokal (defensive try/catch) ============ */

const K_PROFILE = "tka-pancasila:profile:v1";
const K_PROGRESS = "tka-pancasila:progress:v1";
const K_THEME = "tka-pancasila:theme:v1";
const K_MUTE = "tka-pancasila:mute:v1";
const K_SESSIONS = "tka-pancasila:sessions:v1";
const K_MATERI_READ = "tka-pancasila:materi-read:v1";
const K_NAV_STATE = "tka-pancasila:nav-state:v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Safari private / storage full fallback */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export interface BabResult {
  benar: number;
  total: number;
  tanggal: string;
  perTipe?: Record<QType, { benar: number; total: number }>;
}

export interface Progress {
  xp: number;
  selesai: Record<number, BabResult>;
  badge: number[];
  streakTerbaik: number;
}

export interface QuizSession {
  bab: number;
  idx: number;
  jawab: Record<string, string | string[]>;
  benarMap: Record<string, boolean>;
  streak: number;
  streakMax: number;
  xp: number;
  updatedAt: string;
}

export type PersistedScreen =
  | { name: "home"; tab?: "beranda" | "materi" | "rapor" | "profil" }
  | { name: "materi"; bab: number }
  | { name: "latihan"; bab: number }
  | { name: "hasil"; bab: number; benar: number; total: number; streak: number };

const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  selesai: {},
  badge: [],
  streakTerbaik: 0,
};

export const store = {
  profile: {
    load(): { name: string; kelas?: string; sekolah?: string } {
      return read(K_PROFILE, { name: "", kelas: "VI (Enam)", sekolah: "" });
    },
    save(p: { name: string; kelas?: string; sekolah?: string }) {
      write(K_PROFILE, p);
    },
  },
  progress: {
    load(): Progress {
      return read<Progress>(K_PROGRESS, { ...DEFAULT_PROGRESS, selesai: {}, badge: [] });
    },
    save(p: Progress) {
      write(K_PROGRESS, p);
    },
    finishBab(
      bab: number,
      benar: number,
      total: number,
      streak: number,
      perTipe?: Record<QType, { benar: number; total: number }>
    ) {
      const p = store.progress.load();
      const prev = p.selesai[bab];
      const bestBenar = prev ? Math.max(prev.benar, benar) : benar;
      const selisihBenar = prev ? Math.max(0, benar - prev.benar) : benar;
      p.selesai[bab] = {
        benar: bestBenar,
        total,
        tanggal: new Date().toISOString(),
        perTipe: perTipe ?? prev?.perTipe,
      };
      if (!p.badge.includes(bab) && total > 0 && bestBenar / total >= 0.6) {
        p.badge.push(bab);
      }
      p.streakTerbaik = Math.max(p.streakTerbaik, streak);
      // Tambahkan XP penuh di percobaan pertama, atau selisih perbaikan nilai + bonus latihan ulang
      p.xp += prev ? selisihBenar * 10 + Math.round(benar * 2) : benar * 10;
      store.progress.save(p);
      return p;
    },
  },
  session: {
    loadAll(): Record<number, QuizSession> {
      return read<Record<number, QuizSession>>(K_SESSIONS, {});
    },
    load(bab: number): QuizSession | null {
      const all = store.session.loadAll();
      return all[bab] ?? null;
    },
    save(bab: number, s: QuizSession) {
      const all = store.session.loadAll();
      all[bab] = s;
      write(K_SESSIONS, all);
    },
    clear(bab: number) {
      const all = store.session.loadAll();
      delete all[bab];
      write(K_SESSIONS, all);
    },
  },
  materiRead: {
    load(): Record<number, number[]> {
      return read<Record<number, number[]>>(K_MATERI_READ, {});
    },
    mark(bab: number, cardIdx: number) {
      const all = store.materiRead.load();
      const list = all[bab] ?? [];
      if (!list.includes(cardIdx)) {
        all[bab] = [...list, cardIdx];
        write(K_MATERI_READ, all);
      }
      return all;
    },
  },
  nav: {
    load(): PersistedScreen {
      return read<PersistedScreen>(K_NAV_STATE, { name: "home", tab: "beranda" });
    },
    save(s: PersistedScreen) {
      write(K_NAV_STATE, s);
    },
  },
  theme: {
    load(): "dark" | "light" {
      const t = read<string>(K_THEME, "dark");
      return t === "light" ? "light" : "dark";
    },
    save(t: "dark" | "light") {
      write(K_THEME, t);
    },
  },
  mute: {
    load(): boolean {
      return read<boolean>(K_MUTE, false);
    },
    save(m: boolean) {
      write(K_MUTE, m);
    },
  },
  resetAll() {
    remove(K_PROFILE);
    remove(K_PROGRESS);
    remove(K_SESSIONS);
    remove(K_MATERI_READ);
    write(K_NAV_STATE, { name: "home", tab: "beranda" });
  },
};

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => store.theme.load());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0b0f17" : "#f1f5f9");
    store.theme.save(theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<"dark" | "light">).detail;
      if (detail) setTheme(detail);
    };
    window.addEventListener("tka-theme-change", handler);
    return () => window.removeEventListener("tka-theme-change", handler);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.dispatchEvent(new CustomEvent("tka-theme-change", { detail: next }));
  };

  return { theme, toggle };
}

/* ============ Efek Suara WebAudio Sintetis ============ */

let audioCtx: AudioContext | null = null;
export function bunyi(jenis: "benar" | "salah" | "badge" | "klik") {
  if (store.mute.load()) return;
  try {
    if (typeof window === "undefined") return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx ?? new AC();
    const ctx = audioCtx;
    const main = (freq: number, t0: number, dur = 0.14) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.11, ctx.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t0 + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + t0);
      o.stop(ctx.currentTime + t0 + dur);
    };
    if (jenis === "benar") {
      main(660, 0);
      main(880, 0.08);
    } else if (jenis === "salah") {
      main(240, 0, 0.22);
    } else if (jenis === "badge") {
      main(523, 0);
      main(659, 0.09);
      main(784, 0.18, 0.24);
    } else {
      main(520, 0, 0.06);
    }
  } catch {
    /* abaikan */
  }
}

/* ============ Normalisasi & Penilaian Cerdas ============ */

export function norm(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[()[\]{}"'“”‘’,;!?/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.…_]+$/g, "")
    .trim();
}

const ISIAN_SYNONYMS: Record<string, string[]> = {
  "b1-16": ["mohammad hatta", "moh hatta", "bung hatta", "drs mohammad hatta", "hatta"],
  "b1-17": ["ringan sama dijinjing"],
  "b1-18": ["adab", "sopan santun", "akhlak terpuji", "adab dan sopan santun"],
  "b1-19": ["ekoenzim", "eko enzim", "pembuatan ekoenzim"],
  "b1-20": ["nasihat", "nasehat", "pesan"],
  "b2-16": ["keempat", "ke 4", "4", "empat", "alinea keempat", "alinea 4"],
  "b2-17": ["ppki", "sidang ppki", "panitia persiapan kemerdekaan indonesia"],
  "b2-18": ["kedua", "ke 2", "2", "dua", "sila kedua", "sila ke 2", "kemanusiaan yang adil dan beradab"],
  "b2-19": ["keempat", "ke 4", "4", "empat", "sila keempat", "sila ke 4"],
  "b2-20": ["cerita pendek", "cerpen"],
  "b3-16": ["agama", "norma agama"],
  "b3-17": ["kesusilaan", "norma kesusilaan", "susila"],
  "b3-18": ["konvensi hak anak", "kha", "konvensi hak anak kha"],
  "b3-19": ["teman", "sesama teman"],
  "b3-20": ["kewajiban"],
  "b4-16": ["keempat", "ke 4", "4", "empat", "sila keempat", "sila ke 4"],
  "b4-17": ["pemungutan suara", "voting", "pemungutan suara voting", "suara terbanyak"],
  "b4-18": ["mohammad hatta", "moh hatta", "bung hatta", "hatta"],
  "b4-19": ["pemimpin rapat", "ketua rapat", "ketua rt", "kepala desa", "pimpinan rapat"],
  "b4-20": ["tanggung jawab", "bertanggung jawab"],
  "b5-16": ["28e ayat 1", "pasal 28e ayat 1", "28e", "pasal 28e"],
  "b5-17": ["stereotipe", "stereotip", "prasangka negatif"],
  "b5-18": ["tanah kongsi", "pasar tanah kongsi"],
  "b5-19": ["honai", "rumah honai"],
  "b5-20": ["pendet", "tari pendet"],
  "b6-16": ["18", "pasal 18", "delapan belas"],
  "b6-17": ["4", "empat", "4 orang", "empat orang"],
  "b6-18": ["majelis rakyat papua", "mrp", "majelis rakyat papua mrp"],
  "b6-19": ["porsenitas", "pekan olahraga dan seni wilayah perbatasan"],
  "b6-20": ["medan", "kota medan"],
  "b7-16": ["27", "pasal 27", "dua puluh tujuh"],
  "b7-17": ["sambatan"],
  "b7-18": ["besiru"],
  "b7-19": ["ketiga", "ke 3", "3", "tiga", "sila ketiga", "sila ke 3", "persatuan indonesia"],
  "b7-20": ["ikhlas", "tanpa pamrih", "tulus ikhlas", "rela berkorban"],
};

export function nilaiSoal(soal: Soal, jawab: string | string[] | null): boolean {
  if (jawab == null) return false;
  if (soal.tipe === "pg" || soal.tipe === "jodoh" || soal.tipe === "bs") {
    const k = Array.isArray(soal.kunci) ? soal.kunci[0] : soal.kunci;
    return norm(String(jawab)) === norm(String(k));
  }
  if (soal.tipe === "pgk") {
    const kunci = (Array.isArray(soal.kunci) ? soal.kunci : [soal.kunci]).map(norm).sort();
    const j = (Array.isArray(jawab) ? jawab : [jawab]).map(norm).sort();
    return JSON.stringify(kunci) === JSON.stringify(j);
  }
  if (soal.tipe === "isian") {
    const j = norm(String(jawab));
    if (!j) return false;
    const k = norm(Array.isArray(soal.kunci) ? soal.kunci[0] : soal.kunci);
    if (j === k) return true;
    const accepted = ISIAN_SYNONYMS[soal.id] ?? [];
    if (accepted.some((syn) => j === syn || j.includes(syn))) return true;
    const kata = k.split(" ").filter((w) => w.length >= 4);
    return kata.length > 0 && kata.every((w) => j.includes(w));
  }
  if (soal.tipe === "uraian") {
    return String(jawab).trim().length >= 10;
  }
  return false;
}

export function labelTipeSoal(tipe: QType): { kode: string; nama: string; petunjuk: string } {
  switch (tipe) {
    case "pg":
      return { kode: "I. Pilihan Ganda", nama: "Pilihan Ganda", petunjuk: "Pilih 1 jawaban paling tepat" };
    case "pgk":
      return { kode: "II. PG Kompleks", nama: "Pilihan Ganda Kompleks", petunjuk: "Pilih lebih dari 1 jawaban benar" };
    case "isian":
      return { kode: "III. Isian Singkat", nama: "Isian Singkat", petunjuk: "Ketik jawaban singkat & tepat" };
    case "jodoh":
      return { kode: "IV. Menjodohkan", nama: "Menjodohkan", petunjuk: "Pasangkan pernyataan dengan pasangan yang tepat" };
    case "bs":
      return { kode: "V. Benar / Salah", nama: "Benar atau Salah", petunjuk: "Tentukan pernyataan Benar atau Salah" };
    case "uraian":
      return { kode: "VI. Uraian", nama: "Uraian Mandiri", petunjuk: "Tulis jawaban lengkap lalu cocokkan dengan kunci" };
  }
}

export function hurufKeIndex(h: string) {
  return "ABCDE".indexOf(h.toUpperCase());
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function scoreOf(b: number, t: number) {
  return t <= 0 ? 0 : Math.round((b / t) * 100);
}
