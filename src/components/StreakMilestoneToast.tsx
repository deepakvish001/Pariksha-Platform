 import { useEffect, useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Flame, X, Trophy, Star, Crown, Sparkles } from "lucide-react";
 import { cn } from "@/lib/utils";
 import confetti from "canvas-confetti";
 
 interface StreakMilestoneToastProps {
   streak: number;
   isVisible: boolean;
   onClose: () => void;
 }
 
 const milestones = [
   { days: 7, title: "Week Warrior!", icon: Star, color: "from-blue-500 to-cyan-500", message: "7-day streak! You're building great habits!" },
   { days: 14, title: "Fortnight Fighter!", icon: Flame, color: "from-orange-500 to-amber-500", message: "14-day streak! Two weeks of dedication!" },
   { days: 30, title: "Monthly Master!", icon: Trophy, color: "from-amber-500 to-yellow-400", message: "30-day streak! A full month of consistency!" },
   { days: 60, title: "Elite Achiever!", icon: Crown, color: "from-purple-500 to-pink-500", message: "60-day streak! You're unstoppable!" },
   { days: 100, title: "Legendary!", icon: Sparkles, color: "from-rose-500 to-red-500", message: "100-day streak! Absolutely legendary!" },
 ];
 
 const StreakMilestoneToast = ({ streak, isVisible, onClose }: StreakMilestoneToastProps) => {
   const milestone = milestones.find((m) => m.days === streak);
 
   useEffect(() => {
     if (isVisible && milestone) {
       // Fire confetti!
       confetti({
         particleCount: 100,
         spread: 70,
         origin: { y: 0.6 },
         colors: ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"],
       });
 
       // Auto-close after 5 seconds
       const timer = setTimeout(() => {
         onClose();
       }, 5000);
 
       return () => clearTimeout(timer);
     }
   }, [isVisible, milestone, onClose]);
 
   if (!milestone) return null;
 
   const Icon = milestone.icon;
 
   return (
     <AnimatePresence>
       {isVisible && (
         <motion.div
           initial={{ opacity: 0, y: -100, scale: 0.8 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -50, scale: 0.8 }}
           className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
         >
           <div
             className={cn(
               "relative overflow-hidden rounded-2xl border border-white/20 p-6 shadow-2xl",
               "bg-gradient-to-br",
               milestone.color
             )}
           >
             <button
               onClick={onClose}
               aria-label="Close"
               className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
             >
               <X className="h-4 w-4 text-white" />
             </button>
 
             <div className="flex items-center gap-4">
               <motion.div
                 animate={{
                   scale: [1, 1.2, 1],
                   rotate: [0, 10, -10, 0],
                 }}
                 transition={{
                   duration: 0.6,
                   repeat: Infinity,
                   repeatDelay: 1,
                 }}
                 className="flex-shrink-0 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"
               >
                 <Icon className="h-8 w-8 text-white" />
               </motion.div>
 
               <div className="flex-1 text-white">
                 <div className="flex items-center gap-2">
                   <span className="text-4xl font-bold">{streak}</span>
                   <Flame className="h-6 w-6" />
                 </div>
                 <h3 className="text-xl font-bold">{milestone.title}</h3>
                 <p className="text-sm text-white/80">{milestone.message}</p>
               </div>
             </div>
 
             {/* Decorative elements */}
             <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
             <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-white/10 blur-lg" />
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 };
 
 export default StreakMilestoneToast;