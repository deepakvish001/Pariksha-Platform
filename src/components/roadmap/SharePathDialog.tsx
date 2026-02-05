import React, { useState, useEffect } from "react";
import { 
  Share2, 
  Copy, 
  Download, 
  Upload,
  Check,
  Link2,
  FileJson,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SharePathDialogProps {
  roadmapId: string;
  roadmapTitle: string;
  customOrders: Record<string, string[]>;
  hasCustomOrder: boolean;
  onImportOrder: (orders: Record<string, string[]>) => void;
  trigger?: React.ReactNode;
}

interface ExportData {
  version: 1;
  roadmapId: string;
  roadmapTitle: string;
  exportedAt: string;
  customOrders: Record<string, string[]>;
}

const SharePathDialog: React.FC<SharePathDialogProps> = ({
  roadmapId,
  roadmapTitle,
  customOrders,
  hasCustomOrder,
  onImportOrder,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  // Generate share URL with encoded data
  useEffect(() => {
    if (hasCustomOrder && Object.keys(customOrders).length > 0) {
      const exportData: ExportData = {
        version: 1,
        roadmapId,
        roadmapTitle,
        exportedAt: new Date().toISOString(),
        customOrders,
      };
      
      const encoded = btoa(JSON.stringify(exportData));
      const url = `${window.location.origin}${window.location.pathname}?importPath=${encoded}`;
      setShareUrl(url);
    }
  }, [customOrders, hasCustomOrder, roadmapId, roadmapTitle]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with others to share your learning path.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = () => {
    const exportData: ExportData = {
      version: 1,
      roadmapId,
      roadmapTitle,
      exportedAt: new Date().toISOString(),
      customOrders,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${roadmapId}-custom-path.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Path exported!",
      description: "Your custom learning path has been downloaded.",
    });
  };

  const handleCopyJSON = async () => {
    const exportData: ExportData = {
      version: 1,
      roadmapId,
      roadmapTitle,
      exportedAt: new Date().toISOString(),
      customOrders,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      toast({
        title: "JSON copied!",
        description: "Paste it anywhere to share your learning path.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    try {
      const data: ExportData = JSON.parse(importText);
      
      if (data.version !== 1) {
        throw new Error("Unsupported version");
      }

      if (data.roadmapId !== roadmapId) {
        toast({
          title: "Wrong roadmap",
          description: `This path is for "${data.roadmapTitle}", not the current roadmap.`,
          variant: "destructive",
        });
        return;
      }

      if (!data.customOrders || Object.keys(data.customOrders).length === 0) {
        throw new Error("No custom order found");
      }

      onImportOrder(data.customOrders);
      setIsOpen(false);
      setImportText("");
      
      toast({
        title: "Path imported!",
        description: "Your learning path has been updated with the imported order.",
      });
    } catch (err) {
      toast({
        title: "Invalid import data",
        description: "Please paste valid JSON exported from this app.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share Path</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Share Learning Path
          </DialogTitle>
          <DialogDescription>
            Share your custom learning path with others or import a shared path.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 mt-4">
            {hasCustomOrder ? (
              <>
                {/* Share Link */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Link2 className="h-3.5 w-3.5" />
                    Share Link
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={shareUrl} 
                      readOnly 
                      className="text-xs font-mono"
                    />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anyone with this link can import your custom learning path.
                  </p>
                </div>

                {/* Export Options */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <FileJson className="h-3.5 w-3.5" />
                    Export as JSON
                  </Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-1.5"
                      onClick={handleExportJSON}
                    >
                      <Download className="h-4 w-4" />
                      Download File
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-1.5"
                      onClick={handleCopyJSON}
                    >
                      <Copy className="h-4 w-4" />
                      Copy JSON
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Share2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No custom path to share</p>
                <p className="text-sm mt-1">
                  Enable "Reorder" mode and drag topics to create a custom learning path.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Paste JSON or visit a shared link</Label>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste the exported JSON here...
{
  "version": 1,
  "roadmapId": "...",
  ...
}'
                className="font-mono text-xs min-h-[150px]"
              />
            </div>
            <Button 
              onClick={handleImport} 
              disabled={!importText.trim()}
              className="w-full gap-1.5"
            >
              <Upload className="h-4 w-4" />
              Import Learning Path
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SharePathDialog;
