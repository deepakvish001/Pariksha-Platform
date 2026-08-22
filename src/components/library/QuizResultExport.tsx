import { useState, useRef } from "react";
import { format } from "date-fns";
import { Download, Share2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

interface QuizResultExportProps {
  result: {
    id: string;
    quiz_type: string;
    category: string | null;
    difficulty: string | null;
    score: number;
    total_questions: number;
    accuracy: number;
    avg_time_seconds: number;
    total_time_seconds: number;
    completed_at: string;
  };
}

const QuizResultExport = ({ result }: QuizResultExportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#1a1a2e",
      });

      const link = document.createElement("a");
      link.download = `quiz-result-${format(new Date(result.completed_at), "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Error exporting image:", error);
      toast.error("Failed to export image");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#1a1a2e",
      });

      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      setCopied(true);
      toast.success("Image copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      // Fallback: copy text summary
      const text = `🎯 Quiz Result\n\nScore: ${result.score}/${result.total_questions} (${result.accuracy}%)\nTime: ${Math.floor(result.total_time_seconds / 60)}:${(result.total_time_seconds % 60).toString().padStart(2, "0")}\nType: ${result.quiz_type.toUpperCase()}\nDate: ${format(new Date(result.completed_at), "MMM d, yyyy")}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Result copied as text!");
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    if (!navigator.share) {
      handleCopyToClipboard();
      return;
    }

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#1a1a2e",
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "quiz-result.png", { type: "image/png" });

      await navigator.share({
        title: "My Quiz Result",
        text: `I scored ${result.accuracy}% on a ${result.quiz_type.toUpperCase()} quiz!`,
        files: [file],
      });

      toast.success("Shared successfully!");
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        handleCopyToClipboard();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="Export/Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Quiz Result</DialogTitle>
        </DialogHeader>

        {/* Shareable Card Preview */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="w-[320px] p-6 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white"
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="text-lg font-bold text-white/90">Quiz Result</h3>
              <p className="text-xs text-white/60">
                {format(new Date(result.completed_at), "MMMM d, yyyy")}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/10">
                <span className="text-white/70">Score</span>
                <span className="font-bold text-xl">
                  {result.score}/{result.total_questions}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/10">
                <span className="text-white/70">Accuracy</span>
                <span
                  className={cn(
                    "font-bold text-xl",
                    result.accuracy >= 80
                      ? "text-emerald-400"
                      : result.accuracy >= 50
                        ? "text-amber-400"
                        : "text-red-400"
                  )}
                >
                  {result.accuracy}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/10">
                <span className="text-white/70">Time</span>
                <span className="font-bold">{formatTime(result.total_time_seconds)}</span>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <Badge className="bg-white/20 text-white border-0">
                {result.quiz_type.toUpperCase()}
              </Badge>
              {result.difficulty && result.difficulty !== "all" && (
                <Badge className="bg-white/20 text-white border-0">
                  {result.difficulty}
                </Badge>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <p className="text-xs text-white/40">Shared from Quiz Practice</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" onClick={handleDownloadImage} disabled={isExporting} aria-label="Save as image" aria-busy={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCopyToClipboard} disabled={isExporting} aria-label="Copy to clipboard" aria-busy={isExporting}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button onClick={handleShare} disabled={isExporting} aria-label="Share result" aria-busy={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizResultExport;
