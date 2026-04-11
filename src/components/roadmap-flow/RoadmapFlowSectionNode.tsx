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
      className="px-5 py-2 rounded-lg font-bold text-sm text-white shadow-md text-center whitespace-nowrap"
      style={{ background: data.sectionColor }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      {data.title}
    </div>
  );
}

export default memo(RoadmapFlowSectionNode);
