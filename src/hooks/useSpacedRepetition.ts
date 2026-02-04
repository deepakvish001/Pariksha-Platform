import { useMemo } from "react";
import { differenceInDays, differenceInHours } from "date-fns";

export interface SpacedRepetitionQuestion {
  questionId: number;
  categoryId: string;
  completedAt: Date;
  reviewCount: number;
  dueIn: number; // hours until due (negative means overdue)
  isOverdue: boolean;
  urgency: "critical" | "due" | "upcoming" | "later";
}

// Spaced repetition intervals in days based on review count
// Using a simplified version of the SM-2 algorithm
const INTERVALS = [1, 3, 7, 14, 30, 60, 120]; // days

export function getNextReviewInterval(reviewCount: number): number {
  const index = Math.min(reviewCount, INTERVALS.length - 1);
  return INTERVALS[index];
}

export function calculateDueDate(completedAt: Date, reviewCount: number): Date {
  const intervalDays = getNextReviewInterval(reviewCount);
  const dueDate = new Date(completedAt);
  dueDate.setDate(dueDate.getDate() + intervalDays);
  return dueDate;
}

export function getUrgency(hoursUntilDue: number): SpacedRepetitionQuestion["urgency"] {
  if (hoursUntilDue < 0) return "critical"; // Overdue
  if (hoursUntilDue < 24) return "due"; // Due today
  if (hoursUntilDue < 72) return "upcoming"; // Due in 3 days
  return "later";
}

interface ProgressData {
  [role: string]: {
    [categoryId: string]: {
      [questionId: number]: {
        solved: boolean;
        revision: boolean;
        note?: string;
        completedAt?: string;
        reviewCount?: number;
      };
    };
  };
}

export function useSpacedRepetition(
  progress: ProgressData,
  selectedRole: string
) {
  const dueQuestions = useMemo(() => {
    const now = new Date();
    const questions: SpacedRepetitionQuestion[] = [];

    const roleProgress = progress[selectedRole];
    if (!roleProgress) return questions;

    Object.entries(roleProgress).forEach(([categoryId, categoryProgress]) => {
      Object.entries(categoryProgress).forEach(([questionIdStr, data]) => {
        if (!data.solved || !data.completedAt) return;

        const questionId = parseInt(questionIdStr, 10);
        const completedAt = new Date(data.completedAt);
        const reviewCount = data.reviewCount || 0;
        const dueDate = calculateDueDate(completedAt, reviewCount);
        
        const hoursUntilDue = differenceInHours(dueDate, now);
        const isOverdue = hoursUntilDue < 0;
        const urgency = getUrgency(hoursUntilDue);

        // Only include questions that are due within the next 7 days or overdue
        if (hoursUntilDue <= 168) { // 7 days in hours
          questions.push({
            questionId,
            categoryId,
            completedAt,
            reviewCount,
            dueIn: hoursUntilDue,
            isOverdue,
            urgency,
          });
        }
      });
    });

    // Sort by urgency (most urgent first)
    return questions.sort((a, b) => a.dueIn - b.dueIn);
  }, [progress, selectedRole]);

  const stats = useMemo(() => {
    const critical = dueQuestions.filter((q) => q.urgency === "critical").length;
    const due = dueQuestions.filter((q) => q.urgency === "due").length;
    const upcoming = dueQuestions.filter((q) => q.urgency === "upcoming").length;
    return { critical, due, upcoming, total: dueQuestions.length };
  }, [dueQuestions]);

  return { dueQuestions, stats };
}

export function formatDueTime(hoursUntilDue: number): string {
  if (hoursUntilDue < -24) {
    const days = Math.abs(Math.floor(hoursUntilDue / 24));
    return `${days}d overdue`;
  }
  if (hoursUntilDue < 0) {
    return `${Math.abs(Math.floor(hoursUntilDue))}h overdue`;
  }
  if (hoursUntilDue < 1) {
    return "Due now";
  }
  if (hoursUntilDue < 24) {
    return `${Math.floor(hoursUntilDue)}h`;
  }
  const days = Math.floor(hoursUntilDue / 24);
  return `${days}d`;
}
