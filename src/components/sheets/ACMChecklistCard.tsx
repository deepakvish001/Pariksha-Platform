import React, { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, ChevronDown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ChecklistCategory } from "@/data/acmIcpcTrainingData";

interface ACMChecklistCardProps {
  checklist: ChecklistCategory[];
  className?: string;
}

const ACMChecklistCard: React.FC<ACMChecklistCardProps> = ({ checklist, className }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  if (!checklist || checklist.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className={cn("", className)}
    >
      <Card className="glass-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500/50 via-primary/50 to-cyan-500/50" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-primary/20 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            </div>
            Weekly Training Checklist
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Use this checklist every week to track your training discipline and mindset.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {checklist.map((cat) => (
            <div key={cat.title} className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                {cat.title}
              </h4>
              <div className="space-y-1.5 pl-5">
                {cat.items.map((item, i) => {
                  const key = `${cat.title}-${i}`;
                  const isChecked = !!checked[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggle(key)}
                      className="flex items-start gap-2.5 w-full text-left group"
                    >
                      <div
                        className={cn(
                          "mt-0.5 h-4 w-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors",
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border group-hover:border-primary/50"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <span
                        className={cn(
                          "text-sm leading-snug transition-colors",
                          isChecked
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        )}
                      >
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ACMChecklistCard;
