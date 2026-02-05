import React, { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoadmapTreeConnectorProps {
  fromY: number;
  toY: number;
  depth: number;
  isCompleted: boolean;
  isOnProgressPath: boolean;
}

const RoadmapTreeConnector: React.FC<RoadmapTreeConnectorProps> = memo(({
  fromY,
  toY,
  depth,
  isCompleted,
  isOnProgressPath,
}) => {
  const x = 24 + depth * 24; // Horizontal position based on depth
  const height = toY - fromY;
  
  // Create smooth bezier curve path
  const pathD = `
    M ${x} ${fromY}
    C ${x} ${fromY + height * 0.4},
      ${x} ${toY - height * 0.4},
      ${x} ${toY}
  `;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ 
        left: 0, 
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Background Path */}
      <motion.path
        d={pathD}
        fill="none"
        strokeWidth={2}
        className={cn(
          "stroke-border",
          isCompleted && "stroke-emerald-500/30",
          isOnProgressPath && !isCompleted && "stroke-primary/30"
        )}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      
      {/* Progress Overlay Path */}
      {(isCompleted || isOnProgressPath) && (
        <motion.path
          d={pathD}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          className={cn(
            isCompleted ? "stroke-emerald-500" : "stroke-primary"
          )}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      )}
    </svg>
  );
});

RoadmapTreeConnector.displayName = "RoadmapTreeConnector";

// Simplified vertical connector for tree structure
export const VerticalConnector: React.FC<{
  depth: number;
  isCompleted: boolean;
  isOnProgressPath: boolean;
  height?: number;
}> = memo(({ depth, isCompleted, isOnProgressPath, height = 32 }) => {
  if (depth === 0) return null;

  return (
    <div className="absolute" style={{ left: depth * 24 - 12, top: -4 }}>
      <svg width="24" height={height + 8} className="overflow-visible">
        {/* Vertical Line */}
        <motion.line
          x1="12"
          y1="0"
          x2="12"
          y2={height}
          strokeWidth={2}
          strokeLinecap="round"
          className={cn(
            "stroke-border",
            isCompleted && "stroke-emerald-500",
            isOnProgressPath && !isCompleted && "stroke-primary"
          )}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
        {/* Horizontal connector to node */}
        <motion.line
          x1="12"
          y1={height}
          x2="24"
          y2={height}
          strokeWidth={2}
          strokeLinecap="round"
          className={cn(
            "stroke-border",
            isCompleted && "stroke-emerald-500",
            isOnProgressPath && !isCompleted && "stroke-primary"
          )}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        />
      </svg>
    </div>
  );
});

VerticalConnector.displayName = "VerticalConnector";

export default RoadmapTreeConnector;
