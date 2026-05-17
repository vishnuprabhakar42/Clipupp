import type { Metadata } from "next";
import { legalPageMetadata, renderLegalPage } from "@/features/site/components/LegalPageRenderer";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("cookie-policy", "Cookie policy");
}

export default function CookiePolicyPage() {
  return renderLegalPage("cookie-policy");
}
