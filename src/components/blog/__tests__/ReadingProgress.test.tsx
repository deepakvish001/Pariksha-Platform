import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { act } from "react";
import { ReadingProgress } from "../ReadingProgress";

function setScroll({
  scrollHeight,
  clientHeight,
  scrollTop,
}: {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
}) {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
  Object.defineProperty(document.documentElement, "scrollTop", {
    configurable: true,
    value: scrollTop,
    writable: true,
  });
}

describe("ReadingProgress", () => {
  beforeEach(() => {
    setScroll({ scrollHeight: 2000, clientHeight: 1000, scrollTop: 0 });
  });

  it("renders with width 0% at the top", () => {
    const { container } = render(<ReadingProgress />);
    const inner = container.querySelector("div > div") as HTMLElement;
    expect(inner.style.width).toBe("0%");
  });

  it("updates width on scroll", () => {
    const { container } = render(<ReadingProgress />);
    const inner = container.querySelector("div > div") as HTMLElement;
    act(() => {
      setScroll({ scrollHeight: 2000, clientHeight: 1000, scrollTop: 500 });
      window.dispatchEvent(new Event("scroll"));
    });
    // 500 / (2000 - 1000) = 50%
    expect(inner.style.width).toBe("50%");
  });

  it("clamps to 100% when scrolled past the bottom", () => {
    const { container } = render(<ReadingProgress />);
    const inner = container.querySelector("div > div") as HTMLElement;
    act(() => {
      setScroll({ scrollHeight: 2000, clientHeight: 1000, scrollTop: 5000 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(inner.style.width).toBe("100%");
  });
});
