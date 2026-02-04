import { Flame, TrendingUp, Zap, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const weekData = [
  { day: "Mon", value: 80, tasks: 12 },
  { day: "Tue", value: 65, tasks: 9 },
  { day: "Wed", value: 90, tasks: 15 },
  { day: "Thu", value: 75, tasks: 11 },
  { day: "Fri", value: 85, tasks: 14 },
  { day: "Sat", value: 60, tasks: 8 },
  { day: "Sun", value: 95, tasks: 16 },
];

const Momentum = () => {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <h2 className="section-title">Momentum is engineered, not hoped for</h2>
          <p className="section-subtitle">
            Your consistency builds real career outcomes
          </p>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Streak Card */}
            <ScrollReveal delay={0.1} direction="left">
              <div className="card-dark h-full">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Current Streak</h3>
                      <p className="text-xs text-muted-foreground">Keep the fire burning!</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    🔥 On Fire
                  </div>
                </div>

                {/* Big Streak Number */}
                <div className="text-center py-6">
                  <motion.div 
                    className="text-7xl font-bold gradient-text mb-2"
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    viewport={{ once: true }}
                  >
                    14
                  </motion.div>
                  <p className="text-muted-foreground">consecutive days</p>
                </div>

                {/* Streak visualization */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">This week's progress</span>
                    <span className="text-xs text-primary font-medium">7/7 days</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        viewport={{ once: true }}
                        className={`flex-1 h-3 rounded-full ${
                          i < 14 ? "bg-primary" : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Streak stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">28</p>
                      <p className="text-xs text-muted-foreground">Best streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">89%</p>
                      <p className="text-xs text-muted-foreground">Monthly rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Daily History Stats Card */}
            <ScrollReveal delay={0.2} direction="right">
              <div className="card-dark h-full">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Daily History Stats</h3>
                      <p className="text-xs text-muted-foreground">Last 7 days overview</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    +23% vs last week
                  </div>
                </div>
                
                {/* Bar Chart */}
                <div className="flex items-end justify-between h-44 gap-3 mb-4">
                  {weekData.map((day, index) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2 h-full">
                      <span className="text-xs text-muted-foreground">{day.tasks}</span>
                      <div className="flex-1 w-full flex items-end">
                        <motion.div 
                          className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all duration-300 relative group"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${day.value}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          {/* Hover tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border px-2 py-1 rounded text-xs whitespace-nowrap">
                            {day.value}% completed
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">85</p>
                    <p className="text-xs text-muted-foreground">Tasks Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">12.3h</p>
                    <p className="text-xs text-muted-foreground">Avg/Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold gradient-text">A+</p>
                    <p className="text-xs text-muted-foreground">Performance</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Momentum;
