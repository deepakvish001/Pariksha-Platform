import { memo } from 'react';
import { Flag } from 'lucide-react';

interface Props {
  label: string;
}

function RoadmapFlowCheckpoint({ label }: Props) {
  return (
    <div className="py-3 flex flex-col items-center">
      <div
        className="relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white/90"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          minWidth: 220,
        }}
      >
        <Flag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-center flex-1">{label}</span>
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        </div>
      </div>
      {/* Dashed connector below */}
      <div className="w-[3px] h-5 border-l-2 border-dashed border-blue-500/30 mt-1" />
    </div>
  );
}

export default memo(RoadmapFlowCheckpoint);
