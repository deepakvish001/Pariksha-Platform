import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableOfContents } from "../TableOfContents";

class MockIO {
  static instances: MockIO[] = [];
  cb: IntersectionObserverCallback;
  observed: Element[] = [];
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    MockIO.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  trigger(entries: Array<Partial<IntersectionObserverEntry> & { target: Element }>) {
    this.cb(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  MockIO.instances = [];
  // @ts-expect-error jsdom
  window.IntersectionObserver = MockIO;
});

const items = [
  { depth: 2, text: "Alpha", id: "alpha" },
  { depth: 3, text: "Alpha One", id: "alpha-one" },
  { depth: 2, text: "Beta", id: "beta" },
];

function setupHeadings() {
  document.body.innerHTML = "";
  for (const i of items) {
    const h = document.createElement("h2");
    h.id = i.id;
    h.textContent = i.text;
    document.body.appendChild(h);
  }
}

describe("TableOfContents", () => {
  it("renders all items and indents H3 entries", () => {
    setupHeadings();
    const { container } = render(<TableOfContents items={items} />);
    expect(screen.getByRole("navigation", { name: /table of contents/i })).toBeInTheDocument();
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(3);
    const subItem = container.querySelector("li.pl-3");
    expect(subItem).toBeTruthy();
    expect(subItem?.textContent).toContain("Alpha One");
  });

  it("sets aria-current=location on the active item when intersection fires", () => {
    setupHeadings();
    render(<TableOfContents items={items} />);
    const beta = document.getElementById("beta")!;
    const io = MockIO.instances[0];
    io.trigger([
      { isIntersecting: true, target: beta, boundingClientRect: { top: 10 } as DOMRectReadOnly },
    ]);
    const active = screen.getByRole("link", { name: "Beta" });
    expect(active).toHaveAttribute("aria-current", "location");
    const inactive = screen.getByRole("link", { name: "Alpha" });
    expect(inactive).not.toHaveAttribute("aria-current");
  });

  it("Enter key activates a TOC link, scrolls and focuses the heading", () => {
    setupHeadings();
    const scrollSpy = vi.fn();
    const focusSpy = vi.fn();
    const beta = document.getElementById("beta")!;
    beta.scrollIntoView = scrollSpy as any;
    beta.focus = focusSpy as any;
    render(<TableOfContents items={items} />);
    const link = screen.getByRole("link", { name: "Beta" });
    fireEvent.keyDown(link, { key: "Enter" });
    expect(scrollSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();
    expect(beta.getAttribute("tabindex")).toBe("-1");
  });

  it("returns nothing when items list is empty", () => {
    const { container } = render(<TableOfContents items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
