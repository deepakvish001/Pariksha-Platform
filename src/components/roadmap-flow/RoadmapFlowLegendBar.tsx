import { memo } from 'react';
import { CheckCircle2, Clock, SkipForward, Code2, GitBranch } from 'lucide-react';

function RoadmapFlowLegendBar() {
  return (
    <div className="sticky bottom-4 z-20 flex items-center justify-center gap-4 px-6 py-3 mx-auto w-fit rounded-2xl border border-border/40 bg-card/90 backdrop-blur-2xl text-xs mt-8 shadow-2xl shadow-black/30">
      <LegendItem icon={<Code2 className="w-3 h-3 text-blue-400" />} label="Topic" />
      <LegendItem icon={<span className="text-[10px]">⚑</span>} label="Checkpoint" />
      <LegendItem icon={<GitBranch className="w-3 h-3 text-purple-400" />} label="Alternative" dashed />
      <div className="w-px h-4 bg-border/30" />
      <LegendItem icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />} label="Done" />
      <LegendItem icon={<Clock className="w-3 h-3 text-yellow-400" />} label="In Progress" />
      <LegendItem icon={<SkipForward className="w-3 h-3 text-slate-400" />} label="Skipped" />
      <div className="w-px h-4 bg-border/30" />
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
        <span className="text-muted-foreground">Easy</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
        <span className="text-muted-foreground">Medium</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500/80" />
        <span className="text-muted-foreground">Hard</span>
      </span>
    </div>
  );
}

function LegendItem({ icon, label, dashed }: { icon: React.ReactNode; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      <span className="text-muted-foreground font-medium">{label}</span>
    </span>
  );
}

export default memo(RoadmapFlowLegendBar);
