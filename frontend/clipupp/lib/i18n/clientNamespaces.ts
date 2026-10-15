import type { AbstractIntlMessages } from "next-intl";
export const CLIENT_NAMESPACES = [
  "catalog",
  "categories",
  "chrome",
  "common",
  "footer",
  "header",
  "home",
  "legacy",
  "sheet",
  "toast",
] as const;
export function pickClientMessages(
  all: AbstractIntlMessages,
): AbstractIntlMessages {
  const out: AbstractIntlMessages = {};
  for (const ns of CLIENT_NAMESPACES as readonly string[])
    if (ns in all) out[ns] = all[ns];
  return out;
}
