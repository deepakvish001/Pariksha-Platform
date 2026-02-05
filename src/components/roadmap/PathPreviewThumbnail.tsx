import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PathPreviewThumbnailProps {
  customOrders: Record<string, string[]>;
  className?: string;
}

const PathPreviewThumbnail: React.FC<PathPreviewThumbnailProps> = ({
  customOrders,
  className,
}) => {
  const sections = useMemo(() => {
    return Object.entries(customOrders)
      .slice(0, 6) // Max 6 sections
      .map(([sectionId, nodeIds]) => ({
        id: sectionId,
        nodeCount: nodeIds.length,
        nodes: nodeIds.slice(0, 8), // Max 8 nodes per section for preview
      }));
  }, [customOrders]);

  const totalNodes = useMemo(() => {
    return Object.values(customOrders).reduce((acc, nodes) => acc + nodes.length, 0);
  }, [customOrders]);

  const sectionCount = Object.keys(customOrders).length;

  // Generate colors for sections
  const sectionColors = [
    "bg-amber-400",
    "bg-violet-400",
    "bg-emerald-400",
    "bg-blue-400",
    "bg-rose-400",
    "bg-cyan-400",
  ];

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-gradient-to-br from-background to-muted/50 overflow-hidden",
        className
      )}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "12px 12px",
        }}
      />

      {/* Main content */}
      <div className="relative p-3">
        {/* Path visualization */}
        <div className="flex flex-col gap-1.5">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="flex items-center gap-1">
              {/* Section indicator */}
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  sectionColors[sectionIndex % sectionColors.length]
                )}
              />
              
              {/* Nodes in section */}
              <div className="flex items-center gap-0.5 flex-wrap">
                {section.nodes.map((nodeId, nodeIndex) => (
                  <React.Fragment key={nodeId}>
                    {/* Node dot */}
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        nodeIndex === 0
                          ? sectionColors[sectionIndex % sectionColors.length]
                          : "bg-muted-foreground/40"
                      )}
                    />
                    {/* Connector line */}
                    {nodeIndex < section.nodes.length - 1 && (
                      <div className="w-1 h-px bg-muted-foreground/20" />
                    )}
                  </React.Fragment>
                ))}
                {/* More indicator */}
                {section.nodeCount > 8 && (
                  <span className="text-[8px] text-muted-foreground ml-0.5">
                    +{section.nodeCount - 8}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* More sections indicator */}
          {sectionCount > 6 && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30 flex items-center justify-center text-[6px]">
                ⋯
              </div>
              <span>+{sectionCount - 6} more sections</span>
            </div>
          )}
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-1.5 right-2 flex items-center gap-2 text-[9px] text-muted-foreground">
          <span>{sectionCount} sections</span>
          <span>•</span>
          <span>{totalNodes} topics</span>
        </div>
      </div>

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default PathPreviewThumbnail;
