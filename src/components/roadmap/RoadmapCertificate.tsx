import { useState, useRef } from "react";
import { format } from "date-fns";
import { Download, Share2, Copy, Check, Loader2, Award, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

interface RoadmapCertificateProps {
  roadmapTitle: string;
  roadmapIcon: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
  userName?: string;
  trigger?: React.ReactNode;
}

const RoadmapCertificate = ({
  roadmapTitle,
  roadmapIcon,
  completedCount,
  totalCount,
  percentage,
  userName = "Learner",
  trigger,
}: RoadmapCertificateProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isComplete = percentage === 100;
  const currentDate = format(new Date(), "MMMM d, yyyy");

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#0f172a",
      });

      const link = document.createElement("a");
      link.download = `${roadmapTitle.toLowerCase().replace(/\s+/g, "-")}-certificate-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error exporting image:", error);
      toast.error("Failed to export certificate");
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
        backgroundColor: "#0f172a",
      });

      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      setCopied(true);
      toast.success("Certificate copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      const text = `🏆 ${roadmapTitle} Progress\n\nCompleted: ${completedCount}/${totalCount} topics (${percentage}%)\nDate: ${currentDate}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Progress copied as text!");
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
        backgroundColor: "#0f172a",
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "roadmap-certificate.png", { type: "image/png" });

      await navigator.share({
        title: `${roadmapTitle} Progress`,
        text: `I've completed ${percentage}% of the ${roadmapTitle} roadmap!`,
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Award className="h-4 w-4" />
            Export Certificate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {isComplete ? "Completion Certificate" : "Progress Certificate"}
          </DialogTitle>
        </DialogHeader>

        {/* Certificate Preview */}
        <div className="flex justify-center overflow-hidden">
          <div
            ref={cardRef}
            className="w-[400px] p-8 rounded-2xl relative overflow-hidden"
            style={{
              background: isComplete 
                ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
                : "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
            }}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-violet-500/20 to-transparent rounded-full blur-2xl" />
            
            {/* Corner Decorations */}
            <div className="absolute top-4 left-4 text-amber-500/30">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div className="absolute top-4 right-4 text-amber-500/30">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div className="absolute bottom-4 left-4 text-amber-500/30">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div className="absolute bottom-4 right-4 text-amber-500/30">
              <Star className="h-6 w-6 fill-current" />
            </div>

            {/* Content */}
            <div className="relative text-center">
              {/* Header Badge */}
              <div className="flex justify-center mb-4">
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center text-3xl",
                  isComplete 
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"
                    : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"
                )}>
                  {isComplete ? "🏆" : roadmapIcon}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-white/60 mb-1">
                {isComplete ? "Certificate of Completion" : "Progress Certificate"}
              </h3>
              <h2 className="text-2xl font-bold text-white mb-4">
                {roadmapTitle}
              </h2>

              {/* Progress Ring */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <svg className="h-24 w-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      className="fill-none stroke-white/10"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      className={cn(
                        "fill-none",
                        isComplete ? "stroke-amber-400" : "stroke-violet-400"
                      )}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * percentage) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(
                      "text-2xl font-bold",
                      isComplete ? "text-amber-400" : "text-violet-400"
                    )}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Topics Completed</p>
                  <p className="text-xl font-bold text-white">
                    {completedCount}/{totalCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">Achievement</p>
                  <p className="text-xl font-bold text-white">
                    {isComplete ? "🌟 Master" : percentage >= 50 ? "📈 Advancing" : "🚀 Beginner"}
                  </p>
                </div>
              </div>

              {/* User Name */}
              <p className="text-sm text-white/70 mb-2">
                Awarded to <span className="font-semibold text-white">{userName}</span>
              </p>

              {/* Date */}
              <p className="text-xs text-white/40">{currentDate}</p>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/30">Verified by Learning Roadmap</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" onClick={handleDownloadImage} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCopyToClipboard} disabled={isExporting}>
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
          <Button onClick={handleShare} disabled={isExporting}>
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

export default RoadmapCertificate;
