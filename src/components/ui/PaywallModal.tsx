import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Lock,
  Unlock,
  KeyRound,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Users,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  X,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { TapButton } from "./TapButton";
import {
  BABS,
  bunyi,
  store,
  type LicenseInfo,
  type PendingOrder,
  type Soal,
} from "../../lib/store";

interface PaywallModalProps {
  open: boolean;
  targetBab?: number | null;
  onClose: () => void;
  onUnlocked?: (bab?: number | null) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  open,
  targetBab,
  onClose,
  onUnlocked,
}) => {
  const [tab, setTab] = useState<"voucher" | "beli">("voucher");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form pembelian
  const [planType, setPlanType] = useState<"individual" | "school">("individual");
  const [buyerName, setBuyerName] = useState(() => store.profile.load().name || "");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [schoolName, setSchoolName] = useState(() => store.profile.load().sekolah || "");
  const [honeypot, setHoneypot] = useState(""); // Anti-spam honeypot field
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(() => store.order.load());
  const [copiedOrder, setCopiedOrder] = useState(false);

  if (!open) return null;

  const targetMeta = targetBab ? BABS.find((b) => b.id === targetBab) : null;
  const deviceId = store.device.getId();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = voucherCode.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setErrorMsg("Masukkan kode voucher yang valid (minimal 4 karakter).");
      bunyi("salah");
      return;
    }

    setLoading(true);
    try {
      const profile = store.profile.load();
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "activate",
          code: cleanCode,
          deviceId,
          studentName: profile.name || "Siswa Kelas VI",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        accessToken?: string;
        license?: Omit<LicenseInfo, "accessToken">;
        soalByBab?: Record<number, Soal[]>;
      };

      if (!res.ok || !data.ok || !data.license || !data.accessToken) {
        setErrorMsg(data.error || "Gagal mengaktifkan kode voucher.");
        bunyi("salah");
        setLoading(false);
        return;
      }

      const fullLicense: LicenseInfo = {
        ...data.license,
        accessToken: data.accessToken,
      };
      store.license.saveUnlocked(fullLicense, data.soalByBab);
      bunyi("badge");
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      } catch {
        /* ignore */
      }
      setSuccessMsg(`Berhasil! ${fullLicense.label} aktif di perangkat ini.`);
      setTimeout(() => {
        onUnlocked?.(targetBab);
        onClose();
      }, 900);
    } catch {
      setErrorMsg("Gagal terhubung ke server database Neon. Periksa koneksi internet Anda.");
      bunyi("salah");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Bot spam trapped
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = buyerName.trim();
    const cleanWa = buyerWhatsapp.replace(/\D/g, "");
    if (cleanName.length < 2) {
      setErrorMsg("Mohon isi Nama Orang Tua / Guru (minimal 2 huruf).");
      bunyi("salah");
      return;
    }
    if (cleanWa.length < 9 || cleanWa.length > 15) {
      setErrorMsg("Mohon isi Nomor WhatsApp aktif yang valid (contoh: 08123456789).");
      bunyi("salah");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-order",
          buyerName: cleanName,
          buyerWhatsapp: cleanWa,
          schoolName: schoolName.trim(),
          planType,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        order?: PendingOrder;
      };

      if (!res.ok || !data.ok || !data.order) {
        setErrorMsg(data.error || "Gagal membuat pesanan.");
        bunyi("salah");
        setLoading(false);
        return;
      }

      store.order.save(data.order);
      setPendingOrder(data.order);
      bunyi("benar");
      window.dispatchEvent(
        new CustomEvent("tka-form-submit", {
          detail: { type: "create-order", orderCode: data.order.orderCode, planType },
        })
      );
    } catch {
      setErrorMsg("Gagal menghubungi server Neon. Silakan coba lagi.");
      bunyi("salah");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOrderStatus = async () => {
    if (!pendingOrder) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check-order",
          orderCode: pendingOrder.orderCode,
          deviceId,
          studentName: buyerName || store.profile.load().name,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        orderStatus?: "pending" | "paid";
        voucherCode?: string;
        message?: string;
        accessToken?: string;
        license?: Omit<LicenseInfo, "accessToken">;
        soalByBab?: Record<number, Soal[]>;
      };

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Gagal memeriksa status pesanan.");
        setLoading(false);
        return;
      }

      if (data.orderStatus === "paid" && data.license && data.accessToken) {
        const fullLicense: LicenseInfo = {
          ...data.license,
          accessToken: data.accessToken,
        };
        store.license.saveUnlocked(fullLicense, data.soalByBab);
        store.order.save({ ...pendingOrder, status: "paid", voucherCode: data.voucherCode });
        bunyi("badge");
        try {
          confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
        } catch {
          /* ignore */
        }
        setSuccessMsg(
          `Pembayaran Terverifikasi! Kode ${data.voucherCode} aktif & seluruh 7 Bab telah dibuka.`
        );
        setTimeout(() => {
          onUnlocked?.(targetBab);
          onClose();
        }, 1000);
      } else {
        setSuccessMsg(
          data.message ||
            "Pesanan masih menunggu konfirmasi Admin. Klik tombol Konfirmasi WhatsApp di bawah untuk mempercepat."
        );
      }
    } catch {
      setErrorMsg("Gagal memeriksa status pesanan.");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsAppConfirm = (order: PendingOrder) => {
    window.dispatchEvent(
      new CustomEvent("tka-wa-click", { detail: { orderCode: order.orderCode } })
    );
    const paketNama =
      order.planType === "school"
        ? "Lisensi Sekolah/Kelas (40 Siswa) - Rp299.000"
        : "Paket Lulus TKA Individu (3 Perangkat) - Rp35.000";
    const text = encodeURIComponent(
      `Halo Admin Sekawan Digital, saya ingin mengaktifkan akses penuh *TKA Pendidikan Pancasila Kelas VI SD/MI*.\n\n` +
        `• No. Pesanan: *${order.orderCode}*\n` +
        `• Nama: ${order.buyerName}\n` +
        `• Paket: ${paketNama}\n` +
        `• ID Perangkat: ${deviceId}\n\n` +
        `Mohon info QRIS / rekening pembayarannya ya. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, "_blank", "noopener,noreferrer");
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
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" /> Paket Lulus TKA SD/MI
                </span>
                <h2 className="font-display font-bold text-lg text-[var(--fg-primary)] mt-0.5 leading-snug">
                  {targetMeta
                    ? `Buka Bab ${targetMeta.id}: ${targetMeta.judul}`
                    : "Buka Akses Penuh 7 Bab & 245 Soal"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-9 h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg-primary)] shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ringkasan Keuntungan */}
          <div className="mt-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-[var(--fg-secondary)] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Bab 1 Gratis Selamanya • Bab 2–7 Khusus Member PRO</span>
            </div>
            <p className="leading-relaxed">
              Dapatkan akses penuh ke seluruh <strong>56 kartu materi Topik A &amp; B</strong> serta{" "}
              <strong>245 soal latihan Model TKA resmi</strong> (Pilihan Ganda, PG Kompleks,
              Stimulus TKA, Menjodohkan, Isian, dan Uraian) lengkap dengan pembahasan.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                bunyi("klik");
                setTab("voucher");
                setErrorMsg(null);
              }}
              className={`h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === "voucher"
                  ? "bg-emerald-500 text-slate-950 shadow-sm font-bold"
                  : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Masukkan Kode
            </button>
            <button
              type="button"
              onClick={() => {
                bunyi("klik");
                setTab("beli");
                setErrorMsg(null);
              }}
              className={`h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === "beli"
                  ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                  : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Beli Akses PRO
            </button>
          </div>

          {/* Feedback Alert */}
          {errorMsg && (
            <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-200 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: AKTIVASI KODE VOUCHER */}
          {tab === "voucher" && (
            <form onSubmit={handleActivate} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--fg-secondary)] mb-1.5">
                  Kode Voucher / PIN Lisensi Sekolah
                </label>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: TKA-PRO-2026"
                  autoCapitalize="characters"
                  className="w-full h-12 px-4 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-emerald-500 outline-none font-mono font-bold text-sm tracking-wider uppercase text-[var(--fg-primary)]"
                />
              </div>

              <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-[11px] text-[var(--fg-muted)] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  ID Perangkat Ini:
                </span>
                <code className="font-mono font-semibold text-[var(--fg-secondary)]">
                  {deviceId}
                </code>
              </div>

              <TapButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full h-12 text-sm"
              >
                <Unlock className="w-4 h-4" />
                {loading ? "Memverifikasi ke Server Neon..." : "Aktifkan & Buka Semua Bab"}
              </TapButton>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--fg-muted)]">
                <span>Belum punya kode voucher?</span>
                <button
                  type="button"
                  onClick={() => setTab("beli")}
                  className="font-semibold text-amber-600 dark:text-amber-400 underline cursor-pointer"
                >
                  Dapatkan Kode Akses (Rp35.000) &rarr;
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BELI AKSES / CHECKOUT */}
          {tab === "beli" && (
            <div className="mt-4 space-y-3">
              {/* Pilihan Paket */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlanType("individual")}
                  className={`text-left p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    planType === "individual"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      TERLARIS
                    </span>
                  </div>
                  <div className="font-display font-bold text-sm text-[var(--fg-primary)] mt-1.5">
                    Paket Individu
                  </div>
                  <div className="font-display font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                    Rp35.000
                  </div>
                  <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                    Sekali bayar • 3 Perangkat (HP &amp; Laptop)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType("school")}
                  className={`text-left p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    planType === "school"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      KOLEKTIF
                    </span>
                  </div>
                  <div className="font-display font-bold text-sm text-[var(--fg-primary)] mt-1.5">
                    Lisensi Kelas
                  </div>
                  <div className="font-display font-extrabold text-lg text-amber-600 dark:text-amber-400">
                    Rp299.000
                  </div>
                  <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                    1 Kode untuk 40 Perangkat Siswa/Guru
                  </div>
                </button>
              </div>

              {/* Jika sudah ada pesanan pending */}
              {pendingOrder ? (
                <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                      Tagihan Aktif Anda
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(pendingOrder.orderCode);
                        setCopiedOrder(true);
                        setTimeout(() => setCopiedOrder(false), 1500);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                    >
                      {pendingOrder.orderCode}
                      {copiedOrder ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-[var(--fg-muted)]" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-[var(--fg-secondary)] space-y-1">
                    <div>
                      Pemesan: <strong>{pendingOrder.buyerName}</strong> ({pendingOrder.buyerWhatsapp})
                    </div>
                    <div>
                      Nominal:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        Rp{pendingOrder.amountIdr.toLocaleString("id-ID")}
                      </strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <TapButton
                      variant="primary"
                      onClick={() => openWhatsAppConfirm(pendingOrder)}
                      className="w-full h-11 text-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      1. Konfirmasi &amp; Minta QRIS via WhatsApp
                    </TapButton>
                    <TapButton
                      variant="secondary"
                      disabled={loading}
                      onClick={handleCheckOrderStatus}
                      className="w-full h-10 text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      {loading
                        ? "Mengecek Database Neon..."
                        : "2. Cek Status Pembayaran (Otomatis Buka)"}
                    </TapButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      store.order.save(null);
                      setPendingOrder(null);
                    }}
                    className="w-full text-center text-[11px] text-[var(--fg-muted)] underline pt-1"
                  >
                    Buat pesanan baru dengan nomor lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateOrder} className="space-y-2.5">
                  {/* Honeypot anti-spam */}
                  <input
                    type="text"
                    name="website_url_hp"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                  />
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--fg-secondary)] mb-1">
                      Nama Orang Tua / Guru Pemesan *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-emerald-500 outline-none text-xs text-[var(--fg-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--fg-secondary)] mb-1">
                      Nomor WhatsApp Aktif (untuk pengiriman Kode Voucher) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={buyerWhatsapp}
                      onChange={(e) => setBuyerWhatsapp(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-emerald-500 outline-none text-xs text-[var(--fg-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--fg-secondary)] mb-1">
                      Asal SD / MI (Opsional)
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Contoh: SDN Menteng 01"
                      className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-emerald-500 outline-none text-xs text-[var(--fg-primary)]"
                    />
                  </div>
                  <TapButton
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full h-11 text-xs mt-1"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {loading
                      ? "Membuat Pesanan di Server..."
                      : `Pesan Paket ${planType === "school" ? "Sekolah (Rp299.000)" : "Individu (Rp35.000)"}`}
                  </TapButton>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
