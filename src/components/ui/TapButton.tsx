import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface TapButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const TapButton: React.FC<TapButtonProps> = ({ children, variant = "primary", size = "md", isLoading = false, fullWidth = false, className, disabled, ...props }) => {
  const sizes = { sm: "h-9 px-3 text-xs gap-1.5", md: "h-11 px-4 text-sm gap-2 min-h-[44px]", lg: "h-13 px-6 text-base gap-2.5 min-h-[48px]" };
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500 font-semibold shadow-md shadow-emerald-600/25 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400",
    secondary: "bg-slate-200 text-slate-800 border border-slate-300/60 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700/60",
    outline: "bg-transparent border border-slate-300/80 text-slate-700 dark:text-slate-200 dark:border-slate-700/80",
    ghost: "bg-transparent text-slate-600 dark:text-slate-300",
    danger: "bg-rose-500/15 text-rose-600 border border-rose-500/30 dark:text-rose-300",
  };
  return (
    <motion.button whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      disabled={disabled || isLoading}
      className={cn("inline-flex items-center justify-center font-medium rounded-xl transition-colors select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        sizes[size], variants[variant], fullWidth && "w-full", className)} {...props}>
      {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Memproses...</span></>) : children}
    </motion.button>
  );
};
