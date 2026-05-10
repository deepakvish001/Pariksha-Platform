import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Sparkles,
  Loader2,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAIContent, AIContentType } from "@/hooks/useAIContent";

interface FormatOption {
  id: AIContentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const formatOptions: FormatOption[] = [
  { 
    id: "plan", 
    label: "Plan", 
    icon: ClipboardList,
    description: "Structured study plan with milestones"
  },
  { 
    id: "course", 
    label: "Course", 
    icon: BookOpen,
    description: "Structured learning path with modules"
  },
  { 
    id: "guide", 
    label: "Guide", 
    icon: FileText,
    description: "Step-by-step tutorial"
  },
  { 
    id: "quiz", 
    label: "Quiz", 
    icon: HelpCircle,
    description: "Test your knowledge"
  },
];

const AIGenerate = () => {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as AIContentType) || "course";
  
  const [topic, setTopic] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<AIContentType>(initialType);
  const [includeQuestions, setIncludeQuestions] = useState(false);
  const navigate = useNavigate();
  const { generateContent } = useAIContent();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    try {
      const result = await generateContent.mutateAsync({
        topic: topic.trim(),
        contentType: selectedFormat,
        includeQuestions,
      });
      
      // Navigate to the appropriate "My" page after generation
      const routes: Record<AIContentType, string> = {
        plan: "/platform/ai/my-plans",
        course: "/platform/ai/my-courses",
        guide: "/platform/ai/my-guides",
        quiz: "/platform/ai/my-quizzes",
      };
      
      navigate(routes[selectedFormat]);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            What can I help you learn?
          </h1>
          <p className="text-muted-foreground">
            Enter a topic below to generate personalized learning content
          </p>
        </motion.div>

        {/* Topic Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Label htmlFor="topic" className="text-sm font-medium text-foreground mb-2 block">
            What can I help you learn?
          </Label>
          <Input
            id="topic"
            placeholder="Enter a topic (e.g., React Hooks, Machine Learning, System Design)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-12 text-base"
            onKeyDown={(e) => e.key === "Enter" && !generateContent.isPending && handleGenerate()}
            disabled={generateContent.isPending}
          />
        </motion.div>

        {/* Format Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Label className="text-sm font-medium text-foreground mb-4 block">
            Choose the format
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedFormat === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedFormat(option.id)}
                  disabled={generateContent.isPending}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/30",
                    generateContent.isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className={cn(
                    "h-6 w-6 mb-2 transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Additional Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 p-4 rounded-xl border border-border bg-muted/20">
            <Checkbox
              id="questions"
              checked={includeQuestions}
              onCheckedChange={(checked) => setIncludeQuestions(checked as boolean)}
              disabled={generateContent.isPending}
            />
            <Label 
              htmlFor="questions" 
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              Include practice questions for better retention
            </Label>
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleGenerate}
            disabled={generateContent.isPending || !topic.trim()}
            className="w-full h-14 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            {generateContent.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating... (this may take a moment)
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate
              </>
            )}
          </Button>
        </motion.div>

        {/* Quick Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <p className="text-xs text-muted-foreground text-center mb-4">
            Popular topics
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Data Structures",
              "System Design",
              "React.js",
              "Machine Learning",
              "SQL Basics",
              "OOPS Concepts"
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setTopic(suggestion)}
                disabled={generateContent.isPending}
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIGenerate;
