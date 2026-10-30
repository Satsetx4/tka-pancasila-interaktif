import React from "react";
import {
  ShieldCheck,
  HeartHandshake,
  Scale,
  MessagesSquare,
  Globe2,
  MapPinned,
  UsersRound,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { BabMeta } from "../../lib/store";

interface Props {
  bab: number;
  warna?: BabMeta["warna"];
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: ShieldCheck,
  2: HeartHandshake,
  3: Scale,
  4: MessagesSquare,
  5: Globe2,
  6: MapPinned,
  7: UsersRound,
};

const COLOR_STYLES: Record<BabMeta["warna"], string> = {
  emerald:
    "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  amber:
    "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  sky: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  violet:
    "bg-violet-500/15 text-violet-600 border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30",
  rose: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
  cyan: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30",
  lime: "bg-lime-500/15 text-lime-600 border-lime-500/30 dark:bg-lime-500/15 dark:text-lime-400 dark:border-lime-500/30",
};

export const BabBadgeIcon: React.FC<Props> = ({
  bab,
  warna = "emerald",
  size = "md",
  className,
}) => {
  const Icon = ICONS[bab] ?? ShieldCheck;
  const sizeClasses = {
    sm: "w-9 h-9 rounded-xl",
    md: "w-12 h-12 rounded-2xl",
    lg: "w-14 h-14 rounded-2xl",
  };
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center border shrink-0 shadow-xs",
        sizeClasses[size],
        COLOR_STYLES[warna],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
};
