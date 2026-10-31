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

function generateVoucherCode(prefix = "TKA") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${part1}-${part2}`;
}

async function fetchDashboardData(sql: NeonQueryFunction<false, false>) {
  const vouchers = await sql`
    SELECT code, label, plan_type, price_idr, max_devices, used_devices, is_active, expires_at, created_at
    FROM tka_pancasila.vouchers
    ORDER BY created_at DESC
  `;

  const orders = await sql`
    SELECT id, order_code, buyer_name, buyer_whatsapp, school_name, plan_type, amount_idr, status, voucher_code, created_at, paid_at
    FROM tka_pancasila.orders
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const activations = await sql`
    SELECT id, voucher_code, device_id, student_name, activated_at, last_seen_at
    FROM tka_pancasila.activations
    ORDER BY last_seen_at DESC
    LIMIT 50
  `;

  const statsRows = (await sql`
    SELECT
      (SELECT COUNT(*)::int FROM tka_pancasila.soal) AS total_soal,
      (SELECT COUNT(*)::int FROM tka_pancasila.materi_bab) AS total_bab,
      (SELECT COUNT(*)::int FROM tka_pancasila.vouchers WHERE is_active = TRUE) AS active_vouchers,
      (SELECT COUNT(*)::int FROM tka_pancasila.activations) AS total_devices,
      (SELECT COALESCE(SUM(amount_idr), 0)::int FROM tka_pancasila.orders WHERE status = 'paid') AS total_revenue
  `) as Array<{
    total_soal: number;
    total_bab: number;
    active_vouchers: number;
    total_devices: number;
    total_revenue: number;
  }>;

  return {
    vouchers,
    orders,
    activations,
    stats: statsRows[0] ?? {
      total_soal: 245,
      total_bab: 7,
      active_vouchers: 0,
      total_devices: 0,
      total_revenue: 0,
    },
  };
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    sendJson(res, 500, { ok: false, error: "DATABASE_URL belum dikonfigurasi." });
    return;
  }

  const body = await parseBody(req);
  const pin = String(body.pin || "").trim();
  const expectedPin = process.env.TKA_ADMIN_PIN || "2026";

  if (!pin || pin !== expectedPin) {
    sendJson(res, 401, { ok: false, error: "PIN Admin tidak sesuai." });
    return;
  }

  const sql = neon(dbUrl);
  const action = String(body.action || "dashboard");

  try {
    if (action === "dashboard") {
      const data = await fetchDashboardData(sql);
      sendJson(res, 200, { ok: true, ...data });
      return;
    }

    if (action === "create-voucher") {
      const rawPlan = String(body.planType || "individual");
      const planType = rawPlan === "share" || rawPlan === "school" ? "share" : "individual";
      const customCode = String(body.customCode || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "");
      const quantity = Math.max(1, Math.min(200, Number(body.quantity) || 1));
      const baseLabel =
        String(body.label || "").trim() ||
        (planType === "share"
          ? "Paket Share (3 Perangkat)"
          : "Paket Individu (1 Perangkat)");
      const maxDevices = Number(body.maxDevices) || (planType === "share" ? 3 : 1);
      const priceIdr = Number(body.priceIdr) >= 0 ? Number(body.priceIdr) : planType === "share" ? 40000 : 20000;

      const defaultPrefix = planType === "share" ? "SHARE" : "TKA";
      const prefix = customCode ? customCode.replace(/-+$/, "") : defaultPrefix;
      const createdCodes: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const code =
          quantity === 1 && customCode
            ? customCode
            : generateVoucherCode(prefix);
        const itemLabel = quantity > 1 ? `${baseLabel} (#${i + 1})` : baseLabel;

        await sql`
          INSERT INTO tka_pancasila.vouchers (code, label, plan_type, price_idr, max_devices, used_devices, is_active)
          VALUES (${code}, ${itemLabel}, ${planType}, ${priceIdr}, ${maxDevices}, 0, TRUE)
          ON CONFLICT (code) DO UPDATE SET
            label = EXCLUDED.label,
            plan_type = EXCLUDED.plan_type,
            price_idr = EXCLUDED.price_idr,
            max_devices = EXCLUDED.max_devices,
            is_active = TRUE
        `;
        createdCodes.push(code);
      }

      const data = await fetchDashboardData(sql);
      sendJson(res, 200, {
        ok: true,
        createdCode: createdCodes[0],
        createdCodes,
        ...data,
      });
      return;
    }

    if (action === "approve-order") {
      const orderCode = String(body.orderCode || "").trim().toUpperCase();
      const orders = (await sql`
        SELECT order_code, buyer_name, buyer_whatsapp, school_name, plan_type, amount_idr, voucher_code
        FROM tka_pancasila.orders
        WHERE UPPER(order_code) = ${orderCode}
        LIMIT 1
      `) as Array<{
        order_code: string;
        buyer_name: string;
        buyer_whatsapp: string;
        school_name: string | null;
        plan_type: string;
        amount_idr: number;
        voucher_code: string | null;
      }>;

      if (orders.length === 0) {
        sendJson(res, 404, { ok: false, error: "Pesanan tidak ditemukan." });
        return;
      }

      const order = orders[0];
      const isShare = order.plan_type === "share" || order.plan_type === "school";
      const voucherCode =
        order.voucher_code ||
        generateVoucherCode(isShare ? "SHARE" : "TKA");
      const maxDevices = isShare ? 3 : 1;
      const label = isShare
        ? `Paket Share (3 Perangkat) - ${order.buyer_name}`
        : `Paket Individu (1 Perangkat) - ${order.buyer_name}`;

      await sql`
        INSERT INTO tka_pancasila.vouchers (code, label, plan_type, price_idr, max_devices, used_devices, is_active)
        VALUES (${voucherCode}, ${label}, ${order.plan_type}, ${order.amount_idr}, ${maxDevices}, 0, TRUE)
        ON CONFLICT (code) DO NOTHING
      `;

      await sql`
        UPDATE tka_pancasila.orders
        SET status = 'paid',
            voucher_code = ${voucherCode},
            paid_at = NOW()
        WHERE order_code = ${order.order_code}
      `;

      const data = await fetchDashboardData(sql);
      sendJson(res, 200, {
        ok: true,
        approvedOrder: order.order_code,
        voucherCode,
        ...data,
      });
      return;
    }

    if (action === "reset-devices") {
      const code = String(body.code || "").trim().toUpperCase();
      await sql`DELETE FROM tka_pancasila.activations WHERE UPPER(voucher_code) = ${code}`;
      await sql`UPDATE tka_pancasila.vouchers SET used_devices = 0 WHERE UPPER(code) = ${code}`;
      const data = await fetchDashboardData(sql);
      sendJson(res, 200, { ok: true, ...data });
      return;
    }

    if (action === "toggle-voucher") {
      const code = String(body.code || "").trim().toUpperCase();
      const isActive = Boolean(body.isActive);
      await sql`
        UPDATE tka_pancasila.vouchers
        SET is_active = ${isActive}
        WHERE UPPER(code) = ${code}
      `;
      const data = await fetchDashboardData(sql);
      sendJson(res, 200, { ok: true, ...data });
      return;
    }

    if (action === "delete-voucher") {
      const code = String(body.code || "").trim().toUpperCase();
      if (!code) {
        sendJson(res, 400, { ok: false, error: "Kode voucher wajib diisi." });
        return;
      }
      const deletedRows = (await sql`
        DELETE FROM tka_pancasila.vouchers
        WHERE UPPER(code) = ${code} AND is_active = FALSE
        RETURNING code
      `) as Array<{ code: string }>;

      if (deletedRows.length === 0) {
        sendJson(res, 400, {
          ok: false,
          error: "Hanya key berstatus NONAKTIF yang dapat dihapus. Matikan key terlebih dahulu.",
        });
        return;
      }

      const data = await fetchDashboardData(sql);
      sendJson(res, 200, {
        ok: true,
        deletedCode: deletedRows[0].code,
        ...data,
      });
      return;
    }

    if (action === "delete-inactive-vouchers") {
      const deletedRows = (await sql`
        DELETE FROM tka_pancasila.vouchers
        WHERE is_active = FALSE
        RETURNING code
      `) as Array<{ code: string }>;

      const data = await fetchDashboardData(sql);
      sendJson(res, 200, {
        ok: true,
        deletedCount: deletedRows.length,
        ...data,
      });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Aksi admin tidak valid." });
  } catch (err) {
    console.error("[api/admin] Error:", err);
    sendJson(res, 500, { ok: false, error: "Gagal memproses perintah Admin di database Neon." });
  }
}
