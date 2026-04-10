import { memo } from 'react';

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
      style={{ background: data.sectionColor, minWidth: 180 }}
    >
      {data.title}
    </div>
  );
}

export default memo(RoadmapFlowSectionNode);
