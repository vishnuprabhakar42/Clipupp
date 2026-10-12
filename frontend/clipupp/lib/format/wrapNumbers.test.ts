import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { wrapNumbers } from "./wrapNumbers";

const html = (s: string) => renderToStaticMarkup(createElement(Fragment, null, wrapNumbers(s)));

describe("wrapNumbers", () => {
  it("wraps a percentage", () => {
    expect(html("Extra 12% off")).toBe('Extra <span class="clipupp-num">12%</span> off');
  });
  it("wraps rupee amounts and bare numbers", () => {
    expect(html("Flat ₹125 off your first 3 orders")).toBe(
      'Flat <span class="clipupp-num">₹125</span> off your first <span class="clipupp-num">3</span> orders',
    );
  });
  it("wraps single digits and leaves words alone", () => {
    expect(html("Buy 1 get 1")).toBe(
      'Buy <span class="clipupp-num">1</span> get <span class="clipupp-num">1</span>',
    );
  });
  it("returns plain text when there are no numbers", () => {
    expect(html("Free shipping")).toBe("Free shipping");
  });
  it("keeps thousands separators together", () => {
    expect(html("Up to ₹1,500 off")).toBe('Up to <span class="clipupp-num">₹1,500</span> off');
  });
});
