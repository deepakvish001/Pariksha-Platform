import { useState } from "react";
import { Target, Type, Clock, BarChart2, Users, CheckCircle2, FileText, Timer, TrendingUp, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const tabs = [
  { 
    id: "tasks", 
    icon: Target, 
    label: "Daily Tasks",
    title: "Break down goals into actionable steps",
    description: "Transform overwhelming projects into manageable daily tasks. Set priorities, track deadlines, and watch your productivity soar with our intuitive task management system.",
    features: ["Smart priority sorting", "Deadline reminders", "Progress tracking", "Subtask breakdown"],
    preview: [
      { icon: CheckCircle2, text: "Complete DSA Assignment", status: "done" },
      { icon: CheckCircle2, text: "Review System Design notes", status: "progress" },
      { icon: CheckCircle2, text: "Practice coding problems", status: "pending" },
    ]
  },
  { 
    id: "notes", 
    icon: Type, 
    label: "Rich Editing",
    title: "Capture ideas with powerful editing",
    description: "Write notes that work the way you think. Rich text formatting, code blocks, and markdown support help you organize knowledge effectively.",
    features: ["Markdown support", "Code highlighting", "Quick formatting", "Auto-save"],
    preview: [
      { icon: FileText, text: "Lecture Notes - Machine Learning", status: "done" },
      { icon: FileText, text: "Project Ideas - Web App", status: "progress" },
      { icon: FileText, text: "Interview Prep Notes", status: "done" },
    ]
  },
  { 
    id: "time", 
    icon: Clock, 
    label: "Time-Bound Deadlines",
    title: "Never miss a deadline again",
    description: "Smart deadline tracking keeps you ahead of schedule. Get timely reminders, see what's due, and plan your week with confidence.",
    features: ["Calendar view", "Smart reminders", "Time blocking", "Due date alerts"],
    preview: [
      { icon: Timer, text: "Assignment due in 2 days", status: "progress" },
      { icon: Timer, text: "Exam prep - 5 days left", status: "pending" },
      { icon: Timer, text: "Project submission - Today", status: "urgent" },
    ]
  },
  { 
    id: "analytics", 
    icon: BarChart2, 
    label: "Progress Analytics",
    title: "Visualize your growth journey",
    description: "See your productivity patterns, identify peak hours, and understand what drives your best work. Data-driven insights for continuous improvement.",
    features: ["Weekly reports", "Streak tracking", "Productivity score", "Goal insights"],
    preview: [
      { icon: TrendingUp, text: "Productivity up 32% this week", status: "done" },
      { icon: TrendingUp, text: "Best focus time: 9AM - 12PM", status: "done" },
      { icon: TrendingUp, text: "23-day learning streak", status: "done" },
    ]
  },
  { 
    id: "tracking", 
    icon: Users, 
    label: "Track-Share-Repeat",
    title: "Learn together, grow faster",
    description: "Share progress with peers, collaborate on projects, and stay accountable with your study group. Learning is better together.",
    features: ["Progress sharing", "Study groups", "Leaderboards", "Peer motivation"],
    preview: [
      { icon: Share2, text: "Shared roadmap with study group", status: "done" },
      { icon: Share2, text: "Team challenge: 7-day streak", status: "progress" },
      { icon: Share2, text: "Ranked #5 in your batch", status: "done" },
    ]
  },
];

const FeatureTabs = () => {
  const [activeTab, setActiveTab] = useState("tasks");
  const activeContent = tabs.find(tab => tab.id === activeTab);

  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <h2 className="section-title">One place to run your entire college life</h2>
          <p className="section-subtitle">
            Click on the features below to see what they do
          </p>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.2}>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`feature-tab flex items-center gap-2 ${
                  activeTab === tab.id ? "active" : ""
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Tab Content */}
        <ScrollReveal delay={0.3}>
          <AnimatePresence mode="wait">
            {activeContent && (
              <motion.div
                key={activeContent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-5xl mx-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Text Content */}
                  <div className="order-2 lg:order-1">
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                      {activeContent.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {activeContent.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {activeContent.features.map((feature, index) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className="order-1 lg:order-2">
                    <div className="card-dark">
                      {/* Card Header */}
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">{activeContent.label}</span>
                      </div>

                      {/* Preview Items */}
                      <div className="space-y-3">
                        {activeContent.preview.map((item, index) => (
                          <motion.div
                            key={item.text}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              item.status === 'done' ? 'bg-green-500/20 text-green-500' :
                              item.status === 'progress' ? 'bg-primary/20 text-primary' :
                              item.status === 'urgent' ? 'bg-red-500/20 text-red-500' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-foreground flex-1">{item.text}</span>
                            <div className={`w-2 h-2 rounded-full ${
                              item.status === 'done' ? 'bg-green-500' :
                              item.status === 'progress' ? 'bg-primary' :
                              item.status === 'urgent' ? 'bg-red-500' :
                              'bg-muted-foreground'
                            }`} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FeatureTabs;
