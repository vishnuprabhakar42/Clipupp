export type ArticleAuthor = {
  name: string;
  url?: string;
  imageUrl?: string;
};

/**
 * Article schema for blog posts. Use Phase 4 once the /blog/[slug] route
 * exists. Google uses this for the "Top stories" carousel and for surface-
 * level richness (date, author, image) in normal search results.
 */
export function articleSchema({
  url,
  headline,
  description,
  imageUrl,
  datePublished,
  dateModified,
  author,
  publisherUrl,
}: {
  url: string;
  headline: string;
  description: string;
  imageUrl?: string | null;
  datePublished: string;
  dateModified?: string | null;
  author?: ArticleAuthor;
  publisherUrl: string;
}): object {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline,
    description,
    datePublished,
    dateModified: dateModified ?? datePublished,
    publisher: {
      "@type": "Organization",
      name: "ClipUpp",
      url: publisherUrl,
      logo: {
        "@type": "ImageObject",
        url: `${publisherUrl}/icon.svg`,
      },
    },
  };
  if (imageUrl) {
    data.image = [imageUrl];
  }
  if (author) {
    data.author = {
      "@type": "Person",
      name: author.name,
      ...(author.url && { url: author.url }),
      ...(author.imageUrl && { image: author.imageUrl }),
    };
  }
  return data;
}
