import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  CheckCircle2,
  Flame,
  Trophy,
  Zap,
  Star,
  TrendingUp,
  ArrowRight,
  Lock,
} from "lucide-react";

const mockStats = [
  {
    label: "Total Problems",
    value: "917",
    icon: Target,
    gradient: "from-primary/10 to-primary/5",
    border: "border-primary/20",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    label: "Solved",
    value: "247",
    icon: CheckCircle2,
    gradient: "from-green-500/10 to-green-500/5",
    border: "border-green-500/20",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-500",
  },
  {
    label: "Day Streak",
    value: "12",
    icon: Flame,
    gradient: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-500",
  },
  {
    label: "Badges",
    value: "8/24",
    icon: Trophy,
    gradient: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-500",
  },
];

const mockSheets = [
  { name: "Striver's SDE Sheet", progress: 68, solved: 130, total: 191 },
  { name: "Neetcode 150", progress: 45, solved: 68, total: 150 },
  { name: "Love Babbar 450", progress: 22, solved: 99, total: 450 },
];

export const GuestProgressTeaser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative"
    >
      <Card className="overflow-hidden border-primary/20">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Your Progress Dashboard
              </h3>
              <p className="text-xs text-muted-foreground">
                Here's what tracking looks like
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
            <Lock className="h-3 w-3" />
            Preview
          </div>
        </div>

        {/* Blurred content area */}
        <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-5">
          {/* Mock stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {mockStats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-lg bg-gradient-to-br ${stat.gradient} ${stat.border} border p-3`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-md ${stat.iconBg} flex items-center justify-center`}
                  >
                    <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mock sheet progress */}
          <div className="space-y-2.5">
            {mockSheets.map((sheet) => (
              <div
                key={sheet.name}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {sheet.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {sheet.solved}/{sheet.total}
                    </span>
                  </div>
                  <Progress
                    value={sheet.progress}
                    className="h-1.5"
                    indicatorClassName={
                      sheet.progress === 100
                        ? "bg-emerald-500"
                        : "bg-primary"
                    }
                  />
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">
                  {sheet.progress}%
                </span>
              </div>
            ))}
          </div>

          {/* Blur overlay with CTA */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-5">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-2">
                Sign in to start tracking your progress
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="gap-1.5"
                >
                  Create Free Account
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
