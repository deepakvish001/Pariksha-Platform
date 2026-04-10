import { memo } from 'react';

function RoadmapFlowLegendBar() {
  return (
    <div className="sticky bottom-4 z-30 flex items-center justify-center gap-4 sm:gap-6 px-5 py-3 mx-auto w-fit rounded-2xl border border-border/40 bg-card/90 backdrop-blur-2xl text-xs mt-6 shadow-2xl shadow-black/30">
      <LegendItem color="#3b82f6" label="Topic" />
      <LegendItem color="#6d28d9" dashed label="Alternative" />
      <LegendItem color="#3b82f6" pulse label="Up Next" />
      <LegendItem color="#22c55e" label="Done" filled />
      <LegendItem color="#eab308" label="In Progress" filled />
      <LegendItem color="#334155" label="Skipped" />
      <span className="hidden sm:flex items-center gap-1.5">
        <span className="w-4 h-0.5 rounded-full bg-indigo-500/60" />
        <span className="text-muted-foreground">Checkpoint</span>
      </span>
    </div>
  );
}

function LegendItem({ color, label, dashed, filled, pulse }: {
  color: string; label: string; dashed?: boolean; filled?: boolean; pulse?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`w-4 h-3 rounded-[5px] ${pulse ? 'animate-pulse' : ''}`}
        style={{
          background: filled ? color : `${color}18`,
          border: dashed ? `1.5px dashed ${color}` : `1.5px solid ${color}`,
          opacity: 0.9,
        }}
      />
      <span className="text-muted-foreground whitespace-nowrap">{label}</span>
    </span>
  );
}

export default memo(RoadmapFlowLegendBar);
