import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Trophy } from "lucide-react";

interface AnalysisStrengthsProps {
  strengths: string[];
}

export const AnalysisStrengths = ({ strengths }: AnalysisStrengthsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Your Strengths
        </CardTitle>
        <CardDescription>What's working well in your resume</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {strengths.map((strength, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-2 text-sm"
          >
            <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{strength}</span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
