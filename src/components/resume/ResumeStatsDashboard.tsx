import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, Download, Shield, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  gradient: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  suffix = "",
  label,
  gradient,
  delay,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <Card className="relative overflow-hidden p-4 bg-background/60 backdrop-blur-sm border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        {/* Background Gradient */}
        <div
          className={cn(
            "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20",
            gradient
          )}
        />

        <div className="relative flex items-center gap-3">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
              gradient
            )}
          >
            {icon}
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatNumber(count)}
              {suffix}
            </div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

interface ResumeStatsDashboardProps {
  templateCount: number;
  totalDownloads: number;
  atsPercentage: number;
  rating: number;
}

const ResumeStatsDashboard: React.FC<ResumeStatsDashboardProps> = ({
  templateCount,
  totalDownloads,
  atsPercentage,
  rating,
}) => {
  return (
    <section className="py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileCheck className="h-6 w-6 text-white" />}
          value={templateCount}
          suffix="+"
          label="Templates"
          gradient="from-blue-500 to-indigo-600"
          delay={0}
        />
        <StatCard
          icon={<Download className="h-6 w-6 text-white" />}
          value={totalDownloads}
          suffix="+"
          label="Downloads"
          gradient="from-amber-500 to-orange-500"
          delay={150}
        />
        <StatCard
          icon={<Shield className="h-6 w-6 text-white" />}
          value={atsPercentage}
          suffix="%"
          label="ATS Friendly"
          gradient="from-emerald-500 to-green-600"
          delay={300}
        />
        <StatCard
          icon={<Star className="h-6 w-6 text-white" />}
          value={rating}
          suffix="★"
          label="User Rating"
          gradient="from-purple-500 to-pink-500"
          delay={450}
        />
      </div>
    </section>
  );
};

export default ResumeStatsDashboard;
