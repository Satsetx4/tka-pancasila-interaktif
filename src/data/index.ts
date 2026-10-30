import { store, type MateriBab, type Soal } from "../lib/store";
import b1 from "./bab1.json";
import materi from "./materi.json";

export const SOAL_PER_BAB: Record<number, Soal[]> = {
  1: b1 as Soal[],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
};

export function syncUnlockedSoalFromStorage() {
  const unlocked = store.license.loadUnlockedSoal();
  for (let b = 2; b <= 7; b++) {
    SOAL_PER_BAB[b] = Array.isArray(unlocked[b]) ? unlocked[b] : [];
  }
}

syncUnlockedSoalFromStorage();

if (typeof window !== "undefined") {
  window.addEventListener("tka-license-change", syncUnlockedSoalFromStorage);
}

export const MATERI = materi as MateriBab[];
export const totalSoal = () => 245;
