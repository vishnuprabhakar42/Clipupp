"use client";

import { useEffect } from "react";
import { usePathname } from "@/lib/i18n/navigation";
import { useCouponSheet } from "@/lib/home/useCouponSheet";
import { LazyCouponSheet } from "@/components/site/lazy";
import { LazyBoundary } from "@/components/site/LazyBoundary";

/**
 * Mounted once in the locale root layout. Closes the sheet when the route
 * changes and mounts the lazily loaded `CouponSheet` on the first open
 * (`seq` counts opens), keeping it mounted after that so it can animate out.
 */
export function CouponSheetProvider() {
  const opened = useCouponSheet((s) => s.seq > 0);
  const pathname = usePathname();
  useEffect(() => {
    useCouponSheet.getState().close();
  }, [pathname]);
  return opened ? (
    <LazyBoundary name="CouponSheet">
      <LazyCouponSheet />
    </LazyBoundary>
  ) : null;
}
