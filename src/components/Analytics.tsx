import { TrendingUp, BookOpen, Clock, Trophy } from "lucide-react";

const stats = [
  { icon: TrendingUp, label: "Study Trend", value: "+32%", description: "vs last week" },
  { icon: BookOpen, label: "Skills Mastered", value: "8/12", description: "this semester" },
  { icon: Clock, label: "Time invested", value: "67h", description: "focused hours" },
  { icon: Trophy, label: "Top 5%", value: "", description: "Student leaderboard" },
];

const Analytics = () => {
  const completionRate = 76;
  const streakDays = 23;

  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Header */}
        <h2 className="section-title">Know exactly where you stand</h2>
        <p className="section-subtitle">
          All data, in one view, no guesswork
        </p>

        <div className="max-w-4xl mx-auto">
          {/* Main Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Completion Rate */}
            <div className="card-dark flex items-center gap-6">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="fill-none stroke-secondary"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="fill-none progress-ring"
                    strokeWidth="8"
                    strokeDasharray={`${completionRate * 2.51} 251`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{completionRate}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Completion Rate</h3>
                <p className="text-sm text-muted-foreground">All tasks this month</p>
              </div>
            </div>

            {/* Streak */}
            <div className="card-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Streak Wave</h3>
                <span className="text-3xl font-bold text-primary">{streakDays}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">days and counting</p>
              <div className="flex gap-1">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i < 12 ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                {stat.value && (
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
