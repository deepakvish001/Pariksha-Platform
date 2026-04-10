import { ExternalLink, Video, BookOpen, FileText, CheckCircle2, Clock, SkipForward, RotateCcw, Timer, GitBranch, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { RoadmapNodeData, NodeStatus } from '@/data/fullStackRoadmapData';
import { getNodeById } from '@/data/fullStackRoadmapData';

interface Props {
  node: RoadmapNodeData | null;
  status: NodeStatus;
  onStatusChange: (status: NodeStatus) => void;
  onClose: () => void;
}

const typeIcon: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  docs: <BookOpen className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  video: 'text-red-400 bg-red-400/10 border-red-400/20',
  docs: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  article: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

const diffConfig: Record<string, { color: string; bg: string; border: string }> = {
  Beginner: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Intermediate: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  Advanced: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export default function RoadmapFlowDetailPanel({ node, status, onStatusChange, onClose }: Props) {
  if (!node) return null;
  const diff = diffConfig[node.difficulty];

  return (
    <Sheet open={!!node} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-border/50 bg-background/95 backdrop-blur-xl">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: `${node.sectionColor}20`, border: `1.5px solid ${node.sectionColor}50` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: node.sectionColor }} />
            </div>
            <div>
              <SheetTitle className="text-lg">{node.title}</SheetTitle>
              <span className="text-xs text-muted-foreground">{node.section}</span>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${diff.bg} ${diff.border} ${diff.color}`}>
              {node.difficulty}
            </span>
            {node.timeEstimate && (
              <span className="text-xs px-2.5 py-1 rounded-lg border border-border bg-muted/30 text-muted-foreground flex items-center gap-1">
                <Timer className="w-3 h-3" /> {node.timeEstimate}
              </span>
            )}
            {node.isAlternative && (
              <span className="text-xs px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400">
                Alternative
              </span>
            )}
            {node.isRecommended && (
              <span className="text-xs px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center gap-1">
                <Star className="w-3 h-3" /> Recommended
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>

          {/* Prerequisites */}
          {node.prerequisites && node.prerequisites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <GitBranch className="w-3 h-3" /> Prerequisites
              </p>
              <div className="flex flex-wrap gap-1.5">
                {node.prerequisites.map(pid => {
                  const prereq = getNodeById(pid);
                  return prereq ? (
                    <span key={pid} className="text-xs px-2.5 py-1 rounded-lg border border-border bg-muted/30 text-foreground/80">
                      {prereq.title}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Status buttons */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={status === 'done' ? 'default' : 'outline'}
                className={status === 'done' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : ''}
                onClick={() => onStatusChange(status === 'done' ? 'pending' : 'done')}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Done
              </Button>
              <Button
                size="sm"
                variant={status === 'in-progress' ? 'default' : 'outline'}
                className={status === 'in-progress' ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-0' : ''}
                onClick={() => onStatusChange(status === 'in-progress' ? 'pending' : 'in-progress')}
              >
                <Clock className="w-4 h-4 mr-1.5" /> In Progress
              </Button>
              <Button
                size="sm"
                variant={status === 'skipped' ? 'default' : 'outline'}
                className={status === 'skipped' ? 'bg-muted text-muted-foreground' : ''}
                onClick={() => onStatusChange(status === 'skipped' ? 'pending' : 'skipped')}
              >
                <SkipForward className="w-4 h-4 mr-1.5" /> Skip
              </Button>
              {status !== 'pending' && (
                <Button size="sm" variant="ghost" onClick={() => onStatusChange('pending')}>
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resources</p>
            <div className="space-y-2">
              {node.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-border transition-all group"
                >
                  <span className={`p-1.5 rounded-lg border ${typeColors[r.type]}`}>
                    {typeIcon[r.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm block truncate">{r.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{r.type}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
