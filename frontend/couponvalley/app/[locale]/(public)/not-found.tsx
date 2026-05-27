import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="cv-container cv-section">
      <div className="mx-auto max-w-xl text-center">
        <p className="cv-meta uppercase tracking-wider text-cv-primary">404</p>
        <h1 className="cv-h1 mt-3">We couldn&apos;t find that page.</h1>
        <p className="cv-body mt-4 text-cv-neutral-600">
          The link may be broken or the page may have moved. Try searching for what
          you need, or head back to the homepage.
        </p>
        <form
          action="/search"
          method="get"
          role="search"
          className="mt-8 flex items-stretch gap-2"
        >
          <label htmlFor="not-found-search" className="sr-only">
            Search coupons and stores
          </label>
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cv-neutral-400"
            />
            <input
              id="not-found-search"
              name="q"
              type="search"
              placeholder="Search for a brand or category"
              className="cv-input w-full pl-10"
            />
          </div>
          <Button type="submit" className="cv-btn-primary">Search</Button>
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/" className="cv-section-link">Go to homepage</Link>
          <span aria-hidden="true" className="text-cv-neutral-300">·</span>
          <Link href="/stores" className="cv-section-link">Browse stores</Link>
          <span aria-hidden="true" className="text-cv-neutral-300">·</span>
          <Link href="/coupons" className="cv-section-link">All coupons</Link>
        </div>
      </div>
    </div>
  );
}
