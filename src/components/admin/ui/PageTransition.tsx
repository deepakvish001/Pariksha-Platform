import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Framer-motion wrapper applied by AdminShell so every admin page
 * fades + rises on route change. Keep the durations short (180ms) so
 * keyboard-heavy ops users don't feel any drag.
 */
export const PageTransition = ({ children, k }: { children: ReactNode; k: string }) => (
  <motion.div
    key={k}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    className="relative"
  >
    {children}
  </motion.div>
);
