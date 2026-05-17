import { JsonLd } from "./JsonLd";

export function OrganizationSchema({ siteUrl }: { siteUrl: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CouponValley",
    url: siteUrl,
    logo: `${siteUrl}/icons/logo.png`,
    sameAs: [] as string[],
  };
  return <JsonLd id="ld-organization" data={data} />;
}
