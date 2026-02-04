import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  LayoutGrid,
  FileSpreadsheet,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface MobileFABProps {
  onOpenGoals?: () => void;
}

const MobileFAB = ({ onOpenGoals }: MobileFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const actions: FABAction[] = [
    {
      icon: <LayoutGrid className="h-5 w-5" />,
      label: "Dashboard",
      onClick: () => {
        navigate("/dashboard");
        setIsOpen(false);
      },
      color: "bg-purple-500",
    },
    {
      icon: <FileSpreadsheet className="h-5 w-5" />,
      label: "Sheets",
      onClick: () => {
        navigate("/dashboard/sheets");
        setIsOpen(false);
      },
      color: "bg-green-500",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: "Astra AI",
      onClick: () => {
        navigate("/platform/ai");
        setIsOpen(false);
      },
      color: "bg-yellow-500",
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "Set Goals",
      onClick: () => {
        if (onOpenGoals) {
          onOpenGoals();
        }
        setIsOpen(false);
      },
      color: "bg-orange-500",
    },
  ];

  // Filter out current page from actions
  const filteredActions = actions.filter((action) => {
    if (action.label === "Dashboard" && location.pathname === "/dashboard") return false;
    if (action.label === "Sheets" && location.pathname === "/dashboard/sheets") return false;
    if (action.label === "Astra AI" && location.pathname === "/platform/ai") return false;
    return true;
  });

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
              {filteredActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 10, 
                    scale: 0.8,
                    transition: { delay: (filteredActions.length - index - 1) * 0.03 }
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
                      "h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95",
                      action.color || "bg-primary"
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
              : "bg-gradient-orange text-primary-foreground"
          )}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </motion.button>
      </div>
    </>
  );
};

export default MobileFAB;
