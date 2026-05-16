import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AssessmentInsights = {
  totals: {
    invited: number;
    started: number;
    submitted: number;
    inProgress: number;
    completionRate: number; // 0..1 (submitted / invited)
    avgScore: number | null;
    avgIntegrity: number | null;
    maxPossible: number;
  };
  scoreDistribution: { bucket: string; count: number }[]; // 0-20%, 20-40%, ...
  perQuestion: {
    question_id: string;
    title: string;
    type: string;
    points: number;
    attempts: number;
    avgScore: number | null;
    accuracy: number | null; // 0..1, only meaningful for mcq (full credit / attempts)
  }[];
};

export function useAssessmentInsights(assessmentId?: string) {
  return useQuery({
    queryKey: ["b2b", "insights", assessmentId],
    enabled: !!assessmentId,
    queryFn: async (): Promise<AssessmentInsights> => {
      const [invitesRes, attemptsRes, sectionsRes] = await Promise.all([
        supabase
          .from("assessment_invites")
          .select("id", { count: "exact", head: true })
          .eq("assessment_id", assessmentId!),
        supabase
          .from("assessment_attempts")
          .select("id,status,score,integrity_score")
          .eq("assessment_id", assessmentId!),
        supabase
          .from("assessment_sections")
          .select(
            "id, section_questions(question_id, question:questions(id,title,type,points))"
          )
          .eq("assessment_id", assessmentId!),
      ]);
      if (invitesRes.error) throw invitesRes.error;
      if (attemptsRes.error) throw attemptsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;

      const attempts = attemptsRes.data ?? [];
      const attemptIds = attempts.map((a: any) => a.id);

      // Flatten questions in this assessment
      const qList: { id: string; title: string; type: string; points: number }[] = [];
      const seen = new Set<string>();
      for (const s of (sectionsRes.data ?? []) as any[]) {
        for (const link of s.assessment_section_questions ?? []) {
          const q = link.question;
          if (q && !seen.has(q.id)) {
            seen.add(q.id);
            qList.push({ id: q.id, title: q.title, type: q.type, points: q.points ?? 0 });
          }
        }
      }
      const maxPossible = qList.reduce((s, q) => s + (q.points ?? 0), 0);

      // Fetch answers for these attempts
      let answers: any[] = [];
      if (attemptIds.length > 0) {
        const { data, error } = await supabase
          .from("attempt_answers")
          .select("attempt_id,question_id,auto_score,manual_score")
          .in("attempt_id", attemptIds);
        if (error) throw error;
        answers = data ?? [];
      }

      const submitted = attempts.filter(
        (a: any) => a.status === "submitted" || a.status === "auto_submitted"
      );
      const started = attempts.length;
      const inProgress = attempts.filter((a: any) => a.status === "in_progress").length;
      const invited = invitesRes.count ?? 0;

      const submittedScores = submitted
        .map((a: any) => (typeof a.score === "number" ? a.score : null))
        .filter((s): s is number => s !== null);
      const avgScore =
        submittedScores.length > 0
          ? submittedScores.reduce((s, v) => s + v, 0) / submittedScores.length
          : null;
      const integrityScores = attempts.map((a: any) => a.integrity_score ?? 0);
      const avgIntegrity =
        integrityScores.length > 0
          ? integrityScores.reduce((s, v) => s + v, 0) / integrityScores.length
          : null;

      // Distribution (5 buckets) over submitted attempts as % of maxPossible
      const buckets = [
        { bucket: "0–20%", count: 0 },
        { bucket: "20–40%", count: 0 },
        { bucket: "40–60%", count: 0 },
        { bucket: "60–80%", count: 0 },
        { bucket: "80–100%", count: 0 },
      ];
      if (maxPossible > 0) {
        for (const s of submittedScores) {
          const pct = Math.max(0, Math.min(1, s / maxPossible));
          const idx = Math.min(4, Math.floor(pct * 5));
          buckets[idx].count++;
        }
      }

      // Per-question aggregates
      const perQuestion = qList.map((q) => {
        const rows = answers.filter((a) => a.question_id === q.id);
        const scored = rows
          .map((r) => (typeof r.manual_score === "number" ? r.manual_score : r.auto_score))
          .filter((v): v is number => typeof v === "number");
        const avg = scored.length > 0 ? scored.reduce((s, v) => s + v, 0) / scored.length : null;
        const fullCredit = scored.filter((v) => v >= q.points).length;
        const accuracy =
          q.type === "mcq" && rows.length > 0 ? fullCredit / rows.length : null;
        return {
          question_id: q.id,
          title: q.title,
          type: q.type,
          points: q.points,
          attempts: rows.length,
          avgScore: avg,
          accuracy,
        };
      });

      return {
        totals: {
          invited,
          started,
          submitted: submitted.length,
          inProgress,
          completionRate: invited > 0 ? submitted.length / invited : 0,
          avgScore,
          avgIntegrity,
          maxPossible,
        },
        scoreDistribution: buckets,
        perQuestion,
      };
    },
  });
}
