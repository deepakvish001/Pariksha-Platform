import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isLoading: boolean;
  progress: number;
  loadingStage?: string;
}

const LoadingScreen = ({ isLoading, progress, loadingStage = "Loading..." }: LoadingScreenProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-full blur-3xl"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-orange-500/15 via-transparent to-transparent rounded-full blur-3xl"
              animate={{
                rotate: [360, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-8">
            {/* Animated logo container */}
            <motion.div
              className="relative"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Outer pulsing rings */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 via-orange-500/30 to-amber-500/40"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                style={{ filter: "blur(20px)" }}
              />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 via-orange-500/20 to-amber-500/30"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.3,
                }}
                style={{ filter: "blur(30px)" }}
              />

              {/* Rotating glow ring */}
              <motion.div
                className="absolute -inset-4 rounded-3xl"
                style={{
                  background: "conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent, hsl(24 95% 53%), transparent)",
                  filter: "blur(8px)",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Logo container with gradient border */}
              <motion.div
                className={cn(
                  "relative rounded-2xl overflow-hidden",
                  "bg-gradient-to-br from-primary/30 via-orange-500/20 to-amber-500/30",
                  "p-[3px]"
                )}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(249, 115, 22, 0.3)",
                    "0 0 40px rgba(249, 115, 22, 0.5)",
                    "0 0 20px rgba(249, 115, 22, 0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="bg-background rounded-[13px] p-2">
                  <motion.img
                    src="/logo.png"
                    alt="Byteskill"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </motion.div>

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                  animate={{ translateX: ["-100%", "200%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Brand text */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.h1
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Byteskill
              </motion.h1>
              <motion.p
                className="text-sm sm:text-base text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Master your tech career
              </motion.p>
            </motion.div>

            {/* Progress bar section */}
            <motion.div
              className="w-64 sm:w-80 space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {/* Progress bar container */}
              <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm">
                {/* Animated background shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ translateX: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                
                {/* Progress fill */}
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: "linear-gradient(90deg, hsl(var(--primary)), hsl(24 95% 53%), hsl(45 93% 47%))",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Shine effect on progress bar */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ translateX: ["-100%", "200%"] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>

                {/* Glow effect at progress tip */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                  style={{
                    left: `calc(${progress}% - 8px)`,
                    background: "hsl(var(--primary))",
                    boxShadow: "0 0 12px 4px hsl(var(--primary) / 0.5)",
                  }}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    scale: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Progress info */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <motion.span
                  className="text-muted-foreground"
                  key={loadingStage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {loadingStage}
                </motion.span>
                <motion.span
                  className="font-medium text-primary tabular-nums"
                  key={progress}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {Math.round(progress)}%
                </motion.span>
              </div>
            </motion.div>

            {/* Loading dots indicator */}
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/60"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
