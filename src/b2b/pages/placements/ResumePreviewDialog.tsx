import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ExternalLink, FileText, AlertCircle, RefreshCw } from "lucide-react";

function getExt(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const m = path.match(/\.([a-z0-9]+)(?:$)/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

export function ResumePreviewDialog({
  open, onOpenChange, url, studentName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string | null;
  studentName?: string | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const ext = url ? getExt(url) : "";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
  const isPdf = ext === "pdf";
  const isOffice = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext);

  const previewSrc = useMemo(() => {
    if (!url) return "";
    if (isPdf || isImage) return `${url}#toolbar=1&view=FitH`;
    if (isOffice) {
      return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url, isPdf, isImage, isOffice]);

  const reset = () => { setLoaded(false); setErrored(false); setReloadKey((k) => k + 1); };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) { setLoaded(false); setErrored(false); } onOpenChange(o); }}
    >
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            Resume{studentName ? ` · ${studentName}` : ""}
          </DialogTitle>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-8" onClick={reset}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload
            </Button>
            {url && (
              <>
                <Button asChild size="sm" variant="outline" className="h-8">
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
                  </a>
                </Button>
                <Button asChild size="sm" className="h-8">
                  <a href={url} download>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                  </a>
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="relative flex-1 bg-muted/20">
          {!url ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No resume on file.
            </div>
          ) : errored ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
              <AlertCircle className="h-8 w-8 text-amber-400" />
              <div className="text-sm font-medium">Preview not available</div>
              <div className="text-xs text-muted-foreground max-w-md">
                The file couldn't be embedded here (it may block embedding or use an unsupported format).
                You can still open or download it.
              </div>
              <div className="flex gap-2 pt-1">
                <Button asChild size="sm" variant="outline">
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in new tab
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={url} download>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {!loaded && (
                <div className="absolute inset-0 p-4 space-y-3">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-[calc(100%-3rem)] w-full" />
                </div>
              )}
              {isImage ? (
                <img
                  key={reloadKey}
                  src={previewSrc}
                  alt="Resume preview"
                  className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
                  onLoad={() => setLoaded(true)}
                  onError={() => setErrored(true)}
                />
              ) : (
                <iframe
                  key={reloadKey}
                  src={previewSrc}
                  title="Resume preview"
                  className="absolute inset-0 w-full h-full bg-white"
                  onLoad={() => setLoaded(true)}
                  onError={() => setErrored(true)}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
