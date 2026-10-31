import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  KeyRound,
  Plus,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  RotateCcw,
  Power,
  Database,
  LogOut,
  ExternalLink,
  Smartphone,
  ShoppingBag,
  Users,
  Wallet,
  Search,
} from "lucide-react";
import { TapButton } from "../components/ui/TapButton";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { bunyi, useTheme } from "../lib/store";

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
  paid_at: string | null;
}

interface ActivationRow {
  id: number;
  voucher_code: string;
  device_id: string;
  student_name: string | null;
  activated_at: string;
  last_seen_at: string;
}

interface AdminStats {
  total_soal: number;
  total_bab: number;
  active_vouchers: number;
  total_devices: number;
  total_revenue: number;
}

const SESSION_PIN_KEY = "tka-pancasila:admin-pin:v1";

export const AdminPage: React.FC = () => {
  const { theme, toggle } = useTheme();
  const [pin, setPin] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_PIN_KEY) || "";
    } catch {
      return "";
    }
  });
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "vouchers" | "devices">("orders");
  const [searchQuery, setSearchQuery] = useState("");

  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activations, setActivations] = useState<ActivationRow[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total_soal: 245,
    total_bab: 7,
    active_vouchers: 0,
    total_devices: 0,
    total_revenue: 0,
  });

  // Form Buat Voucher Baru
  const [newPlan, setNewPlan] = useState<"individual" | "school">("individual");
  const [customCode, setCustomCode] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customMaxDevices, setCustomMaxDevices] = useState<number>(3);
  const [customPriceIdr, setCustomPriceIdr] = useState<number>(35000);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const callAdminApi = async (
    payload: Record<string, unknown>,
    overridePin?: string
  ) => {
    const activePin = overridePin ?? pin;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: activePin, ...payload }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        vouchers?: VoucherRow[];
        orders?: OrderRow[];
        activations?: ActivationRow[];
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
      if (data.activations) setActivations(data.activations);
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

  useEffect(() => {
    document.title = "Admin Panel Voucher • TKA Pendidikan Pancasila";
    try {
      const savedPin = sessionStorage.getItem(SESSION_PIN_KEY);
      if (savedPin) {
        callAdminApi({ action: "dashboard" }, savedPin).then((data) => {
          if (data) setUnlocked(true);
        });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await callAdminApi({ action: "dashboard" });
    if (data) {
      setUnlocked(true);
      try {
        sessionStorage.setItem(SESSION_PIN_KEY, pin);
      } catch {
        /* ignore */
      }
      bunyi("benar");
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(SESSION_PIN_KEY);
    } catch {
      /* ignore */
    }
    setPin("");
    setUnlocked(false);
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const data = await callAdminApi({
      action: "create-voucher",
      planType: newPlan,
      customCode: customCode.trim(),
      label: customLabel.trim(),
      maxDevices: customMaxDevices,
      priceIdr: customPriceIdr,
    });
    if (data?.createdCode) {
      setNotice(`Kode Voucher baru berhasil dibuat di Neon DB: ${data.createdCode}`);
      setCustomCode("");
      setCustomLabel("");
      bunyi("badge");
    }
  };

  const handleApproveOrder = async (orderCode: string) => {
    setNotice(null);
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
        `Cara Pakai:\n1. Buka https://tka-pancasila-interaktif.vercel.app\n2. Klik tombol *Buka PRO* di pojok kanan atas atau pilih Bab 2–7\n3. Masukkan kode *${order.voucher_code}* untuk membuka seluruh 7 Bab & 245 Soal TKA.\n\nSelamat belajar dan semoga sukses ujiannya!`
    );
    window.open(`https://wa.me/${wa}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const copyShareMessage = (v: VoucherRow) => {
    const msg =
      `🔑 *Kode Voucher Akses Penuh TKA Pendidikan Pancasila Kelas VI SD/MI*\n` +
      `Kode: *${v.code}*\n` +
      `Paket: ${v.label} (Kuota ${v.max_devices} Perangkat)\n\n` +
      `Buka https://tka-pancasila-interaktif.vercel.app lalu masukkan kode di atas pada menu *Buka PRO*.`;
    navigator.clipboard?.writeText(msg);
    setCopiedCode(`msg-${v.code}`);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const pendingOrdersCount = orders.filter((o) => o.status !== "paid").length;

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_code.toLowerCase().includes(q) ||
      o.buyer_name.toLowerCase().includes(q) ||
      o.buyer_whatsapp.toLowerCase().includes(q) ||
      (o.voucher_code ?? "").toLowerCase().includes(q)
    );
  });

  const filteredVouchers = vouchers.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return v.code.toLowerCase().includes(q) || v.label.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--fg-primary)]">
      {/* Top Navbar Admin */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base sm:text-lg leading-tight">
                  Admin Console • TKA Pancasila
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <Database className="w-3 h-3" /> Neon PostgreSQL
                </span>
              </div>
              <p className="text-xs text-[var(--fg-muted)]">
                Manajemen Kode Voucher, Pesanan &amp; Perangkat Siswa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
            >
              <span>Aplikasi Siswa</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {unlocked && (
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari Admin"
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {errorMsg && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-2.5 text-xs sm:text-sm text-rose-600 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {notice && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-200 font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {!unlocked ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Login Pengelola Voucher</h2>
                <p className="text-xs text-[var(--fg-muted)]">
                  Halaman khusus Owner / Admin Sekawan Digital
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--fg-secondary)] mb-1.5">
                  PIN Admin
                </label>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN Admin..."
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-emerald-500 outline-none font-mono text-base tracking-widest text-[var(--fg-primary)]"
                />
              </div>
              <TapButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full h-12 text-sm"
              >
                <Shield className="w-4 h-4" />
                {loading ? "Menghubungkan ke Neon DB..." : "Buka Dashboard Admin"}
              </TapButton>
            </form>
          </motion.div>
        ) : (
          <>
            {/* 4 Kartu Statistik Utama */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
                  <span> Omzet Lunas</span>
                  <Wallet className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="font-display font-bold text-lg sm:text-xl text-emerald-500 mt-1">
                  Rp{stats.total_revenue.toLocaleString("id-ID")}
                </div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  {orders.filter((o) => o.status === "paid").length} pesanan lunas
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
                  <span>Pesanan Baru</span>
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-display font-bold text-lg sm:text-xl text-amber-500 mt-1">
                  {pendingOrdersCount} Menunggu
                </div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  Total {orders.length} transaksi
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
                  <span>Kode Voucher</span>
                  <KeyRound className="w-4 h-4 text-sky-500" />
                </div>
                <div className="font-display font-bold text-lg sm:text-xl text-sky-500 mt-1">
                  {stats.active_vouchers} Aktif
                </div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  Total {vouchers.length} kode terdaftar
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
                  <span>Perangkat Aktif</span>
                  <Smartphone className="w-4 h-4 text-violet-500" />
                </div>
                <div className="font-display font-bold text-lg sm:text-xl text-violet-500 mt-1">
                  {stats.total_devices} Device
                </div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  Bank soal: {stats.total_soal} soal
                </div>
              </div>
            </div>

            {/* Navigasi Tab + Tombol Refresh + Pencarian */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setTab("orders")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tab === "orders"
                      ? "bg-emerald-500 text-slate-950"
                      : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
                  }`}
                >
                  Pesanan Masuk ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("vouchers")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tab === "vouchers"
                      ? "bg-emerald-500 text-slate-950"
                      : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
                  }`}
                >
                  Kode Voucher ({vouchers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("devices")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tab === "devices"
                      ? "bg-emerald-500 text-slate-950"
                      : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
                  }`}
                >
                  Log Perangkat ({activations.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[var(--fg-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode, nama, atau WA..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <TapButton
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                  onClick={() => callAdminApi({ action: "dashboard" })}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Segarkan</span>
                </TapButton>
              </div>
            </div>

            {/* TAB 1: PESANAN MASUK */}
            {tab === "orders" && (
              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center space-y-2">
                    <ShoppingBag className="w-8 h-8 text-[var(--fg-muted)] mx-auto" />
                    <div className="font-display font-bold text-sm">Belum Ada Pesanan</div>
                    <p className="text-xs text-[var(--fg-muted)]">
                      Pesanan dari orang tua atau sekolah melalui aplikasi akan langsung muncul di sini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredOrders.map((o) => (
                      <div
                        key={o.order_code}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-[var(--fg-primary)]">
                              {o.order_code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                o.status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                              }`}
                            >
                              {o.status === "paid" ? "LUNAS / AKTIF" : "MENUNGGU PEMBAYARAN"}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--fg-secondary)] space-y-1">
                            <div>
                              Pemesan: <strong>{o.buyer_name}</strong> ({o.buyer_whatsapp})
                            </div>
                            {o.school_name && (
                              <div>
                                Sekolah: <strong>{o.school_name}</strong>
                              </div>
                            )}
                            <div>
                              Paket:{" "}
                              <strong>
                                {o.plan_type === "school"
                                  ? "Lisensi Sekolah (40 Perangkat)"
                                  : "Paket Individu (3 Perangkat)"}
                              </strong>{" "}
                              •{" "}
                              <span className="text-emerald-500 font-bold">
                                Rp{o.amount_idr.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {o.status !== "paid" ? (
                          <TapButton
                            variant="primary"
                            disabled={loading}
                            onClick={() => handleApproveOrder(o.order_code)}
                            className="w-full h-10 text-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Setujui &amp; Buat Kode Voucher Otomatis
                          </TapButton>
                        ) : (
                          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-[var(--fg-muted)] block">
                                Kode Voucher Diterbitkan:
                              </span>
                              <code className="font-mono font-bold text-xs text-emerald-500">
                                {o.voucher_code}
                              </code>
                            </div>
                            <button
                              type="button"
                              onClick={() => sendVoucherToWa(o)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer hover:bg-emerald-400 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Kirim ke WA Pembeli
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KELOLA KODE VOUCHER */}
            {tab === "vouchers" && (
              <div className="space-y-5">
                {/* Form Buat Voucher Baru */}
                <form
                  onSubmit={handleCreateVoucher}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base">
                        Buat Kode Voucher Baru
                      </h3>
                      <p className="text-xs text-[var(--fg-muted)]">
                        Kosongkan kolom Kode Custom jika ingin sistem membuat kode unik otomatis (contoh: TKA-8K2P-9M4X)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--fg-secondary)] mb-1">
                        Tipe Paket
                      </label>
                      <select
                        value={newPlan}
                        onChange={(e) => {
                          const v = e.target.value as "individual" | "school";
                          setNewPlan(v);
                          setCustomMaxDevices(v === "school" ? 40 : 3);
                          setCustomPriceIdr(v === "school" ? 299000 : 35000);
                        }}
                        className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--fg-primary)]"
                      >
                        <option value="individual">Individu (Default 3 Dev)</option>
                        <option value="school">Sekolah / Kelas (Default 40 Dev)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--fg-secondary)] mb-1">
                        Kode Custom (Opsional)
                      </label>
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        placeholder="Misal: SDN01-JUARA"
                        className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs uppercase text-[var(--fg-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--fg-secondary)] mb-1">
                        Batas Maksimal Perangkat
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={customMaxDevices}
                        onChange={(e) => setCustomMaxDevices(Number(e.target.value) || 1)}
                        className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--fg-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--fg-secondary)] mb-1">
                        Harga Paket (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={customPriceIdr}
                        onChange={(e) => setCustomPriceIdr(Number(e.target.value) || 0)}
                        className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--fg-primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Label / Keterangan Pembeli (contoh: Paket Kelas 6A SDN Menteng 01 / Ibu Rina)"
                      className="flex-1 h-11 px-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--fg-primary)]"
                    />
                    <TapButton
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="h-11 px-6 text-xs shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Terbitkan Voucher di Neon DB
                    </TapButton>
                  </div>
                </form>

                {/* Daftar Voucher */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredVouchers.map((v) => (
                    <div
                      key={v.code}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold text-sm text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                              {v.code}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(v.code);
                                setCopiedCode(v.code);
                                setTimeout(() => setCopiedCode(null), 1500);
                              }}
                              className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] cursor-pointer"
                              title="Salin Kode"
                            >
                              {copiedCode === v.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              v.is_active
                                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                            }`}
                          >
                            {v.is_active ? "AKTIF" : "NONAKTIF"}
                          </span>
                        </div>

                        <div className="font-display font-bold text-sm text-[var(--fg-primary)]">
                          {v.label}
                        </div>

                        <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
                          <span>
                            Kuota Perangkat:{" "}
                            <strong className="text-[var(--fg-primary)]">
                              {v.used_devices} / {v.max_devices}
                            </strong>
                          </span>
                          <span>Rp{v.price_idr.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => copyShareMessage(v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] cursor-pointer"
                        >
                          {copiedCode === `msg-${v.code}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Teks WA Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Format Chat WA</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              callAdminApi({ action: "reset-devices", code: v.code });
                              setNotice(`Kuota perangkat untuk ${v.code} berhasil direset ke 0.`);
                            }}
                            title="Reset kuota perangkat ke 0"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--fg-secondary)] hover:text-amber-500 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
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
                            title={v.is_active ? "Nonaktifkan Voucher" : "Aktifkan Voucher"}
                            className={`p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] cursor-pointer ${
                              v.is_active ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: LOG PERANGKAT AKTIF */}
            {tab === "devices" && (
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
                {activations.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <Users className="w-8 h-8 text-[var(--fg-muted)] mx-auto" />
                    <div className="font-display font-bold text-sm">
                      Belum Ada Perangkat Terdaftar
                    </div>
                    <p className="text-xs text-[var(--fg-muted)]">
                      Setiap HP/laptop siswa yang mengaktifkan kode voucher akan tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {activations.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold text-emerald-500">
                              {a.voucher_code}
                            </code>
                            <span className="text-[var(--fg-muted)]">•</span>
                            <strong className="text-[var(--fg-primary)]">
                              {a.student_name || "Siswa Kelas VI"}
                            </strong>
                          </div>
                          <div className="text-[11px] text-[var(--fg-muted)]">
                            ID Perangkat: <code className="font-mono">{a.device_id}</code>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-[var(--fg-muted)]">
                          <div>Aktif terakhir:</div>
                          <div className="font-medium text-[var(--fg-secondary)]">
                            {new Date(a.last_seen_at).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
