import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "@/hooks/useResumeAnalysis";

interface ResumeAnalysisPDFExportProps {
  analysis: AnalysisResult;
}

export const ResumeAnalysisPDFExport = ({ analysis }: ResumeAnalysisPDFExportProps) => {
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(24);
      doc.setTextColor(79, 70, 229); // Indigo color
      doc.text("Resume Analysis Report", pageWidth / 2, 20, { align: "center" });
      
      // File name and date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`File: ${analysis.file_name}`, 20, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 35, { align: "right" });
      
      // Overall Score Circle representation
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text("Overall Score", 20, 50);
      
      const scoreColor = analysis.overall_score >= 80 
        ? [34, 197, 94] // Green
        : analysis.overall_score >= 60 
        ? [234, 179, 8] // Yellow
        : [239, 68, 68]; // Red
      
      doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.circle(50, 65, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`${analysis.overall_score}`, 50, 68, { align: "center" });
      
      // Score breakdown table
      doc.setTextColor(50, 50, 50);
      autoTable(doc, {
        startY: 90,
        head: [["Category", "Score", "Status"]],
        body: [
          ["ATS Compatibility", `${analysis.ats_score}/100`, getScoreStatus(analysis.ats_score)],
          ["Keywords", `${analysis.keyword_score}/100`, getScoreStatus(analysis.keyword_score)],
          ["Format", `${analysis.format_score}/100`, getScoreStatus(analysis.format_score)],
          ["Content", `${analysis.content_score}/100`, getScoreStatus(analysis.content_score)],
        ],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: "center" },
          2: { cellWidth: 40, halign: "center" },
        },
      });
      
      // Summary
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text("Summary", 20, currentY);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const summaryLines = doc.splitTextToSize(analysis.summary, pageWidth - 40);
      doc.text(summaryLines, 20, currentY + 8);
      currentY += 8 + summaryLines.length * 5;
      
      // Strengths
      if (analysis.strengths.length > 0) {
        currentY += 10;
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text("Strengths", 20, currentY);
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        analysis.strengths.forEach((strength, index) => {
          currentY += 7;
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(`• ${strength}`, 25, currentY);
        });
      }
      
      // Suggestions
      if (analysis.suggestions.length > 0) {
        currentY += 15;
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(234, 179, 8);
        doc.text("Improvement Suggestions", 20, currentY);
        
        const suggestionData = analysis.suggestions.map((s) => [
          getPriorityLabel(s.priority),
          s.text,
        ]);
        
        autoTable(doc, {
          startY: currentY + 5,
          head: [["Priority", "Suggestion"]],
          body: suggestionData,
          theme: "striped",
          headStyles: { fillColor: [234, 179, 8] },
          columnStyles: {
            0: { cellWidth: 25, halign: "center" },
            1: { cellWidth: 140 },
          },
          styles: { fontSize: 9 },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Keywords Found
      if (analysis.keywords_found.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text("Keywords Found", 20, currentY);
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const keywordsText = analysis.keywords_found.join(", ");
        const keywordLines = doc.splitTextToSize(keywordsText, pageWidth - 40);
        doc.text(keywordLines, 20, currentY + 8);
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | Generated by Resume Analyser`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
      
      // Save
      const fileName = `resume-analysis-${analysis.file_name.replace(/\.[^/.]+$/, "")}-${Date.now()}.pdf`;
      doc.save(fileName);
      
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };
  
  return (
    <Button onClick={generatePDF} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Download PDF Report
    </Button>
  );
};

const getScoreStatus = (score: number): string => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
};

const getPriorityLabel = (priority: "high" | "medium" | "low"): string => {
  switch (priority) {
    case "high":
      return "🔴 High";
    case "medium":
      return "🟡 Med";
    case "low":
      return "🟢 Low";
    default:
      return priority;
  }
};
