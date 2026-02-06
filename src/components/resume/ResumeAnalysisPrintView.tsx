import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { AnalysisResult } from "@/hooks/useResumeAnalysis";

interface ResumeAnalysisPrintViewProps {
  analysis: AnalysisResult;
}

export const ResumeAnalysisPrintView = ({ analysis }: ResumeAnalysisPrintViewProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const getScoreColor = (score: number) => {
      if (score >= 80) return "#22c55e";
      if (score >= 60) return "#eab308";
      return "#ef4444";
    };

    const getScoreLabel = (score: number) => {
      if (score >= 80) return "Excellent";
      if (score >= 60) return "Good";
      if (score >= 40) return "Fair";
      return "Needs Work";
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "high": return "#ef4444";
        case "medium": return "#eab308";
        case "low": return "#22c55e";
        default: return "#6b7280";
      }
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume Analysis - ${analysis.file_name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12pt;
              line-height: 1.5;
              color: #1f2937;
              padding: 0.5in;
              max-width: 8.5in;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .header h1 {
              font-size: 24pt;
              color: #4f46e5;
              margin-bottom: 4px;
            }
            .header .subtitle {
              font-size: 10pt;
              color: #6b7280;
            }
            .header .date {
              text-align: right;
              font-size: 10pt;
              color: #6b7280;
            }
            .score-section {
              display: flex;
              gap: 24px;
              margin-bottom: 24px;
            }
            .main-score {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 4px solid ${getScoreColor(analysis.overall_score)};
              flex-shrink: 0;
            }
            .main-score .number {
              font-size: 36pt;
              font-weight: bold;
              color: ${getScoreColor(analysis.overall_score)};
            }
            .main-score .label {
              font-size: 9pt;
              color: #6b7280;
            }
            .score-breakdown {
              flex: 1;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .score-item {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .score-bar-container {
              flex: 1;
              height: 8px;
              background: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
            }
            .score-bar {
              height: 100%;
              border-radius: 4px;
            }
            .score-value {
              width: 40px;
              text-align: right;
              font-weight: 600;
              font-size: 11pt;
            }
            .score-label {
              width: 80px;
              font-size: 10pt;
              color: #374151;
            }
            .section {
              margin-bottom: 20px;
            }
            .section h2 {
              font-size: 14pt;
              color: #1f2937;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .summary {
              background: #f9fafb;
              padding: 12px;
              border-radius: 8px;
              font-size: 11pt;
              color: #374151;
            }
            .suggestions-list {
              list-style: none;
            }
            .suggestion-item {
              display: flex;
              gap: 8px;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .priority-badge {
              width: 60px;
              font-size: 9pt;
              font-weight: 600;
              text-transform: uppercase;
              flex-shrink: 0;
            }
            .strengths-list {
              list-style: none;
            }
            .strength-item {
              padding: 6px 0;
              padding-left: 20px;
              position: relative;
            }
            .strength-item::before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #22c55e;
              font-weight: bold;
            }
            .keywords-container {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .keyword {
              background: #eef2ff;
              color: #4f46e5;
              padding: 4px 10px;
              border-radius: 16px;
              font-size: 10pt;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 9pt;
              color: #9ca3af;
            }
            @media print {
              body {
                padding: 0;
              }
              .section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Resume Analysis Report</h1>
              <p class="subtitle">${analysis.file_name}</p>
            </div>
            <div class="date">
              <p>Generated: ${new Date().toLocaleDateString()}</p>
              <p>Analysis Date: ${new Date(analysis.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="score-section">
            <div class="main-score">
              <span class="number">${analysis.overall_score}</span>
              <span class="label">${getScoreLabel(analysis.overall_score)}</span>
            </div>
            <div class="score-breakdown">
              ${[
                { label: "ATS Score", score: analysis.ats_score },
                { label: "Keywords", score: analysis.keyword_score },
                { label: "Format", score: analysis.format_score },
                { label: "Content", score: analysis.content_score },
              ].map(item => `
                <div class="score-item">
                  <span class="score-label">${item.label}</span>
                  <div class="score-bar-container">
                    <div class="score-bar" style="width: ${item.score}%; background: ${getScoreColor(item.score)};"></div>
                  </div>
                  <span class="score-value">${item.score}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="section">
            <h2>Summary</h2>
            <p class="summary">${analysis.summary}</p>
          </div>

          <div class="section">
            <h2>Improvement Suggestions</h2>
            <ul class="suggestions-list">
              ${analysis.suggestions.map(s => `
                <li class="suggestion-item">
                  <span class="priority-badge" style="color: ${getPriorityColor(s.priority)};">${s.priority}</span>
                  <span>${s.text}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <div class="section">
            <h2>Strengths</h2>
            <ul class="strengths-list">
              ${analysis.strengths.map(s => `
                <li class="strength-item">${s}</li>
              `).join("")}
            </ul>
          </div>

          <div class="section">
            <h2>Keywords Found</h2>
            <div class="keywords-container">
              ${analysis.keywords_found.map(k => `
                <span class="keyword">${k}</span>
              `).join("")}
            </div>
          </div>

          <div class="footer">
            <p>Generated by Resume Analyser | This analysis is for guidance purposes only</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <>
      <Button variant="outline" onClick={handlePrint} className="gap-2">
        <Printer className="h-4 w-4" />
        Print
      </Button>
      <div ref={printRef} className="hidden" />
    </>
  );
};
