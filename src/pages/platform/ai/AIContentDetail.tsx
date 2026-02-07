import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Map, 
  HelpCircle, 
  ClipboardList,
  Clock,
  CheckCircle2,
  Target,
  Layers,
  Globe,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AIContentType } from "@/hooks/useAIContent";
import { format } from "date-fns";

interface ContentData {
  title?: string;
  description?: string;
  modules?: Array<{
    title: string;
    description?: string;
    lessons?: Array<{ title: string; content?: string; duration?: string }>;
  }>;
  steps?: Array<{
    title: string;
    content?: string;
    duration?: string;
  }>;
  phases?: Array<{
    title: string;
    description?: string;
    milestones?: string[];
    duration?: string;
  }>;
  stages?: Array<{
    title: string;
    description?: string;
    topics?: string[];
    resources?: string[];
  }>;
  questions?: Array<{
    question: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
  }>;
  practiceQuestions?: Array<{
    question: string;
    answer?: string;
  }>;
}

const typeIcons: Record<AIContentType, React.ComponentType<{ className?: string }>> = {
  plan: ClipboardList,
  course: BookOpen,
  guide: FileText,
  roadmap: Map,
  quiz: HelpCircle,
};

const typeLabels: Record<AIContentType, string> = {
  plan: "Study Plan",
  course: "Course",
  guide: "Guide",
  roadmap: "Roadmap",
  quiz: "Quiz",
};

const AIContentDetail = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["ai-content-detail", contentId],
    queryFn: async () => {
      if (!contentId) throw new Error("No content ID provided");
      
      const { data, error } = await supabase
        .from("ai_generated_content")
        .select("*")
        .eq("id", contentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h2 className="text-xl font-semibold text-foreground mb-2">Content not found</h2>
          <p className="text-muted-foreground mb-4">This content may have been deleted or you don't have access to it.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const contentType = content.content_type as AIContentType;
  const Icon = typeIcons[contentType] || BookOpen;
  const contentData = content.content as ContentData;

  const renderModules = () => (
    <Accordion type="single" collapsible className="space-y-3">
      {contentData.modules?.map((module, index) => (
        <AccordionItem key={index} value={`module-${index}`} className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {index + 1}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{module.title}</h3>
                {module.description && (
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            {module.lessons && module.lessons.length > 0 && (
              <div className="space-y-3 ml-11">
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lessonIndex} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                      {lesson.content && (
                        <p className="text-sm text-muted-foreground mt-1">{lesson.content}</p>
                      )}
                      {lesson.duration && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3" /> {lesson.duration}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  const renderSteps = () => (
    <div className="space-y-4">
      {contentData.steps?.map((step, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {index + 1}
              </div>
              <CardTitle className="text-base">{step.title}</CardTitle>
            </div>
          </CardHeader>
          {step.content && (
            <CardContent className="pt-0 ml-11">
              <p className="text-sm text-muted-foreground">{step.content}</p>
              {step.duration && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" /> {step.duration}
                </span>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );

  const renderPhases = () => (
    <div className="space-y-4">
      {contentData.phases?.map((phase, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{phase.title}</CardTitle>
                {phase.duration && (
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {phase.duration}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {phase.description && (
              <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
            )}
            {phase.milestones && phase.milestones.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Milestones</p>
                <ul className="space-y-2">
                  {phase.milestones.map((milestone, mIndex) => (
                    <li key={mIndex} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {milestone}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStages = () => (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6">
        {contentData.stages?.map((stage, index) => (
          <div key={index} className="relative pl-12">
            <div className="absolute left-3 w-5 h-5 rounded-full bg-primary border-2 border-background" />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  {stage.title}
                </CardTitle>
                {stage.description && (
                  <CardDescription>{stage.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {stage.topics && stage.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {stage.topics.map((topic, tIndex) => (
                      <Badge key={tIndex} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                )}
                {stage.resources && stage.resources.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Resources:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {stage.resources.map((resource, rIndex) => (
                        <li key={rIndex}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div className="space-y-6">
      {contentData.questions?.map((q, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-base flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                {index + 1}
              </span>
              {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {q.options && (
              <div className="space-y-2 mb-4">
                {q.options.map((option, optIndex) => (
                  <div 
                    key={optIndex} 
                    className={`p-3 rounded-lg border text-sm ${
                      optIndex === q.correctAnswer 
                        ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400" 
                        : "border-border"
                    }`}
                  >
                    {option}
                    {optIndex === q.correctAnswer && (
                      <CheckCircle2 className="h-4 w-4 inline ml-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
            {q.explanation && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <strong>Explanation:</strong> {q.explanation}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPracticeQuestions = () => (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        Practice Questions
      </h3>
      <div className="space-y-4">
        {contentData.practiceQuestions?.map((pq, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Q{index + 1}: {pq.question}</CardTitle>
            </CardHeader>
            {pq.answer && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{pq.answer}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (contentType) {
      case "course":
        return renderModules();
      case "guide":
        return renderSteps();
      case "plan":
        return renderPhases();
      case "roadmap":
        return renderStages();
      case "quiz":
        return renderQuiz();
      default:
        return <p className="text-muted-foreground">Content format not recognized.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">{typeLabels[contentType]}</Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{content.title}</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(content.created_at), "MMM d, yyyy")}
            </span>
            <Badge variant="outline" className="gap-1">
              {content.is_public ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              )}
            </Badge>
          </div>

          {contentData.description && (
            <p className="text-muted-foreground mt-4">{contentData.description}</p>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {renderContent()}
          
          {/* Practice questions if available and not a quiz */}
          {contentType !== "quiz" && contentData.practiceQuestions && contentData.practiceQuestions.length > 0 && (
            renderPracticeQuestions()
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AIContentDetail;
