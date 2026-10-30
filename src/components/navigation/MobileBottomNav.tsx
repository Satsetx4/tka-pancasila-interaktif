import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface NavItem { id: string; label: string; icon: LucideIcon; badge?: string | number; }
interface Props { items: NavItem[]; activeId: string; onChange: (id: string) => void; }

export const MobileBottomNav: React.FC<Props> = ({ items, activeId, onChange }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-3 py-2 backdrop-blur-xl border-t shadow-lg bg-white/90 border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800/80">
    <ul className="flex items-center justify-around gap-1 p-0 m-0 list-none">
      {items.map((item) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;
        return (
          <li key={item.id} className="flex-1">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onChange(item.id)}
              className={cn("relative w-full py-2 px-1 min-h-[52px] flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors cursor-pointer focus:outline-none",
                isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400")}
              aria-current={isActive ? "page" : undefined}>
              {isActive && (
                <motion.div layoutId="bottomNavActivePill" className="absolute inset-0 bg-emerald-500/10 rounded-xl border border-emerald-500/25"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              <span className="relative z-10"><Icon className="w-5 h-5" /></span>
              <span className="relative z-10 text-[11px]">{item.label}</span>
            </motion.button>
          </li>
        );
      })}
    </ul>
  </nav>
);
