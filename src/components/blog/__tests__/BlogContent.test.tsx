import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BlogContent, CALLOUT_REGEX } from "../BlogContent";

// Mock toast to avoid pulling its deps.
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

// next-themes (used by CodeBlock)
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }));

const renderMd = (md: string) =>
  render(
    <MemoryRouter>
      <BlogContent source={md} />
    </MemoryRouter>,
  );

describe("CALLOUT_REGEX", () => {
  it.each([
    ["[!note]\nhello", true],
    ["  [!tip] more", true],
    ["[!WARNING]", true],
    ["[!Danger]\nbody", true],
    ["[!important]", true],
    ["[note]", false],
    ["plain text", false],
    ["![note] image", false],
  ])("matches %j -> %s", (input, expected) => {
    expect(CALLOUT_REGEX.test(input)).toBe(expected);
  });
});

describe("BlogContent callouts", () => {
  it("renders all four callout kinds with labels and roles", () => {
    renderMd(
      [
        "> [!note]\n> Note body",
        "",
        "> [!tip]\n> Tip body",
        "",
        "> [!warning]\n> Warning body",
        "",
        "> [!danger]\n> Danger body",
      ].join("\n"),
    );
    for (const label of ["Note", "Tip", "Warning", "Danger"]) {
      const node = screen.getByLabelText(`${label} callout`);
      expect(node).toBeInTheDocument();
      expect(node).toHaveTextContent(label);
      expect(node).toHaveTextContent(`${label} body`);
    }
  });

  it("renders a regular blockquote when no callout tag is present", () => {
    const { container } = renderMd("> just a quote");
    expect(container.querySelector("blockquote")).toBeInTheDocument();
    expect(container.querySelector('[role="note"]')).toBeNull();
  });

  it("strips the [!kind] tag from the rendered body", () => {
    const node = renderMd("> [!note]\n> Hello world").container;
    expect(node.textContent).toContain("Hello world");
    expect(node.textContent).not.toContain("[!note]");
  });
});

describe("BlogContent code", () => {
  it("renders inline code as <code>", () => {
    const { container } = renderMd("Use `npm test` to run.");
    const code = container.querySelector("code");
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe("npm test");
  });

  it("renders fenced code with a Copy button", () => {
    renderMd("```ts\nconst x = 1;\n```");
    expect(screen.getByLabelText("Copy code")).toBeInTheDocument();
  });
});

describe("BlogContent links", () => {
  it("external links open in a new tab with rel noopener", () => {
    renderMd("[Ex](https://example.com)");
    const a = screen.getByRole("link", { name: /Ex/ });
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("internal links use react-router (no target attr)", () => {
    renderMd("[Home](/blog)");
    const a = screen.getByRole("link", { name: "Home" });
    expect(a.getAttribute("target")).toBeNull();
    expect(a.getAttribute("href")).toBe("/blog");
  });
});

describe("BlogContent embeds & tables", () => {
  it("renders YouTube URL on its own line as an iframe", () => {
    const { container } = renderMd("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    const wrapper = container.querySelector('[data-embed="true"]');
    expect(wrapper).toBeInTheDocument();
    const iframe = wrapper?.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toContain("youtube.com/embed/");
  });

  it("wraps tables in a horizontal-scroll container", () => {
    const { container } = renderMd("| a | b |\n|---|---|\n| 1 | 2 |\n");
    expect(container.querySelector('[data-table-wrapper="true"]')).toBeInTheDocument();
    expect(container.querySelector("table")).toBeInTheDocument();
  });
});

describe("BlogContent heading anchors", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("appends a .heading-anchor link with proper aria-label and id on H2", () => {
    const { container } = renderMd("## Hello world");
    const h2 = container.querySelector("h2");
    expect(h2?.id).toBe("hello-world");
    const anchor = h2?.querySelector("a.heading-anchor");
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute("aria-label")).toMatch(/Copy link/i);
  });

  it("clicking a heading anchor copies the link to clipboard", () => {
    const { container } = renderMd("## Hello world");
    const anchor = container.querySelector("a.heading-anchor") as HTMLAnchorElement;
    fireEvent.click(anchor);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("#hello-world"),
    );
  });
});
