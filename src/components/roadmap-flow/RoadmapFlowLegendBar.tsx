import { memo } from 'react';

function RoadmapFlowLegendBar() {
  return (
    <div className="sticky bottom-4 z-20 flex items-center justify-center gap-5 px-5 py-3 mx-auto w-fit rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl text-xs mt-6 shadow-xl shadow-black/20">
      <LegendItem color="#3b82f6" label="Topic" />
      <LegendItem color="#1e293b" border="#475569" label="Checkpoint" />
      <LegendItem color="#7c3aed" dashed label="Alternative" />
      <LegendItem color="#22c55e" label="Done" />
      <LegendItem color="#eab308" label="In Progress" />
    </div>
  );
}

function LegendItem({ color, border, label, dashed }: { color: string; border?: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-4 h-3 rounded-[4px]"
        style={{
          background: color,
          border: dashed ? `1.5px dashed ${color}` : `1px solid ${border || color}`,
          opacity: 0.8,
        }}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

export default memo(RoadmapFlowLegendBar);
