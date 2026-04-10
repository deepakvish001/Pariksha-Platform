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
      className="flex items-center justify-center rounded-md font-bold text-sm text-white shadow-lg whitespace-nowrap"
      style={{
        background: `linear-gradient(135deg, ${data.sectionColor}, ${data.sectionColor}dd)`,
        border: `2px solid ${data.sectionColor}`,
        width: 200,
        height: 42,
        boxShadow: `0 0 20px ${data.sectionColor}33`,
      }}
    >
      {data.title}
    </div>
  );
}

export default memo(RoadmapFlowSectionNode);
