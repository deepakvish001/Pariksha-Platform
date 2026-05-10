import { describe, it, expect } from "vitest";
import { detectEmbed } from "../embeds";

describe("detectEmbed", () => {
  it("detects youtube.com/watch", () => {
    const r = detectEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(r?.src).toContain("youtube.com/embed/dQw4w9WgXcQ");
    expect(r?.aspect).toBe("aspect-video");
  });

  it("detects youtu.be short urls", () => {
    const r = detectEmbed("https://youtu.be/abc12345");
    expect(r?.src).toContain("youtube.com/embed/abc12345");
  });

  it("detects vimeo numeric ids", () => {
    const r = detectEmbed("https://vimeo.com/76979871");
    expect(r?.src).toContain("player.vimeo.com/video/76979871");
  });

  it("detects codepen pens", () => {
    const r = detectEmbed("https://codepen.io/team/pen/abcXYZ");
    expect(r?.src).toContain("codepen.io/team/embed/abcXYZ");
  });

  it("returns null for unrelated urls", () => {
    expect(detectEmbed("https://example.com/post/1")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(detectEmbed("not a url")).toBeNull();
  });
});
