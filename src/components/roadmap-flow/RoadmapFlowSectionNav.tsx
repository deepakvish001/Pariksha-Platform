import { memo } from 'react';
import { sections, sectionColors, sectionIcons, getSectionStats, type NodeStatus } from '@/data/fullStackRoadmapData';

interface Props {
  progress: Record<string, NodeStatus>;
  activeSection: string;
  onSectionClick: (section: string) => void;
}

function RoadmapFlowSectionNav({ progress, activeSection, onSectionClick }: Props) {
  const stats = getSectionStats(progress);

  return (
    <div className="hidden lg:flex flex-col gap-1.5 fixed right-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl shadow-xl shadow-black/20">
      {sections.map(section => {
        const s = stats[section] || { total: 0, done: 0 };
        const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
        const color = sectionColors[section];
        const icon = sectionIcons[section];
        const isActive = activeSection === section;

        return (
          <button
            key={section}
            onClick={() => onSectionClick(section)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
              transition-all duration-200 text-left
              ${isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}
            `}
          >
            <span className="text-sm">{icon}</span>
            <span className="hidden xl:inline whitespace-nowrap">{section}</span>
            {/* Progress ring */}
            <svg className="w-4 h-4 shrink-0 -rotate-90" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.15" />
              <circle
                cx="10" cy="10" r="8" fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={`${pct * 0.5} 50`}
                strokeLinecap="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default memo(RoadmapFlowSectionNav);
