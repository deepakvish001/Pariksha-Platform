import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Flag } from 'lucide-react';

function RoadmapFlowCheckpointNode({ data }: { data: any }) {
  return (
    <div style={{ width: 260 }}>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      <div
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold"
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(148,163,184,0.15)',
          color: '#e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <Flag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-center flex-1">{data.label}</span>
      </div>
    </div>
  );
}

export default memo(RoadmapFlowCheckpointNode);
