import { supabase } from "@/integrations/supabase/client";

interface ScoreNotificationParams {
  userId: string;
  currentScore: number;
  previousScore?: number;
  fileName: string;
}

const MILESTONES = [70, 80, 90, 95];
const SIGNIFICANT_IMPROVEMENT_THRESHOLD = 10;

/**
 * Check if a milestone was crossed between previous and current score
 */
const getMilestoneReached = (currentScore: number, previousScore?: number): string | null => {
  if (!previousScore) {
    // First analysis - check if they hit a milestone
    const milestone = MILESTONES.filter(m => currentScore >= m).pop();
    return milestone ? `${milestone}+` : null;
  }
  
  // Check if we crossed a milestone threshold
  for (const milestone of MILESTONES.slice().reverse()) {
    if (currentScore >= milestone && previousScore < milestone) {
      return `${milestone}+`;
    }
  }
  return null;
};

/**
 * Send notification for resume score improvement or milestone
 */
export const sendResumeScoreNotification = async ({
  userId,
  currentScore,
  previousScore,
  fileName,
}: ScoreNotificationParams): Promise<void> => {
  try {
    const improvement = previousScore ? currentScore - previousScore : 0;
    const milestoneReached = getMilestoneReached(currentScore, previousScore);
    
    // Determine if we should send a notification
    const hasSignificantImprovement = improvement >= SIGNIFICANT_IMPROVEMENT_THRESHOLD;
    const hasMilestone = !!milestoneReached;
    
    if (!hasSignificantImprovement && !hasMilestone) {
      console.log("No significant improvement or milestone - skipping notification");
      return;
    }
    
    // Prioritize milestone notification over improvement
    const notificationType = hasMilestone ? "milestone" : "improvement";
    
    console.log(`Sending ${notificationType} notification for user ${userId}`);
    
    const { error } = await supabase.functions.invoke("send-resume-score-notification", {
      body: {
        user_id: userId,
        notification_type: notificationType,
        current_score: currentScore,
        previous_score: previousScore,
        improvement: hasSignificantImprovement ? improvement : undefined,
        milestone: milestoneReached,
        file_name: fileName,
      },
    });
    
    if (error) {
      console.error("Error sending resume score notification:", error);
    } else {
      console.log("Resume score notification sent successfully");
    }
  } catch (error) {
    console.error("Failed to send resume score notification:", error);
  }
};

/**
 * Get the previous highest score for comparison
 */
export const getPreviousBestScore = async (userId: string): Promise<number | undefined> => {
  try {
    const { data, error } = await supabase
      .from("resume_analyses")
      .select("overall_score")
      .eq("user_id", userId)
      .order("overall_score", { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return undefined;
    }
    
    return data.overall_score ?? undefined;
  } catch {
    return undefined;
  }
};
