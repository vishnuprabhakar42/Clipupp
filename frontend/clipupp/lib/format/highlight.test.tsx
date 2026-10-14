import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { isValidElement, type ReactElement } from "react";
import { highlight } from "./highlight";

const html = (text: string, query: string) => renderToStaticMarkup(<>{highlight(text, query)}</>);
const MARK = '<mark class="bg-transparent font-semibold text-clipupp-neutral-900">';

describe("highlight", () => {
  it("returns the plain text when there is no query", () => {
    expect(highlight("Amazon India", "")).toEqual(["Amazon India"]);
    expect(highlight("Amazon India", "   ")).toEqual(["Amazon India"]);
  });

  it("wraps the first case-insensitive match in a mark", () => {
    const nodes = highlight("Amazon India", "ama");
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toBe("");
    const mark = nodes[1] as ReactElement<{ children: string }>;
    expect(isValidElement(mark) && mark.type).toBe("mark");
    expect(mark.props.children).toBe("Ama");
    expect(nodes[2]).toBe("zon India");
    expect(html("Amazon India", "ama")).toBe(`${MARK}Ama</mark>zon India`);
  });

  it("only marks the first match", () => {
    expect(html("Nykaa Nykaa", "nyk")).toBe(`${MARK}Nyk</mark>aa Nykaa`);
  });

  it("returns the plain text when nothing matches", () => {
    expect(highlight("Amazon India", "zzzz")).toEqual(["Amazon India"]);
  });

  it("escapes regex characters in the query", () => {
    expect(highlight("Flat 50% off", ".*")).toEqual(["Flat 50% off"]);
    expect(html("Buy (1+1) today", "(1+1)")).toBe(`Buy ${MARK}(1+1)</mark> today`);
  });

  it("keeps the text content equal to the label", () => {
    expect(html("Swiggy Instamart", "insta").replace(/<[^>]+>/g, "")).toBe("Swiggy Instamart");
  });
});
