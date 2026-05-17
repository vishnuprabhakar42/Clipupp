package com.couponvalley.banner.domain;

/**
 * Where a banner is rendered on the site.
 *
 * <ul>
 *   <li>{@link #HERO_CAROUSEL} — large auto-rotating slot at the top of the homepage hero.</li>
 *   <li>{@link #TOP_BAR} — slim dismissible announcement strip above the header (single banner shown).</li>
 *   <li>{@link #PROMO_CARD} — wide promo cards in the homepage scroller (multi-card horizontal rail).</li>
 * </ul>
 */
public enum BannerPlacement {
    HERO_CAROUSEL,
    TOP_BAR,
    PROMO_CARD
}
