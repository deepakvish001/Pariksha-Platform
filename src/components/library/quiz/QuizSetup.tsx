 import { motion } from "framer-motion";
 import { X, Clock, Zap, Settings, Play, Shuffle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Slider } from "@/components/ui/slider";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { cn } from "@/lib/utils";
 import { categoryConfig, type QuizQuestion } from "./types";
 
 interface QuizSetupProps {
   onClose: () => void;
   onStartQuiz: (preset?: QuizPreset) => void;
   questionCount: number;
   setQuestionCount: (count: number) => void;
   enabledCategories: Record<string, boolean>;
   setEnabledCategories: (cats: Record<string, boolean>) => void;
   timedMode: boolean;
   setTimedMode: (timed: boolean) => void;
   timeLimitMinutes: number;
   setTimeLimitMinutes: (mins: number) => void;
   allQuestionsCount: number;
 }
 
 export interface QuizPreset {
   name: string;
   questions: number;
   categories: readonly ("dsa" | "cs" | "sql" | "aptitude")[];
   timeLimit: number;
 }
 
 export const presets: QuizPreset[] = [
   { name: "Quick Mix", questions: 10, categories: ["dsa", "cs", "sql", "aptitude"] as const, timeLimit: 0 },
   { name: "DSA Focus", questions: 15, categories: ["dsa", "cs"] as const, timeLimit: 0 },
   { name: "Database Master", questions: 15, categories: ["sql", "cs"] as const, timeLimit: 0 },
   { name: "Sprint (5 min)", questions: 10, categories: ["dsa", "cs", "sql", "aptitude"] as const, timeLimit: 300 },
   { name: "Blitz (10 min)", questions: 20, categories: ["dsa", "cs", "sql", "aptitude"] as const, timeLimit: 600 },
 ];
 
 const QuizSetup = ({
   onClose,
   onStartQuiz,
   questionCount,
   setQuestionCount,
   enabledCategories,
   setEnabledCategories,
   timedMode,
   setTimedMode,
   timeLimitMinutes,
   setTimeLimitMinutes,
   allQuestionsCount,
 }: QuizSetupProps) => {
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
             <Shuffle className="h-6 w-6 text-primary" />
           </div>
           <div>
             <h2 className="text-2xl font-bold">Combined Quiz</h2>
             <p className="text-muted-foreground">Mix questions from all categories</p>
           </div>
         </div>
         <Button variant="ghost" size="icon" onClick={onClose}>
           <X className="h-5 w-5" />
         </Button>
       </div>
 
       {/* Quick Presets */}
       <div>
         <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
           {presets.map((preset) => (
             <Card 
               key={preset.name}
               className="cursor-pointer hover:border-primary/50 transition-colors"
               onClick={() => onStartQuiz(preset)}
             >
               <CardContent className="p-4 text-center">
                 <div className="flex items-center justify-center gap-1 mb-2">
                   {preset.timeLimit > 0 ? (
                     <Clock className="h-4 w-4 text-orange-500" />
                   ) : (
                     <Zap className="h-4 w-4 text-primary" />
                   )}
                 </div>
                 <p className="font-medium text-sm">{preset.name}</p>
                 <p className="text-xs text-muted-foreground">{preset.questions} questions</p>
               </CardContent>
             </Card>
           ))}
         </div>
       </div>
 
       {/* Custom Setup */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Settings className="h-5 w-5" />
             Custom Quiz
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           {/* Categories */}
           <div>
             <Label className="text-sm font-medium mb-3 block">Categories</Label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((cat) => {
                 const config = categoryConfig[cat];
                 const Icon = config.icon;
                 return (
                   <div
                     key={cat}
                     onClick={() => setEnabledCategories({ ...enabledCategories, [cat]: !enabledCategories[cat] })}
                     className={cn(
                       "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                       enabledCategories[cat] 
                         ? `${config.bgColor} ${config.borderColor}` 
                         : "bg-muted/50 opacity-50"
                     )}
                   >
                     <Icon className={cn("h-5 w-5", config.color)} />
                     <span className="font-medium text-sm">{config.label}</span>
                   </div>
                 );
               })}
             </div>
           </div>
 
           {/* Question Count */}
           <div>
             <Label className="text-sm font-medium mb-3 block">
               Questions: {questionCount} (Available: {allQuestionsCount})
             </Label>
             <Slider
               value={[questionCount]}
               onValueChange={([v]) => setQuestionCount(v)}
               min={5}
               max={Math.min(50, allQuestionsCount)}
               step={5}
             />
           </div>
 
           {/* Timed Mode */}
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Clock className="h-4 w-4 text-muted-foreground" />
               <Label>Timed Mode</Label>
             </div>
             <Switch checked={timedMode} onCheckedChange={setTimedMode} />
           </div>
 
           {timedMode && (
             <div>
               <Label className="text-sm font-medium mb-3 block">
                 Time Limit: {timeLimitMinutes} minutes
               </Label>
               <Slider
                 value={[timeLimitMinutes]}
                 onValueChange={([v]) => setTimeLimitMinutes(v)}
                 min={5}
                 max={60}
                 step={5}
               />
             </div>
           )}
 
           <Button 
             className="w-full" 
             size="lg"
             onClick={() => onStartQuiz()}
             disabled={Object.values(enabledCategories).every(v => !v) || allQuestionsCount === 0}
           >
             <Play className="h-5 w-5 mr-2" />
             Start Quiz
           </Button>
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default QuizSetup;