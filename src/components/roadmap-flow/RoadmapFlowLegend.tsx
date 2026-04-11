import { CheckCircle2, Clock, SkipForward, Circle } from 'lucide-react';

export default function RoadmapFlowLegend() {
  const items = [
    { label: 'Done', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { label: 'In Progress', icon: <Clock className="w-4 h-4 text-yellow-400" /> },
    { label: 'Skipped', icon: <SkipForward className="w-4 h-4 text-muted-foreground" /> },
    { label: 'Pending', icon: <Circle className="w-4 h-4 text-muted-foreground" /> },
  ];

  const difficulty = [
    { label: 'Beginner', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    { label: 'Medium', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    { label: 'Hard', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="sticky bottom-4 left-4 z-10 inline-flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl border border-border bg-card/95 backdrop-blur-md text-xs ml-4 mb-4 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground font-medium">Status:</span>
        {items.map((it) => (
          <span key={it.label} className="flex items-center gap-1">
            {it.icon}
            <span className="text-muted-foreground">{it.label}</span>
          </span>
        ))}
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-medium">Difficulty:</span>
        {difficulty.map((d) => (
          <span key={d.label} className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${d.cls}`}>
            {d.label}
          </span>
        ))}
      </div>
      <div className="w-px h-4 bg-border" />
      <span className="text-muted-foreground italic">Hover a node to see the learning path</span>
    </div>
  );
}
