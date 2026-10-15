import { describe, expect, it } from "vitest";
import { edges } from "./scrollEdges";

describe("edges", () => {
  it("is at the start only when scrolled to 0 with overflow", () => {
    expect(edges(0, 1000, 300)).toEqual({ atStart: true, atEnd: false });
  });
  it("is at the end only when scrolled fully right", () => {
    expect(edges(700, 1000, 300)).toEqual({ atStart: false, atEnd: true });
  });
  it("is at neither edge mid scroll", () => {
    expect(edges(100, 1000, 300)).toEqual({ atStart: false, atEnd: false });
  });
  it("is at both edges when nothing overflows", () => {
    expect(edges(0, 300, 300)).toEqual({ atStart: true, atEnd: true });
  });
  it("treats subpixel remainders as the edge", () => {
    expect(edges(699.4, 1000, 300)).toEqual({ atStart: false, atEnd: true });
    expect(edges(0.6, 1000, 300)).toEqual({ atStart: true, atEnd: false });
  });
  it("handles RTL negative scrollLeft by magnitude", () => {
    expect(edges(-700, 1000, 300)).toEqual({ atStart: false, atEnd: true });
  });
});
