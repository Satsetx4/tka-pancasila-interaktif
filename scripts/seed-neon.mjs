import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('[seed-neon] ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log('[seed-neon] Creating schema tka_pancasila and tables in Neon...');

  await sql`CREATE SCHEMA IF NOT EXISTS tka_pancasila`;

  await sql`DROP TABLE IF EXISTS tka_pancasila.materi_bab CASCADE`;
  await sql`DROP TABLE IF EXISTS tka_pancasila.soal CASCADE`;

  await sql`
    CREATE TABLE IF NOT EXISTS tka_pancasila.materi_bab (
      bab INTEGER PRIMARY KEY,
      judul TEXT NOT NULL,
      subjudul TEXT NOT NULL,
      is_free BOOLEAN NOT NULL DEFAULT FALSE,
      kartu JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tka_pancasila.soal (
      id TEXT PRIMARY KEY,
      bab INTEGER NOT NULL,
      urut INTEGER NOT NULL,
      tipe TEXT NOT NULL,
      stimulus TEXT,
      tanya TEXT NOT NULL,
      opsi JSONB,
      jodoh JSONB,
      kunci JSONB NOT NULL,
      pembahasan TEXT NOT NULL,
      is_free BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tka_pancasila.vouchers (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      plan_type TEXT NOT NULL DEFAULT 'individual',
      price_idr INTEGER NOT NULL DEFAULT 35000,
      max_devices INTEGER NOT NULL DEFAULT 3,
      used_devices INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tka_pancasila.activations (
      id SERIAL PRIMARY KEY,
      voucher_code TEXT NOT NULL REFERENCES tka_pancasila.vouchers(code) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      student_name TEXT,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(voucher_code, device_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tka_pancasila.orders (
      id SERIAL PRIMARY KEY,
      order_code TEXT UNIQUE NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_whatsapp TEXT NOT NULL,
      school_name TEXT,
      plan_type TEXT NOT NULL DEFAULT 'individual',
      amount_idr INTEGER NOT NULL DEFAULT 35000,
      status TEXT NOT NULL DEFAULT 'pending',
      voucher_code TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `;

  // Seed Materi Bab 1-7
  const materiPath = path.join(rootDir, 'src', 'data', 'materi.json');
  const materiList = JSON.parse(fs.readFileSync(materiPath, 'utf8'));

  for (const item of materiList) {
    const isFree = item.bab === 1;
    await sql`
      INSERT INTO tka_pancasila.materi_bab (bab, judul, subjudul, is_free, kartu, updated_at)
      VALUES (${item.bab}, ${item.judul}, ${item.subjudul}, ${isFree}, ${JSON.stringify(item.kartu)}::jsonb, NOW())
      ON CONFLICT (bab) DO UPDATE SET
        judul = EXCLUDED.judul,
        subjudul = EXCLUDED.subjudul,
        is_free = EXCLUDED.is_free,
        kartu = EXCLUDED.kartu,
        updated_at = NOW()
    `;
  }
  console.log(`[seed-neon] Seeded ${materiList.length} bab materi.`);

  // Seed 245 Soal across Bab 1-7
  let totalSoal = 0;
  for (let b = 1; b <= 7; b++) {
    const babFile = path.join(rootDir, 'src', 'data', `bab${b}.json`);
    const soalList = JSON.parse(fs.readFileSync(babFile, 'utf8'));
    for (let idx = 0; idx < soalList.length; idx++) {
      const s = soalList[idx];
      const urut = idx + 1;
      const isFree = b === 1;
      await sql`
        INSERT INTO tka_pancasila.soal (
          id, bab, urut, tipe, stimulus, tanya, opsi, jodoh, kunci, pembahasan, is_free, updated_at
        ) VALUES (
          ${s.id},
          ${s.bab},
          ${urut},
          ${s.tipe},
          ${s.stimulus ?? null},
          ${s.tanya},
          ${s.opsi ? JSON.stringify(s.opsi) : null}::jsonb,
          ${s.jodoh ? JSON.stringify(s.jodoh) : null}::jsonb,
          ${JSON.stringify(s.kunci)}::jsonb,
          ${s.pembahasan},
          ${isFree},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          bab = EXCLUDED.bab,
          urut = EXCLUDED.urut,
          tipe = EXCLUDED.tipe,
          stimulus = EXCLUDED.stimulus,
          tanya = EXCLUDED.tanya,
          opsi = EXCLUDED.opsi,
          jodoh = EXCLUDED.jodoh,
          kunci = EXCLUDED.kunci,
          pembahasan = EXCLUDED.pembahasan,
          is_free = EXCLUDED.is_free,
          updated_at = NOW()
      `;
      totalSoal++;
    }
  }
  console.log(`[seed-neon] Seeded ${totalSoal} soal into tka_pancasila.soal.`);

  // Seed default vouchers
  const starterVouchers = [
    {
      code: 'TKA-PRO-2026',
      label: 'Paket Lulus TKA SD/MI (Individu)',
      plan_type: 'individual',
      price_idr: 35000,
      max_devices: 3,
    },
    {
      code: 'GURU-SD6-VIP',
      label: 'Lisensi Kelas / Sekolah (40 Perangkat)',
      plan_type: 'school',
      price_idr: 299000,
      max_devices: 40,
    },
    {
      code: 'SEKAWAN-VIP',
      label: 'Akses VIP Sekawan (Unlimited)',
      plan_type: 'school',
      price_idr: 0,
      max_devices: 999,
    },
  ];

  for (const v of starterVouchers) {
    await sql`
      INSERT INTO tka_pancasila.vouchers (code, label, plan_type, price_idr, max_devices, is_active)
      VALUES (${v.code}, ${v.label}, ${v.plan_type}, ${v.price_idr}, ${v.max_devices}, TRUE)
      ON CONFLICT (code) DO UPDATE SET
        label = EXCLUDED.label,
        plan_type = EXCLUDED.plan_type,
        price_idr = EXCLUDED.price_idr,
        max_devices = EXCLUDED.max_devices
    `;
  }
  console.log(`[seed-neon] Seeded ${starterVouchers.length} initial vouchers.`);
  console.log('[seed-neon] DONE! Neon database is ready.');
}

main().catch((err) => {
  console.error('[seed-neon] Fatal error:', err);
  process.exit(1);
});
