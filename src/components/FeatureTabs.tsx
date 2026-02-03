import { useState } from "react";
import { Target, Type, Clock, BarChart2, Users } from "lucide-react";

const tabs = [
  { id: "tasks", icon: Target, label: "Daily Tasks" },
  { id: "notes", icon: Type, label: "Rich Editing" },
  { id: "time", icon: Clock, label: "Time-Bound Deadlines" },
  { id: "analytics", icon: BarChart2, label: "Progress Analytics" },
  { id: "tracking", icon: Users, label: "Track-Share-Repeat" },
];

const FeatureTabs = () => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Header */}
        <h2 className="section-title">One place to run your entire college life</h2>
        <p className="section-subtitle">
          Click on the features below to see what they do
        </p>

        {/* Tabs */}
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
      </div>
    </section>
  );
};

export default FeatureTabs;
