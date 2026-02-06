import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileCheck, Search, Layout, Star } from "lucide-react";

interface CriteriaScore {
  name: string;
  score: number;
  icon: React.ReactNode;
  description: string;
}

interface AnalysisCriteriaCardProps {
  atsScore: number;
  keywordScore: number;
  formatScore: number;
  contentScore: number;
}

export const AnalysisCriteriaCard = ({
  atsScore,
  keywordScore,
  formatScore,
  contentScore,
}: AnalysisCriteriaCardProps) => {
  const criteria: CriteriaScore[] = [
    {
      name: "ATS Compatibility",
      score: atsScore,
      icon: <FileCheck className="h-4 w-4" />,
      description: "How well your resume works with applicant tracking systems",
    },
    {
      name: "Keyword Optimization",
      score: keywordScore,
      icon: <Search className="h-4 w-4" />,
      description: "Industry-relevant keywords and action verbs",
    },
    {
      name: "Format & Structure",
      score: formatScore,
      icon: <Layout className="h-4 w-4" />,
      description: "Layout, sections, and readability",
    },
    {
      name: "Content Quality",
      score: contentScore,
      icon: <Star className="h-4 w-4" />,
      description: "Impact statements and quantifiable achievements",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Detailed Analysis</CardTitle>
        <CardDescription>Score breakdown by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {criteria.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-muted">{item.icon}</div>
                <div>
                  <span className="font-medium text-sm">{item.name}</span>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {item.description}
                  </p>
                </div>
              </div>
              <span className="font-bold text-sm">{item.score}%</span>
            </div>
            <Progress
              value={item.score}
              className="h-2"
              // Custom indicator color based on score
              style={
                {
                  "--progress-color": getScoreColor(item.score),
                } as React.CSSProperties
              }
            />
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
