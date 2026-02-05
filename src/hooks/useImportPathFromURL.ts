import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ExportData {
  version: 1;
  roadmapId: string;
  roadmapTitle: string;
  exportedAt: string;
  customOrders: Record<string, string[]>;
}

export const useImportPathFromURL = (
  currentRoadmapId: string,
  onImport: (orders: Record<string, string[]>) => Promise<void>
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState<ExportData | null>(null);

  useEffect(() => {
    const importPath = searchParams.get("importPath");
    
    if (!importPath) return;

    const handleImport = async () => {
      setIsImporting(true);
      
      try {
        // Decode the base64 data
        const decoded = atob(importPath);
        const data: ExportData = JSON.parse(decoded);

        // Validate version
        if (data.version !== 1) {
          throw new Error("Unsupported version");
        }

        // Check if it's for the current roadmap
        if (data.roadmapId !== currentRoadmapId) {
          toast({
            title: "Wrong roadmap",
            description: `This shared path is for "${data.roadmapTitle}", not the current roadmap.`,
            variant: "destructive",
          });
          // Clear the URL param
          setSearchParams((prev) => {
            prev.delete("importPath");
            return prev;
          });
          return;
        }

        // Validate custom orders exist
        if (!data.customOrders || Object.keys(data.customOrders).length === 0) {
          throw new Error("No custom order found in shared link");
        }

        setImportedData(data);

        // Import the orders
        await onImport(data.customOrders);

        toast({
          title: "Path imported!",
          description: `Successfully imported "${data.roadmapTitle}" learning path.`,
        });

        // Clear the URL param after successful import
        setSearchParams((prev) => {
          prev.delete("importPath");
          return prev;
        });
      } catch (err) {
        console.error("Error importing path from URL:", err);
        toast({
          title: "Invalid share link",
          description: "The shared learning path link is invalid or corrupted.",
          variant: "destructive",
        });
        // Clear the invalid param
        setSearchParams((prev) => {
          prev.delete("importPath");
          return prev;
        });
      } finally {
        setIsImporting(false);
      }
    };

    handleImport();
  }, [searchParams, currentRoadmapId, onImport, setSearchParams]);

  return {
    isImporting,
    importedData,
  };
};
