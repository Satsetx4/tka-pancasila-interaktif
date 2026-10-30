import React from "react";
import { cn } from "../../lib/utils";
import { ScrollProgress } from "../ui/ScrollProgress";

interface Props {
  children: React.ReactNode;
  className?: string;
  hasBottomNav?: boolean;
}

export const MobileContainer: React.FC<Props> = ({
  children,
  className,
  hasBottomNav = true,
}) => (
  <div className="min-h-screen bg-slate-200/80 text-slate-900 flex justify-center selection:bg-emerald-500/30 dark:bg-[#070a10] dark:text-slate-100">
    <ScrollProgress />
    <div
      className={cn(
        "w-full max-w-md min-h-screen flex flex-col relative border-x shadow-2xl",
        "bg-slate-50 border-slate-200/90 shadow-slate-400/20",
        "dark:bg-slate-900/95 dark:border-slate-800/80 dark:shadow-black/60",
        hasBottomNav && "pb-24",
        className
      )}
    >
      {children}
    </div>
  </div>
);
