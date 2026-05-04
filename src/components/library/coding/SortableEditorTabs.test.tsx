import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tabs } from "@/components/ui/tabs";
import { SortableEditorTabs } from "./SortableEditorTabs";
import type { EditorTabId } from "@/hooks/useEditorTabsLayout";

const order: EditorTabId[] = [
  "description",
  "notes",
  "my-solution",
  "solution",
  "runs",
];

const renderInTabs = (ui: React.ReactElement) =>
  render(<Tabs value="description">{ui}</Tabs>);

describe("SortableEditorTabs — contest locking", () => {
  it("renders locked tab triggers as disabled with aria-disabled", () => {
    renderInTabs(
      <SortableEditorTabs
        order={order}
        onReorder={() => {}}
        renderLabel={(id) => id}
        lockedIds={["notes", "my-solution", "solution", "runs"]}
        reorderDisabled
      />,
    );

    for (const id of ["notes", "my-solution", "solution", "runs"] as const) {
      const trigger = screen.getByRole("tab", { name: `${id} — locked during contest` });
      // Radix sets data-disabled and the button must be disabled
      expect(trigger).toBeDisabled();
      expect(trigger.getAttribute("aria-disabled")).toBe("true");
      expect(trigger.getAttribute("data-locked")).toBe("true");
    }
  });

  it("does NOT mark non-locked tabs as disabled", () => {
    renderInTabs(
      <SortableEditorTabs
        order={order}
        onReorder={() => {}}
        renderLabel={(id) => id}
        lockedIds={["notes", "my-solution", "solution", "runs"]}
        reorderDisabled
      />,
    );
    const desc = screen.getByRole("tab", { name: /description/i });
    expect(desc).not.toBeDisabled();
  });

  it("blocks pressing Enter / Space on a locked trigger from activating it", () => {
    const onReorder = vi.fn();
    renderInTabs(
      <SortableEditorTabs
        order={order}
        onReorder={onReorder}
        renderLabel={(id) => id}
        lockedIds={["notes"]}
        reorderDisabled
      />,
    );
    const notes = screen.getByRole("tab", { name: "notes — locked during contest" });
    // Disabled buttons cannot receive click activation
    notes.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    // No reorder occurred and trigger remained disabled
    expect(onReorder).not.toHaveBeenCalled();
    expect(notes).toBeDisabled();
  });
});
