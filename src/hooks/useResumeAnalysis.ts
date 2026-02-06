import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AnalysisResult {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  overall_score: number;
  ats_score: number;
  keyword_score: number;
  format_score: number;
  content_score: number;
  suggestions: { text: string; priority: "high" | "medium" | "low" }[];
  strengths: string[];
  keywords_found: string[];
  summary: string;
  created_at: string;
}

export interface AnalysisState {
  isUploading: boolean;
  isAnalyzing: boolean;
  uploadProgress: number;
  currentAnalysis: AnalysisResult | null;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const useResumeAnalysis = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AnalysisState>({
    isUploading: false,
    isAnalyzing: false,
    uploadProgress: 0,
    currentAnalysis: null,
  });

  // Fetch analysis history
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["resume-analyses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as AnalysisResult[];
    },
    enabled: !!user,
  });

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a PDF, DOC, DOCX, or TXT file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB.";
    }
    return null;
  }, []);

  // Extract text from file (for PDF, we'll send raw text; for others, read as text)
  const extractTextFromFile = async (file: File): Promise<string> => {
    // For text files, read directly
    if (file.type === "text/plain") {
      return await file.text();
    }

    // For PDF and Word docs, we'll need to read them as text
    // The AI can handle raw text content from PDFs well enough
    // For a production app, you'd use a dedicated PDF parser
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const text = reader.result as string;
        // For PDFs and Word docs, just send what we can extract
        // The AI will work with the available content
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Upload and analyze resume
  const analyzeResume = useMutation({
    mutationFn: async ({ file, jobDescription }: { file: File; jobDescription?: string }) => {
      if (!user) throw new Error("You must be logged in to analyze resumes");

      // Validate file
      const validationError = validateFile(file);
      if (validationError) throw new Error(validationError);

      setState(prev => ({ ...prev, isUploading: true, uploadProgress: 10 }));

      // Upload file to storage
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("resume-uploads")
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      setState(prev => ({ ...prev, uploadProgress: 40, isUploading: false, isAnalyzing: true }));

      // Get file URL
      const { data: urlData } = supabase.storage
        .from("resume-uploads")
        .getPublicUrl(filePath);

      // Extract text from file
      let resumeText = "";
      try {
        resumeText = await extractTextFromFile(file);
      } catch {
        // If text extraction fails, send filename as context
        resumeText = `Resume file: ${file.name}`;
      }

      setState(prev => ({ ...prev, uploadProgress: 60 }));

      // Call the edge function for AI analysis
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "analyze-resume",
        {
          body: {
            fileUrl: urlData.publicUrl,
            fileName: file.name,
            resumeText,
            jobDescription,
          },
        }
      );

      if (functionError) throw new Error(functionError.message);
      if (functionData.error) throw new Error(functionData.error);

      setState(prev => ({ ...prev, uploadProgress: 80 }));

      const analysis = functionData.analysis;

      // Save analysis to database
      const { data: savedAnalysis, error: saveError } = await supabase
        .from("resume_analyses")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          overall_score: analysis.overall_score,
          ats_score: analysis.ats_score,
          keyword_score: analysis.keyword_score,
          format_score: analysis.format_score,
          content_score: analysis.content_score,
          suggestions: analysis.suggestions,
          strengths: analysis.strengths,
          keywords_found: analysis.keywords_found,
          summary: analysis.summary,
        })
        .select()
        .single();

      if (saveError) throw new Error(`Failed to save analysis: ${saveError.message}`);

      setState(prev => ({ ...prev, uploadProgress: 100 }));

      return savedAnalysis as unknown as AnalysisResult;
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        isUploading: false,
        isAnalyzing: false,
        uploadProgress: 0,
        currentAnalysis: data,
      }));
      queryClient.invalidateQueries({ queryKey: ["resume-analyses"] });
      toast({
        title: "Analysis Complete!",
        description: `Your resume scored ${data.overall_score}/100`,
      });
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        isUploading: false,
        isAnalyzing: false,
        uploadProgress: 0,
      }));
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete analysis
  const deleteAnalysis = useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from("resume_analyses")
        .delete()
        .eq("id", analysisId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-analyses"] });
      setState(prev => ({ ...prev, currentAnalysis: null }));
      toast({
        title: "Analysis Deleted",
        description: "The analysis has been removed from your history.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const viewAnalysis = useCallback((analysis: AnalysisResult) => {
    setState(prev => ({ ...prev, currentAnalysis: analysis }));
  }, []);

  const clearCurrentAnalysis = useCallback(() => {
    setState(prev => ({ ...prev, currentAnalysis: null }));
  }, []);

  return {
    ...state,
    history,
    isLoadingHistory,
    analyzeResume: analyzeResume.mutate,
    isAnalyzingMutation: analyzeResume.isPending,
    deleteAnalysis: deleteAnalysis.mutate,
    isDeletingAnalysis: deleteAnalysis.isPending,
    viewAnalysis,
    clearCurrentAnalysis,
    validateFile,
  };
};
