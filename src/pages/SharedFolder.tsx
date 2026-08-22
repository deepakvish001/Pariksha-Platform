import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Folder,
  Loader2,
  Copy,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFolderSharing } from "@/hooks/useFolderSharing";
import { useFolders } from "@/hooks/useFolders";
import { interviewQuestions } from "@/data/interviewQuestionsData";
import { getQuestionsForCompany, massRecruitmentCategories } from "@/data/massRecruitmentData";

const difficultyStyles: Record<string, string> = {
  Easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  Medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  Hard: "bg-red-500/20 text-red-500 border-red-500/30",
};

// Helper to get question details from various sources
const getQuestionDetails = (questionId: number, source: string) => {
  if (source === "interview") {
    const question = interviewQuestions.find((q) => q.id === questionId);
    return question
      ? { id: question.id, text: question.text, difficulty: question.difficulty }
      : null;
  }
  
  if (source.startsWith("mass-recruitment-")) {
    const companyId = source.replace("mass-recruitment-", "");
    for (const cat of massRecruitmentCategories) {
      const questions = getQuestionsForCompany(companyId, cat.id);
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        return { id: question.id, text: question.text, difficulty: question.difficulty };
      }
    }
  }
  
  return null;
};

// Get source label for display
const getSourceLabel = (source: string): string => {
  if (source === "interview") return "Interview Questions";
  if (source.startsWith("mass-recruitment-")) {
    const companyId = source.replace("mass-recruitment-", "");
    return `Mass Recruitment - ${companyId.charAt(0).toUpperCase() + companyId.slice(1).replace(/-/g, " ")}`;
  }
  return source;
};

const SharedFolder = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSharedFolderByCode } = useFolderSharing();
  
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [folderData, setFolderData] = useState<{
    folder: { name: string; description: string | null; color: string } | null;
    items: { question_id: number; question_source: string; sort_order: number }[];
  } | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // For copying to user's collection
  const { createFolder, addToFolder } = useFolders("interview");

  useEffect(() => {
    const fetchSharedFolder = async () => {
      if (!shareCode) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const data = await getSharedFolderByCode(shareCode);
      if (!data || !data.folder) {
        setNotFound(true);
      } else {
        setFolderData(data);
      }
      setIsLoading(false);
    };

    fetchSharedFolder();
  }, [shareCode, getSharedFolderByCode]);

  // Get items with question details
  const itemsWithDetails = useMemo(() => {
    if (!folderData) return [];
    return folderData.items
      .map((item) => {
        const details = getQuestionDetails(item.question_id, item.question_source);
        if (!details) return null;
        return {
          ...item,
          question: {
            ...details,
            source: item.question_source,
            sourceLabel: getSourceLabel(item.question_source),
          },
        };
      })
      .filter(Boolean) as {
        question_id: number;
        question_source: string;
        sort_order: number;
        question: { id: number; text: string; difficulty?: string; source: string; sourceLabel: string };
      }[];
  }, [folderData]);

  const handleCopyToCollection = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!folderData?.folder) return;

    setIsCopying(true);
    try {
      // Create new folder with same name
      const newFolder = await createFolder(
        `${folderData.folder.name} (Copy)`,
        folderData.folder.description || undefined,
        folderData.folder.color
      );

      if (!newFolder) {
        toast.error("Failed to create folder");
        return;
      }

      // Add all items to the new folder
      let addedCount = 0;
      for (const item of folderData.items) {
        const success = await addToFolder(newFolder.id, item.question_id, item.question_source);
        if (success) addedCount++;
      }

      toast.success(`Copied ${addedCount} questions to your collection!`);
      navigate("/platform/collections");
    } catch (err) {
      console.error("Error copying collection:", err);
      toast.error("Failed to copy collection");
    } finally {
      setIsCopying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-16 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Collection Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This shared collection doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto">
          <div className="flex h-16 items-center gap-4 px-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">
                  {folderData?.folder?.name || "Shared Collection"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {itemsWithDetails.length} questions • Shared collection
                </p>
              </div>
            </div>
            {user && (
              <Button
                onClick={handleCopyToCollection}
                disabled={isCopying}
                className="gap-2"
              >
                {isCopying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Copy to My Collections</span>
                <span className="sm:hidden">Copy</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Description */}
        {folderData?.folder?.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground"
          >
            {folderData.folder.description}
          </motion.p>
        )}

        {/* Login prompt for copying */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">
              Sign in to copy this collection to your account
            </p>
            <Button size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </motion.div>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {itemsWithDetails.map((item, index) => (
            <motion.div
              key={`${item.question_id}-${item.question_source}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.question.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {item.question.sourceLabel}
                        </span>
                      </div>
                    </div>
                    {item.question.difficulty && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs flex-shrink-0",
                          difficultyStyles[item.question.difficulty] || ""
                        )}
                      >
                        {item.question.difficulty}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {itemsWithDetails.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">This collection is empty.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedFolder;
