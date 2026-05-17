import type { Metadata } from "next";
import { legalPageMetadata, renderLegalPage } from "@/features/site/components/LegalPageRenderer";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("affiliate-disclosure", "Affiliate disclosure");
}

export default function AffiliateDisclosurePage() {
  return renderLegalPage("affiliate-disclosure");
}
