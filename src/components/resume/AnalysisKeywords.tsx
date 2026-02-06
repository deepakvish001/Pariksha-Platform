import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";

interface AnalysisKeywordsProps {
  keywords: string[];
}

export const AnalysisKeywords = ({ keywords }: AnalysisKeywordsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          Detected Keywords
        </CardTitle>
        <CardDescription>Industry-relevant keywords found in your resume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Badge variant="secondary" className="font-normal">
                {keyword}
              </Badge>
            </motion.div>
          ))}
        </div>
        {keywords.length === 0 && (
          <p className="text-sm text-muted-foreground">No specific keywords detected.</p>
        )}
      </CardContent>
    </Card>
  );
};
