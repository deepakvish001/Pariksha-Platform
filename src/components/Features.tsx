import { CheckSquare, StickyNote, Table2, Flame, BarChart3, Map } from "lucide-react";

const features = [
  {
    icon: CheckSquare,
    title: "Tasks",
    description: "Track assignments, deadlines, and daily goals",
    color: "text-primary",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description: "Write, organize, and revisit your thoughts",
    color: "text-primary",
  },
  {
    icon: Table2,
    title: "Sheets",
    description: "Quick data tables and spreadsheet-style lists",
    color: "text-primary",
  },
  {
    icon: Flame,
    title: "Streaks",
    description: "Build consistency with daily streak tracking",
    color: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Visualize your productivity patterns clearly",
    color: "text-primary",
  },
  {
    icon: Map,
    title: "Roadmap",
    description: "Plan your semester with milestone tracking",
    color: "text-primary",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Header */}
        <h2 className="section-title">Everything tracked, nothing missed</h2>
        <p className="section-subtitle">
          A dashboard where everything has its place — and stays there.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-feature group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="icon-box group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
