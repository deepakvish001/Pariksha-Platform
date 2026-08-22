import React, { useState } from "react";
import { Download, ChevronDown, FileText, File, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ResumeTemplate } from "@/data/resumeTemplatesData";
import { cn } from "@/lib/utils";

interface FormatDownloadButtonProps {
  template: ResumeTemplate;
  onDownload: (template: ResumeTemplate, format: string) => void;
  variant?: "default" | "card";
  isDownloading?: boolean;
}

const formatIcons: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-4 w-4 text-red-500" />,
  DOCX: <File className="h-4 w-4 text-blue-500" />,
  "Google Docs": <ExternalLink className="h-4 w-4 text-green-500" />,
  LaTeX: <FileText className="h-4 w-4 text-purple-500" />,
  AI: <File className="h-4 w-4 text-orange-500" />,
  Figma: <ExternalLink className="h-4 w-4 text-pink-500" />,
};

const formatDescriptions: Record<string, string> = {
  PDF: "Best for sharing and printing",
  DOCX: "Editable in Microsoft Word",
  "Google Docs": "Edit online in Google Docs",
  LaTeX: "For academic documents",
  AI: "Adobe Illustrator format",
  Figma: "Edit in Figma design tool",
};

const FormatDownloadButton: React.FC<FormatDownloadButtonProps> = ({
  template,
  onDownload,
  variant = "default",
  isDownloading = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);
    setIsOpen(false);
    onDownload(template, format);
  };

  // Quick download with default format (PDF if available)
  const handleQuickDownload = () => {
    const defaultFormat = template.format.includes("PDF") ? "PDF" : template.format[0];
    onDownload(template, defaultFormat);
  };

  if (variant === "card") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            className="w-full gap-2 group/btn" 
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Free
                <ChevronDown className="h-4 w-4 ml-auto opacity-50 group-hover/btn:opacity-100 transition-opacity" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Select Format
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {template.format.map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleFormatSelect(format)}
              className="flex items-center gap-3 cursor-pointer"
            >
              {formatIcons[format] || <FileText className="h-4 w-4" />}
              <div className="flex-1">
                <p className="font-medium">{format}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDescriptions[format] || "Download template"}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant - for preview modal
  return (
    <div className="flex gap-2">
      <Button 
        className="flex-1 gap-2" 
        onClick={handleQuickDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download PDF
          </>
        )}
      </Button>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More download formats" disabled={isDownloading}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Other Formats
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {template.format.map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleFormatSelect(format)}
              className="flex items-center gap-3 cursor-pointer"
            >
              {formatIcons[format] || <FileText className="h-4 w-4" />}
              <div className="flex-1">
                <p className="font-medium">{format}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDescriptions[format] || "Download template"}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FormatDownloadButton;
