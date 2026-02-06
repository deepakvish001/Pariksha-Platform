import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const AstraTypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-500 rounded-full blur-md opacity-40" />
        <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 border border-white/[0.1] flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="rounded-2xl px-5 py-4 bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AstraTypingIndicator;
