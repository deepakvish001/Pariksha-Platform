import { Construction, Lock } from "lucide-react";
import { motion } from "framer-motion";

const UnderConstruction = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md space-y-6"
      >
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <div className="relative flex items-center justify-center w-full h-full bg-primary/5 border-2 border-dashed border-primary/30 rounded-full">
            <Construction className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-muted border border-border rounded-full p-1.5">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Under Process</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This feature is currently being built and will be available soon. Stay tuned for updates!
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default UnderConstruction;
