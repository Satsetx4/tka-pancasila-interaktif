import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

interface Props extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "bordered" | "glow";
  isInteractive?: boolean;
}

export const LivingCard: React.FC<Props> = ({ children, variant = "default", isInteractive = false, className, ...props }) => {
  const variants = {
    default: "bg-white border-slate-200/80 shadow-slate-400/10 dark:bg-slate-900/90 dark:border-slate-800/80 dark:shadow-black/20",
    glass: "bg-white/60 backdrop-blur-md border-slate-300/50 dark:bg-slate-900/60 dark:border-slate-700/50",
    bordered: "bg-transparent border-slate-300 dark:border-slate-800",
    glow: "bg-white border-emerald-500/40 shadow-emerald-500/10 dark:bg-slate-900/80 dark:border-emerald-500/30",
  };
  return (
    <motion.div
      whileHover={isInteractive ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={isInteractive ? { scale: 0.985 } : undefined}
      className={cn("rounded-2xl p-4 border shadow-md transition-all duration-200", variants[variant], isInteractive && "cursor-pointer", className)} {...props}>
      {children}
    </motion.div>
  );
};
