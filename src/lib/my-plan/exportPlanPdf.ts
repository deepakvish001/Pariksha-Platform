import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PlanTask, StudyPlan } from "@/hooks/useStudyPlan";
import type { StudyProfile } from "@/hooks/useStudyProfile";

const isoDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const exportPlanToPdf = (
  plan: StudyPlan | null,
  tasks: PlanTask[],
  profile: StudyProfile | null,
  days = 28
) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("My Study Plan — 28-day Summary", margin, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, 66);

  // Profile box
  let cursorY = 90;
  doc.setTextColor(20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Profile", margin, cursorY);
  cursorY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (profile) {
    const lines = [
      `Goal: ${profile.goal.replace(/_/g, " ")}`,
      `Level: ${profile.level}`,
      `Time budget: ${profile.weekday_minutes} min/weekday · ${profile.weekend_minutes} min/weekend`,
      profile.target_date ? `Target date: ${new Date(profile.target_date).toLocaleDateString()}` : "Target date: —",
    ];
    lines.forEach((l) => {
      doc.text(l, margin, cursorY);
      cursorY += 13;
    });
  } else {
    doc.text("No profile information available.", margin, cursorY);
    cursorY += 13;
  }

  if (plan?.plan?.summary) {
    cursorY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, cursorY);
    cursorY += 14;
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(plan.plan.summary, pageWidth - margin * 2);
    doc.text(wrapped, margin, cursorY);
    cursorY += wrapped.length * 12 + 6;
  }

  if (plan?.plan?.weak_areas?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Focus areas", margin, cursorY);
    cursorY += 14;
    doc.setFont("helvetica", "normal");
    const text = plan.plan.weak_areas.join(" · ");
    const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(wrapped, margin, cursorY);
    cursorY += wrapped.length * 12 + 6;
  }

  // Build day buckets for next N days starting today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { iso: string; label: string; tasks: PlanTask[] }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = isoDay(d);
    buckets.push({
      iso,
      label: fmtDate(iso),
      tasks: tasks
        .filter((t) => t.day_date === iso)
        .sort((a, b) => a.order_index - b.order_index),
    });
  }

  // Stats summary
  const totalTasks = buckets.reduce((s, b) => s + b.tasks.length, 0);
  const totalMinutes = buckets.reduce(
    (s, b) => s + b.tasks.reduce((mm, t) => mm + t.est_minutes, 0),
    0
  );
  const doneTasks = buckets.reduce(
    (s, b) => s + b.tasks.filter((t) => t.status === "done").length,
    0
  );

  cursorY += 4;
  doc.setFont("helvetica", "bold");
  doc.text("28-day overview", margin, cursorY);
  cursorY += 14;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tasks: ${totalTasks} · Completed: ${doneTasks} · Total time: ${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`,
    margin,
    cursorY
  );
  cursorY += 14;

  // Tasks table
  const rows = buckets.flatMap((b) =>
    b.tasks.length === 0
      ? [[b.label, "—", "Rest day", "", "", ""]]
      : b.tasks.map((t, i) => [
          i === 0 ? b.label : "",
          t.topic,
          t.title,
          t.difficulty,
          `${t.est_minutes}m`,
          t.status,
        ])
  );

  autoTable(doc, {
    startY: cursorY + 4,
    head: [["Day", "Topic", "Task", "Difficulty", "Time", "Status"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 30, 40], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      3: { cellWidth: 60 },
      4: { cellWidth: 40 },
      5: { cellWidth: 55 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      `Page ${i} / ${total} · Parikshaa My Plan`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" }
    );
  }

  doc.save(`my-plan-${days}d-${isoDay(today)}.pdf`);
};
