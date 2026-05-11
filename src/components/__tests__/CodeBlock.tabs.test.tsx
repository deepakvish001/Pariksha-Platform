import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeBlock, type CodeVariant } from "../CodeBlock";

const variants: CodeVariant[] = [
  { language: "ts", filename: "setup.ts", code: "// ts\n", highlightLines: [] },
  { language: "js", filename: "setup.js", code: "// js\n", highlightLines: [] },
  { language: "bash", code: "npm i x\n", highlightLines: [] },
];

describe("CodeBlock tabs — persistence & a11y", () => {
  beforeEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it("renders a tablist with role=tab + aria-controls and a tabpanel", () => {
    render(<CodeBlock group="install" variants={variants} />);
    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveAttribute("aria-label");
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0].getAttribute("aria-controls")).toBe(
      screen.getByRole("tabpanel").id,
    );
    // Roving tabindex.
    expect(tabs[0].getAttribute("tabindex")).toBe("0");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");
    expect(tabs[2].getAttribute("tabindex")).toBe("-1");
  });

  it("shows the short language name on each tab and exposes filename via aria-label", () => {
    render(<CodeBlock group="g1" variants={variants} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].textContent).toContain("TS");
    expect(tabs[2].textContent?.toLowerCase()).toContain("bash");
    // Filename still surfaced for screen readers when provided.
    expect(tabs[0].getAttribute("aria-label")).toContain("setup.ts");
  });

  it("persists active tab choice per group across re-mount (refresh)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <CodeBlock group="install" variants={variants} />,
    );
    await user.click(screen.getAllByRole("tab")[1]);
    expect(window.localStorage.getItem("codeblock:tab:install")).toBe("js");
    unmount();
    render(<CodeBlock group="install" variants={variants} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("keeps independent active tabs per group", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <CodeBlock group="alpha" variants={variants} />
        <CodeBlock group="beta" variants={variants} />
      </div>,
    );
    const allTabs = screen.getAllByRole("tab");
    // alpha has indices 0..2, beta has 3..5
    await user.click(allTabs[1]); // alpha → js
    await user.click(allTabs[5]); // beta → bash
    expect(window.localStorage.getItem("codeblock:tab:alpha")).toBe("js");
    expect(window.localStorage.getItem("codeblock:tab:beta")).toBe("bash");
  });

  it("persists collapsed/expanded state per group + tab", async () => {
    const long = "x\n".repeat(40);
    const longVariants: CodeVariant[] = [
      { language: "ts", code: long, highlightLines: [] },
      { language: "js", code: long, highlightLines: [] },
    ];
    const user = userEvent.setup();
    render(<CodeBlock group="big" variants={longVariants} />);
    // Default collapsed for long content.
    const expand = screen.getByRole("button", { name: /show all/i });
    await user.click(expand);
    expect(window.localStorage.getItem("codeblock:collapsed:big:ts")).toBe("0");

    // Switch to js tab — should still default to collapsed (own key).
    await user.click(screen.getAllByRole("tab")[1]);
    expect(
      screen.getByRole("button", { name: /show all/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show all/i }));
    expect(window.localStorage.getItem("codeblock:collapsed:big:js")).toBe("0");

    // Re-mount: ts should still be expanded (Collapse button visible).
    cleanup();
    render(<CodeBlock group="big" variants={longVariants} />);
    expect(
      screen.getByRole("button", { name: /collapse/i }),
    ).toBeInTheDocument();
  });
});
