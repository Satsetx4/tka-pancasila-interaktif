import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  KeyRound,
  Plus,
  RefreshCw,
  Copy,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  RotateCcw,
  Power,
  Database,
} from "lucide-react";
import { TapButton } from "./TapButton";
import { bunyi } from "../../lib/store";

interface VoucherRow {
  code: string;
  label: string;
  plan_type: string;
  price_idr: number;
  max_devices: number;
  used_devices: number;
  is_active: boolean;
  created_at: string;
}

interface OrderRow {
  id: number;
  order_code: string;
  buyer_name: string;
  buyer_whatsapp: string;
  school_name: string | null;
  plan_type: string;
  amount_idr: number;
  status: string;
  voucher_code: string | null;
  created_at: string;
}

interface AdminStats {
  total_soal: number;
  total_bab: number;
  active_vouchers: number;
  total_devices: number;
  total_revenue: number;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ open, onClose }) => {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "vouchers">("orders");

  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total_soal: 245,
    total_bab: 7,
    active_vouchers: 0,
    total_devices: 0,
    total_revenue: 0,
  });

  // Form buat voucher baru
  const [newPlan, setNewPlan] = useState<"individual" | "school">("individual");
  const [customCode, setCustomCode] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!open) return null;

  const callAdminApi = async (payload: Record<string, unknown>) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, ...payload }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        vouchers?: VoucherRow[];
        orders?: OrderRow[];
        stats?: AdminStats;
        createdCode?: string;
        approvedOrder?: string;
        voucherCode?: string;
      };
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Gagal memproses permintaan Admin.");
        bunyi("salah");
        return null;
      }
      if (data.vouchers) setVouchers(data.vouchers);
      if (data.orders) setOrders(data.orders);
      if (data.stats) setStats(data.stats);
      return data;
    } catch {
      setErrorMsg("Gagal terhubung ke server Neon Database.");
      bunyi("salah");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callAdminApi({ action: "dashboard" });
    if (data) {
      setUnlocked(true);
      bunyi("benar");
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callAdminApi({
      action: "create-voucher",
      planType: newPlan,
      customCode: customCode.trim(),
      label: customLabel.trim(),
      maxDevices: newPlan === "school" ? 40 : 3,
      priceIdr: newPlan === "school" ? 299000 : 35000,
    });
    if (data?.createdCode) {
      setNotice(`Voucher baru berhasil dibuat di Neon DB: ${data.createdCode}`);
      setCustomCode("");
      setCustomLabel("");
      bunyi("badge");
    }
  };

  const handleApproveOrder = async (orderCode: string) => {
    const data = await callAdminApi({
      action: "approve-order",
      orderCode,
    });
    if (data?.voucherCode) {
      setNotice(`Pesanan ${orderCode} disetujui! Kode Voucher: ${data.voucherCode}`);
      bunyi("badge");
    }
  };

  const sendVoucherToWa = (order: OrderRow) => {
    if (!order.voucher_code) return;
    let wa = order.buyer_whatsapp.replace(/\D/g, "");
    if (wa.startsWith("0")) wa = "62" + wa.slice(1);
    const text = encodeURIComponent(
      `Halo Bapak/Ibu *${order.buyer_name}*, pembayaran Anda untuk *TKA Pendidikan Pancasila Kelas VI SD/MI* (${order.order_code}) telah berhasil diverifikasi!\n\n` +
        `🔑 *Kode Voucher Akses Penuh:*\n*${order.voucher_code}*\n\n` +
        `Cara Pakai:\n1. Buka https://tka-pancasila-interaktif.vercel.app\n2. Klik tombol *Buka PRO* atau pilih Bab 2–7\n3. Masukkan kode *${order.voucher_code}* untuk membuka seluruh 7 Bab & 245 Soal TKA.\n\nSelamat belajar dan semoga sukses ujiannya!`
    );
    window.open(`https://wa.me/${wa}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, scale: 0.96, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 30, scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-[var(--fg-primary)]">
                  Panel Admin &amp; Voucher Neon DB
                </h2>
                <p className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-500" />
                  Terhubung ke Neon Serverless PostgreSQL
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--fg-muted)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {notice && (
            <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-200 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {!unlocked ? (
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--fg-secondary)] mb-1.5">
                  Masukkan PIN Admin
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN Admin"
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-emerald-500 outline-none font-mono text-sm text-[var(--fg-primary)]"
                />
              </div>
              <TapButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full h-11 text-xs"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? "Memuat Data Neon DB..." : "Buka Dashboard Admin"}
              </TapButton>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Live Neon DB Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-center">
                  <div className="text-[10px] text-[var(--fg-muted)] uppercase">Bank Soal DB</div>
                  <div className="font-display font-bold text-base text-emerald-500">
                    {stats.total_soal} Soal
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-center">
                  <div className="text-[10px] text-[var(--fg-muted)] uppercase">Voucher Aktif</div>
                  <div className="font-display font-bold text-base text-amber-500">
                    {stats.active_vouchers} Kode
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-center">
                  <div className="text-[10px] text-[var(--fg-muted)] uppercase">Perangkat</div>
                  <div className="font-display font-bold text-base text-sky-500">
                    {stats.total_devices} Aktif
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setTab("orders")}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all ${
                    tab === "orders"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-[var(--fg-secondary)]"
                  }`}
                >
                  Pesanan ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("vouchers")}
                  className={`h-9 rounded-xl text-xs font-semibold transition-all ${
                    tab === "vouchers"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-[var(--fg-secondary)]"
                  }`}
                >
                  Kode Voucher ({vouchers.length})
                </button>
              </div>

              {tab === "orders" && (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {orders.length === 0 ? (
                    <p className="text-center text-xs text-[var(--fg-muted)] py-6">
                      Belum ada pesanan masuk.
                    </p>
                  ) : (
                    orders.map((o) => (
                      <div
                        key={o.order_code}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[var(--fg-primary)]">
                            {o.order_code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              o.status === "paid"
                                ? "bg-emerald-500/20 text-emerald-500"
                                : "bg-amber-500/20 text-amber-500"
                            }`}
                          >
                            {o.status === "paid" ? "LUNAS" : "MENUNGGU"}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--fg-secondary)]">
                          <div>
                            <strong>{o.buyer_name}</strong> • {o.buyer_whatsapp}
                          </div>
                          <div className="text-[11px] text-[var(--fg-muted)]">
                            Paket {o.plan_type === "school" ? "Sekolah (40 Dev)" : "Individu (3 Dev)"} •
                            Rp{o.amount_idr.toLocaleString("id-ID")}
                          </div>
                        </div>
                        {o.status !== "paid" ? (
                          <TapButton
                            variant="primary"
                            disabled={loading}
                            onClick={() => handleApproveOrder(o.order_code)}
                            className="w-full h-9 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Setujui &amp; Buat Kode Voucher Otomatis
                          </TapButton>
                        ) : (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <code className="text-xs font-mono font-bold text-emerald-500">
                              {o.voucher_code}
                            </code>
                            <button
                              type="button"
                              onClick={() => sendVoucherToWa(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[11px] font-semibold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Kirim ke WA Pembeli
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "vouchers" && (
                <div className="space-y-3">
                  {/* Form Buat Voucher */}
                  <form
                    onSubmit={handleCreateVoucher}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 space-y-2"
                  >
                    <div className="text-xs font-bold text-[var(--fg-primary)]">
                      + Buat Kode Voucher Baru di Neon DB
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newPlan}
                        onChange={(e) => setNewPlan(e.target.value as "individual" | "school")}
                        className="h-9 px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--fg-primary)]"
                      >
                        <option value="individual">Individu (3 Perangkat)</option>
                        <option value="school">Sekolah (40 Perangkat)</option>
                      </select>
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        placeholder="Kode Custom (Opsional)"
                        className="h-9 px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-xs uppercase text-[var(--fg-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Keterangan (misal: SDN 01 Pagi / Nama Pembeli)"
                      className="w-full h-9 px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--fg-primary)]"
                    />
                    <TapButton
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="w-full h-9 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Simpan Voucher ke Neon DB
                    </TapButton>
                  </form>

                  {/* Daftar Voucher */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {vouchers.map((v) => (
                      <div
                        key={v.code}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono font-bold text-xs text-emerald-500">
                              {v.code}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(v.code);
                                setCopiedCode(v.code);
                                setTimeout(() => setCopiedCode(null), 1500);
                              }}
                              className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
                              title="Salin kode"
                            >
                              {copiedCode === v.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-[var(--fg-secondary)] truncate">
                            {v.label}
                          </div>
                          <div className="text-[10px] text-[var(--fg-muted)]">
                            Perangkat: <strong>{v.used_devices}</strong> / {v.max_devices} •{" "}
                            {v.is_active ? "Aktif" : "Nonaktif"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              callAdminApi({ action: "reset-devices", code: v.code })
                            }
                            title="Reset kuota perangkat"
                            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--fg-secondary)] hover:text-amber-500"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              callAdminApi({
                                action: "toggle-voucher",
                                code: v.code,
                                isActive: !v.is_active,
                              })
                            }
                            title={v.is_active ? "Nonaktifkan" : "Aktifkan"}
                            className={`p-2 rounded-xl border border-[var(--border-subtle)] ${
                              v.is_active ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <TapButton
                variant="secondary"
                disabled={loading}
                onClick={() => callAdminApi({ action: "dashboard" })}
                className="w-full h-9 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Segarkan Data dari Neon DB
              </TapButton>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
