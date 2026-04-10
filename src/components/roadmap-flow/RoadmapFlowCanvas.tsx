import { roadmapBlocks, getNodeById, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
import RoadmapFlowNodeCard from './RoadmapFlowNodeCard';
import RoadmapFlowCheckpoint from './RoadmapFlowCheckpoint';
import RoadmapFlowLegendBar from './RoadmapFlowLegendBar';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

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
      {/* Central gradient spine */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-0 w-[3px]">
        <div className="w-full h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 opacity-70 rounded-full" />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 opacity-30 blur-md rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-0 py-6">
        {roadmapBlocks.map((block, i) => {
          if (block.type === 'section-label') {
            return (
              <div key={i} className="flex flex-col items-center gap-2 py-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent relative">
                  {block.label}
                </h2>
                {block.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md relative">{block.subtitle}</p>
                )}
              </div>
            );
          }

          if (block.type === 'divider') {
            return (
              <div key={i} className="relative flex items-center gap-4 py-8 w-full max-w-2xl px-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                {block.label && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 whitespace-nowrap px-3 py-1.5 rounded-full border border-border/50 bg-card/80 backdrop-blur-sm">
                    {block.label}
                  </span>
                )}
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            );
          }

          if (block.type === 'annotation') {
            return (
              <div
                key={i}
                className={`max-w-[280px] text-[12px] text-muted-foreground/80 leading-relaxed px-4 py-3 rounded-xl 
                  border border-border/30 bg-card/40 backdrop-blur-md italic my-2
                  ${block.side === 'left' ? 'self-start ml-4 sm:ml-16' :
                    block.side === 'right' ? 'self-end mr-4 sm:mr-16' :
                    'self-center'}`}
              >
                <span className="text-primary/60 mr-1">💡</span> {block.text}
              </div>
            );
          }

          if (block.type === 'checkpoint') {
            return <RoadmapFlowCheckpoint key={i} label={block.label} />;
          }

          if (block.type === 'row') {
            const isDashed = block.connector === 'dashed';
            return (
              <div key={i} className="py-2 w-full">
                {/* Spine dot */}
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-400 animate-ping opacity-30" />
                  </div>
                </div>
                {/* Horizontal connector + nodes */}
                <div className="relative flex items-center justify-center">
                  {block.nodes.length > 1 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 z-0 h-[2px]"
                      style={{
                        left: '50%',
                        transform: 'translateX(-50%) translateY(-50%)',
                        width: `${(block.nodes.length - 1) * 170 + 60}px`,
                        background: isDashed ? 'none' : 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)',
                        borderTop: isDashed ? '2px dashed hsl(var(--primary) / 0.4)' : 'none',
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3 flex-wrap justify-center px-4">
                    {block.nodes.map((nodeId) => {
                      const node = getNodeById(nodeId);
                      if (!node) return null;
                      return (
                        <RoadmapFlowNodeCard
                          key={nodeId}
                          node={node}
                          status={getStatus(nodeId)}
                          dimmed={isDimmed(nodeId)}
                          onClick={() => onNodeClick(node)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          if (block.type === 'continue') {
            return (
              <div key={i} className="py-10 w-full flex justify-center">
                <div className="flex flex-col items-center gap-5 px-8 py-7 rounded-2xl border border-border/50 bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-xl max-w-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">🚀</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground text-center">
                    Continue Learning with these tracks
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {block.tracks.map((track) => (
                      <span
                        key={track}
                        className="px-5 py-2 rounded-lg text-sm font-bold text-primary-foreground bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow cursor-pointer"
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

      <RoadmapFlowLegendBar />
    </div>
  );
}
