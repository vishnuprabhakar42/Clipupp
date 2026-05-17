import type { Metadata } from "next";
import { InfoPageShell } from "@/features/site/components/InfoPageShell";

export const metadata: Metadata = {
  title: "Contact CouponValley",
  description:
    "Reach our team for support, partnership inquiries, or to flag a stale coupon.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <InfoPageShell title="Contact us">
      <h2>Support</h2>
      <p>
        Spot a stale or fake coupon? Email{" "}
        <a href="mailto:support@couponvalley.com">support@couponvalley.com</a>
        — we typically reply within one business day.
      </p>
      <h2>Partnerships</h2>
      <p>
        Brands and affiliate networks: please contact{" "}
        <a href="mailto:partners@couponvalley.com">partners@couponvalley.com</a>
        with your network ID and merchant program details.
      </p>
      <h2>Press</h2>
      <p>
        Press inquiries: <a href="mailto:press@couponvalley.com">press@couponvalley.com</a>.
      </p>
    </InfoPageShell>
  );
}
