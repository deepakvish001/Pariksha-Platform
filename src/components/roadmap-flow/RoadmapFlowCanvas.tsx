import { useMemo } from 'react';
import { roadmapBlocks, roadmapNodesData, getNodeById, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

const statusStyles: Record<string, { bg: string; border: string; ring?: string }> = {
  done: { bg: '#166534', border: '#22c55e', ring: '0 0 0 2px #22c55e44' },
  'in-progress': { bg: '#854d0e', border: '#eab308', ring: '0 0 0 2px #eab30844' },
  skipped: { bg: '#374151', border: '#6b7280', ring: 'none' },
};

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const getStatus = (id: string): NodeStatus => progress[id] || 'pending';

  const isDimmed = (id: string) => {
    const node = getNodeById(id);
    if (!node) return false;
    const status = getStatus(id);
    if (search && !node.title.toLowerCase().includes(search.toLowerCase())) return true;
    if (sectionFilter !== 'all' && node.section !== sectionFilter) return true;
    if (statusFilter !== 'all' && status !== statusFilter) return true;
    return false;
  };

  return (
    <div className="relative w-full pb-8">
      {/* Central vertical spine line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-500/60 -translate-x-1/2 z-0" />

      <div className="relative z-10 flex flex-col items-center gap-3 py-6">
        {roadmapBlocks.map((block, i) => {
          if (block.type === 'section-label') {
            return (
              <div key={i} className="flex flex-col items-center gap-1 py-6">
                <h2 className="text-2xl font-bold text-foreground">{block.label}</h2>
                {block.subtitle && <p className="text-sm text-muted-foreground text-center max-w-md">{block.subtitle}</p>}
              </div>
            );
          }

          if (block.type === 'divider') {
            return (
              <div key={i} className="flex items-center gap-4 py-6 w-full max-w-2xl">
                <div className="flex-1 h-px bg-border" />
                {block.label && (
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {block.label}
                  </span>
                )}
                <div className="flex-1 h-px bg-border" />
              </div>
            );
          }

          if (block.type === 'annotation') {
            return (
              <div
                key={i}
                className={`max-w-xs text-[13px] text-muted-foreground leading-relaxed px-4 py-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm ${
                  block.side === 'left' ? 'self-start ml-4 sm:ml-16' :
                  block.side === 'right' ? 'self-end mr-4 sm:mr-16' :
                  'self-center'
                }`}
              >
                {block.text}
              </div>
            );
          }

          if (block.type === 'checkpoint') {
            return (
              <div key={i} className="py-1">
                <div
                  className="px-6 py-3 rounded-lg text-sm font-semibold text-white text-center"
                  style={{
                    background: 'linear-gradient(135deg, #1f2937, #111827)',
                    border: '1px solid #374151',
                    minWidth: 240,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {block.label}
                </div>
                {/* Dashed line below checkpoint */}
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-4 border-l-2 border-dashed border-blue-500/40" />
                </div>
              </div>
            );
          }

          if (block.type === 'row') {
            const isDashed = block.connector === 'dashed';
            return (
              <div key={i} className="py-1">
                {/* Connector dot on spine */}
                <div className="flex justify-center mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/30" />
                </div>
                {/* Horizontal line + nodes */}
                <div className="relative flex items-center justify-center gap-0">
                  {/* Horizontal connector line behind nodes */}
                  {block.nodes.length > 1 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 z-0"
                      style={{
                        left: '50%',
                        transform: 'translateX(-50%) translateY(-50%)',
                        width: `${(block.nodes.length - 1) * 160 + 40}px`,
                        height: 2,
                        background: isDashed ? 'none' : '#3b82f6',
                        borderTop: isDashed ? '2px dashed #3b82f6' : 'none',
                        opacity: 0.6,
                      }}
                    />
                  )}
                  {/* Nodes */}
                  <div className="relative z-10 flex items-center gap-3 flex-wrap justify-center">
                    {block.nodes.map((nodeId) => {
                      const node = getNodeById(nodeId);
                      if (!node) return null;
                      const status = getStatus(nodeId);
                      const dim = isDimmed(nodeId);
                      const styles = statusStyles[status];
                      const isAlt = node.isAlternative;

                      return (
                        <button
                          key={nodeId}
                          onClick={() => onNodeClick(node)}
                          className={`
                            relative px-5 py-2.5 rounded-md font-semibold text-sm
                            transition-all duration-200 cursor-pointer
                            hover:scale-105 hover:shadow-lg active:scale-100
                            ${dim ? 'opacity-20 pointer-events-none' : ''}
                          `}
                          style={{
                            background: styles?.bg || (isAlt ? '#1e1b4b' : '#fef08a'),
                            color: styles ? '#fff' : (isAlt ? '#c4b5fd' : '#1a1a1a'),
                            border: `2px solid ${styles?.border || (isAlt ? '#7c3aed' : '#eab308')}`,
                            borderStyle: isAlt && !styles ? 'dashed' : 'solid',
                            boxShadow: styles?.ring || (isAlt ? 'none' : '0 2px 8px rgba(234,179,8,0.15)'),
                            minWidth: 100,
                          }}
                        >
                          {status === 'done' && <span className="mr-1">✓</span>}
                          {status === 'in-progress' && <span className="mr-1">◐</span>}
                          {node.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          if (block.type === 'continue') {
            return (
              <div key={i} className="py-8">
                <div
                  className="flex flex-col items-center gap-4 px-8 py-6 rounded-xl border border-border bg-card/80 backdrop-blur-sm"
                  style={{ minWidth: 300, maxWidth: 500 }}
                >
                  <p className="text-sm font-semibold text-foreground text-center">Continue Learning with following relevant tracks</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {block.tracks.map((track) => (
                      <span
                        key={track}
                        className="px-4 py-2 rounded-md text-sm font-bold text-white"
                        style={{ background: '#4f46e5' }}
                      >
                        {track}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Legend */}
      <div className="sticky bottom-4 z-20 flex items-center justify-center gap-4 px-4 py-2.5 mx-auto w-fit rounded-lg border border-border bg-card/95 backdrop-blur-sm text-xs mt-4">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm" style={{ background: '#fef08a', border: '1px solid #eab308' }} />
          <span className="text-muted-foreground">Key Topic</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm" style={{ background: '#1f2937', border: '1px solid #374151' }} />
          <span className="text-muted-foreground">Checkpoint</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm border-dashed" style={{ background: '#1e1b4b', border: '2px dashed #7c3aed' }} />
          <span className="text-muted-foreground">Alternative</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm" style={{ background: '#166534', border: '1px solid #22c55e' }} />
          <span className="text-muted-foreground">Done</span>
        </span>
      </div>
    </div>
  );
}
