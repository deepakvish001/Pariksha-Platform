import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface ResumeUploadZoneProps {
  onUpload: (file: File, jobDescription?: string) => void;
  isUploading: boolean;
  isAnalyzing: boolean;
  uploadProgress: number;
  validateFile: (file: File) => string | null;
}

export const ResumeUploadZone = ({
  onUpload,
  isUploading,
  isAnalyzing,
  uploadProgress,
  validateFile,
}: ResumeUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { requireAuth, LoginPromptDialog: AuthDialog } = useRequireAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const file = e.dataTransfer.files[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        setSelectedFile(file);
      }
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        setSelectedFile(file);
      }
    },
    [validateFile]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (selectedFile) {
      requireAuth(() => onUpload(selectedFile, jobDescription || undefined));
    }
  }, [selectedFile, jobDescription, onUpload, requireAuth]);

  const isProcessing = isUploading || isAnalyzing;

  if (isProcessing) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isUploading ? "Uploading Resume..." : "Analyzing Resume..."}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isUploading
                ? "Please wait while we upload your file"
                : "AI is reviewing your resume for improvements"}
            </p>
            <Progress value={uploadProgress} className="w-64 h-2" />
            <p className="text-xs text-muted-foreground mt-2">{uploadProgress}% complete</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "border-dashed border-2 transition-colors cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          error && "border-destructive",
          !isDragging && !error && "border-border hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          {selectedFile ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{selectedFile.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Drag and drop your resume or click to browse
              </p>
              <label htmlFor="resume-upload">
                <Button asChild>
                  <span>Select File</span>
                </Button>
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, DOC, DOCX, TXT (Max 5MB)
              </p>
            </>
          )}
          {error && <p className="text-sm text-destructive mt-4">{error}</p>}
        </CardContent>
      </Card>

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="job-description">Job Description (Optional)</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description here for a more targeted analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Adding a job description helps us provide more relevant feedback
            </p>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            Analyze Resume
          </Button>
        </motion.div>
      )}
      {AuthDialog}
    </div>
  );
};
