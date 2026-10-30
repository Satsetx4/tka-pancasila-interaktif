import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

/** Toggle gelap/terang 44px, ikon animasi putar. */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const dark = theme === "dark";
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
      className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border transition-colors cursor-pointer bg-slate-200/60 border-slate-300/60 text-slate-600 hover:bg-slate-300/60 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.span>
    </motion.button>
  );
};
