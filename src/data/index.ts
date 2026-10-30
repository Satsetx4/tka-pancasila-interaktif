import type { MateriBab, Soal } from "../lib/store";
import b1 from "./bab1.json";
import b2 from "./bab2.json";
import b3 from "./bab3.json";
import b4 from "./bab4.json";
import b5 from "./bab5.json";
import b6 from "./bab6.json";
import b7 from "./bab7.json";
import materi from "./materi.json";

export const SOAL_PER_BAB: Record<number, Soal[]> = {
  1: b1 as Soal[], 2: b2 as Soal[], 3: b3 as Soal[],
  4: b4 as Soal[], 5: b5 as Soal[], 6: b6 as Soal[], 7: b7 as Soal[],
};

export const MATERI = materi as MateriBab[];
export const totalSoal = () => Object.values(SOAL_PER_BAB).reduce((n, arr) => n + arr.length, 0);
