import { jsPDF } from "jspdf";
import { format } from "date-fns";

type Ranking = {
  student_id: string;
  full_name: string | null;
  email: string;
  roll_number: string | null;
  branch: string | null;
  batch_year: number | null;
  section: string | null;
  score: number;
  rank_in_org: number | null;
  rank_in_branch: number | null;
  assessments_taken: number;
  avg_assessment_score: number | null;
  avg_integrity: number | null;
  applications_count: number;
  shortlisted_count: number;
  offers_count: number;
  is_placed: boolean;
  is_multi_offer: boolean;
  scores: Record<string, number>;
};

const WEIGHTS: { key: string; label: string; weight: number }[] = [
  { key: "assessment_score", label: "Assessment", weight: 0.4 },
  { key: "integrity", label: "Integrity", weight: 0.2 },
  { key: "engagement", label: "Applications", weight: 0.15 },
  { key: "shortlist_rate", label: "Shortlisted", weight: 0.1 },
  { key: "offer_factor", label: "Offer factor", weight: 0.15 },
];

function statusLabel(r: Ranking) {
  if (r.is_multi_offer) return "Multi-offer";
  if (r.is_placed) return "Placed";
  if (r.shortlisted_count > 0) return "Shortlisted";
  return "Unplaced";
}

export type WatermarkOptions = {
  /** Toggle the diagonal CONFIDENTIAL watermark on/off. Default: true. */
  enabled?: boolean;
  /** Opacity in [0, 1]. Clamped. Default: 0.06. */
  opacity?: number;
};

export async function exportStudentHighlightsPdf({
  ranking,
  offers,
  applications,
  watermark,
}: {
  ranking: Ranking;
  offers: any[];
  applications: any[];
  watermark?: WatermarkOptions;
}) {
  const wmEnabled = watermark?.enabled !== false;
  const wmOpacity = Math.max(
    0,
    Math.min(1, watermark?.opacity ?? 0.06),
  );

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;

  // Document metadata — surfaced in PDF reader "Properties" dialogs.
  const generatedAt = new Date();
  const candidateName = ranking.full_name || ranking.email || "Candidate";
  doc.setProperties({
    title: `Candidate Highlights — ${candidateName}`,
    subject: `HR-ready candidate highlights for ${candidateName} (generated ${generatedAt.toISOString()})`,
    author: "Parikshaa Placements",
    creator: "Parikshaa Placements",
    keywords: [
      "Parikshaa",
      "Placements",
      "Candidate Highlights",
      "Confidential",
      ranking.roll_number || "",
      ranking.branch || "",
      ranking.batch_year ? String(ranking.batch_year) : "",
      `Generated:${generatedAt.toISOString()}`,
    ]
      .filter(Boolean)
      .join(", "),
  });

  // Draw the diagonal CONFIDENTIAL watermark BEFORE any content so it sits
  // underneath everything else (jsPDF has no z-index — draw order wins).
  const drawWatermark = () => {
    if (!wmEnabled || wmOpacity <= 0) return;
    const anyDoc = doc as any;
    const hasGState = !!anyDoc.GState && !!anyDoc.setGState;
    if (hasGState) anyDoc.setGState(new anyDoc.GState({ opacity: wmOpacity }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(48);
    doc.setTextColor(120, 120, 130);

    // Staggered diagonal bands placed in the gaps between content blocks.
    const rows = [180, 360, 540, 720];
    const tileX = 340;
    for (let ri = 0; ri < rows.length; ri++) {
      const yPos = rows[ri];
      const xOffset = ri % 2 === 0 ? -40 : 120;
      for (let xi = -1; xi < Math.ceil(W / tileX) + 1; xi++) {
        doc.text("CONFIDENTIAL", xi * tileX + xOffset, yPos, { angle: 32 });
      }
    }

    if (hasGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
    // Reset text defaults so subsequent content isn't affected.
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  // Draw on page 1 first, and on every subsequent page automatically.
  drawWatermark();
  try {
    doc.internal.events.subscribe("addPage", () => drawWatermark());
  } catch {
    /* event API unavailable — page 1 watermark still applied */
  }


  // Header band
  doc.setFillColor(15, 15, 20);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(245, 200, 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("HR-READY CANDIDATE HIGHLIGHTS", M, 28);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(ranking.full_name || ranking.email, M, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190, 190, 200);
  const meta = [
    ranking.roll_number,
    ranking.branch,
    ranking.batch_year ? String(ranking.batch_year) : null,
    ranking.section ? `Sec ${ranking.section}` : null,
    ranking.email,
  ].filter(Boolean).join("  ·  ");
  doc.text(meta, M, 63);

  // Status pill (top-right)
  const status = statusLabel(ranking);
  doc.setFillColor(245, 200, 90);
  doc.setTextColor(15, 15, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const pillW = doc.getTextWidth(status) + 16;
  doc.roundedRect(W - M - pillW, 22, pillW, 18, 9, 9, "F");
  doc.text(status, W - M - pillW + 8, 34);

  y = 95;
  doc.setTextColor(20, 20, 20);

  // Headline KPI row
  const kpis: { label: string; value: string }[] = [
    { label: "Overall Score", value: String(Math.round(ranking.score)) },
    { label: "Org Rank", value: ranking.rank_in_org ? `#${ranking.rank_in_org}` : "—" },
    { label: "Branch Rank", value: ranking.rank_in_branch ? `#${ranking.rank_in_branch}` : "—" },
    { label: "Offers", value: String(ranking.offers_count) },
  ];
  const colW = (W - M * 2 - 24) / 4;
  kpis.forEach((k, i) => {
    const x = M + i * (colW + 8);
    doc.setDrawColor(220);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(x, y, colW, 58, 6, 6, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 120);
    doc.text(k.label.toUpperCase(), x + 10, y + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(20, 20, 30);
    doc.text(k.value, x + 10, y + 44);
  });
  y += 76;

  // Secondary stats grid
  const sec: { label: string; value: string }[] = [
    { label: "Assessments", value: String(ranking.assessments_taken) },
    { label: "Avg Score %", value: ranking.avg_assessment_score?.toFixed(0) ?? "—" },
    { label: "Integrity", value: ranking.avg_integrity?.toFixed(0) ?? "—" },
    { label: "Applications", value: String(ranking.applications_count) },
    { label: "Shortlists", value: String(ranking.shortlisted_count) },
    { label: "Offers", value: String(ranking.offers_count) },
  ];
  const sColW = (W - M * 2 - 5 * 6) / 6;
  sec.forEach((k, i) => {
    const x = M + i * (sColW + 6);
    doc.setDrawColor(230);
    doc.roundedRect(x, y, sColW, 42, 4, 4, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 130);
    doc.text(k.label.toUpperCase(), x + 6, y + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(25, 25, 35);
    doc.text(k.value, x + 6, y + 33);
  });
  y += 60;

  // Section: breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 30);
  doc.text("Score Breakdown", M, y);
  y += 12;
  WEIGHTS.forEach((w) => {
    const v = Math.max(0, Math.min(100, Number(ranking.scores?.[w.key] ?? 0)));
    const contrib = v * w.weight;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 80);
    doc.text(`${w.label}  (weight ${Math.round(w.weight * 100)}%)`, M, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 30);
    const right = `${Math.round(v)}  →  ${contrib.toFixed(1)}`;
    doc.text(right, W - M, y + 10, { align: "right" });
    // bar
    const barX = M;
    const barW = W - M * 2;
    doc.setFillColor(235, 236, 240);
    doc.roundedRect(barX, y + 14, barW, 5, 2, 2, "F");
    doc.setFillColor(245, 200, 90);
    doc.roundedRect(barX, y + 14, (barW * v) / 100, 5, 2, 2, "F");
    y += 26;
  });

  y += 4;

  // Two-column section: Offers + Applications
  const colWidth = (W - M * 2 - 16) / 2;
  const startY = y;

  function drawList(
    title: string,
    items: string[],
    x: number,
    yy: number,
    width: number,
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 30);
    doc.text(title, x, yy);
    yy += 10;
    doc.setDrawColor(230);
    doc.line(x, yy, x + width, yy);
    yy += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 60);
    if (!items.length) {
      doc.setTextColor(140, 140, 150);
      doc.text("None yet.", x, yy);
      return;
    }
    items.slice(0, 5).forEach((line) => {
      const wrapped = doc.splitTextToSize(`• ${line}`, width);
      doc.text(wrapped, x, yy);
      yy += wrapped.length * 11 + 2;
    });
  }

  const offerLines = (offers || []).map((o) => {
    const ctc = o.ctc ? `  ₹${(Number(o.ctc) / 100000).toFixed(1)}L` : "";
    const dt = o.offered_at ? `  ${format(new Date(o.offered_at), "MMM d, yyyy")}` : "";
    const rec = o.recruiter?.name ? `  · ${o.recruiter.name}` : "";
    return `${o.role_title || "Offer"}${ctc}${rec}${dt}${o.is_dream_offer ? "  (Dream)" : ""}`;
  });
  const appLines = (applications || []).map((a) => {
    const stage = a.stage || "active";
    const round = a.current_round ? ` · R${a.current_round}` : "";
    const dt = a.last_event_at ? ` · ${format(new Date(a.last_event_at), "MMM d")}` : "";
    return `${a.drive?.title || "Drive"} — ${stage}${round}${dt}`;
  });

  drawList("Recent Offers", offerLines, M, startY, colWidth);
  drawList("Recent Applications", appLines, M + colWidth + 16, startY, colWidth);

  // Header + footer applied to every page for consistency.
  const pageCount = doc.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const genStamp = format(generatedAt, "PPP p");
  const cohort = [
    ranking.branch,
    ranking.batch_year ? String(ranking.batch_year) : null,
    ranking.section ? `Sec ${ranking.section}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const headerName = ranking.full_name || ranking.email;

  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);

    // Slim running header — skipped on page 1 because the rich header band
    // already shows the same candidate / cohort info more prominently.
    if (p > 1) {
      doc.setFillColor(15, 15, 20);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(245, 200, 90);
      doc.text(headerName, M, 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 210);
      if (cohort) {
        doc.text(cohort, M + doc.getTextWidth(headerName) + 10, 18);
      }
      doc.setTextColor(170, 170, 180);
      doc.text(`Exported ${genStamp}`, pageW - M, 18, { align: "right" });
    }

    // Footer
    const footerY = pageH - 24;
    doc.setDrawColor(230);
    doc.line(M, footerY - 8, pageW - M, footerY - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 140);
    doc.text(
      `Generated ${genStamp}  ·  Confidential — for recruiter use only`,
      M,
      footerY,
    );
    doc.text(`Page ${p} of ${pageCount}`, pageW / 2, footerY, { align: "center" });
    doc.text("Parikshaa Placements", pageW - M, footerY, { align: "right" });
  }

  const safeName = (ranking.full_name || ranking.email || "candidate")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  doc.save(`highlights_${safeName}.pdf`);
}
