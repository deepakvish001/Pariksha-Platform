import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, ExternalLink, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resumeTemplates, styleConfig, type ResumeTemplate } from "@/data/resumeTemplatesData";
import { useResumeDownloads } from "@/hooks/useResumeActions";
import type { AnalysisResult } from "@/hooks/useResumeAnalysis";

interface ResumeTemplateSuggestionsProps {
  analysis: AnalysisResult;
}

interface SuggestionReason {
  template: ResumeTemplate;
  reasons: string[];
  matchScore: number;
}

export const ResumeTemplateSuggestions = ({ analysis }: ResumeTemplateSuggestionsProps) => {
  const navigate = useNavigate();
  const { trackDownload, isDownloading } = useResumeDownloads();
  
  const suggestions = useMemo((): SuggestionReason[] => {
    const results: SuggestionReason[] = [];
    
    resumeTemplates.forEach((template) => {
      const reasons: string[] = [];
      let matchScore = 0;
      
      // Low ATS score - suggest ATS-compatible templates
      if (analysis.ats_score < 70 && template.atsCompatible) {
        reasons.push("ATS-optimized to improve your compatibility score");
        matchScore += 30;
      }
      
      // Low format score - suggest minimal/clean templates
      if (analysis.format_score < 60) {
        if (template.style === "minimal") {
          reasons.push("Clean layout to improve readability");
          matchScore += 25;
        }
        if (template.style === "modern") {
          reasons.push("Modern structure for better organization");
          matchScore += 20;
        }
      }
      
      // Low content score - suggest two-column for more space
      if (analysis.content_score < 60 && template.style === "two-column") {
        reasons.push("Two-column layout maximizes space for content");
        matchScore += 20;
      }
      
      // High scores - suggest featured/premium templates
      if (analysis.overall_score >= 75 && template.isFeatured) {
        reasons.push("Premium design to showcase your strong resume");
        matchScore += 15;
      }
      
      // Check keywords for role-specific suggestions
      const keywords = analysis.keywords_found.map((k) => k.toLowerCase());
      
      if (keywords.some((k) => ["tech", "software", "developer", "engineering", "python", "javascript"].includes(k))) {
        if (template.tags.some((t) => ["Tech", "Engineering", "Developer"].includes(t))) {
          reasons.push("Designed for tech professionals");
          matchScore += 25;
        }
      }
      
      if (keywords.some((k) => ["design", "creative", "ui", "ux", "figma"].includes(k))) {
        if (template.style === "creative") {
          reasons.push("Creative layout for design roles");
          matchScore += 25;
        }
      }
      
      if (keywords.some((k) => ["leadership", "management", "director", "executive"].includes(k))) {
        if (template.style === "traditional" || template.tags.includes("Executive")) {
          reasons.push("Professional design for leadership positions");
          matchScore += 25;
        }
      }
      
      if (keywords.some((k) => ["entry", "graduate", "intern", "junior"].includes(k))) {
        if (template.tags.some((t) => ["Entry-Level", "Graduate", "Internship"].includes(t))) {
          reasons.push("Perfect for early career professionals");
          matchScore += 25;
        }
      }
      
      // Boost popular templates slightly
      if (template.downloads > 10000) {
        matchScore += 5;
      }
      
      if (reasons.length > 0) {
        results.push({ template, reasons, matchScore });
      }
    });
    
    // Sort by match score and take top 3
    return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [analysis]);
  
  if (suggestions.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended Templates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your analysis results, these templates could help improve your resume
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {suggestions.map(({ template, reasons, matchScore }) => {
            const style = styleConfig[template.style];
            
            return (
              <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Preview image */}
                <div className={`h-32 bg-gradient-to-br ${template.colorScheme} relative`}>
                  {template.previewUrl && (
                    <img
                      src={template.previewUrl}
                      alt={template.name}
                      className="w-full h-full object-cover opacity-90"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                      {Math.round(matchScore)}% Match
                    </Badge>
                    {template.atsCompatible && (
                      <Badge variant="secondary" className="text-xs bg-green-500/80 text-white border-0">
                        ATS ✓
                      </Badge>
                    )}
                  </div>
                  {template.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {style.label}
                    </Badge>
                  </div>
                  
                  <ul className="space-y-1">
                    {reasons.slice(0, 2).map((reason, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => trackDownload(template, "PDF")}
                      disabled={isDownloading}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => navigate("/research/resume-templates")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="link" onClick={() => navigate("/research/resume-templates")}>
            View All Templates →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
