import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export const AppHeader: React.FC<Props> = ({ title, subtitle, onBack, backLabel = "Kembali", rightAction, className }) => (
  <header className={cn("sticky top-0 z-40 w-full px-4 py-3 backdrop-blur-md border-b flex items-center justify-between",
    "bg-white/85 border-slate-200/80", "dark:bg-slate-900/85 dark:border-slate-800/80", className)}>
    <div className="flex items-center gap-3 min-w-0">
      {onBack && (
        <motion.button whileTap={{ scale: 0.92 }} onClick={onBack}
          className="flex items-center justify-center p-2 -ml-2 min-w-[44px] min-h-[44px] rounded-xl transition-colors cursor-pointer text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label={backLabel} title={backLabel}>
          <ArrowLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </motion.button>
      )}
      <div className="flex flex-col min-w-0">
        <h1 className="text-base font-semibold truncate tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs truncate text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {rightAction && <div className="flex items-center gap-2 shrink-0">{rightAction}</div>}
  </header>
);
