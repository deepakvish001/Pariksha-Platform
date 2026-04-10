import { X, ExternalLink, Video, BookOpen, FileText, CheckCircle2, Clock, SkipForward, RotateCcw, Timer, ArrowRight, Zap } from 'lucide-react';
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
  video: 'text-red-400 bg-red-500/10 border-red-500/20',
  docs: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  article: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const diffColors: Record<string, string> = {
  Beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Intermediate: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  Advanced: 'bg-red-500/15 text-red-400 border-red-500/25',
};

export default function RoadmapFlowDetailPanel({ node, status, onStatusChange, onClose }: Props) {
  if (!node) return null;

  const prereqs = node.prerequisites?.map(id => getNodeById(id)).filter(Boolean) || [];

  return (
    <Sheet open={!!node} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-border bg-background">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `${node.sectionColor}18`,
                border: `1px solid ${node.sectionColor}30`,
              }}
            >
              <Zap className="w-5 h-5" style={{ color: node.sectionColor }} />
            </div>
            <div>
              <SheetTitle className="text-lg">{node.title}</SheetTitle>
              <p className="text-xs text-muted-foreground">{node.section}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Meta tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${diffColors[node.difficulty]}`}>
              {node.difficulty}
            </span>
            {node.timeEstimate && (
              <span className="text-xs px-2.5 py-1 rounded-lg border border-border bg-muted/50 text-muted-foreground flex items-center gap-1.5">
                <Timer className="w-3 h-3" />
                {node.timeEstimate}
              </span>
            )}
            {node.isAlternative && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                Alternative
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>

          {/* Prerequisites */}
          {prereqs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prerequisites</p>
              <div className="flex flex-wrap gap-2">
                {prereqs.map((prereq) => (
                  <span
                    key={prereq!.id}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border bg-muted/30 text-foreground/70 flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3 h-3 text-primary" />
                    {prereq!.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status buttons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={status === 'done' ? 'default' : 'outline'}
                className={status === 'done' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                onClick={() => onStatusChange(status === 'done' ? 'pending' : 'done')}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Done
              </Button>
              <Button
                size="sm"
                variant={status === 'in-progress' ? 'default' : 'outline'}
                className={status === 'in-progress' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}
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
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Resources ({node.resources.length})
            </p>
            <div className="space-y-2">
              {node.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className={`p-1.5 rounded-lg border ${typeColors[r.type]}`}>
                    {typeIcon[r.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{r.title}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{r.type}</span>
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
