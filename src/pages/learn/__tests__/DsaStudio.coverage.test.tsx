import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DsaStudio from "../DsaStudio";
import { DSA_TOPICS } from "@/data/dsaStudioData";

const TOTAL_PROBLEMS = 171;

const allProblems = DSA_TOPICS.flatMap((t) =>
  t.groups.flatMap((g) => g.problems.map((p) => ({ ...p, topicId: t.id, topicLabel: t.label }))),
);

beforeEach(() => {
  window.localStorage.clear();
});

const renderApp = (path = "/learn/dsa-studio") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DsaStudio />
    </MemoryRouter>,
  );

describe("DSA Studio — data integrity", () => {
  it(`contains exactly ${TOTAL_PROBLEMS} problems across all topics`, () => {
    expect(allProblems.length).toBe(TOTAL_PROBLEMS);
  });

  it("each problem has a unique slug", () => {
    const slugs = allProblems.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("each topic.count matches its actual problems length (QA parity)", () => {
    const mismatches = DSA_TOPICS
      .map((t) => ({
        id: t.id,
        expected: t.count,
        actual: t.groups.reduce((s, g) => s + g.problems.length, 0),
      }))
      .filter((r) => r.expected !== r.actual);
    expect(mismatches).toEqual([]);
  });
});

describe("DSA Studio — rendered indicator + grand total", () => {
  it("shows the grand total of 171 indexed problems", () => {
    renderApp();
    const badge = screen.getByTestId("dsa-grand-total");
    expect(badge.textContent).toMatch(new RegExp(`${TOTAL_PROBLEMS}\\s*/\\s*171`));
  });

  it("Rendered: X/Y indicator matches actual cards in DOM for the active topic", () => {
    renderApp();
    const indicator = screen.getByTestId("dsa-rendered-indicator");
    const cards = screen.getAllByTestId("dsa-problem-card");
    const m = indicator.textContent!.match(/Rendered:\s*(\d+)\s*\/\s*(\d+)/)!;
    const x = Number(m[1]);
    const y = Number(m[2]);
    expect(cards.length).toBe(x);
    const firstTopic = DSA_TOPICS[0];
    const expectedTotal = firstTopic.groups.reduce((s, g) => s + g.problems.length, 0);
    expect(y).toBe(expectedTotal);
    expect(x).toBe(expectedTotal);
  });
});

describe("DSA Studio — every problem renders to its detail route", () => {
  it.each(DSA_TOPICS.map((t) => [t.id, t.label] as const))(
    "topic %s renders all problem cards with correct hrefs",
    (topicId) => {
      window.localStorage.setItem(
        "dsaStudio:prefs:v1",
        JSON.stringify({ activeTopic: topicId, activeTab: "problems", search: "", priority: "all" }),
      );
      const { unmount } = renderApp();
      const topic = DSA_TOPICS.find((t) => t.id === topicId)!;
      const expected = topic.groups.flatMap((g) => g.problems);
      const cards = screen.getAllByTestId("dsa-problem-card") as HTMLAnchorElement[];
      expect(cards.length).toBe(expected.length);
      const renderedSlugs = new Set(cards.map((c) => c.getAttribute("data-slug")));
      for (const p of expected) {
        expect(renderedSlugs.has(p.slug)).toBe(true);
        const card = cards.find((c) => c.getAttribute("data-slug") === p.slug)!;
        expect(card.getAttribute("href")).toBe(`/library/problems/${p.slug}`);
      }
      unmount();
    },
  );
});

describe("DSA Studio — filters preserved when navigating to a problem", () => {
  it("active filters/search persist in localStorage so revisiting restores them", () => {
    renderApp();
    const input = screen.getByPlaceholderText(/search problem/i) as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: "sum" } });
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /^P1 Only$/i }));
    });
    const prefs = JSON.parse(window.localStorage.getItem("dsaStudio:prefs:v1")!);
    expect(prefs.search).toBe("sum");
    expect(prefs.priority).toBe("p1");

    // Click-through: every visible card still routes to its slug
    const cards = screen.getAllByTestId("dsa-problem-card") as HTMLAnchorElement[];
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      const slug = c.getAttribute("data-slug")!;
      expect(c.getAttribute("href")).toBe(`/library/problems/${slug}`);
    }
  });
});

describe("DSA Studio — QA mode", () => {
  it("toggling QA mode does not surface mismatches when data is consistent", () => {
    renderApp("/learn/dsa-studio?qa=1");
    // If data integrity test passes, no mismatch panel should be present
    expect(screen.queryByTestId("dsa-qa-mismatches")).toBeNull();
  });
});
