 import { useEffect, useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import confetti from "canvas-confetti";
 import { Star, Sparkles, Crown, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { LEVEL_TITLES } from "@/hooks/useXPSystem";
 
 interface LevelUpCelebrationProps {
   level: number;
   onClose: () => void;
 }
 
 const LevelUpCelebration = ({ level, onClose }: LevelUpCelebrationProps) => {
   const [showDetails, setShowDetails] = useState(false);
   const title = LEVEL_TITLES[level - 1] || "Ultimate";
 
   useEffect(() => {
     // Initial burst
     const duration = 3000;
     const end = Date.now() + duration;
 
     const frame = () => {
       confetti({
         particleCount: 3,
         angle: 60,
         spread: 55,
         origin: { x: 0, y: 0.7 },
         colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#8b5cf6"],
       });
       confetti({
         particleCount: 3,
         angle: 120,
         spread: 55,
         origin: { x: 1, y: 0.7 },
         colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#8b5cf6"],
       });
 
       if (Date.now() < end) {
         requestAnimationFrame(frame);
       }
     };
 
     frame();
 
     // Center burst
     setTimeout(() => {
       confetti({
         particleCount: 150,
         spread: 100,
         origin: { y: 0.5 },
         colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#8b5cf6"],
       });
       setShowDetails(true);
     }, 500);
   }, []);
 
   return (
     <AnimatePresence>
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
         onClick={onClose}
       >
         <motion.div
           initial={{ scale: 0, rotate: -10 }}
           animate={{ scale: 1, rotate: 0 }}
           exit={{ scale: 0, rotate: 10 }}
           transition={{ type: "spring", stiffness: 200, damping: 20 }}
           onClick={(e) => e.stopPropagation()}
           className="relative max-w-md w-full mx-4 p-8 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-primary/20 border border-amber-500/30 shadow-2xl"
         >
           <Button
             variant="ghost"
             size="icon"
             className="absolute top-4 right-4"
             aria-label="Close"
             onClick={onClose}
           >
             <X className="h-4 w-4" />
           </Button>
 
           <div className="text-center space-y-6">
             {/* Animated crown/star */}
             <motion.div
               animate={{
                 scale: [1, 1.2, 1],
                 rotate: [0, 5, -5, 0],
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut",
               }}
               className="flex justify-center"
             >
               <div className="relative">
                 <div className="absolute inset-0 animate-ping">
                   <Sparkles className="h-20 w-20 text-amber-400/50" />
                 </div>
                 <Crown className="h-20 w-20 text-amber-500 fill-amber-500/30" />
               </div>
             </motion.div>
 
             {/* Level up text */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
             >
               <p className="text-sm font-medium text-amber-500 uppercase tracking-wider">
                 Level Up!
               </p>
               <h2 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-primary bg-clip-text text-transparent mt-2">
                 Level {level}
               </h2>
             </motion.div>
 
             {/* Title */}
             <AnimatePresence>
               {showDetails && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.2 }}
                   className="space-y-4"
                 >
                   <div className="flex items-center justify-center gap-2">
                     <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                     <span className="text-xl font-semibold">{title}</span>
                     <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                   </div>
                   
                   <p className="text-muted-foreground">
                     You've reached a new milestone! Keep up the amazing work.
                   </p>
 
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.5 }}
                   >
                     <Button
                       onClick={onClose}
                       className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                     >
                       Continue Learning
                     </Button>
                   </motion.div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
         </motion.div>
       </motion.div>
     </AnimatePresence>
   );
 };
 
 export default LevelUpCelebration;