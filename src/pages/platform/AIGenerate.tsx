import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  FileText, 
  Map, 
  HelpCircle, 
  Sparkles,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type GenerationType = "course" | "guide" | "roadmap" | "quiz";

interface FormatOption {
  id: GenerationType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const formatOptions: FormatOption[] = [
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
    id: "roadmap", 
    label: "Roadmap", 
    icon: Map,
    description: "Visual learning journey"
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
  const initialType = (searchParams.get("type") as GenerationType) || "course";
  
  const [topic, setTopic] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<GenerationType>(initialType);
  const [includeQuestions, setIncludeQuestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Please enter a topic",
        description: "You need to enter a topic to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation delay for now
    // TODO: Integrate with Lovable AI edge function
    setTimeout(() => {
      toast({
        title: "Generation Started",
        description: `Creating your ${selectedFormat} on "${topic}"...`,
      });
      setIsGenerating(false);
      // Navigate to chat with pre-filled prompt
      navigate(`/platform/ai?prompt=${encodeURIComponent(`Create a ${selectedFormat} about: ${topic}${includeQuestions ? ". Include practice questions at the end of each section." : ""}`)}`);
    }, 1500);
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
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedFormat === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedFormat(option.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                  )}
                >
                  <Icon className={cn(
                    "h-8 w-8 mb-3 transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium transition-colors",
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
            />
            <Label 
              htmlFor="questions" 
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              Answer the following questions for a better {selectedFormat}
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
            disabled={isGenerating || !topic.trim()}
            className="w-full h-14 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
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
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
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
