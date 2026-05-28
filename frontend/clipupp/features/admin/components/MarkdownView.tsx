import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentType } from "react";

// react-markdown's exported component type is incompatible with the React 19
// `ReactNode` shape (its returned ReactElement is missing the new
// portal-children property). The runtime is fine; cast it to a typed shim so
// our callers stay type-safe.
const Markdown = ReactMarkdown as unknown as ComponentType<{
  children: string;
  remarkPlugins?: unknown[];
}>;

/**
 * Safe markdown renderer — used by both the admin editor preview pane and
 * the public legal-pages route. react-markdown sanitises by default
 * (no raw HTML), and remark-gfm adds tables / strikethrough / task lists.
 */
export function MarkdownView({ source }: { source: string }) {
  return <Markdown remarkPlugins={[remarkGfm]}>{source}</Markdown>;
}
