import { CouponCard, type CouponCardData } from "@/features/catalog/components/CouponCard";

const SLOTS = [
  { rot: "-6deg", y: "-92px", z: 1 },
  { rot: "0deg", y: "0px", z: 3 },
  { rot: "6deg", y: "92px", z: 2 },
];

/**
 * Three real coupon cards fanned behind the hero copy. Purely decorative:
 * aria-hidden, no buttons, codes visible. Height is fixed so the hero never
 * shifts while logos load.
 */
export function CouponFan({ coupons }: { coupons: CouponCardData[] }) {
  if (coupons.length === 0) return null;
  return (
    <div className="clipupp-fx relative hidden h-[360px] lg:block lg:h-[420px]" style={{ "--i": 2 } as React.CSSProperties} aria-hidden>
      {coupons.slice(0, 3).map((c, i) => {
        const s = SLOTS[i];
        return (
          <div
            key={c.id}
            className="absolute left-1/2 top-1/2 w-[330px] [&>article]:shadow-[0_16px_40px_rgba(10,22,70,0.12)]"
            style={{ transform: `translate(-50%, -50%) rotate(${s.rot}) translateY(${s.y})`, zIndex: s.z }}
          >
            <CouponCard coupon={c} interactive={false} priority={i === 1} />
          </div>
        );
      })}
    </div>
  );
}
