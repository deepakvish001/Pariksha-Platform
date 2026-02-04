import { Check } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const tasks = [
  { id: 1, title: "Complete DSA Assignment for Prof. Sharma", completed: true, progress: 100 },
  { id: 2, title: "Submit resume for interviews at Desk AI", completed: false, progress: 75 },
  { id: 3, title: "Resume resume review session at Slate", completed: false, progress: 60, subtasks: ["Edit summary", "Add projects"] },
  { id: 4, title: "Read DSA + AI Analysis", completed: false, progress: 0 },
];

const Checklist = () => {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <h2 className="section-title">Structured execution, not scattered learning</h2>
          <p className="section-subtitle">
            Every task has a place, a deadline, and a clear status
          </p>
        </ScrollReveal>

        {/* Checklist Card */}
        <ScrollReveal delay={0.2}>
          <div className="max-w-2xl mx-auto card-dark">
            <div className="space-y-0">
              {tasks.map((task) => (
                <div key={task.id} className="checklist-item">
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    task.completed 
                      ? "bg-primary text-primary-foreground" 
                      : "border border-border"
                  }`}>
                    {task.completed && <Check className="w-3 h-3" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    {task.subtasks && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {task.subtasks.map((subtask) => (
                          <span key={subtask} className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                            {subtask}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{task.progress}%</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-lg">
              + Add task to agenda
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Checklist;
