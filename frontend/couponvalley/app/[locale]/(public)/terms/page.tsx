import type { Metadata } from "next";
import { legalPageMetadata, renderLegalPage } from "@/features/site/components/LegalPageRenderer";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("terms", "Terms of service");
}

export default function TermsPage() {
  return renderLegalPage("terms");
}
