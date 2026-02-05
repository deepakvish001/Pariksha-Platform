 import { useRef, useState } from "react";
 import { motion } from "framer-motion";
 import { toPng } from "html-to-image";
 import { Download, Share2, Copy, Check, Twitter, Linkedin, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import { toast } from "sonner";
 import { cn } from "@/lib/utils";
 import { type Achievement, type RarityTier } from "@/components/AchievementBadge";
 import {
   Trophy,
   Flame,
   Target,
   Star,
   Zap,
   Crown,
   Medal,
   Rocket,
   BookOpen,
   GraduationCap,
   Timer,
   CheckCircle,
   Swords,
   Brain,
   Sparkles,
 } from "lucide-react";
 
 const iconMap = {
   trophy: Trophy,
   flame: Flame,
   target: Target,
   star: Star,
   zap: Zap,
   crown: Crown,
   medal: Medal,
   rocket: Rocket,
   book: BookOpen,
   graduation: GraduationCap,
   timer: Timer,
   check: CheckCircle,
   swords: Swords,
   brain: Brain,
   sparkles: Sparkles,
 };
 
 const rarityColors: Record<RarityTier, { bg: string; text: string; border: string }> = {
   common: { bg: "bg-slate-800", text: "text-slate-300", border: "border-slate-600" },
   uncommon: { bg: "bg-green-900", text: "text-green-300", border: "border-green-600" },
   rare: { bg: "bg-blue-900", text: "text-blue-300", border: "border-blue-600" },
   epic: { bg: "bg-purple-900", text: "text-purple-300", border: "border-purple-600" },
   legendary: { bg: "bg-amber-900", text: "text-amber-300", border: "border-amber-500" },
 };
 
 const rarityLabels: Record<RarityTier, string> = {
   common: "Common",
   uncommon: "Uncommon",
   rare: "Rare",
   epic: "Epic",
   legendary: "Legendary",
 };
 
 interface ShareableAchievementCardProps {
   achievement: Achievement;
   earnedAt: string;
   rarity?: { earnedCount: number; percentage: number; rarity: RarityTier };
   username?: string;
 }
 
 const ShareableAchievementCard = ({
   achievement,
   earnedAt,
   rarity,
   username,
 }: ShareableAchievementCardProps) => {
   const cardRef = useRef<HTMLDivElement>(null);
   const [isOpen, setIsOpen] = useState(false);
   const [isGenerating, setIsGenerating] = useState(false);
   const [copied, setCopied] = useState(false);
 
   const Icon = iconMap[achievement.icon];
   const rarityTier = rarity?.rarity || "common";
   const colors = rarityColors[rarityTier];
 
   const handleDownload = async () => {
     if (!cardRef.current) return;
     setIsGenerating(true);
 
     try {
       const dataUrl = await toPng(cardRef.current, {
         cacheBust: true,
         pixelRatio: 2,
         backgroundColor: "#0a0a0a",
       });
 
       const link = document.createElement("a");
       link.download = `achievement-${achievement.id}.png`;
       link.href = dataUrl;
       link.click();
       toast.success("Achievement card downloaded!");
     } catch (error) {
       console.error("Error generating image:", error);
       toast.error("Failed to generate image");
     } finally {
       setIsGenerating(false);
     }
   };
 
   const shareText = `🏆 I just earned the "${achievement.name}" achievement on UniDash! ${rarity ? `Only ${rarity.percentage.toFixed(1)}% of users have this badge!` : ""} #UniDash #Achievement`;
   const shareUrl = window.location.origin;
 
   const handleCopyText = async () => {
     try {
       await navigator.clipboard.writeText(shareText);
       setCopied(true);
       toast.success("Copied to clipboard!");
       setTimeout(() => setCopied(false), 2000);
     } catch (error) {
       toast.error("Failed to copy");
     }
   };
 
   const handleShareTwitter = () => {
     const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
     window.open(url, "_blank", "noopener,noreferrer");
   };
 
   const handleShareLinkedIn = () => {
     const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
     window.open(url, "_blank", "noopener,noreferrer");
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
       <DialogTrigger asChild>
         <Button variant="ghost" size="sm" className="gap-1.5">
           <Share2 className="h-4 w-4" />
           Share
         </Button>
       </DialogTrigger>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Share2 className="h-5 w-5" />
             Share Achievement
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4">
           {/* Preview Card */}
           <div className="flex justify-center">
             <div
               ref={cardRef}
               className={cn(
                 "relative w-80 rounded-xl p-6 border-2",
                 colors.bg,
                 colors.border
               )}
               style={{ backgroundColor: "#0a0a0a" }}
             >
               {/* Background glow */}
               <div
                 className="absolute inset-0 rounded-xl opacity-30"
                 style={{
                   background: `radial-gradient(circle at 50% 30%, ${rarityTier === "legendary" ? "#fbbf24" : rarityTier === "epic" ? "#a855f7" : rarityTier === "rare" ? "#3b82f6" : rarityTier === "uncommon" ? "#22c55e" : "#64748b"}40, transparent 70%)`,
                 }}
               />
 
               <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                 {/* Badge Icon */}
                 <div
                   className={cn(
                     "w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
                     `bg-gradient-to-br ${achievement.color}`
                   )}
                 >
                   <Icon className="w-10 h-10 text-white" />
                 </div>
 
                 {/* Achievement Name */}
                 <div>
                   <h3 className="text-xl font-bold text-white">{achievement.name}</h3>
                   <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                 </div>
 
                 {/* Rarity Badge */}
                 {rarity && (
                   <div
                     className={cn(
                       "px-3 py-1 rounded-full text-xs font-semibold border",
                       colors.text,
                       colors.border
                     )}
                   >
                     {rarityLabels[rarityTier]} • {rarity.percentage.toFixed(1)}% have this
                   </div>
                 )}
 
                 {/* Earned Date */}
                 <p className="text-xs text-gray-500">
                   Earned on {new Date(earnedAt).toLocaleDateString("en-US", {
                     month: "long",
                     day: "numeric",
                     year: "numeric",
                   })}
                 </p>
 
                 {/* Branding */}
                 <div className="pt-2 border-t border-gray-800 w-full">
                   <p className="text-xs text-gray-600">UniDash Achievements</p>
                 </div>
               </div>
             </div>
           </div>
 
           {/* Action Buttons */}
           <div className="flex flex-wrap gap-2 justify-center">
             <Button onClick={handleDownload} disabled={isGenerating} className="gap-2">
               <Download className="h-4 w-4" />
               {isGenerating ? "Generating..." : "Download Image"}
             </Button>
             <Button variant="outline" onClick={handleCopyText} className="gap-2">
               {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
               Copy Text
             </Button>
           </div>
 
           {/* Social Share */}
           <div className="flex gap-2 justify-center pt-2 border-t">
             <Button variant="ghost" size="sm" onClick={handleShareTwitter} className="gap-2">
               <Twitter className="h-4 w-4" />
               Share on X
             </Button>
             <Button variant="ghost" size="sm" onClick={handleShareLinkedIn} className="gap-2">
               <Linkedin className="h-4 w-4" />
               LinkedIn
             </Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default ShareableAchievementCard;