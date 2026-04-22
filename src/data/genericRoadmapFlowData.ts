// ─────────────────────────────────────────────────────────────────────────────
// Generic Roadmap Flow Adapter
// Converts any RoadmapTree (from roadmapTreesData) into the flow node/edge
// shape consumed by RoadmapFlowCanvas — so every roadmap can use the same
// interactive zig-zag flow UI as the Full Stack roadmap.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getRoadmapTreeById,
  type RoadmapTree,
  type RoadmapTreeNode,
} from "./roadmapTreesData";

// Re-use the same NodeStatus contract as the Full Stack flow.
export type NodeStatus = "done" | "in-progress" | "skipped" | "pending";

export interface RoadmapFlowResource {
  title: string;
  url: string;
  type: "video" | "docs" | "article";
}

export interface FlowTopicData {
  id: string;
  title: string;
  description: string;
  section: string;
  sectionColor: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  resources: RoadmapFlowResource[];
  isAlternative?: boolean;
}

interface FlowNode {
  id: string;
  type: "sectionNode" | "roadmapNode";
  position: { x: number; y: number };
  data: any;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  style: Record<string, any>;
  meta?: {
    srcX: number;
    srcY: number;
    tgtX: number;
    tgtY: number;
    spineX: number;
    color: string;
  };
}

export interface RoadmapFlowData {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  sections: string[];
  sectionColors: Record<string, string>;
  topics: FlowTopicData[];
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
}

// ── Layout constants (mirror fullStackRoadmapData) ──
export const SPINE_X = 400;
const BRANCH_OFFSET = 230;
export const NODE_W = 220;
export const NODE_H = 62;
export const SECTION_H = 46;
export const SECTION_W = 200;
const Y_GAP = 78;
const Y_SECTION_GAP = 90;

// Map node "type" / "difficulty" → flow difficulty
const toDifficulty = (
  node: RoadmapTreeNode
): "Beginner" | "Intermediate" | "Advanced" => {
  if (node.difficulty === "Hard") return "Advanced";
  if (node.difficulty === "Medium") return "Intermediate";
  return "Beginner";
};

// Stable color palette assigned per section in order. Uses semantic-ish hexes
// that read well on dark + light themes.
const SECTION_PALETTE = [
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#22c55e", // green
  "#14b8a6", // teal
  "#ef4444", // red
  "#a78bfa", // light purple
  "#f97316", // orange
  "#eab308", // yellow
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#d946ef", // fuchsia
  "#6366f1", // indigo
  "#84cc16", // lime
  "#f43f5e", // rose
  "#fb923c", // light orange
  "#64748b", // slate
  "#059669", // dark emerald
];

const buildSectionColors = (sectionTitles: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  sectionTitles.forEach((s, i) => {
    map[s] = SECTION_PALETTE[i % SECTION_PALETTE.length];
  });
  return map;
};

// Pull sub-topics from a top-level "section" node. We treat the section as the
// header and its descendant leaves as the actual flow topics.
const collectTopics = (
  sectionNode: RoadmapTreeNode,
  sectionColor: string
): FlowTopicData[] => {
  const topics: FlowTopicData[] = [];

  const walk = (node: RoadmapTreeNode, parentTitle?: string) => {
    const hasChildren = node.children && node.children.length > 0;
    if (!hasChildren) {
      topics.push({
        id: node.id,
        title: node.title,
        description:
          node.description ||
          `Learn ${node.title}${parentTitle ? ` as part of ${parentTitle}` : ""}.`,
        section: sectionNode.title,
        sectionColor,
        difficulty: toDifficulty(node),
        resources: (node.resources ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          type:
            r.type === "video"
              ? "video"
              : r.type === "docs" || r.type === "course"
              ? "docs"
              : "article",
        })),
        isAlternative: node.type === "optional",
      });
      return;
    }
    node.children!.forEach((c) => walk(c, node.title));
  };

  if (!sectionNode.children || sectionNode.children.length === 0) {
    // Section itself is a leaf → render it as a single topic.
    topics.push({
      id: sectionNode.id,
      title: sectionNode.title,
      description: sectionNode.description || `Master ${sectionNode.title}.`,
      section: sectionNode.title,
      sectionColor,
      difficulty: toDifficulty(sectionNode),
      resources: (sectionNode.resources ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        type:
          r.type === "video"
            ? "video"
            : r.type === "docs" || r.type === "course"
            ? "docs"
            : "article",
      })),
      isAlternative: sectionNode.type === "optional",
    });
  } else {
    sectionNode.children.forEach((c) => walk(c, sectionNode.title));
  }

  return topics;
};

const buildLayout = (
  topics: FlowTopicData[]
): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  let y = 50;
  let globalIndex = 0;
  let prevNodeId: string | null = null;
  let prevNodeCenter: { x: number; y: number; isSection: boolean } | null =
    null;
  let currentSection = "";
  const sectionHeaderIds: string[] = [];

  topics.forEach((nd) => {
    if (nd.section !== currentSection) {
      currentSection = nd.section;
      const sectionId = `section-${nd.section
        .replace(/\s+/g, "-")
        .toLowerCase()}`;

      if (sectionHeaderIds.length > 0) y += Y_SECTION_GAP;

      const sectionNodeX = SPINE_X - SECTION_W / 2;
      nodes.push({
        id: sectionId,
        type: "sectionNode",
        position: { x: sectionNodeX, y },
        data: { title: nd.section, sectionColor: nd.sectionColor },
      });

      const sectionCenter = {
        x: SPINE_X,
        y: y + SECTION_H / 2,
        isSection: true,
      };

      if (prevNodeCenter) {
        const srcBottomY =
          prevNodeCenter.y +
          (prevNodeCenter.isSection ? SECTION_H / 2 : NODE_H / 2);
        const tgtTopY = y;
        edges.push({
          id: `e-${prevNodeId}-${sectionId}`,
          source: prevNodeId!,
          target: sectionId,
          type: "elbow",
          animated: false,
          style: { stroke: "#525252", strokeWidth: 2 },
          meta: {
            srcX: prevNodeCenter.x,
            srcY: srcBottomY,
            tgtX: SPINE_X,
            tgtY: tgtTopY,
            spineX: SPINE_X,
            color: "#525252",
          },
        });
      }

      sectionHeaderIds.push(sectionId);
      prevNodeId = sectionId;
      prevNodeCenter = sectionCenter;
      y += SECTION_H + 20;
    }

    const isLeft = globalIndex % 2 === 0;
    const nodeX = isLeft
      ? SPINE_X - BRANCH_OFFSET - NODE_W / 2
      : SPINE_X + BRANCH_OFFSET - NODE_W / 2;

    nodes.push({
      id: nd.id,
      type: "roadmapNode",
      position: { x: nodeX, y },
      data: { ...nd, nodeType: "topic", order: globalIndex + 1, isLeft },
    });

    const nodeCenterX = nodeX + NODE_W / 2;

    if (prevNodeCenter) {
      const srcBottomY =
        prevNodeCenter.y +
        (prevNodeCenter.isSection ? SECTION_H / 2 : NODE_H / 2);
      const tgtTopY = y;
      edges.push({
        id: `e-${prevNodeId}-${nd.id}`,
        source: prevNodeId!,
        target: nd.id,
        type: "elbow",
        animated: false,
        style: { stroke: nd.sectionColor, strokeWidth: 2, opacity: 0.6 },
        meta: {
          srcX: prevNodeCenter.x,
          srcY: srcBottomY,
          tgtX: nodeCenterX,
          tgtY: tgtTopY,
          spineX: SPINE_X,
          color: nd.sectionColor,
        },
      });
    }

    prevNodeId = nd.id;
    prevNodeCenter = { x: nodeCenterX, y: y + NODE_H / 2, isSection: false };
    globalIndex++;
    y += Y_GAP;
  });

  return { nodes, edges };
};

// Cache so we don't rebuild on every render.
const flowCache = new Map<string, RoadmapFlowData>();

export const buildRoadmapFlow = (tree: RoadmapTree): RoadmapFlowData => {
  if (flowCache.has(tree.id)) return flowCache.get(tree.id)!;

  const sectionTitles = tree.nodes.map((n) => n.title);
  const sectionColors = buildSectionColors(sectionTitles);

  const topics: FlowTopicData[] = [];
  tree.nodes.forEach((sectionNode) => {
    const color = sectionColors[sectionNode.title];
    topics.push(...collectTopics(sectionNode, color));
  });

  const { nodes: flowNodes, edges: flowEdges } = buildLayout(topics);

  const data: RoadmapFlowData = {
    id: tree.id,
    title: tree.title,
    description: tree.description,
    color: tree.color,
    icon: tree.icon,
    sections: sectionTitles,
    sectionColors,
    topics,
    flowNodes,
    flowEdges,
  };
  flowCache.set(tree.id, data);
  return data;
};

export const getRoadmapFlow = (
  roadmapId: string
): RoadmapFlowData | undefined => {
  const tree = getRoadmapTreeById(roadmapId);
  if (!tree) return undefined;
  return buildRoadmapFlow(tree);
};
