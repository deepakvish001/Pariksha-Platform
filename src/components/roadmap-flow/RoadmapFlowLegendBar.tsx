import { memo } from 'react';
import { CheckCircle2, Clock, SkipForward, Code2, GitBranch, Sparkles, Flame, Award, Star } from 'lucide-react';

function RoadmapFlowLegendBar() {
  return (
    <div className="sticky bottom-4 z-20 mx-auto w-fit mt-8">
      <div
        className="flex items-center gap-3 sm:gap-4 px-6 py-3.5 rounded-2xl text-xs flex-wrap justify-center"
        style={{
          background: 'rgba(15,23,42,0.9)',
          border: '1px solid rgba(148,163,184,0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.04)',
        }}
      >
        <LegendItem icon={<Code2 className="w-3 h-3 text-blue-400" />} label="Topic" />
        <LegendItem icon={<span className="text-[10px]">⚑</span>} label="Checkpoint" />
        <LegendItem icon={<GitBranch className="w-3 h-3 text-purple-400" />} label="Alternative" />
        <Divider />
        <LegendItem icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />} label="Done" />
        <LegendItem icon={<Clock className="w-3 h-3 text-yellow-400" />} label="Active" />
        <LegendItem icon={<SkipForward className="w-3 h-3 text-slate-400" />} label="Skipped" />
        <LegendItem icon={<Star className="w-3 h-3 text-orange-400" />} label="Next" />
        <Divider />
        <DiffDot color="#22c55e" label="Easy" />
        <DiffDot color="#eab308" label="Medium" />
        <DiffDot color="#ef4444" label="Hard" />
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4" style={{ background: 'rgba(148,163,184,0.1)' }} />;
}

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      <span className="text-muted-foreground font-medium">{label}</span>
    </span>
  );
}

function DiffDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}40` }} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

export default memo(RoadmapFlowLegendBar);
