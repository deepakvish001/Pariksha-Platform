import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import type { AnalysisResult } from "@/hooks/useResumeAnalysis";

interface ResumeAnalysisComparisonProps {
  analyses: AnalysisResult[];
  onClose: () => void;
}

export const ResumeAnalysisComparison = ({ analyses, onClose }: ResumeAnalysisComparisonProps) => {
  const [leftId, setLeftId] = useState<string>(analyses[0]?.id || "");
  const [rightId, setRightId] = useState<string>(analyses[1]?.id || "");
  
  const leftAnalysis = analyses.find((a) => a.id === leftId);
  const rightAnalysis = analyses.find((a) => a.id === rightId);
  
  if (analyses.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            You need at least 2 resume analyses to compare.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload and analyze more resumes to unlock this feature.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const getDifference = (left: number, right: number) => {
    const diff = left - right;
    if (diff > 0) return { value: `+${diff}`, trend: "up" as const };
    if (diff < 0) return { value: `${diff}`, trend: "down" as const };
    return { value: "0", trend: "same" as const };
  };
  
  const TrendIcon = ({ trend }: { trend: "up" | "down" | "same" }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };
  
  const ScoreCompareRow = ({
    label,
    leftScore,
    rightScore,
  }: {
    label: string;
    leftScore: number;
    rightScore: number;
  }) => {
    const diff = getDifference(leftScore, rightScore);
    
    return (
      <div className="grid grid-cols-7 gap-2 items-center py-3 border-b last:border-0">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{leftScore}</span>
            <Progress value={leftScore} className="h-2 flex-1" />
          </div>
        </div>
        <div className="col-span-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <TrendIcon trend={diff.trend} />
            <span className="text-sm font-medium">{label}</span>
            <Badge
              variant={diff.trend === "up" ? "default" : diff.trend === "down" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {diff.value}
            </Badge>
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Progress value={rightScore} className="h-2 flex-1" />
            <span className="font-medium">{rightScore}</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Compare Analyses
        </CardTitle>
        <Button variant="ghost" size="icon" aria-label="Close comparison" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger>
              <SelectValue placeholder="Select first resume" />
            </SelectTrigger>
            <SelectContent>
              {analyses.map((a) => (
                <SelectItem key={a.id} value={a.id} disabled={a.id === rightId}>
                  {a.file_name} ({a.overall_score}/100)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger>
              <SelectValue placeholder="Select second resume" />
            </SelectTrigger>
            <SelectContent>
              {analyses.map((a) => (
                <SelectItem key={a.id} value={a.id} disabled={a.id === leftId}>
                  {a.file_name} ({a.overall_score}/100)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {leftAnalysis && rightAnalysis && (
          <>
            {/* File names header */}
            <div className="grid grid-cols-7 gap-2 text-center">
              <div className="col-span-2 text-left">
                <p className="font-semibold text-sm truncate" title={leftAnalysis.file_name}>
                  {leftAnalysis.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(leftAnalysis.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-3 flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="col-span-2 text-right">
                <p className="font-semibold text-sm truncate" title={rightAnalysis.file_name}>
                  {rightAnalysis.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(rightAnalysis.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Score comparisons */}
            <div className="bg-muted/30 rounded-lg p-4">
              <ScoreCompareRow
                label="Overall"
                leftScore={leftAnalysis.overall_score}
                rightScore={rightAnalysis.overall_score}
              />
              <ScoreCompareRow
                label="ATS"
                leftScore={leftAnalysis.ats_score}
                rightScore={rightAnalysis.ats_score}
              />
              <ScoreCompareRow
                label="Keywords"
                leftScore={leftAnalysis.keyword_score}
                rightScore={rightAnalysis.keyword_score}
              />
              <ScoreCompareRow
                label="Format"
                leftScore={leftAnalysis.format_score}
                rightScore={rightAnalysis.format_score}
              />
              <ScoreCompareRow
                label="Content"
                leftScore={leftAnalysis.content_score}
                rightScore={rightAnalysis.content_score}
              />
            </div>
            
            {/* Strengths comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-600">Strengths</h4>
                <ul className="space-y-1">
                  {leftAnalysis.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-green-500">✓</span>
                      <span className="line-clamp-2">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-600">Strengths</h4>
                <ul className="space-y-1">
                  {rightAnalysis.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-green-500">✓</span>
                      <span className="line-clamp-2">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Verdict */}
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              {leftAnalysis.overall_score > rightAnalysis.overall_score ? (
                <p className="text-sm">
                  <span className="font-semibold">{leftAnalysis.file_name}</span> scores{" "}
                  <span className="text-green-600 font-bold">
                    {leftAnalysis.overall_score - rightAnalysis.overall_score} points higher
                  </span>
                </p>
              ) : leftAnalysis.overall_score < rightAnalysis.overall_score ? (
                <p className="text-sm">
                  <span className="font-semibold">{rightAnalysis.file_name}</span> scores{" "}
                  <span className="text-green-600 font-bold">
                    {rightAnalysis.overall_score - leftAnalysis.overall_score} points higher
                  </span>
                </p>
              ) : (
                <p className="text-sm">Both resumes have the same overall score</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
