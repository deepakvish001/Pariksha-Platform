import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, RotateCcw, Check, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import XPLevelBadge from "@/components/XPLevelBadge";
import { useSRSSettings, DEFAULT_SRS_INTERVALS, DEFAULT_MASTERY_THRESHOLD } from "@/hooks/useSRSSettings";
import SettingsCard from "./SettingsCard";

const SettingsLearningTab = () => {
  const {
    settings: srsSettings,
    isLoading: srsLoading,
    isSaving: srsSaving,
    updateSettings: updateSRSSettings,
    resetToDefaults,
  } = useSRSSettings();

  const [localSRSIntervals, setLocalSRSIntervals] = useState<number[]>(DEFAULT_SRS_INTERVALS);
  const [localMasteryThreshold, setLocalMasteryThreshold] = useState(DEFAULT_MASTERY_THRESHOLD);

  useEffect(() => {
    if (!srsLoading) {
      setLocalSRSIntervals(srsSettings.intervals);
      setLocalMasteryThreshold(srsSettings.masteryThreshold);
    }
  }, [srsLoading, srsSettings]);

  const handleSave = () => {
    updateSRSSettings({
      intervals: localSRSIntervals,
      masteryThreshold: localMasteryThreshold,
    });
  };

  const ordinalSuffix = (n: number) => {
    if (n === 1) return "st";
    if (n === 2) return "nd";
    if (n === 3) return "rd";
    return "th";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* XP & Level Card */}
      <SettingsCard delay={0}>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">XP & Level</h2>
        </div>

        <div className="flex flex-col items-center py-4">
          <XPLevelBadge showProgress />
          <p className="text-sm text-muted-foreground text-center mt-4 max-w-md">
            Earn XP by completing quizzes, mastering spaced repetition questions, and maintaining streaks.
            Level up to unlock titles and track your progress!
          </p>
        </div>

        {/* Stats preview */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: "Quiz Complete", xp: "+10 XP", icon: TrendingUp },
            { label: "Question Mastered", xp: "+5 XP", icon: Brain },
            { label: "Daily Streak", xp: "+25 XP", icon: Zap },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="p-3 rounded-xl bg-secondary/30 border border-border text-center"
            >
              <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-semibold text-primary">{stat.xp}</p>
            </motion.div>
          ))}
        </div>
      </SettingsCard>

      {/* Spaced Repetition Settings Card */}
      <SettingsCard delay={0.05}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Brain className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Spaced Repetition</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            disabled={srsSaving}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="space-y-8">
          {/* Mastery Threshold */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-base text-foreground">Mastery Threshold</Label>
              <p className="text-sm text-muted-foreground">
                Number of consecutive correct answers to master a question
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Slider
                value={[localMasteryThreshold]}
                onValueChange={([v]) => setLocalMasteryThreshold(v)}
                min={2}
                max={5}
                step={1}
                className="flex-1"
              />
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{localMasteryThreshold}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Review Intervals */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-base text-foreground">Review Intervals (days)</Label>
              <p className="text-sm text-muted-foreground">
                Days between reviews for each correct answer streak
              </p>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {localSRSIntervals.map((interval, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + idx * 0.03 }}
                  className="space-y-1"
                >
                  <Label htmlFor={`srs-interval-${idx}`} className="text-xs text-center block text-muted-foreground">
                    {idx + 1}{ordinalSuffix(idx + 1)}
                  </Label>
                  <Input
                    id={`srs-interval-${idx}`}
                    type="number"
                    min={1}
                    max={120}
                    value={interval}
                    onChange={(e) => {
                      const newIntervals = [...localSRSIntervals];
                      newIntervals[idx] = Math.max(1, parseInt(e.target.value) || 1);
                      setLocalSRSIntervals(newIntervals);
                    }}
                    className="text-center bg-secondary/50 border-border"
                  />
                </motion.div>
              ))}
            </div>

            {/* Visual timeline */}
            <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">Review Schedule Preview</p>
              <div className="flex items-center justify-between">
                {localSRSIntervals.map((interval, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                    <span className="text-xs text-muted-foreground mt-1">{interval}d</span>
                  </div>
                ))}
              </div>
              <div className="relative mt-1 h-0.5 bg-border rounded-full">
                <div className="absolute left-0 top-0 h-full w-[14%] bg-gradient-to-r from-emerald-500 to-emerald-500/50 rounded-full" />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={srsSaving} className="w-full">
            {srsSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Learning Settings
          </Button>
        </div>
      </SettingsCard>
    </motion.div>
  );
};

export default SettingsLearningTab;
