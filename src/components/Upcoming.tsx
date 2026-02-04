import { CalendarDays, Bell, Users } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const upcomingEvents = [
  {
    icon: CalendarDays,
    title: "AI Placement Drive",
    description: "Campus drive by TCS for final year students",
    date: "Dec 15",
    type: "placement",
  },
  {
    icon: Bell,
    title: "Hackathon Updates",
    description: "New rules for the semester-end competition",
    date: "Dec 20",
    type: "event",
  },
  {
    icon: Users,
    title: "Team Fit Session",
    description: "Weekly standup for project coordination and goals",
    date: "Dec 22",
    type: "meeting",
  },
];

const Upcoming = () => {
  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <h2 className="section-title">Upcoming</h2>
          <p className="section-subtitle">
            Events that matter, surfaced when it matters
          </p>
        </ScrollReveal>

        {/* Events Grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {upcomingEvents.map((event, index) => (
            <ScrollReveal key={event.title} delay={index * 0.1}>
              <div className="upcoming-card h-full">
                <div className="icon-box">
                  <event.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                  <span className="text-xs text-primary">{event.date}</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Upcoming;
