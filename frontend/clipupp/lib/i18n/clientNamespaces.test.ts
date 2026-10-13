import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CLIENT_NAMESPACES, pickClientMessages } from "./clientNamespaces";

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (!p.includes("node_modules") && !p.includes(".next")) walk(p, out);
    } else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

function clientFiles(): { file: string; src: string }[] {
  const root = join(__dirname, "..", "..");
  const files = [
    ...walk(join(root, "app")),
    ...walk(join(root, "components")),
    ...walk(join(root, "features")),
    ...walk(join(root, "lib")),
  ];
  return files
    .map((file) => ({ file, src: readFileSync(file, "utf8") }))
    .filter(({ src }) => /^\s*["']use client["']/m.test(src));
}

describe("CLIENT_NAMESPACES", () => {
  it("covers every namespace a client component translates", () => {
    const missing = new Set<string>();
    for (const { file, src } of clientFiles()) {
      for (const m of src.matchAll(/useTranslations\(\s*["']([^"'.]+)/g)) {
        if (!(CLIENT_NAMESPACES as readonly string[]).includes(m[1])) {
          missing.add(`${m[1]} (${file})`);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });

  it("never uses useTranslations() or useMessages() without a namespace in client files", () => {
    const offenders: string[] = [];
    for (const { file, src } of clientFiles()) {
      if (/useTranslations\(\s*\)/.test(src) || /useMessages\(/.test(src))
        offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("picks only listed namespaces", () => {
    const picked = pickClientMessages({
      header: { a: "x" },
      zzzNotListed: { b: "y" },
    });
    expect(Object.keys(picked)).toEqual(["header"]);
  });
});
