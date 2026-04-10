

## Full Stack Developer Roadmap — Implementation Plan

### Overview
Build an interactive, visual Full Stack Developer Roadmap page using **@xyflow/react** (React Flow) with a vertical flowchart layout, clickable nodes opening detail panels, progress tracking (localStorage), and a search/filter bar. Dark theme, color-coded sections, fully responsive.

---

### Architecture

```text
src/
├── data/fullStackRoadmapData.ts        # All roadmap nodes/edges JSON
├── pages/FullStackRoadmap.tsx           # Main page component
├── components/roadmap-flow/
│   ├── RoadmapFlowCanvas.tsx            # React Flow canvas wrapper
│   ├── RoadmapFlowNode.tsx              # Custom node component
│   ├── RoadmapFlowSectionNode.tsx       # Section header node
│   ├── RoadmapFlowDetailPanel.tsx       # Side panel for node details
│   ├── RoadmapFlowProgressBar.tsx       # Top progress bar
│   ├── RoadmapFlowSearchBar.tsx         # Search/filter toolbar
│   └── RoadmapFlowLegend.tsx            # Status legend
└── hooks/useRoadmapFlowProgress.ts      # localStorage progress hook
```

---

### Step-by-step Plan

**1. Install @xyflow/react**
Add the React Flow library to the project.

**2. Create roadmap data file (`src/data/fullStackRoadmapData.ts`)**
- Define ~60-80 nodes across 10 sections: Internet Basics, HTML, CSS, JavaScript, React, Node.js, Databases, APIs, DevOps, Deployment
- Each node: `{ id, title, description, section, sectionColor, difficulty, resources: [{title, url, type}], status }` 
- Define edges connecting nodes in a vertical flow with section groupings
- Color scheme per section: Internet=slate, HTML=orange, CSS=blue, JS=yellow, React=cyan, Node=green, DB=violet, APIs=rose, DevOps=amber, Deploy=emerald

**3. Create progress hook (`src/hooks/useRoadmapFlowProgress.ts`)**
- Store node statuses in localStorage (`fullstack-roadmap-progress`)
- Methods: `getStatus(nodeId)`, `setStatus(nodeId, 'done'|'in-progress'|'skipped')`, `resetAll()`
- Compute overall completion percentage

**4. Create custom React Flow node (`src/components/roadmap-flow/RoadmapFlowNode.tsx`)**
- Renders title, difficulty badge, section color border/accent
- Color-coded by status: green (done), yellow (in-progress), grey (skipped), default (pending)
- Click handler to open detail panel
- Source/target handles for edge connections

**5. Create section header node (`RoadmapFlowSectionNode.tsx`)**
- Larger styled node acting as a section divider/label with section color gradient

**6. Create detail side panel (`RoadmapFlowDetailPanel.tsx`)**
- Slides in from right on node click
- Shows: title, description, difficulty badge, 2-3 resource links with icons
- Status toggle buttons (Done / In Progress / Skipped)
- Close button

**7. Create progress bar (`RoadmapFlowProgressBar.tsx`)**
- Fixed at top of the roadmap page
- Shows percentage and count (e.g., "32/68 completed")
- Uses existing Progress component with emerald indicator at 100%

**8. Create search/filter bar (`RoadmapFlowSearchBar.tsx`)**
- Text search to filter/highlight nodes by title
- Filter by section dropdown
- Filter by status (All / Done / In Progress / Skipped / Pending)
- When filtering, non-matching nodes dim/fade

**9. Create legend component (`RoadmapFlowLegend.tsx`)**
- Small floating legend showing color meanings for Done/In Progress/Skipped/Pending

**10. Build main canvas (`RoadmapFlowCanvas.tsx`)**
- React Flow canvas with custom node types registered
- Vertical layout (top-to-bottom)
- Animated edges with step/smoothstep type
- Zoom controls, minimap
- Fit-view on load
- Pan and zoom enabled

**11. Create page (`src/pages/FullStackRoadmap.tsx`)**
- Combines all components: ProgressBar, SearchBar, Canvas, DetailPanel, Legend
- Full-height layout within DashboardLayout

**12. Add routing and navigation**
- Add route `/dashboard/roadmap/fullstack` under PublicDashboardWrapper in App.tsx
- Add a new sheet card entry in DashboardSheets.tsx for the Full Stack Roadmap (category: "Roadmap", linking to the new route)
- Add sidebar entry if appropriate

**13. Mobile responsiveness**
- On mobile: detail panel becomes a bottom sheet/dialog instead of side panel
- React Flow canvas remains zoomable/pannable
- Search bar collapses to icon on small screens

---

### Technical Details

- **Library**: `@xyflow/react` (v12+) with `@xyflow/react` CSS imported
- **Node layout**: Pre-computed x/y positions in data file (vertical flow, centered)
- **Edge style**: `smoothstep` type with animated dash for pending, solid for completed sections
- **Progress persistence**: `localStorage` key `fullstack-roadmap-progress` storing `Record<string, 'done'|'in-progress'|'skipped'>`
- **No database needed** — localStorage only as requested

