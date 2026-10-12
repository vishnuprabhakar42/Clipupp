package com.clipupp.dev;

import com.clipupp.auth.domain.Role;
import com.clipupp.banner.domain.Banner;
import com.clipupp.banner.domain.BannerPlacement;
import com.clipupp.banner.infra.BannerRepository;
import com.clipupp.blog.domain.Article;
import com.clipupp.blog.domain.Author;
import com.clipupp.blog.infra.ArticleRepository;
import com.clipupp.blog.infra.AuthorRepository;
import com.clipupp.categories.domain.Category;
import com.clipupp.categories.infra.CategoryRepository;
import com.clipupp.coupons.domain.Coupon;
import com.clipupp.coupons.domain.CouponType;
import com.clipupp.coupons.infra.CouponRepository;
import com.clipupp.stores.domain.ContentWriter;
import com.clipupp.stores.domain.Faq;
import com.clipupp.stores.domain.Stats;
import com.clipupp.stores.domain.Store;
import com.clipupp.stores.infra.ContentWriterRepository;
import com.clipupp.stores.infra.FaqRepository;
import com.clipupp.stores.infra.StatsRepository;
import com.clipupp.stores.infra.StoreRepository;
import com.clipupp.users.domain.AppUser;
import com.clipupp.users.domain.UserPreference;
import com.clipupp.users.infra.AppUserRepository;
import com.clipupp.users.infra.UserPreferenceRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("dev")
public class DevSeedService {

    private static final Logger log = LoggerFactory.getLogger(DevSeedService.class);

    private final AppUserRepository userRepo;
    private final UserPreferenceRepository prefRepo;
    private final CategoryRepository categoryRepo;
    private final StoreRepository storeRepo;
    private final StatsRepository statsRepo;
    private final ContentWriterRepository contentWriterRepo;
    private final FaqRepository faqRepo;
    private final CouponRepository couponRepo;
    private final ArticleRepository articleRepo;
    private final AuthorRepository authorRepo;
    private final BannerRepository bannerRepo;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    public DevSeedService(AppUserRepository userRepo, UserPreferenceRepository prefRepo,
                          CategoryRepository categoryRepo, StoreRepository storeRepo,
                          StatsRepository statsRepo, ContentWriterRepository contentWriterRepo,
                          FaqRepository faqRepo, CouponRepository couponRepo,
                          ArticleRepository articleRepo, AuthorRepository authorRepo,
                          BannerRepository bannerRepo, PasswordEncoder passwordEncoder,
                          JdbcTemplate jdbc) {
        this.userRepo = userRepo;
        this.prefRepo = prefRepo;
        this.categoryRepo = categoryRepo;
        this.storeRepo = storeRepo;
        this.statsRepo = statsRepo;
        this.contentWriterRepo = contentWriterRepo;
        this.faqRepo = faqRepo;
        this.couponRepo = couponRepo;
        this.articleRepo = articleRepo;
        this.authorRepo = authorRepo;
        this.bannerRepo = bannerRepo;
        this.passwordEncoder = passwordEncoder;
        this.jdbc = jdbc;
    }

    public record SeedResult(int users, int categories, int stores, int coupons,
                              int articles, int banners, boolean alreadySeeded) {}

    @Transactional
    public SeedResult seed() {
        if (storeRepo.count() > 0) {
            log.info("Database already seeded — skipping");
            return new SeedResult(0, 0, 0, 0, 0, 0, true);
        }
        log.info("Starting database seed...");

        int users = seedUsers();
        Map<String, Category> cats = seedCategories();
        int stores = seedStores(cats);
        int articles = seedBlog();
        int banners = seedBanners();
        int coupons = (int) couponRepo.count();

        log.info("Seed complete — users={} categories={} stores={} coupons={} articles={} banners={}",
                users, cats.size(), stores, coupons, articles, banners);
        return new SeedResult(users, cats.size(), stores, coupons, articles, banners, false);
    }

    @Transactional
    public void unseed() {
        log.warn("Clearing all seeded data...");
        jdbc.execute("TRUNCATE TABLE banner, article, author, coupon_category, coupon, " +
                "store_category, faq, featured_article, content_writer, stats, store, " +
                "category, user_preference, user_role, app_user RESTART IDENTITY CASCADE");
        log.warn("All data cleared");
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    private int seedUsers() {
        seedUser("admin@clipupp.com", "Admin@Clipupp1!", "Admin User",
                Set.of(Role.USER, Role.ADMIN, Role.SUPER_ADMIN));
        seedUser("editor@clipupp.com", "Editor@Clipupp1!", "Content Editor",
                Set.of(Role.USER, Role.ADMIN));
        seedUser("user@clipupp.com", "User@Clipupp1!", "Test User",
                Set.of(Role.USER));
        return 3;
    }

    private void seedUser(String email, String password, String name, Set<Role> roles) {
        if (userRepo.existsByEmail(email)) return;
        AppUser u = AppUser.create(email, passwordEncoder.encode(password), name, "en");
        u.markEmailVerified();
        roles.forEach(u::grant);
        userRepo.save(u);
        prefRepo.save(new UserPreference(u.getId()));
    }

    // ── Categories ─────────────────────────────────────────────────────────────

    private Map<String, Category> seedCategories() {
        List<CategoryDef> defs = List.of(
            new CategoryDef("electronics", "Electronics", "Monitor", "Deals on phones, laptops, TVs, and gadgets", (short) 1),
            new CategoryDef("fashion", "Fashion & Apparel", "Shirt", "Coupons on clothing, shoes, and accessories", (short) 2),
            new CategoryDef("food-grocery", "Food & Grocery", "ShoppingCart", "Save on groceries, fresh produce, and pantry staples", (short) 3),
            new CategoryDef("travel", "Travel", "Plane", "Flight, hotel, and holiday package deals", (short) 4),
            new CategoryDef("beauty-health", "Beauty & Health", "Sparkles", "Coupons for skincare, makeup, and wellness", (short) 5),
            new CategoryDef("sports-fitness", "Sports & Fitness", "Dumbbell", "Deals on sportswear, equipment, and memberships", (short) 6),
            new CategoryDef("home-kitchen", "Home & Kitchen", "Home", "Discounts on furniture, appliances, and décor", (short) 7),
            new CategoryDef("books-education", "Books & Education", "BookOpen", "Savings on books, courses, and e-learning", (short) 8),
            new CategoryDef("finance", "Finance & Cards", "CreditCard", "Cashback and offers on payments and insurance", (short) 9)
        );

        Map<String, Category> saved = new java.util.LinkedHashMap<>();
        for (CategoryDef d : defs) {
            if (categoryRepo.existsBySlug(d.slug())) {
                categoryRepo.findBySlug(d.slug()).ifPresent(c -> saved.put(d.slug(), c));
                continue;
            }
            Category c = Category.create(d.slug(), d.title(), null);
            c.setIcon(d.icon());
            c.setDescription(d.description());
            c.setPosition(d.position());
            c.setMetaTitle(d.title() + " Coupons & Deals | Clipupp");
            c.setMetaDescription("Find the best " + d.title().toLowerCase() + " coupons and deals on Clipupp.");
            saved.put(d.slug(), categoryRepo.save(c));
        }
        return saved;
    }

    record CategoryDef(String slug, String title, String icon, String description, short position) {}

    // ── Stores ─────────────────────────────────────────────────────────────────

    private int seedStores(Map<String, Category> cats) {
        List<StoreDef> stores = List.of(
            new StoreDef("amazon-india", "Amazon India",
                "https://placehold.co/200x200/FF9900/FFFFFF?text=AMZ",
                "India's largest online marketplace with millions of products across electronics, fashion, books, and more. Enjoy fast delivery, easy returns, and exclusive deals.",
                "Millions of products, fast delivery, easy returns.",
                4.5, 125000, "https://www.amazon.in", "IN", 98,
                List.of("electronics", "fashion", "books-education", "home-kitchen"),
                new ContentWriterDef("Meera Nair", "Senior Deals Analyst",
                    "Meera covers Amazon's daily lightning deals and tracks the best savings across all categories.",
                    "https://ui-avatars.com/api/?name=Meera+Nair&background=FF9900&color=fff&size=200"),
                List.of(
                    new FaqDef("How do I use Amazon coupon codes?", "At checkout, click 'Apply a promo code or gift card' and enter your code. The discount applies instantly."),
                    new FaqDef("Does Amazon offer free delivery in India?", "Yes — Amazon Prime members get free delivery on eligible items. Non-members get free delivery on orders over ₹499."),
                    new FaqDef("What is Amazon's return policy?", "Most items are returnable within 10–30 days of delivery. Electronics typically have a 7–10 day return window.")
                ),
                List.of(
                    new CouponDef("amazon-10-off-electronics", CouponType.CODE, "AMZN10ELEC", "10% Off on Electronics", "Get flat 10% off on smartphones, laptops, and accessories. Valid on orders above ₹5,000.", "10% off", List.of("electronics"), 90, true, true, 95),
                    new CouponDef("amazon-fashion-15", CouponType.CODE, "FASHION15", "15% Off on Fashion", "Save 15% on clothing, footwear, and accessories from top brands.", "15% off", List.of("fashion"), 60, true, false, 80),
                    new CouponDef("amazon-free-delivery", CouponType.FREE_SHIPPING, null, "Free Delivery on Orders ₹499+", "No delivery charges on eligible orders above ₹499 for non-Prime members.", "Free delivery", List.of(), 365, false, false, 99),
                    new CouponDef("amazon-books-30", CouponType.CODE, "BOOKS30", "30% Off on Books", "Flat 30% discount on bestselling books and academic titles.", "30% off", List.of("books-education"), 45, true, false, 70),
                    new CouponDef("amazon-prime-day", CouponType.DEAL, null, "Prime Day Special — Up to 60% Off", "Exclusive deals during Amazon Prime Day on electronics, kitchen appliances, and fashion.", "Up to 60% off", List.of("electronics", "home-kitchen"), 7, false, true, 98)
                )
            ),
            new StoreDef("flipkart", "Flipkart",
                "https://placehold.co/200x200/2874F0/FFFFFF?text=FK",
                "Flipkart is India's leading e-commerce platform offering electronics, fashion, home appliances, and more. Shop with guaranteed quality and hassle-free returns.",
                "India's #1 e-commerce for electronics and fashion.",
                4.3, 98000, "https://www.flipkart.com", "IN", 95,
                List.of("electronics", "fashion", "home-kitchen"),
                new ContentWriterDef("Arjun Kapoor", "E-Commerce Deals Expert",
                    "Arjun specialises in tracking Flipkart's Big Billion Days and weekly smartphone sales.",
                    "https://ui-avatars.com/api/?name=Arjun+Kapoor&background=2874F0&color=fff&size=200"),
                List.of(
                    new FaqDef("How do I apply Flipkart promo codes?", "In the cart, enter the promo code in the 'Enter Coupon Code' field and click Apply."),
                    new FaqDef("What is Flipkart's Big Billion Days?", "Big Billion Days is Flipkart's annual mega-sale with discounts up to 80% on electronics, fashion, and appliances."),
                    new FaqDef("Does Flipkart offer EMI?", "Yes — Flipkart offers no-cost EMI on select products via credit cards, debit cards, and Bajaj Finserv.")
                ),
                List.of(
                    new CouponDef("flipkart-20-off", CouponType.CODE, "FLIP20NOW", "20% Off — All Categories", "Get 20% discount on your first Flipkart order. Minimum order ₹999.", "20% off", List.of("electronics", "fashion"), 30, true, true, 92),
                    new CouponDef("flipkart-hdfc-5", CouponType.CODE, "HDFC5FK", "5% Extra Off with HDFC Card", "Additional 5% cashback on payments via HDFC credit or debit cards.", "5% cashback", List.of(), 90, false, false, 75),
                    new CouponDef("flipkart-free-shipping", CouponType.FREE_SHIPPING, null, "Free Shipping on Electronics", "No shipping fee on electronics purchases above ₹1,499.", "Free shipping", List.of("electronics"), 180, false, false, 88),
                    new CouponDef("flipkart-mobile-deal", CouponType.DEAL, null, "Smartphones Starting ₹5,999", "Budget smartphones from Redmi, Realme, and Samsung starting at just ₹5,999.", "From ₹5,999", List.of("electronics"), 14, false, true, 90)
                )
            ),
            new StoreDef("myntra", "Myntra",
                "https://placehold.co/200x200/FF3F6C/FFFFFF?text=MYN",
                "Myntra is India's leading fashion and lifestyle e-commerce platform featuring top brands like H&M, Zara, Nike, and thousands of Indian designers.",
                "India's #1 fashion destination with 5000+ brands.",
                4.4, 87000, "https://www.myntra.com", "IN", 93,
                List.of("fashion"),
                new ContentWriterDef("Kavya Reddy", "Fashion Deals Curator",
                    "Kavya tracks Myntra's End of Reason Sale and seasonal fashion trends to bring you the best style savings.",
                    "https://ui-avatars.com/api/?name=Kavya+Reddy&background=FF3F6C&color=fff&size=200"),
                List.of(
                    new FaqDef("When is Myntra's End of Reason Sale?", "EORS happens twice a year — in June and December — with discounts up to 80% on 5000+ brands."),
                    new FaqDef("Does Myntra accept returns?", "Yes — most items can be returned within 14–30 days. Try-at-home is available in select cities."),
                    new FaqDef("How do I find my Myntra size?", "Use Myntra's Size Guide on each product page. Measurements are in inches and cm for Indian and international sizing.")
                ),
                List.of(
                    new CouponDef("myntra-30-off", CouponType.CODE, "MYNTRA30", "30% Off on All Brands", "Get flat 30% off on fashion, footwear, and accessories across all brands.", "30% off", List.of("fashion"), 60, true, false, 90),
                    new CouponDef("myntra-first-50", CouponType.CODE, "MYNTRAFIRST", "50% Off for New Users", "New to Myntra? Get 50% off on your first order. No minimum purchase required.", "50% off", List.of("fashion"), 365, true, true, 95),
                    new CouponDef("myntra-eors-deal", CouponType.DEAL, null, "End of Reason Sale — Up to 80% Off", "Myntra's biggest sale of the year with 80% off on 5000+ brands.", "Up to 80% off", List.of("fashion"), 7, false, true, 99),
                    new CouponDef("myntra-free-returns", CouponType.FREE_SHIPPING, null, "Free Delivery + Easy Returns", "Free delivery on all orders and hassle-free returns within 30 days.", "Free delivery", List.of("fashion"), 180, false, false, 85)
                )
            ),
            new StoreDef("nykaa", "Nykaa",
                "https://placehold.co/200x200/FC2779/FFFFFF?text=NYK",
                "Nykaa is India's premier beauty and wellness destination, offering 5000+ brands of makeup, skincare, haircare, and personal care products.",
                "India's top beauty destination — 5000+ brands.",
                4.6, 62000, "https://www.nykaa.com", "IN", 91,
                List.of("beauty-health"),
                new ContentWriterDef("Priya Sharma", "Beauty & Skincare Expert",
                    "Priya is a certified beauty advisor who reviews the latest skincare launches and curates the best Nykaa offers.",
                    "https://ui-avatars.com/api/?name=Priya+Sharma&background=FC2779&color=fff&size=200"),
                List.of(
                    new FaqDef("Is Nykaa authentic?", "Yes — Nykaa sources products directly from brands and authorised distributors, ensuring 100% authentic products."),
                    new FaqDef("Does Nykaa offer samples?", "Nykaa offers free beauty samples with select orders. Look for the 'Free Samples' option at checkout."),
                    new FaqDef("What is Nykaa's return policy?", "Most products are returnable within 15 days of delivery if unused and in original packaging.")
                ),
                List.of(
                    new CouponDef("nykaa-15-off", CouponType.CODE, "NYK15SAVE", "15% Off on Skincare", "Save 15% on all skincare products including moisturisers, serums, and sunscreens.", "15% off", List.of("beauty-health"), 60, true, false, 88),
                    new CouponDef("nykaa-free-gift", CouponType.DEAL, null, "Free Gift on Orders ₹999+", "Get a complimentary beauty kit worth ₹299 on orders above ₹999.", "Free gift", List.of("beauty-health"), 30, false, true, 92),
                    new CouponDef("nykaa-skincare-20", CouponType.CODE, "SKINCARE20", "20% Off — Premium Skincare Brands", "20% discount on The Ordinary, Minimalist, Dot & Key, and other premium brands.", "20% off", List.of("beauty-health"), 45, true, false, 85),
                    new CouponDef("nykaa-free-shipping", CouponType.FREE_SHIPPING, null, "Free Shipping on Orders ₹499+", "No shipping charges on beauty and wellness orders above ₹499.", "Free shipping", List.of("beauty-health"), 180, false, false, 82)
                )
            ),
            new StoreDef("zomato", "Zomato",
                "https://placehold.co/200x200/E23744/FFFFFF?text=ZOM",
                "Zomato is India's largest food delivery platform serving 800+ cities. Order from thousands of restaurants and get food delivered in under 30 minutes.",
                "Order food from 500,000+ restaurants across India.",
                4.3, 210000, "https://www.zomato.com", "IN", 97,
                List.of("food-grocery"),
                new ContentWriterDef("Rohan Das", "Food Tech Writer",
                    "Rohan covers Zomato's weekend deals, restaurant partnerships, and the best ways to maximise savings on food delivery.",
                    "https://ui-avatars.com/api/?name=Rohan+Das&background=E23744&color=fff&size=200"),
                List.of(
                    new FaqDef("How do I use Zomato coupon codes?", "Open the Zomato app, add items to cart, and enter the promo code at checkout. Discounts are applied automatically."),
                    new FaqDef("What is Zomato Gold?", "Zomato Gold is a premium membership offering unlimited free delivery, exclusive discounts, and priority customer support."),
                    new FaqDef("What areas does Zomato deliver to?", "Zomato delivers across 800+ cities in India. Enter your pincode in the app to see available restaurants.")
                ),
                List.of(
                    new CouponDef("zomato-50-off", CouponType.CODE, "ZOMATO50", "50% Off Up to ₹100", "Get 50% discount on your order, maximum savings of ₹100. Valid on select restaurants.", "50% off", List.of("food-grocery"), 14, false, false, 95),
                    new CouponDef("zomato-free-delivery", CouponType.FREE_SHIPPING, null, "Free Delivery All Weekend", "No delivery charges on all orders placed Saturday and Sunday.", "Free delivery", List.of("food-grocery"), 7, false, true, 93),
                    new CouponDef("zomato-bogo", CouponType.DEAL, null, "Buy 1 Get 1 Free on Select Items", "Order one main course and get another free at participating restaurants.", "BOGO offer", List.of("food-grocery"), 30, false, false, 88),
                    new CouponDef("zomato-first-order", CouponType.CODE, "ZFIRST60", "60% Off on First Order", "New user? Get 60% off (up to ₹120) on your very first Zomato order.", "60% off", List.of("food-grocery"), 365, true, true, 97)
                )
            ),
            new StoreDef("swiggy", "Swiggy",
                "https://placehold.co/200x200/FC8019/FFFFFF?text=SWG",
                "Swiggy is India's leading on-demand delivery platform for food, groceries (Instamart), and more. Get delivery in as fast as 10 minutes.",
                "Food delivery in 30 min — groceries in 10 min.",
                4.2, 185000, "https://www.swiggy.com", "IN", 96,
                List.of("food-grocery"),
                new ContentWriterDef("Ananya Iyer", "Food & Delivery Expert",
                    "Ananya tracks the best Swiggy deals, Instamart offers, and subscription benefits to help you save every day.",
                    "https://ui-avatars.com/api/?name=Ananya+Iyer&background=FC8019&color=fff&size=200"),
                List.of(
                    new FaqDef("What is Swiggy One?", "Swiggy One is the premium membership offering unlimited free delivery, discounts, and priority support for ₹299/month."),
                    new FaqDef("Does Swiggy deliver groceries?", "Yes — Swiggy Instamart delivers groceries, fresh produce, and daily essentials in 10–15 minutes."),
                    new FaqDef("How do I track my Swiggy order?", "Track your order in real-time on the Swiggy app from the restaurant to your doorstep.")
                ),
                List.of(
                    new CouponDef("swiggy-60-off", CouponType.CODE, "SWIGGY60", "60% Off on Select Restaurants", "Flat 60% off up to ₹120 on orders from partner restaurants. Minimum order ₹149.", "60% off", List.of("food-grocery"), 14, false, false, 94),
                    new CouponDef("swiggy-free-delivery-wknd", CouponType.FREE_SHIPPING, null, "Free Delivery on Weekends", "No delivery fee on all orders placed between Friday evening and Sunday midnight.", "Free delivery", List.of("food-grocery"), 7, false, true, 90),
                    new CouponDef("swiggy-instamart", CouponType.CODE, "INSTANT20", "20% Off on Instamart", "20% discount on grocery and essentials orders from Swiggy Instamart.", "20% off", List.of("food-grocery"), 30, false, false, 85)
                )
            ),
            new StoreDef("makemytrip", "MakeMyTrip",
                "https://placehold.co/200x200/E8092A/FFFFFF?text=MMT",
                "MakeMyTrip is India's leading travel booking platform for flights, hotels, holiday packages, buses, and trains. Book your dream trip at the best prices.",
                "India's top travel booking platform — best flight & hotel deals.",
                4.4, 74000, "https://www.makemytrip.com", "IN", 89,
                List.of("travel"),
                new ContentWriterDef("Vikram Nair", "Travel Deals Specialist",
                    "Vikram covers the best MMT deals on international and domestic travel, hotel packages, and seasonal sale offers.",
                    "https://ui-avatars.com/api/?name=Vikram+Nair&background=E8092A&color=fff&size=200"),
                List.of(
                    new FaqDef("How do MMT promo codes work?", "Enter the code on the payment page. The discount is applied before final payment."),
                    new FaqDef("Does MakeMyTrip offer price match?", "MMT offers a Best Price Guarantee on select hotels. If you find a lower price, they'll match it."),
                    new FaqDef("What is MMT Double Black membership?", "Double Black is MMT's top loyalty tier with maximum cashback, lounge access, and priority support.")
                ),
                List.of(
                    new CouponDef("mmt-hotel-20", CouponType.CODE, "MHTL20", "20% Off on Hotel Bookings", "Save 20% on domestic and international hotel bookings. Valid on stays of 2+ nights.", "20% off", List.of("travel"), 90, true, false, 87),
                    new CouponDef("mmt-flight-10", CouponType.CODE, "MFLT10", "10% Off on Flights", "Get 10% discount on domestic flight bookings. Valid on bookings 15+ days in advance.", "10% off", List.of("travel"), 60, true, false, 84),
                    new CouponDef("mmt-holiday-pkg", CouponType.DEAL, null, "Holiday Packages from ₹9,999/person", "All-inclusive Goa, Kerala, and Rajasthan holiday packages starting at ₹9,999 per person.", "From ₹9,999/person", List.of("travel"), 30, false, true, 91),
                    new CouponDef("mmt-international", CouponType.CODE, "INTL15MMT", "15% Off on International Flights", "15% discount on international flight bookings to Dubai, Bangkok, Singapore, and more.", "15% off", List.of("travel"), 60, true, false, 88)
                )
            ),
            new StoreDef("bigbasket", "BigBasket",
                "https://placehold.co/200x200/89C400/FFFFFF?text=BB",
                "BigBasket is India's largest online grocery platform delivering fresh fruits, vegetables, dairy, bakery, and packaged food right to your doorstep.",
                "India's biggest online grocery — fresh delivery daily.",
                4.3, 92000, "https://www.bigbasket.com", "IN", 90,
                List.of("food-grocery"),
                new ContentWriterDef("Sunita Rao", "Grocery & Savings Expert",
                    "Sunita helps families save on their monthly grocery bills with the best BigBasket coupons and subscription tips.",
                    "https://ui-avatars.com/api/?name=Sunita+Rao&background=89C400&color=fff&size=200"),
                List.of(
                    new FaqDef("Is BigBasket delivery free?", "BigBasket offers free delivery for BB Star members. Non-members get free delivery on orders above ₹600."),
                    new FaqDef("How fresh are BigBasket products?", "BigBasket sources fresh produce directly from farms and ensures delivery within 24–48 hours of harvest."),
                    new FaqDef("What is BB Star membership?", "BB Star is BigBasket's premium membership offering unlimited free delivery, exclusive discounts, and early access to deals.")
                ),
                List.of(
                    new CouponDef("bb-10-off", CouponType.CODE, "BB10SAVE", "10% Off on Grocery Orders", "Get 10% discount on all grocery, fresh, and packaged food orders.", "10% off", List.of("food-grocery"), 30, true, false, 88),
                    new CouponDef("bb-fresh-20", CouponType.CODE, "BBFRESH20", "20% Off on Fresh Fruits & Veggies", "20% discount on fresh fruits, vegetables, and organic produce.", "20% off", List.of("food-grocery"), 15, true, false, 85),
                    new CouponDef("bb-free-delivery", CouponType.FREE_SHIPPING, null, "Free Delivery on Orders ₹600+", "No delivery fee on grocery orders above ₹600.", "Free delivery", List.of("food-grocery"), 180, false, false, 92)
                )
            ),
            new StoreDef("ajio", "AJIO",
                "https://placehold.co/200x200/FF6B00/FFFFFF?text=AJIO",
                "AJIO is Reliance's premium fashion destination with over 5,000 brands including international labels, homegrown designers, and exclusive private labels.",
                "Fashion-forward destination with 5000+ premium brands.",
                4.3, 45000, "https://www.ajio.com", "IN", 86,
                List.of("fashion"),
                new ContentWriterDef("Neha Gupta", "Fashion & Trend Analyst",
                    "Neha covers AJIO's INDI fashion drops, sale events, and exclusive brand launches to help you stay stylish on a budget.",
                    "https://ui-avatars.com/api/?name=Neha+Gupta&background=FF6B00&color=fff&size=200"),
                List.of(
                    new FaqDef("What brands does AJIO carry?", "AJIO stocks 5000+ brands including Levis, Tommy Hilfiger, Puma, Nike, and exclusive private labels."),
                    new FaqDef("What is AJIO's return policy?", "AJIO offers free returns within 14–30 days. Pick-up is arranged from your doorstep."),
                    new FaqDef("Does AJIO have a loyalty program?", "Yes — AJIO members earn Ajio Coins on every purchase, redeemable on future orders.")
                ),
                List.of(
                    new CouponDef("ajio-30-off", CouponType.CODE, "AJIO30NOW", "30% Off on All Fashion", "Save 30% on clothing, footwear, and accessories across all AJIO brands.", "30% off", List.of("fashion"), 45, true, false, 89),
                    new CouponDef("ajio-first-50", CouponType.CODE, "AJIONEW50", "50% Off for New Users", "First time on AJIO? Get flat 50% off on your entire first order.", "50% off", List.of("fashion"), 365, true, true, 94),
                    new CouponDef("ajio-indi-sale", CouponType.DEAL, null, "INDI Sale — Up to 70% Off", "AJIO's mega sale featuring up to 70% off on premium and international brands.", "Up to 70% off", List.of("fashion"), 7, false, true, 96)
                )
            ),
            new StoreDef("croma", "Croma",
                "https://placehold.co/200x200/67B346/FFFFFF?text=CRM",
                "Croma (Infiniti Retail) is India's first large-format retail chain for consumer electronics and durables, operated by the Tata Group.",
                "Tata's trusted electronics chain — 600+ stores across India.",
                4.2, 38000, "https://www.croma.com", "IN", 82,
                List.of("electronics"),
                new ContentWriterDef("Aditya Shah", "Consumer Electronics Expert",
                    "Aditya reviews gadgets and tracks the best Croma exchange offers, EMI schemes, and extended warranty deals.",
                    "https://ui-avatars.com/api/?name=Aditya+Shah&background=67B346&color=fff&size=200"),
                List.of(
                    new FaqDef("Does Croma offer EMI?", "Yes — Croma offers 0% EMI for 3–24 months on select products via leading credit cards."),
                    new FaqDef("What is Croma's exchange policy?", "Croma accepts old electronics for exchange with attractive buyback values on TVs, laptops, and phones."),
                    new FaqDef("Does Croma price-match?", "Croma has a Best Price Guarantee. If you find the same product cheaper elsewhere, they'll match the price.")
                ),
                List.of(
                    new CouponDef("croma-15-off", CouponType.CODE, "CROMA15OFF", "15% Off on Electronics", "Flat 15% discount on laptops, tablets, and smart home devices. Valid on orders above ₹10,000.", "15% off", List.of("electronics"), 30, true, false, 83),
                    new CouponDef("croma-emi-deal", CouponType.DEAL, null, "0% EMI on Smartphones & Laptops", "Buy top electronics on 0% EMI for up to 12 months with select bank credit cards.", "0% EMI", List.of("electronics"), 90, false, true, 87),
                    new CouponDef("croma-exchange", CouponType.DEAL, null, "Up to ₹15,000 Off via Exchange", "Exchange your old phone, laptop, or TV and get up to ₹15,000 off on a new purchase.", "Up to ₹15,000 off", List.of("electronics"), 60, false, false, 85)
                )
            ),
            new StoreDef("tata-1mg", "Tata 1mg",
                "https://placehold.co/200x200/E40046/FFFFFF?text=1MG",
                "Tata 1mg is India's leading digital healthcare platform for medicines, diagnostics, health products, and online doctor consultations.",
                "India's trusted health platform — medicines, labs & consultations.",
                4.5, 55000, "https://www.1mg.com", "IN", 88,
                List.of("beauty-health"),
                new ContentWriterDef("Dr. Ritika Sinha", "Health & Wellness Writer",
                    "Dr. Ritika is a pharmacist who reviews the best 1mg offers on essential medicines, diagnostic packages, and health supplements.",
                    "https://ui-avatars.com/api/?name=Ritika+Sinha&background=E40046&color=fff&size=200"),
                List.of(
                    new FaqDef("Are medicines on 1mg genuine?", "Yes — all medicines are sourced from licensed pharmacies and come with pharmacist verification."),
                    new FaqDef("How does 1mg lab testing work?", "Book a lab test online, a phlebotomist visits your home for sample collection, and reports are delivered digitally."),
                    new FaqDef("Can I consult a doctor on 1mg?", "Yes — 1mg offers video and chat consultations with verified doctors across specialities.")
                ),
                List.of(
                    new CouponDef("1mg-med-20", CouponType.CODE, "MED20SAVE", "20% Off on Medicines", "Save 20% on prescription and over-the-counter medicines. Valid on all orders.", "20% off", List.of("beauty-health"), 30, true, false, 90),
                    new CouponDef("1mg-lab-15", CouponType.CODE, "LAB15OFF", "15% Off on Lab Tests", "15% discount on all diagnostic tests and health check packages. Home collection available.", "15% off", List.of("beauty-health"), 60, true, false, 87),
                    new CouponDef("1mg-supplement", CouponType.CODE, "HEALTH10", "10% Off on Health Supplements", "Discount on vitamins, protein powders, and wellness supplements.", "10% off", List.of("beauty-health"), 45, false, false, 82)
                )
            ),
            new StoreDef("boat", "boAt Lifestyle",
                "https://placehold.co/200x200/1A1A1A/FFFFFF?text=boAt",
                "boAt is India's leading audio brand making headphones, earphones, smartwatches, and speakers popular among youth for their quality and style.",
                "India's #1 audio brand — headphones, earbuds & smartwatches.",
                4.4, 68000, "https://www.boat-lifestyle.com", "IN", 87,
                List.of("electronics"),
                new ContentWriterDef("Kabir Malhotra", "Audio Tech Reviewer",
                    "Kabir reviews boAt's latest audio gear and tracks the best deals on headphones, earbuds, and smartwatches.",
                    "https://ui-avatars.com/api/?name=Kabir+Malhotra&background=1A1A1A&color=fff&size=200"),
                List.of(
                    new FaqDef("What warranty do boAt products come with?", "All boAt products come with a 1-year manufacturer warranty. Extended warranty is available at checkout."),
                    new FaqDef("Is boAt Made in India?", "Yes — boAt products are designed in India and manufactured locally, supporting the Made in India initiative."),
                    new FaqDef("Does boAt offer a student discount?", "boAt offers up to 10% additional discount to students via verified email. Check the website for details.")
                ),
                List.of(
                    new CouponDef("boat-10-off", CouponType.CODE, "BOAT10AFF", "10% Off on All Products", "Flat 10% discount on headphones, earbuds, smartwatches, and speakers.", "10% off", List.of("electronics"), 30, true, false, 86),
                    new CouponDef("boat-bundle", CouponType.DEAL, null, "Buy 2 Get 20% Off", "Purchase any two boAt products and get an additional 20% discount on the cheaper item.", "20% off on second item", List.of("electronics"), 60, false, true, 88),
                    new CouponDef("boat-earbuds", CouponType.CODE, "BUDS20", "20% Off on Airdopes Earbuds", "20% discount on the entire Airdopes earbuds range — TWS for every budget.", "20% off", List.of("electronics"), 45, true, false, 84)
                )
            ),
            new StoreDef("puma-india", "Puma India",
                "https://placehold.co/200x200/0D0D0D/FFFFFF?text=PUMA",
                "Puma India is the official store for Puma sportswear, footwear, and accessories. Shop the latest collections from football, running, training, and lifestyle ranges.",
                "Official Puma store — premium sportswear & footwear.",
                4.4, 42000, "https://in.puma.com", "IN", 85,
                List.of("sports-fitness", "fashion"),
                new ContentWriterDef("Sanjay Kumar", "Sports & Fitness Writer",
                    "Sanjay is a fitness enthusiast who reviews the latest Puma launches and tracks the best sale events for sports gear.",
                    "https://ui-avatars.com/api/?name=Sanjay+Kumar&background=0D0D0D&color=fff&size=200"),
                List.of(
                    new FaqDef("What is Puma's return policy in India?", "Puma offers free returns within 14 days for unworn items in original packaging."),
                    new FaqDef("Does Puma India have an outlet?", "Yes — Puma has 600+ outlets across India. Use the Store Locator on the website."),
                    new FaqDef("Are Puma India products authentic?", "Only buy from Puma.com or authorised retailers. All products sold on the official site carry a brand guarantee.")
                ),
                List.of(
                    new CouponDef("puma-30-off", CouponType.CODE, "PUMA30STYLE", "30% Off on All Orders", "Get flat 30% discount on footwear, clothing, and accessories. Minimum order ₹2,000.", "30% off", List.of("sports-fitness"), 45, true, false, 88),
                    new CouponDef("puma-flat40", CouponType.DEAL, null, "Sale — Flat 40% Off", "Puma sale with flat 40% off on running shoes, training gear, and lifestyle collections.", "Flat 40% off", List.of("sports-fitness", "fashion"), 14, false, true, 92),
                    new CouponDef("puma-sporty20", CouponType.CODE, "SPORTY20IN", "20% Off on Sports Footwear", "20% discount on running, training, and cricket footwear from Puma's performance range.", "20% off", List.of("sports-fitness"), 60, true, false, 85)
                )
            ),
            new StoreDef("cleartrip", "Cleartrip",
                "https://placehold.co/200x200/0E6EFF/FFFFFF?text=CT",
                "Cleartrip is India's premium travel booking platform for flights, hotels, and holiday packages, now powered by Flipkart for unbeatable deals.",
                "India's easiest travel booking — flights, hotels & holidays.",
                4.2, 35000, "https://www.cleartrip.com", "IN", 81,
                List.of("travel"),
                new ContentWriterDef("Meghna Pillai", "Travel & Hospitality Writer",
                    "Meghna covers the best Cleartrip flash sales, international flight deals, and hotel packages to help you travel more for less.",
                    "https://ui-avatars.com/api/?name=Meghna+Pillai&background=0E6EFF&color=fff&size=200"),
                List.of(
                    new FaqDef("Is Cleartrip safe for booking?", "Yes — Cleartrip is PCI DSS certified and uses bank-grade encryption for all transactions."),
                    new FaqDef("Does Cleartrip charge booking fees?", "Cleartrip charges minimal convenience fees. Use promo codes to offset these charges."),
                    new FaqDef("Can I cancel Cleartrip bookings?", "Yes — cancellations follow airline/hotel policies. Cleartrip processes refunds within 5–7 business days.")
                ),
                List.of(
                    new CouponDef("cleartrip-200", CouponType.CODE, "CLEAR200OFF", "₹200 Off on Flights", "Get ₹200 off on domestic flight bookings. Valid on one-way and round-trip tickets.", "₹200 off", List.of("travel"), 30, false, false, 83),
                    new CouponDef("cleartrip-flight5", CouponType.CODE, "CTFLIGHT5", "5% Off on International Flights", "Save 5% on all international flights booked at least 7 days in advance.", "5% off", List.of("travel"), 60, true, false, 80),
                    new CouponDef("cleartrip-hotel", CouponType.CODE, "CTHOTEL15", "15% Off on Hotel Bookings", "15% discount on hotel stays across India. Valid on 2-night minimum bookings.", "15% off", List.of("travel"), 60, true, false, 82)
                )
            )
        );

        int count = 0;
        for (StoreDef s : stores) {
            if (storeRepo.existsBySlug(s.slug())) continue;
            createStore(s, cats);
            count++;
        }
        return count;
    }

    /**
     * Brand colors for the Rakuten-style homepage cards. Keys are store slugs.
     * The color fills the card background; the logo is rendered on top.
     */
    private static final Map<String, String> BRAND_COLORS = Map.ofEntries(
            Map.entry("amazon-india", "#FF9900"),
            Map.entry("flipkart",     "#2874F0"),
            Map.entry("myntra",       "#FF3F6C"),
            Map.entry("nykaa",        "#FC2779"),
            Map.entry("zomato",       "#E23744"),
            Map.entry("swiggy",       "#FC8019"),
            Map.entry("makemytrip",   "#E8092A"),
            Map.entry("bigbasket",    "#84C341"),
            Map.entry("ajio",         "#1A1A1A"),
            Map.entry("croma",        "#0A8D3A"),
            Map.entry("tata-1mg",     "#E40046"),
            Map.entry("boat",         "#1A1A1A"),
            Map.entry("puma-india",   "#0D0D0D"),
            Map.entry("cleartrip",    "#0E6EFF")
    );

    private void createStore(StoreDef s, Map<String, Category> catMap) {
        Store store = Store.create(s.slug(), s.name(), s.logoUrl(), s.description(), s.primaryUrl(), s.countryCode());
        store.setShortDescription(s.shortDescription());
        store.setRating(BigDecimal.valueOf(s.rating()));
        store.setReviewCount(s.reviewCount());
        store.setPopularityScore(s.popularityScore());
        store.setBrandColor(BRAND_COLORS.get(s.slug()));
        store.setMetaTitle(s.name() + " Coupons & Deals " + OffsetDateTime.now().getYear() + " | Clipupp");
        store.setMetaDescription("Save big at " + s.name() + " with verified coupon codes and deals. Updated daily on Clipupp.");
        Store saved = storeRepo.saveAndFlush(store);

        // Stats
        Stats stats = new Stats(saved.getId());
        stats.setTotalOffers(s.coupons().size());
        stats.setCouponCodes((int) s.coupons().stream().filter(c -> c.type() == CouponType.CODE).count());
        stats.setFreeShippingDeals((int) s.coupons().stream().filter(c -> c.type() == CouponType.FREE_SHIPPING).count());
        statsRepo.save(stats);

        // Content writer
        ContentWriterDef cw = s.contentWriter();
        ContentWriter writer = new ContentWriter(saved.getId(), cw.name(), cw.role(), cw.bio());
        writer.setImageUrl(cw.imageUrl());
        contentWriterRepo.save(writer);

        // FAQs
        short pos = 1;
        for (FaqDef f : s.faqs()) {
            faqRepo.save(Faq.create(saved.getId(), pos++, f.question(), f.answer()));
        }

        // Store-category links
        List<Category> linkedCats = s.categorySlugsList().stream()
                .map(catMap::get)
                .filter(java.util.Objects::nonNull)
                .toList();
        for (Category cat : linkedCats) {
            jdbc.update("INSERT INTO store_category(store_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                    saved.getId(), cat.getId());
        }

        // Coupons
        OffsetDateTime now = OffsetDateTime.now();
        for (CouponDef cd : s.coupons()) {
            Coupon coupon = Coupon.create(cd.slug(), saved.getId(), cd.type(), cd.title(), cd.description());
            coupon.setCode(cd.code());
            coupon.setSavingsLabel(cd.savingsLabel());
            coupon.setExpiresAt(now.plusDays(cd.daysUntilExpiry()));
            coupon.applyVerified(cd.verified(), OffsetDateTime.now());
            coupon.setExclusive(cd.exclusive());
            coupon.setPopularityScore(cd.popularityScore());
            coupon.setMetaTitle(cd.title() + " — " + s.name() + " | Clipupp");
            coupon.setMetaDescription("Use this " + s.name() + " coupon to save. " + cd.description());
            Set<Category> couponCats = cd.categorySlugs().stream()
                    .map(catMap::get)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toCollection(HashSet::new));
            coupon.getCategories().addAll(couponCats);
            couponRepo.save(coupon);
        }
    }

    record StoreDef(String slug, String name, String logoUrl, String description,
                    String shortDescription, double rating, int reviewCount,
                    String primaryUrl, String countryCode, int popularityScore,
                    List<String> categorySlugsList, ContentWriterDef contentWriter,
                    List<FaqDef> faqs, List<CouponDef> coupons) {}

    record ContentWriterDef(String name, String role, String bio, String imageUrl) {}
    record FaqDef(String question, String answer) {}
    record CouponDef(String slug, CouponType type, String code, String title, String description,
                     String savingsLabel, List<String> categorySlugs, int daysUntilExpiry,
                     boolean verified, boolean exclusive, int popularityScore) {}

    // ── Blog ───────────────────────────────────────────────────────────────────

    private int seedBlog() {
        Author priya = getOrCreateAuthor("priya-sharma", "Priya Sharma",
                "Priya is a senior deals analyst with 8 years of experience finding the best savings across e-commerce, travel, and lifestyle.",
                "https://ui-avatars.com/api/?name=Priya+Sharma&background=4F46E5&color=fff&size=200");
        Author rahul = getOrCreateAuthor("rahul-mehta", "Rahul Mehta",
                "Rahul is a consumer electronics journalist who tests gadgets and tracks the best tech deals across India's top retailers.",
                "https://ui-avatars.com/api/?name=Rahul+Mehta&background=0891B2&color=fff&size=200");
        Author ananya = getOrCreateAuthor("ananya-iyer", "Ananya Iyer",
                "Ananya covers fashion, beauty, and lifestyle with a focus on sustainable shopping and finding the best value for money.",
                "https://ui-avatars.com/api/?name=Ananya+Iyer&background=BE185D&color=fff&size=200");

        int count = 0;
        count += createArticle("best-smartphone-deals-india-2024", "Best Smartphone Deals in India This Month",
            "Find the top smartphone discounts from Amazon, Flipkart, and Croma in India right now.",
            ARTICLE_SMARTPHONES, "https://placehold.co/1200x630/0891B2/FFFFFF?text=Smartphone+Deals", rahul.getId());
        count += createArticle("top-fashion-coupons-festive-season", "Top Fashion Coupons for the Festive Season",
            "Dress for every celebration with these handpicked coupons from Myntra, AJIO, and Puma.",
            ARTICLE_FASHION, "https://placehold.co/1200x630/BE185D/FFFFFF?text=Fashion+Deals", ananya.getId());
        count += createArticle("save-grocery-bills-india", "7 Ways to Save More on Your Monthly Grocery Bill",
            "Smart shopping strategies using BigBasket and Swiggy Instamart coupons to cut your grocery spend.",
            ARTICLE_GROCERY, "https://placehold.co/1200x630/89C400/FFFFFF?text=Grocery+Savings", priya.getId());
        count += createArticle("best-travel-deals-2024", "Best Travel Deals to Book Right Now",
            "Flights, hotels, and holiday packages at prices you won't believe — limited-time offers inside.",
            ARTICLE_TRAVEL, "https://placehold.co/1200x630/E8092A/FFFFFF?text=Travel+Deals", priya.getId());
        count += createArticle("beauty-products-under-999-coupons", "Top Beauty Products Under ₹999 with Coupons",
            "Look great without breaking the bank — curated Nykaa and 1mg deals for skincare and makeup.",
            ARTICLE_BEAUTY, "https://placehold.co/1200x630/FC2779/FFFFFF?text=Beauty+Deals", ananya.getId());
        return count;
    }

    private Author getOrCreateAuthor(String slug, String name, String bio, String avatarUrl) {
        return authorRepo.findBySlug(slug).orElseGet(() -> {
            Author a = Author.create(slug, name);
            a.setBio(bio);
            a.setAvatarUrl(avatarUrl);
            return authorRepo.save(a);
        });
    }

    private int createArticle(String slug, String title, String excerpt, String bodyMd,
                               String heroImageUrl, UUID authorId) {
        if (articleRepo.existsBySlug(slug)) return 0;
        Article a = Article.create(slug, title, excerpt, bodyMd, authorId);
        a.setHeroImageUrl(heroImageUrl);
        a.setMetaTitle(title + " | Clipupp Blog");
        a.setMetaDescription(excerpt);
        a.publishNow();
        articleRepo.save(a);
        return 1;
    }

    // ── Banners ────────────────────────────────────────────────────────────────

    private int seedBanners() {
        OffsetDateTime now = OffsetDateTime.now();

        // ── TOP_BAR — slim dismissible announcement at the very top of every page ──
        createBanner("Share Clipupp & earn ₹500 referral bonus",
                "Refer Now",
                "", // image not used for top bar; only title/subtitle/link
                "/account",
                BannerPlacement.TOP_BAR, (short) 0, now, now.plusDays(60));

        // ── HERO_CAROUSEL — large auto-rotating slot in the hero ──
        createBanner("Mega Sale — Up to 80% Off Across All Categories",
                "Shop from 500+ stores and save big with verified coupon codes",
                "https://placehold.co/1200x400/4F46E5/FFFFFF?text=Mega+Sale+%E2%80%94+Up+to+80%25+Off",
                "/stores",
                BannerPlacement.HERO_CAROUSEL, (short) 1, now, now.plusDays(30));
        createBanner("Festive Season Deals Are Live!",
                "Exclusive coupons for Diwali, Navratri & all festive shopping",
                "https://placehold.co/1200x400/E8092A/FFFFFF?text=Festive+Season+Deals",
                "/categories/fashion",
                BannerPlacement.HERO_CAROUSEL, (short) 2, now, now.plusDays(14));
        createBanner("Food Delivery Cashback Offers",
                "Save up to 60% on Zomato & Swiggy every day",
                "https://placehold.co/1200x400/FC8019/FFFFFF?text=Food+Delivery+Cashback",
                "/categories/food-grocery",
                BannerPlacement.HERO_CAROUSEL, (short) 3, now, now.plusDays(60));

        // ── PROMO_CARD — wide promo cards in the homepage horizontal rail ──
        createBanner("Gettin' Cashback — Learn how to use Clipupp",
                "Earn cashback on every purchase. Here's how it works.",
                "https://placehold.co/1200x500/4F46E5/FFFFFF?text=How+Cashback+Works",
                "/how-it-works",
                BannerPlacement.PROMO_CARD, (short) 1, now, now.plusDays(90));
        createBanner("Refer a Friend & Earn ₹500",
                "Share Clipupp with friends and earn cashback for every signup.",
                "https://placehold.co/1200x500/F59E0B/1A1A1A?text=Refer+%26+Earn+%E2%82%B9500",
                "/account",
                BannerPlacement.PROMO_CARD, (short) 2, now, now.plusDays(90));
        createBanner("New User Bonus — Flat ₹100 Off",
                "Sign up today and grab a flat ₹100 off coupon on your first order.",
                "https://placehold.co/1200x500/10B981/FFFFFF?text=New+User+Bonus",
                "/sign-up",
                BannerPlacement.PROMO_CARD, (short) 3, now, now.plusDays(90));
        createBanner("Download the Clipupp App",
                "Get exclusive app-only deals, instant notifications, and faster cashback.",
                "https://placehold.co/1200x500/2563EB/FFFFFF?text=Download+the+App",
                "/about",
                BannerPlacement.PROMO_CARD, (short) 4, now, now.plusDays(180));

        return 8;
    }

    private void createBanner(String title, String subtitle, String imageUrl, String linkUrl,
                               BannerPlacement placement, short position,
                               OffsetDateTime startsAt, OffsetDateTime endsAt) {
        // Banner.create requires a non-null imageUrl; for TOP_BAR we don't render an image,
        // so use a 1×1 transparent placeholder as a sentinel.
        String img = (imageUrl == null || imageUrl.isBlank())
                ? "https://placehold.co/1x1/000000/000000?text=+"
                : imageUrl;
        Banner b = Banner.create(title, img, linkUrl, position);
        b.setSubtitle(subtitle);
        b.setStartsAt(startsAt);
        b.setEndsAt(endsAt);
        b.setActive(true);
        b.setCountryCode("IN");
        b.setPlacement(placement);
        bannerRepo.save(b);
    }

    // ── Article body content ───────────────────────────────────────────────────

    private static final String ARTICLE_SMARTPHONES = """
# Best Smartphone Deals in India This Month

Looking for a new smartphone without overspending? We've scoured Amazon, Flipkart, and Croma to bring you the best verified deals available right now.

## Top Picks Under ₹15,000

- **Redmi Note 13** — Available on Flipkart for ₹13,499 (use code **FLIP20NOW** for extra 20% off)
- **realme narzo 60** — Amazon has it at ₹14,999 with a ₹1,000 exchange bonus
- **Samsung Galaxy M14** — Croma exclusive with 0% EMI (use **CROMA15OFF**)

## Premium Deals Under ₹30,000

- **OnePlus Nord CE 3** — Flipkart exclusive with ₹2,000 bank discount
- **Samsung Galaxy A54** — Amazon sale price ₹26,999 with **AMZN10ELEC**

## Tips to Maximise Savings

1. Stack bank card discounts with coupon codes
2. Check the exchange value of your old phone before buying
3. Look for No-Cost EMI options to spread payments

Use the coupon codes above on Clipupp to verify they're still active before checkout.
""";

    private static final String ARTICLE_FASHION = """
# Top Fashion Coupons for the Festive Season

India's festive season is the best time to refresh your wardrobe. Here are the most valuable fashion coupons available right now.

## Myntra

Myntra's EORS (End of Reason Sale) runs twice a year with up to 80% off. Year-round, use **MYNTRA30** for 30% off or **MYNTRAFIRST** for 50% off your first order.

## AJIO

AJIO's INDI Sale is legendary for premium brand discounts. Try **AJIO30NOW** for regular savings or **AJIONEW50** if you're a new customer.

## Puma India

Running shoes, training gear, and lifestyle apparel — use **PUMA30STYLE** for 30% off or watch for the flat 40% off sale events.

## How to Layer Deals

1. Choose a credit card with additional fashion cashback
2. Apply the platform coupon code at checkout
3. Check if your item qualifies for loyalty points or coins

Stay stylish without splurging — Clipupp updates deals daily.
""";

    private static final String ARTICLE_GROCERY = """
# 7 Ways to Save More on Your Monthly Grocery Bill

With grocery prices rising, smart shoppers are turning to online platforms and coupon codes to stay within budget. Here's how.

## 1. Use BigBasket Subscriptions

BB Star members save an average of ₹500/month on delivery fees alone. Add code **BB10SAVE** for 10% off on top.

## 2. Order Vegetables on Swiggy Instamart

For daily essentials, Swiggy Instamart with **SWIGGY60** gives 60% off and delivers in 10 minutes.

## 3. Plan Weekly Menus

Bulk ordering fresh produce on BigBasket reduces impulse purchases. Use **BBFRESH20** for 20% off on fruits and vegetables.

## 4. Track Expiry Dates on Coupons

Most grocery coupons are short-lived (7–14 days). Bookmark Clipupp's food & grocery section for daily updates.

## 5. Use Cashback Cards

Pair grocery coupons with a cashback credit card for double savings.

## 6. Buy Non-Perishables in Bulk

Staples like rice, lentils, and cooking oil are cheaper in larger quantities on BigBasket.

## 7. Monitor Weekend Deals

Both Zomato and Swiggy run exclusive weekend promos. Check Clipupp every Friday for the latest codes.
""";

    private static final String ARTICLE_TRAVEL = """
# Best Travel Deals to Book Right Now

India's travel sector is booming and competition between platforms means incredible deals if you know where to look.

## Domestic Flights

- **MakeMyTrip**: Use **MFLT10** for 10% off on flights booked 15+ days ahead
- **Cleartrip**: **CLEAR200OFF** gives ₹200 off — great for short-notice bookings
- Best routes: Mumbai–Delhi, Bengaluru–Hyderabad, Chennai–Kolkata

## Hotels

- MMT's **MHTL20** saves 20% on hotel stays of 2+ nights
- Cleartrip's **CTHOTEL15** gives 15% off on domestic hotels

## Holiday Packages

MakeMyTrip's all-inclusive packages start at ₹9,999/person for Goa and ₹14,999 for Kerala during shoulder season.

## Pro Tips

1. Book flights 3–6 weeks ahead for best prices
2. Fly on Tuesday or Wednesday — cheapest days in India
3. Use **INTL15MMT** for international routes to Dubai, Bangkok, and Singapore

Set a price alert on Clipupp and we'll notify you when these deals drop further.
""";

    private static final String ARTICLE_BEAUTY = """
# Top Beauty Products Under ₹999 with Coupons

Looking fabulous shouldn't cost a fortune. These curated picks from Nykaa and Tata 1mg come with verified coupon codes.

## Skincare Under ₹999

- **Minimalist 10% Niacinamide Serum** — ₹599 on Nykaa with **NYK15SAVE** = ₹509
- **Dot & Key Moisture + Matte SPF 50** — ₹795 with free samples on orders above ₹999
- **CeraVe Hydrating Cleanser** — ₹799 on 1mg with **MED20SAVE** = ₹639

## Makeup Under ₹999

- **Maybelline Fit Me Foundation** — ₹699 on Nykaa with free delivery on orders ₹499+
- **MyGlamm Perfect Curves Kajal** — ₹350, buy 3 get 15% off with **SKINCARE20**

## Wellness Under ₹999

- **Oziva Protein & Herbs** — ₹799 on 1mg with **HEALTH10** = ₹719
- **Himalaya Ashwagandha** — ₹225, eligible for 20% medicine discount

## How to Save More

1. Stack Nykaa Prive points with coupon codes
2. Look for "Free Sample" offers at checkout on Nykaa
3. Check 1mg's daily health specials for time-limited discounts

All codes on Clipupp are verified before publishing — always copy from here for the highest chance of success.
""";
}
