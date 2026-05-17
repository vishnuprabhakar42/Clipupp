import type { Metadata } from "next";
import { legalPageMetadata, renderLegalPage } from "@/features/site/components/LegalPageRenderer";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("privacy", "Privacy policy");
}

export default function PrivacyPolicyPage() {
  return renderLegalPage("privacy");
}
