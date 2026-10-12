-- V037: Homepage v2 copy fixes (fix forward, V036 is applied).
-- Copy may only promise what exists today.

-- "Updated every hour" overstated how often deals are refreshed.
update homepage_section set subtitle = 'Updated daily'
  where code = 'top_deals' and subtitle = 'Updated every hour';

-- "500+ stores" was a hardcoded claim; the frontend now shows the live
-- active-store count when the subtitle is empty.
update homepage_section set subtitle = null
  where code = 'featured_stores' and subtitle = '500+ stores';

-- Disabled legacy rows kept positions that collided with the seven live
-- blocks (20, 50, 60), which made the admin editor order ambiguous.
-- Park them after the live blocks (all shifted by 100), keeping their relative order.
update homepage_section set position = position + 100
  where enabled = false
    and code in ('promo_banners','trending_stores','trusted_brands','savings_stats','daily_picks',
                 'popular_categories','editorial_tips','editorial','guarantees','faq');
