import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface Props {
  data: {
    title: string;
    sectionColor: string;
  };
}

function RoadmapFlowSectionNode({ data }: Props) {
  return (
    <div
      className="px-6 py-3 rounded-2xl font-bold text-base text-white shadow-lg min-w-[200px] text-center"
      style={{ background: `linear-gradient(135deg, ${data.sectionColor}, ${data.sectionColor}cc)` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      {data.title}
    </div>
  );
}

export default memo(RoadmapFlowSectionNode);
