import { motion } from "framer-motion";

const AstraBackground = () => {
  return (
    <div className="fixed inset-0 bg-background overflow-hidden pointer-events-none">
      {/* Radial gradient base - theme aware */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.03)_0%,_transparent_70%)]" />
      
      {/* Animated gradient orbs - Dark mode */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] dark:opacity-100 opacity-50"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.06, 0.12, 0.06],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-purple-600/8 dark:bg-purple-600/8 bg-purple-500/5 rounded-full blur-[130px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute -bottom-20 left-1/3 w-[450px] h-[450px] bg-blue-600/6 dark:bg-blue-600/6 bg-blue-500/5 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1.1, 0.9, 1.1],
          opacity: [0.04, 0.08, 0.04],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-1/2 left-1/4 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px]"
      />

      {/* Grid overlay - theme aware */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.03) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground) / 0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Vignette effect - theme aware */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background)/0.5)_100%)]" />
    </div>
  );
};

export default AstraBackground;
