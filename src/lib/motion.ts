import type { Transition, Variants } from "framer-motion";

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 28,
};

export const springSmooth: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 28,
      delay: i * 0.045,
    },
  }),
};

export const slideHorizontal: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir >= 0 ? 40 : -40,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: springSnappy,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir >= 0 ? -40 : 40,
    transition: { duration: 0.16 },
  }),
};
