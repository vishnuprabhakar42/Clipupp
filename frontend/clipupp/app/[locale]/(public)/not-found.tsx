import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="clipupp-container clipupp-section">
      <div className="mx-auto max-w-xl text-center">
        <p className="clipupp-meta uppercase tracking-wider text-clipupp-primary">404</p>
        <h1 className="clipupp-h1 mt-3">We couldn&apos;t find that page.</h1>
        <p className="clipupp-body mt-4 text-clipupp-neutral-600">
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
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clipupp-neutral-400"
            />
            <input
              id="not-found-search"
              name="q"
              type="search"
              placeholder="Search for a brand or category"
              className="clipupp-input w-full pl-10"
            />
          </div>
          <Button type="submit" className="clipupp-btn-primary">Search</Button>
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/" className="clipupp-section-link">Go to homepage</Link>
          <span aria-hidden="true" className="text-clipupp-neutral-300">·</span>
          <Link href="/stores" className="clipupp-section-link">Browse stores</Link>
          <span aria-hidden="true" className="text-clipupp-neutral-300">·</span>
          <Link href="/coupons" className="clipupp-section-link">All coupons</Link>
        </div>
      </div>
    </div>
  );
}
