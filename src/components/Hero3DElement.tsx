import { motion } from "framer-motion";
import heroIllustration from "@/assets/hero-illustration-3d.png";

const Hero3DElement = () => {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[500px] lg:w-[500px] lg:h-[650px] pointer-events-none hidden lg:block">
      {/* Decorative background elements */}
      <motion.div
        className="absolute top-10 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Floating decorative shapes */}
      <motion.div
        className="absolute top-20 right-8 w-4 h-4 bg-primary rounded-full"
        animate={{
          y: [-10, 10, -10],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-40 right-4 w-3 h-3 bg-orange-400 rounded-full"
        animate={{
          y: [10, -10, 10],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute bottom-32 right-16 w-2 h-2 bg-primary/80 rounded-full"
        animate={{
          y: [-8, 8, -8],
          x: [-4, 4, -4],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Main illustration with floating animation */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.img
          src={heroIllustration}
          alt="Professional woman working"
          className="w-full h-full object-contain drop-shadow-2xl"
          animate={{
            y: [-8, 8, -8],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Decorative ring */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-primary/10 rounded-full"
        animate={{
          rotate: 360,
          scale: [1, 1.02, 1],
        }}
        transition={{
          rotate: {
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />
    </div>
  );
};

export default Hero3DElement;
