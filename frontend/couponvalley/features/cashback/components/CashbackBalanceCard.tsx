import { Hourglass, CheckCircle2, Wallet } from "lucide-react";

export type CashbackBalance = {
  /** Pending cashback amount (click recorded, conversion not yet confirmed). */
  pending: number;
  /** Confirmed cashback amount (conversion confirmed, available to withdraw). */
  confirmed: number;
  /** Lifetime cashback withdrawn (paid out). */
  withdrawnLifetime: number;
  /** Currency ISO-4217 code (e.g. "INR"). */
  currency: string;
};

/**
 * Account dashboard triplet: Pending · Confirmed · Lifetime. Each tile gets a
 * gradient icon disc + tabular-number balance + tone-coloured label. Pure
 * server render — data fetched in the parent page via `accountFetch`.
 *
 * If a balance row is null (user has never earned cashback), the tile still
 * renders showing 0.00 — empty UI doesn't help the user.
 */
export function CashbackBalanceCard({
  balance,
}: {
  balance: CashbackBalance | null;
}) {
  const b: CashbackBalance = balance ?? {
    pending: 0,
    confirmed: 0,
    withdrawnLifetime: 0,
    currency: "INR",
  };

  const tiles = [
    {
      key: "confirmed",
      label: "Available to withdraw",
      value: b.confirmed,
      tone: "success" as const,
      icon: CheckCircle2,
    },
    {
      key: "pending",
      label: "Pending confirmation",
      value: b.pending,
      tone: "accent" as const,
      icon: Hourglass,
    },
    {
      key: "lifetime",
      label: "Lifetime withdrawn",
      value: b.withdrawnLifetime,
      tone: "primary" as const,
      icon: Wallet,
    },
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((t) => {
        const Icon = t.icon;
        const discClass =
          t.tone === "success"
            ? "cv-gradient-success shadow-glow-success"
            : t.tone === "accent"
              ? "cv-gradient-warm shadow-glow-accent"
              : "cv-gradient-hero shadow-glow-primary";
        return (
          <li
            key={t.key}
            className="cv-card flex items-center gap-3 p-4"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${discClass}`}
            >
              <Icon className="h-5 w-5" aria-hidden strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="cv-meta text-cv-neutral-500">{t.label}</p>
              <p className="font-display text-[1.5rem] font-extrabold tabular-nums leading-none text-cv-neutral-900">
                {formatMoney(t.value, b.currency)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
