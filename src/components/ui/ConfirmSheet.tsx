import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { TapButton } from "./TapButton";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Bottom sheet konfirmasi: tombol X + Batal + aksi, tap-outside tutup. */
export const ConfirmSheet: React.FC<Props> = ({
  open, title, message, confirmLabel = "Ya, lanjut", danger, onConfirm, onClose,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
        <motion.div
          initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="relative w-full max-w-md rounded-t-3xl p-5 pb-8 border-t bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
          role="dialog" aria-modal="true" aria-label={title}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl ${danger ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"}`}>
                {danger ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </span>
              <h3 className="font-display font-bold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <button onClick={onClose} aria-label="Tutup"
              className="p-2 -m-1 min-w-[44px] min-h-[44px] rounded-xl text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <TapButton variant="secondary" onClick={onClose}>Batal</TapButton>
            <TapButton variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</TapButton>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
