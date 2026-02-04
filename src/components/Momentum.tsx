import { Flame, TrendingUp } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const weekData = [
  { day: "Mon", value: 80 },
  { day: "Tue", value: 65 },
  { day: "Wed", value: 90 },
  { day: "Thu", value: 75 },
  { day: "Fri", value: 85 },
  { day: "Sat", value: 60 },
  { day: "Sun", value: 95 },
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

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Streak */}
            <ScrollReveal delay={0.1} direction="left">
              <div className="card-dark text-center h-full">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                </div>
                <div className="text-6xl font-bold text-primary mb-4">14</div>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < 14 ? "bg-primary" : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Weekly Activity */}
            <ScrollReveal delay={0.2} direction="right">
              <div className="card-dark h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Daily History Stats</span>
                  </div>
                </div>
                
                <div className="flex items-end justify-between h-32 gap-2">
                  {weekData.map((day) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary rounded-t transition-all duration-300"
                        style={{ height: `${day.value}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-4">Last 7 days</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Momentum;
