export function organizationSchema(siteUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Clipupp",
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    sameAs: [] as string[],
  };
}
