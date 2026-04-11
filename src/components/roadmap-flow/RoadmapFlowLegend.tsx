import { CheckCircle2, Clock, SkipForward, Circle } from 'lucide-react';

export default function RoadmapFlowLegend() {
  const items = [
    { label: 'Done', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, color: 'border-emerald-500' },
    { label: 'In Progress', icon: <Clock className="w-3.5 h-3.5 text-yellow-400" />, color: 'border-yellow-500' },
    { label: 'Skipped', icon: <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />, color: 'border-muted' },
    { label: 'Pending', icon: <Circle className="w-3.5 h-3.5 text-muted-foreground" />, color: 'border-border' },
  ];

  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card/90 backdrop-blur-sm text-xs">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {it.icon}
          <span className="text-muted-foreground">{it.label}</span>
        </span>
      ))}
    </div>
  );
}
