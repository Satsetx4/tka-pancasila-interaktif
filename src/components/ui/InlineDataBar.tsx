import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface Props {
  label: string;
  sublabel?: string;
  value: number;
  max: number;
  formatValue?: (val: number) => string;
  color?: "emerald" | "amber" | "rose" | "sky" | "auto";
  className?: string;
}

export const InlineDataBar: React.FC<Props> = ({ label, sublabel, value, max, formatValue = (v) => v.toLocaleString("id-ID"), color = "emerald", className }) => {
  const pct = Math.min(Math.round((value / (max || 1)) * 100), 100);
  const resolved = color === "auto" ? (pct > 90 ? "rose" : pct > 70 ? "amber" : "emerald") : color;
  const themes = {
    emerald: { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
    amber: { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
    rose: { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
    sky: { bar: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
  };
  const t = themes[resolved];
  return (
    <div className={cn("w-full space-y-1.5 py-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="font-medium truncate text-slate-800 dark:text-slate-200">{label}</span>
          {sublabel && <span className="text-[11px] truncate text-slate-500">{sublabel}</span>}
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{formatValue(value)}</span>
          <span className={cn("text-[11px] font-medium", t.text)}>{pct}%</span>
        </div>
      </div>
      <div className="relative w-full h-2 rounded-full overflow-hidden bg-slate-200/90 dark:bg-slate-800/90">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }} className={cn("h-full rounded-full", t.bar)} />
      </div>
    </div>
  );
};
