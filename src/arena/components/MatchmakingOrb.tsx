import { motion } from "framer-motion";

export function MatchmakingOrb({ label = "Searching for opponent" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="relative h-48 w-48">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-cyan-400/50"
            animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
          style={{ boxShadow: "0 0 60px rgba(34,211,238,0.6), inset 0 0 40px rgba(217,70,239,0.4)" }}
        />
        <div className="absolute inset-12 rounded-full bg-black/60 backdrop-blur" />
      </div>
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">{label}</p>
    </div>
  );
}
