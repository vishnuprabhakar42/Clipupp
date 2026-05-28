import { Coins, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

/**
 * Larger info box rendered on store / coupon detail pages when the store has
 * cashback enabled. Soft emerald band with rate, brief explanation, and a
 * link to the /cashback marketing page.
 *
 * Renders nothing when `enabled` is false or `rateBps` is 0.
 */
export function CashbackCallout({
  rateBps,
  enabled = true,
  storeName,
}: {
  rateBps: number | null | undefined;
  enabled?: boolean | null;
  storeName?: string;
}) {
  if (!enabled || !rateBps || rateBps <= 0) return null;
  const pct = (rateBps / 100).toFixed(rateBps % 100 === 0 ? 0 : 1);

  return (
    <aside
      aria-label="Cashback offer"
      className="flex items-start gap-3 rounded-xl bg-cv-success-soft p-4"
      style={{ border: "1px solid rgb(var(--cv-success-rgb) / 0.25)" }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--cv-success-strong), var(--cv-success))",
          boxShadow: "var(--cv-shadow-glow-success)",
        }}
      >
        <Coins className="h-5 w-5" aria-hidden strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-extrabold text-cv-success-strong">
          Earn up to{" "}
          <span className="tabular-nums">{pct}%</span> cashback
          {storeName ? ` at ${storeName}` : ""}
        </p>
        <p className="cv-meta mt-0.5 text-cv-neutral-700">
          Cashback credits to your CouponValley balance after the merchant
          confirms your order.{" "}
          <Link
            href="/cashback"
            className="font-semibold text-cv-success-strong underline-offset-2 hover:underline"
          >
            How it works
          </Link>
        </p>
      </div>
      <span
        className="hidden shrink-0 self-center font-display text-[12px] font-extrabold uppercase tracking-[0.12em] text-cv-success-strong sm:inline-flex sm:items-center sm:gap-1"
        aria-hidden
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified
      </span>
    </aside>
  );
}
