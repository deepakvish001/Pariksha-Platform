import { motion } from "framer-motion";
import heroCharacter from "@/assets/hero-3d-final.png";

const Hero3DElement = () => {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[380px] h-[550px] lg:w-[480px] lg:h-[680px] pointer-events-none hidden lg:block">
      {/* Subtle glow behind character */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles around character */}
      <motion.div
        className="absolute top-16 right-12 w-3 h-3 bg-primary rounded-full"
        animate={{
          y: [-15, 15, -15],
          x: [-5, 5, -5],
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-32 left-4 w-2 h-2 bg-orange-400 rounded-full"
        animate={{
          y: [10, -10, 10],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
      <motion.div
        className="absolute bottom-24 right-8 w-2.5 h-2.5 bg-primary/80 rounded-full"
        animate={{
          y: [-10, 10, -10],
          x: [5, -5, 5],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
      />

      {/* Main 3D character with animations */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <motion.img
          src={heroCharacter}
          alt="Professional 3D character"
          className="w-full h-full object-contain"
          animate={{
            y: [-6, 6, -6],
            rotate: [-0.5, 0.5, -0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Sparkle effects */}
      <motion.div
        className="absolute top-20 right-20 w-1.5 h-1.5 bg-primary rounded-full"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.5, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-40 left-16 w-1 h-1 bg-orange-300 rounded-full"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.5, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      />
      <motion.div
        className="absolute bottom-32 right-24 w-1 h-1 bg-primary/80 rounded-full"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.5, 0.5],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />
    </div>
  );
};

export default Hero3DElement;
