import jsPDF from "jspdf";

interface ReceiptInput {
  attemptId: string;
  assessmentTitle: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  integrityScore?: number | null;
  durationLabel?: string | null;
  nextSteps: { title: string; detail: string }[];
}

function fmt(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function generateSubmissionReceipt(input: ReceiptInput): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  // Header band
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Submission Receipt", margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Parikshaa Assessments", margin, 70);
  doc.setFontSize(9);
  const generatedAt = `Generated ${new Date().toLocaleString()}`;
  doc.text(generatedAt, pageW - margin - doc.getTextWidth(generatedAt), 70);

  y = 120;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(input.assessmentTitle || "Untitled assessment", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Attempt ID  ${input.attemptId}`,
    margin,
    y
  );
  y += 22;

  // Stats grid (2 cols)
  const stats: { label: string; value: string }[] = [
    {
      label: "Score",
      value: typeof input.score === "number" ? String(input.score) : "Pending review",
    },
    {
      label: "Integrity",
      value:
        typeof input.integrityScore === "number"
          ? `${Math.round(input.integrityScore)}%`
          : "—",
    },
    { label: "Submitted at", value: fmt(input.submittedAt) },
    { label: "Time taken", value: input.durationLabel ?? "—" },
    { label: "Started at", value: fmt(input.startedAt) },
    { label: "Status", value: "Submitted" },
  ];

  const colW = (pageW - margin * 2 - 12) / 2;
  const rowH = 52;
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (colW + 12);
    const ty = y + row * (rowH + 8);
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, ty, colW, rowH, 6, 6, "FD");
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(s.label.toUpperCase(), x + 12, ty + 18);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(s.value, x + 12, ty + 38, { maxWidth: colW - 24 });
  });
  y += Math.ceil(stats.length / 2) * (rowH + 8) + 14;

  // Candidate block (optional)
  if (input.candidateName || input.candidateEmail) {
    doc.setDrawColor(225, 225, 225);
    doc.line(margin, y, pageW - margin, y);
    y += 18;
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CANDIDATE", margin, y);
    y += 14;
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    if (input.candidateName) {
      doc.text(input.candidateName, margin, y);
      y += 14;
    }
    if (input.candidateEmail) {
      doc.setTextColor(90, 90, 90);
      doc.text(input.candidateEmail, margin, y);
      y += 14;
    }
    y += 8;
  }

  // Next steps
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WHAT'S NEXT", margin, y);
  y += 16;

  doc.setFontSize(11);
  input.nextSteps.forEach((s, i) => {
    if (y > pageH - margin - 60) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(16, 185, 129);
    doc.circle(margin + 8, y - 3, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(i + 1), margin + 8, y, { align: "center", baseline: "middle" });

    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(s.title, margin + 26, y);
    y += 14;
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(s.detail, pageW - margin * 2 - 26);
    doc.text(lines, margin + 26, y);
    y += lines.length * 13 + 10;
  });

  // Footer
  const footerY = pageH - 30;
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, footerY - 14, pageW - margin, footerY - 14);
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Keep this receipt for your records. Questions? support@parikshaa.app",
    margin,
    footerY
  );
  const ref = `Ref ${input.attemptId.slice(0, 8)}`;
  doc.text(ref, pageW - margin - doc.getTextWidth(ref), footerY);

  return doc;
}

export function downloadSubmissionReceipt(input: ReceiptInput) {
  const doc = generateSubmissionReceipt(input);
  const safeTitle = (input.assessmentTitle || "assessment")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  doc.save(`receipt-${safeTitle}-${input.attemptId.slice(0, 8)}.pdf`);
}
