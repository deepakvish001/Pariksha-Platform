import { motion } from "framer-motion";
import { FileSearch, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ResumeAnalyser = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <FileSearch className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Resume Analyser</h1>
              <p className="text-sm text-muted-foreground">AI-powered resume analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Drag and drop your resume or click to browse
              </p>
              <Button>Select File</Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, DOC, DOCX (Max 5MB)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Criteria</CardTitle>
                <CardDescription>What we check in your resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "ATS Compatibility", score: 85 },
                  { name: "Keyword Optimization", score: 72 },
                  { name: "Format & Structure", score: 90 },
                  { name: "Content Quality", score: 78 },
                ].map((criteria) => (
                  <div key={criteria.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{criteria.name}</span>
                      <span className="font-medium">{criteria.score}%</span>
                    </div>
                    <Progress value={criteria.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Tips</CardTitle>
                <CardDescription>Improve your resume score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { text: "Use action verbs to describe achievements", good: true },
                  { text: "Include relevant keywords from job descriptions", good: true },
                  { text: "Avoid graphics and tables for ATS", good: false },
                  { text: "Keep it to 1-2 pages maximum", good: true },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {tip.good ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    )}
                    <span>{tip.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ResumeAnalyser;
