import { X, ExternalLink, Video, BookOpen, FileText, CheckCircle2, Clock, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { RoadmapNodeData, NodeStatus } from '@/data/fullStackRoadmapData';

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

const diffColors: Record<string, string> = {
  Beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function RoadmapFlowDetailPanel({ node, status, onStatusChange, onClose }: Props) {
  if (!node) return null;

  return (
    <Sheet open={!!node} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-border bg-background">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: node.sectionColor }} />
            <SheetTitle className="text-lg">{node.title}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${diffColors[node.difficulty]}`}>
              {node.difficulty}
            </span>
            <span className="text-xs text-muted-foreground">{node.section}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>

          {/* Status buttons */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resources</p>
            <div className="space-y-2">
              {node.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors group"
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    {typeIcon[r.type]}
                  </span>
                  <span className="text-sm flex-1">{r.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
