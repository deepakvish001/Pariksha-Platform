import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Minimize2,
  Maximize2,
  Focus,
  List,
  LayoutGrid,
  Filter,
  ArrowUp,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapMobileFABProps {
  isCompactMode: boolean;
  onToggleCompact: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  layoutMode: "vertical" | "horizontal";
  onLayoutModeChange: (mode: "vertical" | "horizontal") => void;
  onScrollToTop: () => void;
  onResetOrder?: () => void;
  showResetOrder?: boolean;
}

interface FABAction {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  color?: string;
  activeColor?: string;
}

const RoadmapMobileFAB = ({
  isCompactMode,
  onToggleCompact,
  isFocusMode,
  onToggleFocus,
  layoutMode,
  onLayoutModeChange,
  onScrollToTop,
  onResetOrder,
  showResetOrder = false,
}: RoadmapMobileFABProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions: FABAction[] = [
    {
      icon: <ArrowUp className="h-5 w-5" />,
      label: "Scroll to Top",
      onClick: () => {
        onScrollToTop();
        setIsOpen(false);
      },
      color: "bg-slate-500",
    },
    {
      icon: isCompactMode ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />,
      label: isCompactMode ? "Expand View" : "Compact View",
      onClick: () => {
        onToggleCompact();
        setIsOpen(false);
      },
      isActive: isCompactMode,
      color: "bg-blue-500",
      activeColor: "bg-blue-600 ring-2 ring-blue-300",
    },
    {
      icon: <Focus className="h-5 w-5" />,
      label: isFocusMode ? "Exit Focus" : "Focus Mode",
      onClick: () => {
        onToggleFocus();
        setIsOpen(false);
      },
      isActive: isFocusMode,
      color: "bg-amber-500",
      activeColor: "bg-amber-600 ring-2 ring-amber-300",
    },
    {
      icon: layoutMode === "vertical" ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />,
      label: layoutMode === "vertical" ? "Card View" : "List View",
      onClick: () => {
        onLayoutModeChange(layoutMode === "vertical" ? "horizontal" : "vertical");
        setIsOpen(false);
      },
      color: "bg-violet-500",
    },
  ];

  // Add reset order action if available
  if (showResetOrder && onResetOrder) {
    actions.push({
      icon: <RotateCcw className="h-5 w-5" />,
      label: "Reset Order",
      onClick: () => {
        onResetOrder();
        setIsOpen(false);
      },
      color: "bg-rose-500",
    });
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container - Only visible on mobile */}
      <div className="fixed bottom-6 right-4 z-50 sm:hidden">
        {/* Action Buttons */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end mb-2">
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.8,
                    transition: { delay: (actions.length - index - 1) * 0.03 },
                  }}
                  onClick={action.onClick}
                  className="flex items-center gap-3 group"
                >
                  {/* Label */}
                  <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-medium shadow-lg whitespace-nowrap">
                    {action.label}
                  </span>

                  {/* Icon Button */}
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95",
                      action.isActive && action.activeColor
                        ? action.activeColor
                        : action.color || "bg-primary"
                    )}
                  >
                    {action.icon}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-colors",
            isOpen
              ? "bg-muted text-foreground"
              : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
          )}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </motion.button>
      </div>
    </>
  );
};

export default RoadmapMobileFAB;
