import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

interface ApiRequest extends IncomingMessage {
  body?: unknown;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function parseBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk: Buffer | string) => {
      raw += chunk.toString();
    });
    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function getSecret() {
  return process.env.TKA_TOKEN_SECRET || "sekawan-tka-pancasila-neon-secret-2026";
}

function signToken(data: { code: string; deviceId: string; planType: string }) {
  const payload = Buffer.from(
    JSON.stringify({
      ...data,
      iat: Date.now(),
    })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { code: string; deviceId: string; planType: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      code?: string;
      deviceId?: string;
      planType?: string;
    };
    if (!parsed.code || !parsed.deviceId) return null;
    return {
      code: parsed.code,
      deviceId: parsed.deviceId,
      planType: parsed.planType || "individual",
    };
  } catch {
    return null;
  }
}

async function fetchPremiumPayload(sql: NeonQueryFunction<false, false>) {
  const soalRows = (await sql`
    SELECT id, bab, urut, tipe, stimulus, tanya, opsi, jodoh, kunci, pembahasan
    FROM tka_pancasila.soal
    ORDER BY bab ASC, urut ASC
  `) as Array<{
    id: string;
    bab: number;
    urut: number;
    tipe: string;
    stimulus: string | null;
    tanya: string;
    opsi: string[] | null;
    jodoh: { kiri: string[]; kanan: string[] } | null;
    kunci: string | string[];
    pembahasan: string;
  }>;

  const soalByBab: Record<number, unknown[]> = {};
  for (const row of soalRows) {
    if (!soalByBab[row.bab]) soalByBab[row.bab] = [];
    const item: Record<string, unknown> = {
      id: row.id,
      bab: row.bab,
      tipe: row.tipe,
      tanya: row.tanya,
      kunci: row.kunci,
      pembahasan: row.pembahasan,
    };
    if (row.stimulus) item.stimulus = row.stimulus;
    if (row.opsi) item.opsi = row.opsi;
    if (row.jodoh) item.jodoh = row.jodoh;
    soalByBab[row.bab].push(item);
  }

  const materiRows = (await sql`
    SELECT bab, judul, subjudul, kartu
    FROM tka_pancasila.materi_bab
    ORDER BY bab ASC
  `) as Array<{
    bab: number;
    judul: string;
    subjudul: string;
    kartu: unknown[];
  }>;

  return { soalByBab, materiList: materiRows };
}

async function activateVoucherForDevice(
  sql: NeonQueryFunction<false, false>,
  rawCode: string,
  deviceId: string,
  studentName: string
) {
  const code = rawCode.trim().toUpperCase();
  if (!code || !deviceId) {
    return { ok: false as const, status: 400, error: "Kode voucher dan ID perangkat wajib diisi." };
  }

  const vouchers = (await sql`
    SELECT code, label, plan_type, price_idr, max_devices, used_devices, is_active, expires_at
    FROM tka_pancasila.vouchers
    WHERE UPPER(code) = ${code}
    LIMIT 1
  `) as Array<{
    code: string;
    label: string;
    plan_type: string;
    price_idr: number;
    max_devices: number;
    used_devices: number;
    is_active: boolean;
    expires_at: string | null;
  }>;

  if (vouchers.length === 0) {
    return {
      ok: false as const,
      status: 404,
      error: "Kode voucher tidak ditemukan. Pastikan penulisan kode sudah benar.",
    };
  }

  const voucher = vouchers[0];
  if (!voucher.is_active) {
    return {
      ok: false as const,
      status: 403,
      error: "Kode voucher ini sedang dinonaktifkan oleh Admin.",
    };
  }

  if (voucher.expires_at && new Date(voucher.expires_at).getTime() < Date.now()) {
    return {
      ok: false as const,
      status: 403,
      error: "Masa aktif kode voucher ini sudah berakhir.",
    };
  }

  const existing = (await sql`
    SELECT id FROM tka_pancasila.activations
    WHERE voucher_code = ${voucher.code} AND device_id = ${deviceId}
    LIMIT 1
  `) as Array<{ id: number }>;

  const countRows = (await sql`
    SELECT COUNT(*)::int AS cnt FROM tka_pancasila.activations
    WHERE voucher_code = ${voucher.code}
  `) as Array<{ cnt: number }>;
  const currentCount = countRows[0]?.cnt ?? 0;

  let finalUsedDevices = currentCount;

  if (existing.length === 0) {
    if (currentCount >= voucher.max_devices) {
      return {
        ok: false as const,
        status: 403,
        error: `Kuota perangkat untuk kode ${voucher.code} sudah penuh (${voucher.max_devices}/${voucher.max_devices} perangkat). Hubungi Admin jika Anda berganti HP/perangkat.`,
      };
    }

    await sql`
      INSERT INTO tka_pancasila.activations (voucher_code, device_id, student_name, activated_at, last_seen_at)
      VALUES (${voucher.code}, ${deviceId}, ${studentName || null}, NOW(), NOW())
      ON CONFLICT (voucher_code, device_id) DO UPDATE SET
        last_seen_at = NOW(),
        student_name = COALESCE(EXCLUDED.student_name, tka_pancasila.activations.student_name)
    `;

    finalUsedDevices = currentCount + 1;
    await sql`
      UPDATE tka_pancasila.vouchers
      SET used_devices = ${finalUsedDevices}
      WHERE code = ${voucher.code}
    `;
  } else {
    await sql`
      UPDATE tka_pancasila.activations
      SET last_seen_at = NOW(),
          student_name = COALESCE(${studentName || null}, student_name)
      WHERE voucher_code = ${voucher.code} AND device_id = ${deviceId}
    `;
  }

  const accessToken = signToken({
    code: voucher.code,
    deviceId,
    planType: voucher.plan_type,
  });

  const { soalByBab, materiList } = await fetchPremiumPayload(sql);

  return {
    ok: true as const,
    status: 200,
    accessToken,
    license: {
      code: voucher.code,
      label: voucher.label,
      planType: voucher.plan_type,
      maxDevices: voucher.max_devices,
      usedDevices: finalUsedDevices,
      activatedAt: new Date().toISOString(),
    },
    soalByBab,
    materiList,
  };
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    sendJson(res, 500, { ok: false, error: "Server DATABASE_URL belum dikonfigurasi." });
    return;
  }

  const sql = neon(dbUrl);

  try {
    const body = req.method === "POST" ? await parseBody(req) : {};
    const action = String(body.action || "activate");

    if (action === "activate") {
      const code = String(body.code || "");
      const deviceId = String(body.deviceId || "");
      const studentName = String(body.studentName || "");
      const result = await activateVoucherForDevice(sql, code, deviceId, studentName);
      if (!result.ok) {
        sendJson(res, result.status, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (action === "verify") {
      const token = String(body.accessToken || "");
      const deviceId = String(body.deviceId || "");
      const verified = verifyToken(token);
      if (!verified || verified.deviceId !== deviceId) {
        sendJson(res, 401, { ok: false, error: "Sesi akses tidak valid atau kedaluwarsa." });
        return;
      }
      const result = await activateVoucherForDevice(sql, verified.code, deviceId, "");
      if (!result.ok) {
        sendJson(res, result.status, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (action === "create-order") {
      const buyerName = String(body.buyerName || "").trim();
      const buyerWhatsapp = String(body.buyerWhatsapp || "").trim();
      const schoolName = String(body.schoolName || "").trim();
      const rawPlan = String(body.planType || "individual");
      const planType = rawPlan === "share" || rawPlan === "school" ? "share" : "individual";

      if (buyerName.length < 2 || buyerWhatsapp.replace(/\D/g, "").length < 9) {
        sendJson(res, 400, {
          ok: false,
          error: "Mohon isi Nama Lengkap dan Nomor WhatsApp aktif (minimal 9 digit).",
        });
        return;
      }

      const amountIdr = planType === "share" ? 40000 : 20000;
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderCode = `INV-TKA-${rand}`;

      await sql`
        INSERT INTO tka_pancasila.orders (order_code, buyer_name, buyer_whatsapp, school_name, plan_type, amount_idr, status)
        VALUES (${orderCode}, ${buyerName}, ${buyerWhatsapp}, ${schoolName || null}, ${planType}, ${amountIdr}, 'pending')
      `;

      sendJson(res, 200, {
        ok: true,
        order: {
          orderCode,
          buyerName,
          buyerWhatsapp,
          schoolName,
          planType,
          amountIdr,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (action === "check-order") {
      const orderCode = String(body.orderCode || "").trim().toUpperCase();
      const deviceId = String(body.deviceId || "");
      const studentName = String(body.studentName || "");

      if (!orderCode) {
        sendJson(res, 400, { ok: false, error: "Nomor pesanan wajib diisi." });
        return;
      }

      const orders = (await sql`
        SELECT order_code, buyer_name, plan_type, amount_idr, status, voucher_code
        FROM tka_pancasila.orders
        WHERE UPPER(order_code) = ${orderCode}
        LIMIT 1
      `) as Array<{
        order_code: string;
        buyer_name: string;
        plan_type: string;
        amount_idr: number;
        status: string;
        voucher_code: string | null;
      }>;

      if (orders.length === 0) {
        sendJson(res, 404, { ok: false, error: "Nomor pesanan tidak ditemukan." });
        return;
      }

      const order = orders[0];
      if (order.status === "paid" && order.voucher_code) {
        const activation = await activateVoucherForDevice(
          sql,
          order.voucher_code,
          deviceId,
          studentName || order.buyer_name
        );
        if (activation.ok) {
          sendJson(res, 200, {
            ...activation,
            orderStatus: "paid",
            voucherCode: order.voucher_code,
          });
          return;
        }
      }

      sendJson(res, 200, {
        ok: true,
        orderStatus: order.status,
        voucherCode: order.voucher_code,
        message:
          order.status === "paid"
            ? `Pesanan telah disetujui! Kode Voucher Anda: ${order.voucher_code}`
            : "Pesanan Anda sedang menunggu verifikasi pembayaran oleh Admin.",
      });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Aksi tidak dikenali." });
  } catch (err) {
    console.error("[api/access] Error:", err);
    sendJson(res, 500, {
      ok: false,
      error: "Terjadi gangguan koneksi ke server database Neon. Silakan coba sesaat lagi.",
    });
  }
}
