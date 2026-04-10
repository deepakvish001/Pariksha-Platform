import { memo } from 'react';

const sections = [
  { key: 'Internet', emoji: '🌐', color: '#64748b' },
  { key: 'Frontend', emoji: '🎨', color: '#3b82f6' },
  { key: 'Testing', emoji: '🧪', color: '#14b8a6' },
  { key: 'Backend', emoji: '⚙️', color: '#22c55e' },
  { key: 'Security', emoji: '🛡️', color: '#ef4444' },
  { key: 'DevOps', emoji: '🚀', color: '#f59e0b' },
];

interface Props {
  sectionFilter: string;
  onSectionFilterChange: (s: string) => void;
}

function RoadmapFlowSectionNav({ sectionFilter, onSectionFilterChange }: Props) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2">
      <div
        className="flex flex-col gap-1.5 px-2 py-3 rounded-2xl"
        style={{
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(148,163,184,0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {sections.map(s => {
          const isActive = sectionFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onSectionFilterChange(isActive ? 'all' : s.key)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all duration-200 hover:scale-110"
              style={{
                background: isActive ? `${s.color}20` : 'transparent',
                border: isActive ? `1px solid ${s.color}40` : '1px solid transparent',
                boxShadow: isActive ? `0 0 12px ${s.color}15` : 'none',
              }}
              title={s.key}
            >
              {s.emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(RoadmapFlowSectionNav);
