import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Target, Calendar, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, Clock, Edit2, Trash2, Bell, BellOff, Sparkles 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { format, addWeeks, addMonths } from "date-fns";
import { useRoadmapLearningGoals, type GoalProgress } from "@/hooks/useRoadmapLearningGoals";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Skeleton } from "@/components/ui/skeleton";

interface LearningGoalCardProps {
  roadmapId: string;
  roadmapTitle: string;
  totalTopics: number;
  completedTopics: number;
  className?: string;
}

const LearningGoalCard: React.FC<LearningGoalCardProps> = ({
  roadmapId,
  roadmapTitle,
  totalTopics,
  completedTopics,
  className,
}) => {
  const { goal, isLoading, isSaving, saveGoal, deleteGoal, getGoalProgress } = 
    useRoadmapLearningGoals(roadmapId, totalTopics, completedTopics);
  const { permission, isSubscribed, subscribe, unsubscribe, isSupported } = usePushNotifications();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    goal?.target_completion_date ? new Date(goal.target_completion_date) : addMonths(new Date(), 1)
  );
  const [weeklyTarget, setWeeklyTarget] = useState(goal?.weekly_topics_target || 5);
  const [reminderEnabled, setReminderEnabled] = useState(goal?.reminder_enabled ?? true);

  const progress = getGoalProgress();
  const remainingTopics = totalTopics - completedTopics;

  const handleSave = async () => {
    if (!targetDate) return;
    
    const success = await saveGoal(targetDate, weeklyTarget, reminderEnabled);
    if (success) {
      setIsDialogOpen(false);
      // If reminders enabled and no push subscription, prompt to subscribe
      if (reminderEnabled && !isSubscribed && isSupported) {
        await subscribe();
      }
    }
  };

  const handleDelete = async () => {
    await deleteGoal();
    setIsDialogOpen(false);
  };

  const getQuickDateOptions = () => [
    { label: "2 weeks", date: addWeeks(new Date(), 2) },
    { label: "1 month", date: addMonths(new Date(), 1) },
    { label: "2 months", date: addMonths(new Date(), 2) },
    { label: "3 months", date: addMonths(new Date(), 3) },
  ];

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No goal set - show prompt
  if (!goal) {
    return (
      <Card className={cn("overflow-hidden border-dashed", className)}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Set a Learning Goal</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Stay motivated by setting a target completion date for this roadmap.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Set Goal
                </Button>
              </DialogTrigger>
              <GoalDialogContent
                targetDate={targetDate}
                setTargetDate={setTargetDate}
                weeklyTarget={weeklyTarget}
                setWeeklyTarget={setWeeklyTarget}
                reminderEnabled={reminderEnabled}
                setReminderEnabled={setReminderEnabled}
                remainingTopics={remainingTopics}
                totalTopics={totalTopics}
                isSaving={isSaving}
                onSave={handleSave}
                onDelete={undefined}
                getQuickDateOptions={getQuickDateOptions}
              />
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Goal exists - show progress
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className={cn(
        "h-1",
        progress.isOnTrack 
          ? "bg-gradient-to-r from-emerald-500 to-green-500" 
          : "bg-gradient-to-r from-amber-500 to-orange-500"
      )} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Learning Goal
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <GoalDialogContent
              targetDate={targetDate}
              setTargetDate={setTargetDate}
              weeklyTarget={weeklyTarget}
              setWeeklyTarget={setWeeklyTarget}
              reminderEnabled={reminderEnabled}
              setReminderEnabled={setReminderEnabled}
              remainingTopics={remainingTopics}
              totalTopics={totalTopics}
              isSaving={isSaving}
              onSave={handleSave}
              onDelete={handleDelete}
              getQuickDateOptions={getQuickDateOptions}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {progress.isOnTrack ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
              <TrendingUp className="h-3 w-3" />
              On Track
            </Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
              <AlertTriangle className="h-3 w-3" />
              Behind Schedule
            </Badge>
          )}
          {goal.reminder_enabled && (
            <Badge variant="outline" className="gap-1">
              <Bell className="h-3 w-3" />
              Reminders On
            </Badge>
          )}
        </div>

        {/* Target Date & Days Remaining */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Target Date
            </div>
            <p className="font-semibold">
              {format(new Date(goal.target_completion_date), "MMM d, yyyy")}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              Time Left
            </div>
            <p className="font-semibold">
              {progress.daysRemaining} days
            </p>
          </div>
        </div>

        {/* Weekly Pace */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Weekly Pace Needed</span>
            <span className="text-lg font-bold text-primary">
              {progress.requiredWeeklyPace} topics/week
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {remainingTopics} topics remaining • Your target: {goal.weekly_topics_target}/week
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progress.currentProgress}%</span>
          </div>
          <Progress value={progress.currentProgress} className="h-2" />
        </div>

        {/* Motivational message */}
        <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
          {progress.isOnTrack && completedTopics < totalTopics && (
            <span className="text-emerald-600">🎯 Great pace! Keep it up to reach your goal!</span>
          )}
          {!progress.isOnTrack && (
            <span className="text-amber-600">⚡ Pick up the pace! Complete {progress.requiredWeeklyPace} topics this week.</span>
          )}
          {completedTopics >= totalTopics && (
            <span className="text-emerald-600">🏆 Congratulations! Goal achieved!</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

// Dialog content component
const GoalDialogContent: React.FC<{
  targetDate: Date | undefined;
  setTargetDate: (date: Date | undefined) => void;
  weeklyTarget: number;
  setWeeklyTarget: (value: number) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (value: boolean) => void;
  remainingTopics: number;
  totalTopics: number;
  isSaving: boolean;
  onSave: () => void;
  onDelete?: () => void;
  getQuickDateOptions: () => { label: string; date: Date }[];
}> = ({
  targetDate,
  setTargetDate,
  weeklyTarget,
  setWeeklyTarget,
  reminderEnabled,
  setReminderEnabled,
  remainingTopics,
  totalTopics,
  isSaving,
  onSave,
  onDelete,
  getQuickDateOptions,
}) => {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {onDelete ? "Edit Learning Goal" : "Set Learning Goal"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Target Date */}
        <div className="space-y-3">
          <Label>Target Completion Date</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {getQuickDateOptions().map((option) => (
              <Button
                key={option.label}
                variant={targetDate?.toDateString() === option.date.toDateString() ? "default" : "outline"}
                size="sm"
                onClick={() => setTargetDate(option.date)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                {targetDate ? format(targetDate, "MMMM d, yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={targetDate}
                onSelect={setTargetDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Weekly Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Weekly Topics Target</Label>
            <span className="font-bold text-primary">{weeklyTarget} topics</span>
          </div>
          <Slider
            value={[weeklyTarget]}
            onValueChange={([value]) => setWeeklyTarget(value)}
            min={1}
            max={Math.min(20, remainingTopics)}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {remainingTopics} topics remaining out of {totalTopics} total
          </p>
        </div>

        {/* Reminders */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {reminderEnabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label className="cursor-pointer">Enable Reminders</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when falling behind
              </p>
            </div>
          </div>
          <Switch
            checked={reminderEnabled}
            onCheckedChange={setReminderEnabled}
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        {onDelete && (
          <Button variant="destructive" onClick={onDelete} className="mr-auto">
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Goal
          </Button>
        )}
        <Button onClick={onSave} disabled={!targetDate || isSaving}>
          {isSaving ? "Saving..." : "Save Goal"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default LearningGoalCard;
