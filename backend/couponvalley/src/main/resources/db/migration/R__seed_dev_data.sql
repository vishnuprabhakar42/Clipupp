-- R__seed_dev_data.sql
-- Repeatable migration — re-runs whenever the file checksum changes.
-- All statements are idempotent via ON CONFLICT DO NOTHING / WHERE NOT EXISTS.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CATEGORIES  (20 top-level + 120 sub-categories = 140 total)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO category (id, slug, title, parent_id, icon, position, active) VALUES
-- Top-level
  ('10000000-0000-0000-0000-000000000001','fashion',              'Fashion',                NULL,'shirt',             1, TRUE),
  ('10000000-0000-0000-0000-000000000002','electronics',          'Electronics',            NULL,'cpu',               2, TRUE),
  ('10000000-0000-0000-0000-000000000003','food-dining',          'Food & Dining',          NULL,'utensils',          3, TRUE),
  ('10000000-0000-0000-0000-000000000004','travel',               'Travel',                 NULL,'plane',             4, TRUE),
  ('10000000-0000-0000-0000-000000000005','health-wellness',      'Health & Wellness',      NULL,'heart-pulse',       5, TRUE),
  ('10000000-0000-0000-0000-000000000006','beauty-personal-care', 'Beauty & Personal Care', NULL,'sparkles',          6, TRUE),
  ('10000000-0000-0000-0000-000000000007','sports-fitness',       'Sports & Fitness',       NULL,'dumbbell',          7, TRUE),
  ('10000000-0000-0000-0000-000000000008','home-living',          'Home & Living',          NULL,'home',              8, TRUE),
  ('10000000-0000-0000-0000-000000000009','books-education',      'Books & Education',      NULL,'book-open',         9, TRUE),
  ('10000000-0000-0000-0000-000000000010','entertainment',        'Entertainment',          NULL,'clapperboard',     10, TRUE),
  ('10000000-0000-0000-0000-000000000011','financial-services',   'Financial Services',     NULL,'landmark',         11, TRUE),
  ('10000000-0000-0000-0000-000000000012','automotive',           'Automotive',             NULL,'car',              12, TRUE),
  ('10000000-0000-0000-0000-000000000013','groceries',            'Groceries',              NULL,'shopping-basket',  13, TRUE),
  ('10000000-0000-0000-0000-000000000014','baby-kids',            'Baby & Kids',            NULL,'baby',             14, TRUE),
  ('10000000-0000-0000-0000-000000000015','pet-care',             'Pet Care',               NULL,'paw-print',        15, TRUE),
  ('10000000-0000-0000-0000-000000000016','jewellery-accessories','Jewellery & Accessories',NULL,'gem',              16, TRUE),
  ('10000000-0000-0000-0000-000000000017','office-stationery',    'Office & Stationery',    NULL,'briefcase',        17, TRUE),
  ('10000000-0000-0000-0000-000000000018','gaming',               'Gaming',                 NULL,'gamepad-2',        18, TRUE),
  ('10000000-0000-0000-0000-000000000019','mobile-recharge',      'Mobile & Recharge',      NULL,'smartphone',       19, TRUE),
  ('10000000-0000-0000-0000-000000000020','gifts-flowers',        'Gifts & Flowers',        NULL,'gift',             20, TRUE),

-- Fashion sub-categories
  ('10000000-0000-0000-0001-000000000001','mens-clothing',        'Men''s Clothing',        '10000000-0000-0000-0000-000000000001',NULL,1,TRUE),
  ('10000000-0000-0000-0001-000000000002','womens-clothing',      'Women''s Clothing',      '10000000-0000-0000-0000-000000000001',NULL,2,TRUE),
  ('10000000-0000-0000-0001-000000000003','kids-clothing',        'Kids Clothing',          '10000000-0000-0000-0000-000000000001',NULL,3,TRUE),
  ('10000000-0000-0000-0001-000000000004','footwear',             'Footwear',               '10000000-0000-0000-0000-000000000001',NULL,4,TRUE),
  ('10000000-0000-0000-0001-000000000005','bags-luggage',         'Bags & Luggage',         '10000000-0000-0000-0000-000000000001',NULL,5,TRUE),
  ('10000000-0000-0000-0001-000000000006','ethnic-wear',          'Ethnic Wear',            '10000000-0000-0000-0000-000000000001',NULL,6,TRUE),

-- Electronics sub-categories
  ('10000000-0000-0000-0002-000000000001','mobiles-tablets',      'Mobiles & Tablets',      '10000000-0000-0000-0000-000000000002',NULL,1,TRUE),
  ('10000000-0000-0000-0002-000000000002','laptops-computers',    'Laptops & Computers',    '10000000-0000-0000-0000-000000000002',NULL,2,TRUE),
  ('10000000-0000-0000-0002-000000000003','tv-audio',             'TV & Audio',             '10000000-0000-0000-0000-000000000002',NULL,3,TRUE),
  ('10000000-0000-0000-0002-000000000004','cameras-photography',  'Cameras & Photography',  '10000000-0000-0000-0000-000000000002',NULL,4,TRUE),
  ('10000000-0000-0000-0002-000000000005','wearables',            'Wearables',              '10000000-0000-0000-0000-000000000002',NULL,5,TRUE),
  ('10000000-0000-0000-0002-000000000006','smart-home',           'Smart Home',             '10000000-0000-0000-0000-000000000002',NULL,6,TRUE),

-- Food & Dining sub-categories
  ('10000000-0000-0000-0003-000000000001','food-delivery',        'Food Delivery',          '10000000-0000-0000-0000-000000000003',NULL,1,TRUE),
  ('10000000-0000-0000-0003-000000000002','restaurants',          'Restaurants',            '10000000-0000-0000-0000-000000000003',NULL,2,TRUE),
  ('10000000-0000-0000-0003-000000000003','beverages',            'Beverages',              '10000000-0000-0000-0000-000000000003',NULL,3,TRUE),
  ('10000000-0000-0000-0003-000000000004','bakery-sweets',        'Bakery & Sweets',        '10000000-0000-0000-0000-000000000003',NULL,4,TRUE),
  ('10000000-0000-0000-0003-000000000005','health-food',          'Health Food',            '10000000-0000-0000-0000-000000000003',NULL,5,TRUE),
  ('10000000-0000-0000-0003-000000000006','meal-kits',            'Meal Kits',              '10000000-0000-0000-0000-000000000003',NULL,6,TRUE),

-- Travel sub-categories
  ('10000000-0000-0000-0004-000000000001','flights',              'Flights',                '10000000-0000-0000-0000-000000000004',NULL,1,TRUE),
  ('10000000-0000-0000-0004-000000000002','hotels',               'Hotels',                 '10000000-0000-0000-0000-000000000004',NULL,2,TRUE),
  ('10000000-0000-0000-0004-000000000003','holiday-packages',     'Holiday Packages',       '10000000-0000-0000-0000-000000000004',NULL,3,TRUE),
  ('10000000-0000-0000-0004-000000000004','cab-rental',           'Cab & Car Rental',       '10000000-0000-0000-0000-000000000004',NULL,4,TRUE),
  ('10000000-0000-0000-0004-000000000005','bus-tickets',          'Bus Tickets',            '10000000-0000-0000-0000-000000000004',NULL,5,TRUE),
  ('10000000-0000-0000-0004-000000000006','travel-insurance',     'Travel Insurance',       '10000000-0000-0000-0000-000000000004',NULL,6,TRUE),

-- Health & Wellness sub-categories
  ('10000000-0000-0000-0005-000000000001','pharmacy-medicines',   'Pharmacy & Medicines',   '10000000-0000-0000-0000-000000000005',NULL,1,TRUE),
  ('10000000-0000-0000-0005-000000000002','fitness-nutrition',    'Fitness & Nutrition',    '10000000-0000-0000-0000-000000000005',NULL,2,TRUE),
  ('10000000-0000-0000-0005-000000000003','diagnostics-labs',     'Diagnostics & Labs',     '10000000-0000-0000-0000-000000000005',NULL,3,TRUE),
  ('10000000-0000-0000-0005-000000000004','ayurveda-herbal',      'Ayurveda & Herbal',      '10000000-0000-0000-0000-000000000005',NULL,4,TRUE),
  ('10000000-0000-0000-0005-000000000005','mental-health',        'Mental Health',          '10000000-0000-0000-0000-000000000005',NULL,5,TRUE),
  ('10000000-0000-0000-0005-000000000006','medical-devices',      'Medical Devices',        '10000000-0000-0000-0000-000000000005',NULL,6,TRUE),

-- Beauty sub-categories
  ('10000000-0000-0000-0006-000000000001','skincare',             'Skincare',               '10000000-0000-0000-0000-000000000006',NULL,1,TRUE),
  ('10000000-0000-0000-0006-000000000002','haircare',             'Haircare',               '10000000-0000-0000-0000-000000000006',NULL,2,TRUE),
  ('10000000-0000-0000-0006-000000000003','makeup-cosmetics',     'Makeup & Cosmetics',     '10000000-0000-0000-0000-000000000006',NULL,3,TRUE),
  ('10000000-0000-0000-0006-000000000004','fragrances',           'Fragrances',             '10000000-0000-0000-0000-000000000006',NULL,4,TRUE),
  ('10000000-0000-0000-0006-000000000005','mens-grooming',        'Men''s Grooming',        '10000000-0000-0000-0000-000000000006',NULL,5,TRUE),
  ('10000000-0000-0000-0006-000000000006','bath-body',            'Bath & Body',            '10000000-0000-0000-0000-000000000006',NULL,6,TRUE),

-- Sports & Fitness sub-categories
  ('10000000-0000-0000-0007-000000000001','gym-equipment',        'Gym Equipment',          '10000000-0000-0000-0000-000000000007',NULL,1,TRUE),
  ('10000000-0000-0000-0007-000000000002','sportswear',           'Sportswear',             '10000000-0000-0000-0000-000000000007',NULL,2,TRUE),
  ('10000000-0000-0000-0007-000000000003','outdoor-sports',       'Outdoor Sports',         '10000000-0000-0000-0000-000000000007',NULL,3,TRUE),
  ('10000000-0000-0000-0007-000000000004','cricket-gear',         'Cricket Gear',           '10000000-0000-0000-0000-000000000007',NULL,4,TRUE),
  ('10000000-0000-0000-0007-000000000005','yoga-pilates',         'Yoga & Pilates',         '10000000-0000-0000-0000-000000000007',NULL,5,TRUE),
  ('10000000-0000-0000-0007-000000000006','cycling',              'Cycling',                '10000000-0000-0000-0000-000000000007',NULL,6,TRUE),

-- Home & Living sub-categories
  ('10000000-0000-0000-0008-000000000001','furniture',            'Furniture',              '10000000-0000-0000-0000-000000000008',NULL,1,TRUE),
  ('10000000-0000-0000-0008-000000000002','kitchen-appliances',   'Kitchen Appliances',     '10000000-0000-0000-0000-000000000008',NULL,2,TRUE),
  ('10000000-0000-0000-0008-000000000003','home-decor',           'Home Decor',             '10000000-0000-0000-0000-000000000008',NULL,3,TRUE),
  ('10000000-0000-0000-0008-000000000004','bedding-bath',         'Bedding & Bath',         '10000000-0000-0000-0000-000000000008',NULL,4,TRUE),
  ('10000000-0000-0000-0008-000000000005','cleaning-supplies',    'Cleaning Supplies',      '10000000-0000-0000-0000-000000000008',NULL,5,TRUE),
  ('10000000-0000-0000-0008-000000000006','garden-outdoor',       'Garden & Outdoor',       '10000000-0000-0000-0000-000000000008',NULL,6,TRUE),

-- Books & Education sub-categories
  ('10000000-0000-0000-0009-000000000001','textbooks-academic',   'Textbooks & Academic',   '10000000-0000-0000-0000-000000000009',NULL,1,TRUE),
  ('10000000-0000-0000-0009-000000000002','fiction-novels',       'Fiction & Novels',       '10000000-0000-0000-0000-000000000009',NULL,2,TRUE),
  ('10000000-0000-0000-0009-000000000003','online-courses',       'Online Courses',         '10000000-0000-0000-0000-000000000009',NULL,3,TRUE),
  ('10000000-0000-0000-0009-000000000004','stationery-art',       'Stationery & Art',       '10000000-0000-0000-0000-000000000009',NULL,4,TRUE),
  ('10000000-0000-0000-0009-000000000005','e-books',              'E-Books',                '10000000-0000-0000-0000-000000000009',NULL,5,TRUE),
  ('10000000-0000-0000-0009-000000000006','kids-learning',        'Kids Learning',          '10000000-0000-0000-0000-000000000009',NULL,6,TRUE),

-- Entertainment sub-categories
  ('10000000-0000-0000-0010-000000000001','ott-streaming',        'OTT Streaming',          '10000000-0000-0000-0000-000000000010',NULL,1,TRUE),
  ('10000000-0000-0000-0010-000000000002','movie-tickets',        'Movie Tickets',          '10000000-0000-0000-0000-000000000010',NULL,2,TRUE),
  ('10000000-0000-0000-0010-000000000003','music-podcasts',       'Music & Podcasts',       '10000000-0000-0000-0000-000000000010',NULL,3,TRUE),
  ('10000000-0000-0000-0010-000000000004','live-events',          'Live Events',            '10000000-0000-0000-0000-000000000010',NULL,4,TRUE),
  ('10000000-0000-0000-0010-000000000005','gaming-consoles',      'Gaming Consoles',        '10000000-0000-0000-0000-000000000010',NULL,5,TRUE),
  ('10000000-0000-0000-0010-000000000006','comics-manga',         'Comics & Manga',         '10000000-0000-0000-0000-000000000010',NULL,6,TRUE),

-- Financial Services sub-categories
  ('10000000-0000-0000-0011-000000000001','credit-cards',         'Credit Cards',           '10000000-0000-0000-0000-000000000011',NULL,1,TRUE),
  ('10000000-0000-0000-0011-000000000002','insurance',            'Insurance',              '10000000-0000-0000-0000-000000000011',NULL,2,TRUE),
  ('10000000-0000-0000-0011-000000000003','loans-emi',            'Loans & EMI',            '10000000-0000-0000-0000-000000000011',NULL,3,TRUE),
  ('10000000-0000-0000-0011-000000000004','mutual-funds',         'Mutual Funds',           '10000000-0000-0000-0000-000000000011',NULL,4,TRUE),
  ('10000000-0000-0000-0011-000000000005','digital-payments',     'Digital Payments',       '10000000-0000-0000-0000-000000000011',NULL,5,TRUE),
  ('10000000-0000-0000-0011-000000000006','tax-filing',           'Tax Filing',             '10000000-0000-0000-0000-000000000011',NULL,6,TRUE),

-- Automotive sub-categories
  ('10000000-0000-0000-0012-000000000001','car-accessories',      'Car Accessories',        '10000000-0000-0000-0000-000000000012',NULL,1,TRUE),
  ('10000000-0000-0000-0012-000000000002','bike-accessories',     'Bike Accessories',       '10000000-0000-0000-0000-000000000012',NULL,2,TRUE),
  ('10000000-0000-0000-0012-000000000003','car-care',             'Car Care',               '10000000-0000-0000-0000-000000000012',NULL,3,TRUE),
  ('10000000-0000-0000-0012-000000000004','fuel-cards',           'Fuel Cards',             '10000000-0000-0000-0000-000000000012',NULL,4,TRUE),
  ('10000000-0000-0000-0012-000000000005','ev-charging',          'EV Charging',            '10000000-0000-0000-0000-000000000012',NULL,5,TRUE),
  ('10000000-0000-0000-0012-000000000006','auto-insurance',       'Auto Insurance',         '10000000-0000-0000-0000-000000000012',NULL,6,TRUE),

-- Groceries sub-categories
  ('10000000-0000-0000-0013-000000000001','fresh-produce',        'Fresh Produce',          '10000000-0000-0000-0000-000000000013',NULL,1,TRUE),
  ('10000000-0000-0000-0013-000000000002','dairy-eggs',           'Dairy & Eggs',           '10000000-0000-0000-0000-000000000013',NULL,2,TRUE),
  ('10000000-0000-0000-0013-000000000003','snacks-munchies',      'Snacks & Munchies',      '10000000-0000-0000-0000-000000000013',NULL,3,TRUE),
  ('10000000-0000-0000-0013-000000000004','pantry-staples',       'Pantry Staples',         '10000000-0000-0000-0000-000000000013',NULL,4,TRUE),
  ('10000000-0000-0000-0013-000000000005','frozen-food',          'Frozen Food',            '10000000-0000-0000-0000-000000000013',NULL,5,TRUE),
  ('10000000-0000-0000-0013-000000000006','organic-natural',      'Organic & Natural',      '10000000-0000-0000-0000-000000000013',NULL,6,TRUE),

-- Baby & Kids sub-categories
  ('10000000-0000-0000-0014-000000000001','baby-clothing',        'Baby Clothing',          '10000000-0000-0000-0000-000000000014',NULL,1,TRUE),
  ('10000000-0000-0000-0014-000000000002','toys-games',           'Toys & Games',           '10000000-0000-0000-0000-000000000014',NULL,2,TRUE),
  ('10000000-0000-0000-0014-000000000003','baby-care',            'Baby Care',              '10000000-0000-0000-0000-000000000014',NULL,3,TRUE),
  ('10000000-0000-0000-0014-000000000004','school-supplies',      'School Supplies',        '10000000-0000-0000-0000-000000000014',NULL,4,TRUE),
  ('10000000-0000-0000-0014-000000000005','baby-food',            'Baby Food',              '10000000-0000-0000-0000-000000000014',NULL,5,TRUE),
  ('10000000-0000-0000-0014-000000000006','baby-furniture',       'Baby Furniture',         '10000000-0000-0000-0000-000000000014',NULL,6,TRUE),

-- Pet Care sub-categories
  ('10000000-0000-0000-0015-000000000001','pet-food',             'Pet Food',               '10000000-0000-0000-0000-000000000015',NULL,1,TRUE),
  ('10000000-0000-0000-0015-000000000002','pet-accessories',      'Pet Accessories',        '10000000-0000-0000-0000-000000000015',NULL,2,TRUE),
  ('10000000-0000-0000-0015-000000000003','pet-grooming',         'Pet Grooming',           '10000000-0000-0000-0000-000000000015',NULL,3,TRUE),
  ('10000000-0000-0000-0015-000000000004','veterinary',           'Veterinary',             '10000000-0000-0000-0000-000000000015',NULL,4,TRUE),
  ('10000000-0000-0000-0015-000000000005','pet-toys',             'Pet Toys',               '10000000-0000-0000-0000-000000000015',NULL,5,TRUE),
  ('10000000-0000-0000-0015-000000000006','fish-aquarium',        'Fish & Aquarium',        '10000000-0000-0000-0000-000000000015',NULL,6,TRUE),

-- Jewellery & Accessories sub-categories
  ('10000000-0000-0000-0016-000000000001','gold-jewellery',       'Gold Jewellery',         '10000000-0000-0000-0000-000000000016',NULL,1,TRUE),
  ('10000000-0000-0000-0016-000000000002','silver-jewellery',     'Silver Jewellery',       '10000000-0000-0000-0000-000000000016',NULL,2,TRUE),
  ('10000000-0000-0000-0016-000000000003','fashion-jewellery',    'Fashion Jewellery',      '10000000-0000-0000-0000-000000000016',NULL,3,TRUE),
  ('10000000-0000-0000-0016-000000000004','watches',              'Watches',                '10000000-0000-0000-0000-000000000016',NULL,4,TRUE),
  ('10000000-0000-0000-0016-000000000005','sunglasses',           'Sunglasses',             '10000000-0000-0000-0000-000000000016',NULL,5,TRUE),
  ('10000000-0000-0000-0016-000000000006','belts-wallets',        'Belts & Wallets',        '10000000-0000-0000-0000-000000000016',NULL,6,TRUE),

-- Office & Stationery sub-categories
  ('10000000-0000-0000-0017-000000000001','office-supplies',      'Office Supplies',        '10000000-0000-0000-0000-000000000017',NULL,1,TRUE),
  ('10000000-0000-0000-0017-000000000002','printers-ink',         'Printers & Ink',         '10000000-0000-0000-0000-000000000017',NULL,2,TRUE),
  ('10000000-0000-0000-0017-000000000003','ergonomic-furniture',  'Ergonomic Furniture',    '10000000-0000-0000-0000-000000000017',NULL,3,TRUE),
  ('10000000-0000-0000-0017-000000000004','writing-tools',        'Writing Tools',          '10000000-0000-0000-0000-000000000017',NULL,4,TRUE),
  ('10000000-0000-0000-0017-000000000005','filing-storage',       'Filing & Storage',       '10000000-0000-0000-0000-000000000017',NULL,5,TRUE),
  ('10000000-0000-0000-0017-000000000006','tech-accessories',     'Tech Accessories',       '10000000-0000-0000-0000-000000000017',NULL,6,TRUE),

-- Gaming sub-categories
  ('10000000-0000-0000-0018-000000000001','video-games',          'Video Games',            '10000000-0000-0000-0000-000000000018',NULL,1,TRUE),
  ('10000000-0000-0000-0018-000000000002','gaming-laptops-pcs',   'Gaming Laptops & PCs',   '10000000-0000-0000-0000-000000000018',NULL,2,TRUE),
  ('10000000-0000-0000-0018-000000000003','controllers-headsets', 'Controllers & Headsets', '10000000-0000-0000-0000-000000000018',NULL,3,TRUE),
  ('10000000-0000-0000-0018-000000000004','game-credits',         'Game Credits & Gift Cards','10000000-0000-0000-0000-000000000018',NULL,4,TRUE),
  ('10000000-0000-0000-0018-000000000005','board-games',          'Board Games',            '10000000-0000-0000-0000-000000000018',NULL,5,TRUE),
  ('10000000-0000-0000-0018-000000000006','vr-gaming',            'VR Gaming',              '10000000-0000-0000-0000-000000000018',NULL,6,TRUE),

-- Mobile & Recharge sub-categories
  ('10000000-0000-0000-0019-000000000001','prepaid-recharge',     'Prepaid Recharge',       '10000000-0000-0000-0000-000000000019',NULL,1,TRUE),
  ('10000000-0000-0000-0019-000000000002','postpaid-bills',       'Postpaid Bills',         '10000000-0000-0000-0000-000000000019',NULL,2,TRUE),
  ('10000000-0000-0000-0019-000000000003','dth-recharge',         'DTH Recharge',           '10000000-0000-0000-0000-000000000019',NULL,3,TRUE),
  ('10000000-0000-0000-0019-000000000004','data-plans',           'Data Plans',             '10000000-0000-0000-0000-000000000019',NULL,4,TRUE),
  ('10000000-0000-0000-0019-000000000005','broadband',            'Broadband',              '10000000-0000-0000-0000-000000000019',NULL,5,TRUE),
  ('10000000-0000-0000-0019-000000000006','mobile-accessories',   'Mobile Accessories',     '10000000-0000-0000-0000-000000000019',NULL,6,TRUE),

-- Gifts & Flowers sub-categories
  ('10000000-0000-0000-0020-000000000001','gift-cards-vouchers',  'Gift Cards & Vouchers',  '10000000-0000-0000-0000-000000000020',NULL,1,TRUE),
  ('10000000-0000-0000-0020-000000000002','personalized-gifts',   'Personalized Gifts',     '10000000-0000-0000-0000-000000000020',NULL,2,TRUE),
  ('10000000-0000-0000-0020-000000000003','flowers-bouquets',     'Flowers & Bouquets',     '10000000-0000-0000-0000-000000000020',NULL,3,TRUE),
  ('10000000-0000-0000-0020-000000000004','chocolates-sweets',    'Chocolates & Sweets',    '10000000-0000-0000-0000-000000000020',NULL,4,TRUE),
  ('10000000-0000-0000-0020-000000000005','anniversary-gifts',    'Anniversary Gifts',      '10000000-0000-0000-0000-000000000020',NULL,5,TRUE),
  ('10000000-0000-0000-0020-000000000006','corporate-gifts',      'Corporate Gifts',        '10000000-0000-0000-0000-000000000020',NULL,6,TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. STORES  (40 new stores; existing 14 already seeded in V011/V012)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO store (slug, name, logo_url, description, short_description, rating, review_count,
                   primary_url, country_code, status, popularity_score,
                   brand_color, tagline, cashback_rate, is_featured)
VALUES
  ('meesho',         'Meesho',            'https://placehold.co/200x200/F43397/FFFFFF?text=M',   'India''s largest social commerce platform with millions of products at factory prices.',   'Social commerce with lowest prices',          4.2, 85000, 'https://meesho.com',         'IN','ACTIVE',88,'#F43397','Factory prices for everyone',       'Up to 5% Cash Back',  TRUE),
  ('snapdeal',       'Snapdeal',          'https://placehold.co/200x200/E40046/FFFFFF?text=SD',  'Value-focused e-commerce platform offering electronics, fashion, and home products.',      'Value shopping for everyone',                 4.0, 62000, 'https://snapdeal.com',       'IN','ACTIVE',70,'#E40046','Best value deals online',           'Up to 4% Cash Back',  FALSE),
  ('reliance-digital','Reliance Digital', 'https://placehold.co/200x200/0078D4/FFFFFF?text=RD', 'India''s largest electronics retailer with 3000+ products and expert assistance.',         'India''s largest electronics retailer',       4.3, 54000, 'https://reliancedigital.in',  'IN','ACTIVE',82,'#0078D4','Electronics at best prices',        'Up to 5% Cash Back',  TRUE),
  ('vijay-sales',    'Vijay Sales',       'https://placehold.co/200x200/E8212A/FFFFFF?text=VS',  'Trusted consumer electronics and appliances retailer with 100+ stores across India.',     'Consumer electronics & appliances',           4.4, 41000, 'https://vijaysales.com',     'IN','ACTIVE',72,'#E8212A','Trusted electronics since 1967',    'Up to 3% Cash Back',  FALSE),
  ('decathlon',      'Decathlon',         '/brands/decathlon.png',                               'World''s largest sports retailer offering equipment and clothing for 70+ sports.',         'Sports equipment for every athlete',          4.5, 93000, 'https://decathlon.in',       'IN','ACTIVE',91,'#0082C3','Sports for all, price for all',     'Up to 4% Cash Back',  TRUE),
  ('lenskart',       'Lenskart',          '/brands/lenskart.png',                                'India''s leading eyewear brand offering 5000+ styles of glasses, sunglasses, and lenses.','India''s #1 eyewear brand',                   4.3, 71000, 'https://lenskart.com',       'IN','ACTIVE',85,'#00BAF2','See the world differently',         'Up to 10% Cash Back', TRUE),
  ('mamaearth',      'Mamaearth',         'https://placehold.co/200x200/4CAF50/FFFFFF?text=ME',  'India''s fastest-growing natural beauty brand with toxin-free personal care products.',   'Natural & toxin-free beauty',                 4.4, 67000, 'https://mamaearth.in',       'IN','ACTIVE',80,'#4CAF50','Goodness inside',                   'Up to 8% Cash Back',  TRUE),
  ('wow-skin-science','WOW Skin Science', 'https://placehold.co/200x200/7B3F00/FFFFFF?text=WOW', 'Science-backed natural beauty products for skin, hair, and body care.',                    'Science meets nature in beauty',              4.3, 52000, 'https://buywow.in',          'IN','ACTIVE',74,'#7B3F00','Wow your natural beauty',           'Up to 12% Cash Back', FALSE),
  ('minimalist',     'Minimalist',        'https://placehold.co/200x200/1A1A1A/FFFFFF?text=MIN', 'Research-backed skincare with clinically proven actives at honest prices.',               'Research-backed actives skincare',            4.6, 89000, 'https://beminimalist.co',    'IN','ACTIVE',87,'#1A1A1A','High actives. Low prices.',         'Up to 9% Cash Back',  TRUE),
  ('plum-goodness',  'Plum Goodness',     'https://placehold.co/200x200/9B59B6/FFFFFF?text=PG',  '100% vegan and cruelty-free beauty and skincare products made with natural ingredients.', 'Vegan & cruelty-free beauty',                 4.3, 44000, 'https://plumgoodness.com',   'IN','ACTIVE',68,'#9B59B6','Good. Clean. Fun.',                 'Up to 10% Cash Back', FALSE),
  ('healthkart',     'HealthKart',        'https://placehold.co/200x200/FF6B35/FFFFFF?text=HK',  'India''s trusted platform for nutrition, supplements, sports, and health products.',      'Sports nutrition & supplements',              4.4, 78000, 'https://healthkart.com',     'IN','ACTIVE',83,'#FF6B35','Your fitness partner',              'Up to 6% Cash Back',  TRUE),
  ('netmeds',        'Netmeds',           'https://placehold.co/200x200/00897B/FFFFFF?text=NM',  'Online pharmacy offering genuine medicines, health products, and diagnostic services.',   'Online pharmacy you can trust',               4.2, 65000, 'https://netmeds.com',        'IN','ACTIVE',77,'#00897B','India''s trusted online pharmacy',  'Up to 15% Cash Back', FALSE),
  ('apollo-pharmacy','Apollo Pharmacy',   'https://placehold.co/200x200/E91E63/FFFFFF?text=AP',  'India''s largest pharmacy chain offering medicines, health products, and wellness items.','India''s largest pharmacy chain',             4.5, 112000,'https://apollopharmacy.in',  'IN','ACTIVE',90,'#E91E63','Be well, stay well',               'Up to 12% Cash Back', TRUE),
  ('pharmeasy',      'PharmEasy',         'https://placehold.co/200x200/5E35B1/FFFFFF?text=PE',  'Online healthcare platform delivering medicines, health products, and diagnostic tests.',  'Medicine delivery in 2 hours',                4.2, 58000, 'https://pharmeasy.in',       'IN','ACTIVE',75,'#5E35B1','Healthcare, simplified',            'Up to 14% Cash Back', FALSE),
  ('urban-company',  'Urban Company',     'https://placehold.co/200x200/F5A623/FFFFFF?text=UC',  'Home services platform for beauty, cleaning, repairs, and wellness at your doorstep.',   'Professional home services',                  4.5, 96000, 'https://urbancompany.com',   'IN','ACTIVE',89,'#F5A623','Professional services at home',     'Up to ₹300 Back',     TRUE),
  ('ola',            'Ola',               'https://placehold.co/200x200/1F8DD6/FFFFFF?text=OLA', 'India''s ride-hailing giant offering cabs, autos, bikes, and electric vehicles.',         'India''s #1 ride-hailing app',                4.1, 145000,'https://olacabs.com',        'IN','ACTIVE',92,'#1F8DD6','Chalo nikalte hain',                'Up to ₹100 Back',     TRUE),
  ('uber',           'Uber',              '/brands/uber.png',                                    'Global ride-sharing and food delivery platform operating in 80+ cities in India.',      'Rides at the tap of a button',               4.2, 132000,'https://uber.com/in',        'IN','ACTIVE',91,'#000000','Move the way you want',             'Up to ₹80 Back',      TRUE),
  ('rapido',         'Rapido',            'https://placehold.co/200x200/FFD700/000000?text=RAP', 'India''s largest bike taxi platform offering affordable two-wheeler rides across cities.', 'Affordable bike rides',                      4.0, 78000, 'https://rapido.bike',        'IN','ACTIVE',76,'#FFD700','Ride easy, ride Rapido',            'Up to ₹50 Back',      FALSE),
  ('phonepe',        'PhonePe',           '/brands/phonepe.png',                                 'India''s leading digital payments platform for UPI, bill payments, and investments.',    'India''s payments super-app',                 4.5, 189000,'https://phonepe.com',        'IN','ACTIVE',95,'#5F259F','Karo payment, ek hi jagah',        'Up to ₹150 Back',     TRUE),
  ('paytm',          'Paytm',             '/brands/paytm.png',                                   'Super-app for payments, banking, insurance, investments, and online shopping.',           'India''s payments & banking super-app',       4.3, 167000,'https://paytm.com',          'IN','ACTIVE',93,'#00BAF2','Paytm Karo',                        'Up to ₹200 Back',     TRUE),
  ('google-pay',     'Google Pay',        'https://placehold.co/200x200/4285F4/FFFFFF?text=GPY', 'Simple, secure, and fast digital payments platform powered by Google.',                   'Pay your way with Google',                   4.4, 143000,'https://pay.google.com',     'IN','ACTIVE',91,'#4285F4','A simple and helpful way to pay',  'Up to ₹100 Back',     TRUE),
  ('bookmyshow',     'BookMyShow',        '/brands/bookmyshow.png',                              'India''s largest entertainment ticketing platform for movies, events, and sports.',       'Book tickets for movies & events',           4.4, 134000,'https://bookmyshow.com',     'IN','ACTIVE',90,'#E31E24','Book your show, your way',         'Up to 8% Cash Back',  TRUE),
  ('fastrack',       'Fastrack',          'https://placehold.co/200x200/000000/FFFFFF?text=FT',  'Tata''s youth-oriented brand for watches, accessories, bags, and wearables.',            'Cool watches & accessories',                 4.3, 56000, 'https://fastrack.in',        'IN','ACTIVE',73,'#000000','Move on',                           'Up to 7% Cash Back',  FALSE),
  ('tanishq',        'Tanishq',           'https://placehold.co/200x200/B8963E/FFFFFF?text=TNQ', 'India''s most trusted jewellery brand by Tata, offering gold, diamond, and platinum.',  'India''s most trusted jewellery brand',      4.7, 87000, 'https://tanishq.co.in',      'IN','ACTIVE',85,'#B8963E','Celebrate every moment',           'Up to 2% Cash Back',  TRUE),
  ('caratlane',      'CaratLane',         'https://placehold.co/200x200/D4AF37/FFFFFF?text=CL',  'Modern jewellery brand offering certified diamonds and gold jewellery with try-at-home.', 'Try at home diamond jewellery',              4.5, 72000, 'https://caratlane.com',      'IN','ACTIVE',80,'#D4AF37','A Tata & Titan company',           'Up to 3% Cash Back',  FALSE),
  ('noise',          'Noise',             'https://placehold.co/200x200/FF4500/FFFFFF?text=NSE', 'India''s leading smartwatch and earbuds brand known for innovative audio and wearables.',  'Smartwatches & earbuds for everyone',        4.2, 63000, 'https://gonoise.com',        'IN','ACTIVE',79,'#FF4500','Colorfit your world',               'Up to 8% Cash Back',  FALSE),
  ('boat-lifestyle',  'boAt Lifestyle',   'https://placehold.co/200x200/E91E63/FFFFFF?text=BT',  'boAt''s official store for headphones, earphones, smartwatches, and speakers.',          'Premium audio for all',                      4.3, 94000, 'https://boat-lifestyle.com', 'IN','ACTIVE',83,'#E91E63','Plug into nirvana',                 'Up to 10% Cash Back', FALSE),
  ('samsung-india',  'Samsung India',     '/brands/samsung.png',                                 'Official Samsung store for smartphones, TVs, home appliances, and accessories.',         'Official Samsung Store',                     4.5, 178000,'https://samsung.com/in',     'IN','ACTIVE',92,'#1428A0','Do what you can''t',               'Up to 5% Cash Back',  TRUE),
  ('apple-india',    'Apple India',       '/brands/apple.png',                                   'Official Apple store for iPhone, MacBook, iPad, Apple Watch, and accessories.',           'Official Apple Store India',                 4.8, 156000,'https://apple.com/in',       'IN','ACTIVE',94,'#555555','Think different',                   'Up to 3% Cash Back',  TRUE),
  ('mi-india',       'Xiaomi India',      'https://placehold.co/200x200/FF6900/FFFFFF?text=MI',  'Official Xiaomi store for smartphones, accessories, smart home, and lifestyle products.', 'Honest pricing. Amazing products.',          4.3, 112000,'https://mi.com/in',          'IN','ACTIVE',85,'#FF6900','Innovation for everyone',          'Up to 6% Cash Back',  TRUE),
  ('oneplus-india',  'OnePlus India',     'https://placehold.co/200x200/EB0028/FFFFFF?text=1+',  'Official OnePlus store for flagship smartphones, TVs, audio, and accessories.',           'Official OnePlus Store',                     4.5, 98000, 'https://oneplus.in',         'IN','ACTIVE',88,'#EB0028','Never Settle',                      'Up to 6% Cash Back',  FALSE),
  ('nike-india',     'Nike India',        '/brands/nike.png',                                    'Official Nike store for sports footwear, apparel, and accessories for athletes.',        'Just Do It',                                 4.6, 143000,'https://nike.com/in',        'IN','ACTIVE',91,'#000000','Just Do It',                        'Up to 8% Cash Back',  TRUE),
  ('adidas-india',   'Adidas India',      '/brands/adidas.png',                                  'Official Adidas store for sport and lifestyle footwear, clothing, and accessories.',      'Sport & lifestyle for all',                  4.5, 127000,'https://adidas.co.in',       'IN','ACTIVE',89,'#000000','Impossible is Nothing',            'Up to 8% Cash Back',  TRUE),
  ('nykaa-fashion',  'Nykaa Fashion',     'https://placehold.co/200x200/FC2779/FFFFFF?text=NF',  'Nykaa''s fashion vertical offering Indian and international fashion brands.',             'Fashion for the bold & beautiful',           4.2, 61000, 'https://nykaafashion.com',   'IN','ACTIVE',78,'#FC2779','Fashion that speaks to you',        'Up to 11% Cash Back', FALSE),
  ('tata-cliq',      'Tata CLiQ',         'https://placehold.co/200x200/1A1A1A/FFFFFF?text=TC',  'Tata''s premium e-commerce platform for fashion, electronics, and luxury products.',     'Premium fashion & electronics',              4.3, 57000, 'https://tatacliq.com',       'IN','ACTIVE',76,'#1A1A1A','Trusted. Premium. Tata.',          'Up to 7% Cash Back',  FALSE),
  ('jiomart',        'JioMart',           'https://placehold.co/200x200/0E4DA4/FFFFFF?text=JM',  'Reliance''s online grocery and daily essentials store with delivery across India.',       'Grocery at your doorstep',                   4.1, 82000, 'https://jiomart.com',        'IN','ACTIVE',81,'#0E4DA4','Desh ki Nayi Dukan',               'Up to 5% Cash Back',  TRUE),
  ('zepto',          'Zepto',             'https://placehold.co/200x200/9C27B0/FFFFFF?text=ZPT', '10-minute grocery delivery startup operating in major Indian metros.',                   'Grocery in 10 minutes',                      4.1, 48000, 'https://zeptonow.com',       'IN','ACTIVE',77,'#9C27B0','Groceries delivered in 10 minutes','Up to ₹100 Back',     FALSE),
  ('blinkit',        'Blinkit',           'https://placehold.co/200x200/FFE000/000000?text=BLK', 'Quick-commerce platform (formerly Grofers) delivering groceries in under 15 minutes.',   'Grocery in minutes',                         4.2, 67000, 'https://blinkit.com',        'IN','ACTIVE',82,'#FFE000','Ab minutes mein',                   'Up to ₹120 Back',     TRUE),
  ('dominos-india',  'Domino''s India',   '/brands/dominos.png',                                 'World''s largest pizza company delivering fresh pizzas, sides, and beverages.',          'Hot, fresh pizzas delivered fast',           4.3, 187000,'https://dominos.co.in',      'IN','ACTIVE',88,'#E31837','Oh yes we did',                     'Up to ₹150 Back',     TRUE),
  ('mcdonalds-india','McDonald''s India', 'https://placehold.co/200x200/FFC72C/DA291C?text=MCD', 'Global fast food chain serving burgers, fries, happy meals, and McDelivery in India.',   'I''m lovin'' it',                            4.2, 165000,'https://mcdelivery.mcdonalds.com/in','IN','ACTIVE',86,'#FFC72C','I''m lovin'' it',               'Up to ₹100 Back',     FALSE)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STATS  (one per store — covers all stores including pre-seeded ones)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO stats (store_id, total_offers, coupon_codes, in_store_coupons, free_shipping_deals)
SELECT s.id,
       (s.popularity_score / 10 + 8),
       (s.popularity_score / 20 + 3),
       (s.popularity_score / 25 + 1),
       (s.popularity_score / 30 + 2)
FROM store s
WHERE s.deleted_at IS NULL
ON CONFLICT (store_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONTENT WRITERS  (one per store)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO content_writer (store_id, name, role, bio)
SELECT s.id,
       CASE (row_number() OVER (ORDER BY s.slug) % 8)
         WHEN 0 THEN 'Priya Sharma'
         WHEN 1 THEN 'Rahul Mehta'
         WHEN 2 THEN 'Anjali Singh'
         WHEN 3 THEN 'Vikram Nair'
         WHEN 4 THEN 'Neha Gupta'
         WHEN 5 THEN 'Arjun Patel'
         WHEN 6 THEN 'Sneha Reddy'
         ELSE       'Karan Malhotra'
       END,
       'Deals & Savings Editor',
       'Our savings expert has spent years tracking the best deals, coupon codes, and cashback offers at ' || s.name || '. Updated daily so you never miss a saving.'
FROM store s
WHERE s.deleted_at IS NULL
ON CONFLICT (store_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. STORE TOP OFFERS  (3 per store)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO store_top_offer (store_id, position, text)
SELECT s.id, 1, 'Up to ' || (s.popularity_score / 10 + 10) || '% off sitewide with coupon codes'
FROM store s WHERE s.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO store_top_offer (store_id, position, text)
SELECT s.id, 2, 'Free delivery on orders above ₹' || (499 + (s.popularity_score % 5) * 100)
FROM store s WHERE s.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO store_top_offer (store_id, position, text)
SELECT s.id, 3, 'Extra ' || (5 + s.popularity_score % 8) || '% cashback via CouponValley'
FROM store s WHERE s.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FAQs  (4 per store)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO faq (store_id, position, question, answer)
SELECT s.id, 1,
       'How do I use a ' || s.name || ' coupon code?',
       'Copy the coupon code from CouponValley and paste it in the promo/discount field at ' || s.name || ' checkout. The discount is applied instantly before payment.'
FROM store s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM faq f WHERE f.store_id = s.id AND f.position = 1);

INSERT INTO faq (store_id, position, question, answer)
SELECT s.id, 2,
       'Does ' || s.name || ' offer free delivery?',
       'Yes! ' || s.name || ' offers free delivery on orders above a minimum value. Check the current free shipping coupon on CouponValley for the latest threshold.'
FROM store s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM faq f WHERE f.store_id = s.id AND f.position = 2);

INSERT INTO faq (store_id, position, question, answer)
SELECT s.id, 3,
       'What is the return policy at ' || s.name || '?',
       s.name || ' offers a standard 7–30 day return policy depending on the product category. Check the product page for category-specific return windows.'
FROM store s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM faq f WHERE f.store_id = s.id AND f.position = 3);

INSERT INTO faq (store_id, position, question, answer)
SELECT s.id, 4,
       'Are ' || s.name || ' coupons verified on CouponValley?',
       'Yes, our team verifies all ' || s.name || ' coupons daily. Verified coupons are marked with a tick and guaranteed to work at the time of publishing.'
FROM store s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM faq f WHERE f.store_id = s.id AND f.position = 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. STORE ↔ CATEGORY links
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO store_category (store_id, category_id)
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'amazon-india'     AND c.slug IN ('fashion','electronics','groceries','home-living','baby-kids')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'flipkart'         AND c.slug IN ('fashion','electronics','mobiles-tablets','home-living')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'myntra'           AND c.slug IN ('fashion','mens-clothing','womens-clothing','footwear','bags-luggage')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'nykaa'            AND c.slug IN ('beauty-personal-care','skincare','haircare','makeup-cosmetics','fragrances')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'zomato'           AND c.slug IN ('food-dining','food-delivery','restaurants')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'swiggy'           AND c.slug IN ('food-dining','food-delivery','groceries')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'makemytrip'       AND c.slug IN ('travel','flights','hotels','holiday-packages')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'bigbasket'        AND c.slug IN ('groceries','fresh-produce','dairy-eggs','pantry-staples')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'ajio'             AND c.slug IN ('fashion','mens-clothing','womens-clothing','footwear','ethnic-wear')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'croma'            AND c.slug IN ('electronics','mobiles-tablets','tv-audio','laptops-computers')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'tata-1mg'         AND c.slug IN ('health-wellness','pharmacy-medicines','diagnostics-labs')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'boat'             AND c.slug IN ('electronics','wearables','tech-accessories')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'puma-india'       AND c.slug IN ('sports-fitness','footwear','sportswear')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'cleartrip'        AND c.slug IN ('travel','flights','hotels','bus-tickets')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'meesho'           AND c.slug IN ('fashion','home-living','jewellery-accessories')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'reliance-digital' AND c.slug IN ('electronics','mobiles-tablets','tv-audio','smart-home')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'decathlon'        AND c.slug IN ('sports-fitness','gym-equipment','sportswear','cycling','outdoor-sports')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'lenskart'         AND c.slug IN ('health-wellness','sunglasses','jewellery-accessories')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'mamaearth'        AND c.slug IN ('beauty-personal-care','skincare','haircare','baby-care')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'minimalist'       AND c.slug IN ('beauty-personal-care','skincare')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'healthkart'       AND c.slug IN ('health-wellness','fitness-nutrition','sports-fitness')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'netmeds'          AND c.slug IN ('health-wellness','pharmacy-medicines')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'apollo-pharmacy'  AND c.slug IN ('health-wellness','pharmacy-medicines','diagnostics-labs')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'pharmeasy'        AND c.slug IN ('health-wellness','pharmacy-medicines')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'urban-company'    AND c.slug IN ('beauty-personal-care','home-living','health-wellness')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'ola'              AND c.slug IN ('travel','cab-rental')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'uber'             AND c.slug IN ('travel','cab-rental','food-delivery')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'phonepe'          AND c.slug IN ('financial-services','digital-payments','mobile-recharge')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'paytm'            AND c.slug IN ('financial-services','digital-payments','mobile-recharge','ott-streaming')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'bookmyshow'       AND c.slug IN ('entertainment','movie-tickets','live-events')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'tanishq'          AND c.slug IN ('jewellery-accessories','gold-jewellery')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'caratlane'        AND c.slug IN ('jewellery-accessories','gold-jewellery','fashion-jewellery')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'samsung-india'    AND c.slug IN ('electronics','mobiles-tablets','tv-audio','wearables','smart-home')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'apple-india'      AND c.slug IN ('electronics','mobiles-tablets','laptops-computers','wearables')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'mi-india'         AND c.slug IN ('electronics','mobiles-tablets','smart-home','wearables')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'nike-india'       AND c.slug IN ('sports-fitness','footwear','sportswear')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'adidas-india'     AND c.slug IN ('sports-fitness','footwear','sportswear')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'jiomart'          AND c.slug IN ('groceries','fresh-produce','pantry-staples','baby-food')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'blinkit'          AND c.slug IN ('groceries','fresh-produce','dairy-eggs')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'zepto'            AND c.slug IN ('groceries','fresh-produce','snacks-munchies')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'dominos-india'    AND c.slug IN ('food-dining','food-delivery')
UNION ALL
SELECT s.id, c.id FROM store s, category c
WHERE s.slug = 'mcdonalds-india'  AND c.slug IN ('food-dining','food-delivery')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. AFFILIATE NETWORKS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO affiliate_network (id, code, name, active, config_json) VALUES
  ('20000000-0000-0000-0000-000000000001','ADMITAD', 'Admitad',          TRUE, '{"baseUrl":"https://ad.admitad.com"}'),
  ('20000000-0000-0000-0000-000000000002','AWIN',    'Awin',             TRUE, '{"baseUrl":"https://www.awin1.com"}'),
  ('20000000-0000-0000-0000-000000000003','CJ',      'Commission Junction',TRUE,'{"baseUrl":"https://www.anrdoezrs.net"}'),
  ('20000000-0000-0000-0000-000000000004','IMPACT',  'Impact',           TRUE, '{"baseUrl":"https://goto.target.com"}'),
  ('20000000-0000-0000-0000-000000000005','VCOMMISSION','vCommission',   TRUE, '{"baseUrl":"https://track.vcommission.com"}')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. MERCHANT NETWORK LINKS  (one per store, rotating through networks)
-- ─────────────────────────────────────────────────────────────────────────────

WITH ranked_stores AS (
  SELECT id, slug,
         (row_number() OVER (ORDER BY slug) - 1) AS rn
  FROM store WHERE deleted_at IS NULL
),
ranked_networks AS (
  SELECT id,
         (row_number() OVER (ORDER BY code) - 1) AS rn
  FROM affiliate_network WHERE active = TRUE
),
net_count AS (
  SELECT count(*)::int AS cnt FROM affiliate_network WHERE active = TRUE
)
INSERT INTO merchant_network_link (store_id, network_id, advertiser_id, deeplink_template, priority, active)
SELECT
  rs.id,
  rn.id,
  'ADV-' || upper(substr(rs.slug, 1, 6)) || '-' || (1000 + rs.rn + 1)::text,
  'https://track.couponvalley.in/r?store=' || rs.slug || '&sub_id={click_id}&url={url}',
  1,
  TRUE
FROM ranked_stores rs
JOIN ranked_networks rn ON rn.rn = rs.rn % (SELECT cnt FROM net_count)
ON CONFLICT (store_id, network_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. COUPONS  (~12 per store = 600+ total)
-- Uses a cross-join of stores × coupon templates, generating unique slugs.
-- ─────────────────────────────────────────────────────────────────────────────

WITH templates(n, type, title_tpl, desc_tpl, code_suffix, savings, score_base) AS (
  VALUES
    (1,  'CODE',         '% Off Sitewide',                      'Apply code at checkout to save % on your entire order. Valid on all products.',              'SAVE',    '% off',        85),
    (2,  'DEAL',         'Flash Sale — Up to % Off',             'Limited time flash sale. Shop now for the best prices on top products.',                     NULL,      '% off',        78),
    (3,  'FREE_SHIPPING','Free Delivery on All Orders',          'Get free standard delivery on all orders with no minimum spend required.',                    NULL,      'Free shipping',70),
    (4,  'CODE',         'Extra % Off on App',                   'Download the app and use this code to get extra % off on your first app order.',             'APP',     '% off',        72),
    (5,  'DEAL',         'Buy 2 Get 1 Free',                     'Add 3 items to your cart and the cheapest one is on us. No code needed.',                    NULL,      'Buy 2 get 1',  65),
    (6,  'CODE',         'Flat ₹200 Off on ₹999+',               'Save flat ₹200 on orders above ₹999. Applies on full-price items.',                         'FLAT200', 'Flat ₹200 off',80),
    (7,  'CODE',         'New User Special — % Off',             'New customers get an exclusive % discount on their first order. One-time use only.',         'NEW',     '% off',        90),
    (8,  'DEAL',         'Weekend Special — % Off',              'Exclusive weekend sale. Valid Saturday and Sunday only. No coupon needed.',                   NULL,      '% off',        73),
    (9,  'CODE',         'Flat ₹500 Off on ₹2499+',             'Get ₹500 off on orders of ₹2499 or more. Stack with bank offers for extra savings.',         'FLAT500', 'Flat ₹500 off',75),
    (10, 'FREE_SHIPPING','Free Express Delivery',                'Upgrade to express delivery for free on orders above ₹799.',                                  NULL,      'Free express', 68),
    (11, 'CODE',         'Student Discount — % Off',             'Verified students get % off sitewide. Use your college email to verify instantly.',          'STUDENT', '% off',        71),
    (12, 'DEAL',         'Clearance Sale — Up to % Off',         'Shop the clearance section for up to % off on hundreds of products. While stocks last.',    NULL,      '% off',        66)
),
store_coupon_data AS (
  SELECT
    s.id                                                                AS store_id,
    s.slug                                                              AS store_slug,
    t.n,
    t.type,
    replace(t.title_tpl, '%', (10 + t.n * 5)::text || '%')            AS title,
    replace(t.desc_tpl,  '%', (10 + t.n * 5)::text || '%')            AS description,
    replace(t.savings,   '%', (10 + t.n * 5)::text || '%')            AS savings_label,
    CASE WHEN t.code_suffix IS NOT NULL
         THEN upper(substr(replace(s.slug,'-',''), 1, 4)) || t.code_suffix || (t.n * 7 + 13)::text
         ELSE NULL
    END                                                                 AS code,
    t.score_base + (s.popularity_score / 10)                           AS popularity_score
  FROM store s
  CROSS JOIN templates t
  WHERE s.deleted_at IS NULL
)
INSERT INTO coupon (id, slug, store_id, type, code, title, description, savings_label,
                    status, verified, exclusive, used_count, popularity_score,
                    expires_at)
SELECT
  gen_random_uuid(),
  d.store_slug || '-' || lower(replace(d.type, '_', '-')) || '-' || d.n,
  d.store_id,
  d.type,
  d.code,
  d.title,
  d.description,
  d.savings_label,
  'ACTIVE',
  (d.n % 3 = 0),        -- every 3rd coupon is verified
  (d.n % 7 = 0),        -- every 7th is exclusive
  (d.n * 13 + d.popularity_score * 3),
  d.popularity_score,
  CASE WHEN d.n % 4 = 0 THEN now() + INTERVAL '30 days'
       WHEN d.n % 4 = 1 THEN now() + INTERVAL '60 days'
       WHEN d.n % 4 = 2 THEN now() + INTERVAL '90 days'
       ELSE                   NULL   -- no expiry
  END
FROM store_coupon_data d
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. COUPON ↔ CATEGORY links  (2-3 categories per coupon via store categories)
-- ─────────────────────────────────────────────────────────────────────────────

-- Link each coupon to the categories of its store
INSERT INTO coupon_category (coupon_id, category_id)
SELECT DISTINCT c.id, sc.category_id
FROM coupon c
JOIN store_category sc ON sc.store_id = c.store_id
WHERE c.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. AUTHORS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO author (id, slug, name, bio, avatar_url) VALUES
  ('30000000-0000-0000-0000-000000000001','priya-sharma',   'Priya Sharma',   'Senior deals editor with 8+ years of experience tracking online offers and cashback opportunities across Indian e-commerce.', '/authors/priya-sharma.svg'),
  ('30000000-0000-0000-0000-000000000002','rahul-mehta',    'Rahul Mehta',    'Tech deals specialist covering smartphones, laptops, and electronics. Former product reviewer at leading tech publications.', '/authors/rahul-mehta.svg'),
  ('30000000-0000-0000-0000-000000000003','anjali-singh',   'Anjali Singh',   'Fashion and beauty expert who helps readers find the best style deals and beauty offers across top Indian brands.', '/authors/anjali-singh.svg'),
  ('30000000-0000-0000-0000-000000000004','vikram-nair',    'Vikram Nair',    'Travel hacks writer specialising in flight deals, hotel discounts, and budget travel tips for Indian explorers.', '/authors/vikram-nair.svg')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. BLOG ARTICLES
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO article (slug, title, excerpt, body_md, author_id, status, published_at,
                     meta_title, meta_description)
VALUES
  ('how-to-use-coupon-codes-india',
   'How to Use Coupon Codes in India: Complete Guide 2025',
   'Learn the step-by-step process of finding, copying, and applying coupon codes at India''s top online stores to save money on every purchase.',
   '## Introduction\n\nSaving money online has never been easier. With CouponValley, you can find verified coupon codes for over 500 Indian stores and apply them at checkout for instant discounts.\n\n## Step 1: Find Your Coupon\n\nBrowse our store listings or search for a specific brand. Click "Get Code" to reveal the coupon code.\n\n## Step 2: Copy and Shop\n\nCopy the code to your clipboard, then click through to the store. Add items to your cart as usual.\n\n## Step 3: Apply at Checkout\n\nLook for the "Promo Code", "Discount Code", or "Coupon Code" field at checkout. Paste your code and click Apply.\n\n## Pro Tips\n\n- Stack bank offers with coupon codes for double savings\n- Check expiry dates before applying\n- Some codes are single-use only\n- App-exclusive codes require the store''s mobile app',
   '30000000-0000-0000-0000-000000000001',
   'PUBLISHED', now() - INTERVAL '5 days',
   'How to Use Coupon Codes in India 2025',
   'Step-by-step guide to finding and using coupon codes at India''s top online stores to save money on every purchase.'),

  ('best-amazon-india-coupons-2025',
   'Best Amazon India Coupons & Deals This Month',
   'Discover the top Amazon India coupon codes, deals, and cashback offers available right now. Updated daily by our deals team.',
   '## Amazon India Deals This Month\n\nAmazon India is one of the most popular shopping destinations in India, and with the right coupon codes, you can save significantly on every purchase.\n\n## Top Categories for Deals\n\n### Electronics\nAmazon regularly offers 10-30% off on smartphones, laptops, and accessories during sale events.\n\n### Fashion\nFashion discounts of up to 50% are common, especially during end-of-season sales.\n\n### Groceries\nAmazon Fresh offers weekly deals on fruits, vegetables, and pantry staples.\n\n## How to Find the Best Amazon Deals\n\n1. Bookmark CouponValley''s Amazon page\n2. Enable deal alerts\n3. Check back daily — new coupons added every day\n4. Stack with HDFC/SBI credit card offers\n\n## Amazon Great Indian Sale\n\nThe annual Great Indian Sale is Amazon''s biggest event, with deals across all categories starting from ₹1.',
   '30000000-0000-0000-0000-000000000001',
   'PUBLISHED', now() - INTERVAL '3 days',
   'Best Amazon India Coupon Codes & Deals 2025',
   'Find verified Amazon India coupon codes, sale dates, and cashback offers. Updated daily.'),

  ('top-10-grocery-delivery-apps-india',
   'Top 10 Grocery Delivery Apps in India 2025 (With Coupons)',
   'A complete comparison of India''s best online grocery delivery apps — Blinkit, Zepto, BigBasket, JioMart, and more — with the latest coupon codes.',
   '## The Best Grocery Delivery Apps in India\n\nOnline grocery shopping has exploded in India, with multiple apps competing to deliver your essentials in under 30 minutes.\n\n## 1. Blinkit (15-minute delivery)\n\nFormerly Grofers, Blinkit is now India''s fastest grocery delivery service operating in 30+ cities.\n\n**Best for:** Last-minute grocery needs\n**Average delivery time:** 10-15 minutes\n\n## 2. Zepto (10-minute delivery)\n\nZepto pioneered the 10-minute delivery model in India and operates dark stores across major metros.\n\n**Best for:** Speed-first shoppers\n\n## 3. BigBasket\n\nIndia''s largest online supermarket with the widest SKU range and reliable scheduled delivery slots.\n\n**Best for:** Weekly grocery shopping\n\n## 4. JioMart\n\nReliance''s grocery platform with competitive prices and integration with WhatsApp ordering.\n\n## How to Save on Grocery Apps\n\n- Use first-order coupons for maximum savings\n- Subscribe to membership plans for consistent discounts\n- Check CouponValley before every order',
   '30000000-0000-0000-0000-000000000001',
   'PUBLISHED', now() - INTERVAL '7 days',
   'Top 10 Grocery Delivery Apps in India 2025',
   'Compare India''s best grocery delivery apps with coupon codes for Blinkit, Zepto, BigBasket, JioMart, and more.'),

  ('best-flight-booking-deals-india',
   'How to Get Cheap Flights in India: Booking Tips & Coupon Codes',
   'Expert tips for finding the cheapest domestic and international flights from India, plus the latest MakeMyTrip, Cleartrip, and Indigo coupon codes.',
   '## How to Book Cheap Flights in India\n\nFlight prices fluctuate constantly. With the right strategy and coupon codes, you can save thousands on every booking.\n\n## Best Time to Book Domestic Flights\n\nBook 6-8 weeks in advance for domestic routes. Last-minute bookings are almost always more expensive.\n\n## Top Flight Booking Platforms\n\n### MakeMyTrip\nIndia''s most popular travel platform with the widest selection of flights and hotel combos.\n\n### Cleartrip\nKnown for transparent pricing with no hidden fees. Best for straightforward flight searches.\n\n### IRCTC Air\nBook flights through IRCTC for exclusive railway-integration deals.\n\n## Money-Saving Tips\n\n1. Use incognito mode while searching (prices may vary with cookies)\n2. Set price alerts 60 days before your travel date\n3. Compare prices across all platforms\n4. Use CouponValley codes at checkout for extra discounts\n5. Stack credit card travel benefits with coupon codes',
   '30000000-0000-0000-0000-000000000004',
   'PUBLISHED', now() - INTERVAL '10 days',
   'Cheap Flight Booking Tips India 2025 — Coupon Codes Included',
   'Save on domestic and international flights from India with these booking tips and verified coupon codes.'),

  ('skincare-deals-india-2025',
   'Best Skincare Deals in India 2025 — Minimalist, Mamaearth & More',
   'Shop the best skincare deals from India''s top D2C brands — Minimalist, Mamaearth, Plum, WOW, and Nykaa. With verified coupon codes.',
   '## India''s Skincare Revolution\n\nIndian skincare has transformed dramatically. D2C brands now offer dermatologist-formulated products at a fraction of international brand prices.\n\n## Top Skincare Brands & Deals\n\n### Minimalist\nScience-backed serums with high-concentration actives. Known for transparent ingredient labelling.\n**Best sellers:** Vitamin C 10%, Niacinamide 10%, Retinol 0.3%\n\n### Mamaearth\nToxin-free natural beauty brand. Great for sensitive skin and beginners.\n**Best sellers:** Vitamin C Face Wash, Onion Hair Oil\n\n### Plum\n100% vegan formulations with botanical ingredients.\n\n### WOW Skin Science\nApple Cider Vinegar range is their hero product line.\n\n## When to Buy\n\n- Nykaa sale events: Biggest discounts 4x per year\n- Brand anniversary sales: 30-50% off site-wide\n- Daily CouponValley exclusive codes: 5-15% additional',
   '30000000-0000-0000-0000-000000000003',
   'PUBLISHED', now() - INTERVAL '2 days',
   'Best Skincare Deals India 2025 — Minimalist, Mamaearth, Plum',
   'Find the best skincare deals from India''s top D2C brands with verified coupon codes updated daily.'),

  ('electronics-buying-guide-india',
   'Electronics Buying Guide India 2025: When to Buy & Best Deals',
   'The complete guide to buying electronics in India — the best time to shop, which platforms to use, and how to find the biggest discounts on phones, laptops, and TVs.',
   '## When Is the Best Time to Buy Electronics in India?\n\n### Diwali Sale Season (Oct–Nov)\nThe biggest discounts of the year. Amazon Great Indian Festival and Flipkart Big Billion Days run simultaneously.\n\n### Republic Day Sales (January)\nGreat for laptops and TVs. Discounts of 20-40% are common.\n\n### Independence Day Sales (August)\nMid-year refresh with solid deals on smartphones.\n\n## Best Platforms by Category\n\n| Category | Best Platform |\n|---|---|\n| Smartphones | Amazon, Flipkart |\n| Laptops | Croma, Reliance Digital |\n| TVs | Vijay Sales, Croma |\n| Audio | boAt website, Amazon |\n\n## Pro Tips\n\n1. Never buy at full price — electronics go on sale every 2-3 weeks\n2. Check CouponValley for launch-day exclusive codes\n3. Compare across 3+ platforms before buying\n4. EMI with zero cost via bank credit cards saves additional interest',
   '30000000-0000-0000-0000-000000000002',
   'PUBLISHED', now() - INTERVAL '14 days',
   'Electronics Buying Guide India 2025 — Best Time to Buy',
   'When to buy electronics in India and how to get the best deals on phones, laptops, and TVs with coupon codes.'),

  ('how-cashback-works-couponvalley',
   'How Cashback Works on CouponValley — Complete Guide',
   'Everything you need to know about earning cashback on CouponValley. How it''s tracked, when it''s credited, and how to maximize your earnings.',
   '## What Is Cashback?\n\nCashback is real money returned to you after a qualifying purchase. When you click through CouponValley to a partner store and complete a purchase, we earn a commission — and share a portion of it with you as cashback.\n\n## How It Works\n\n1. **Find a store** on CouponValley with a cashback rate\n2. **Click through** — our tracking link records your session\n3. **Shop and pay** on the partner store as normal\n4. **Cashback is tracked** — usually confirmed within 24–48 hours\n5. **Cash is credited** — to your CouponValley wallet after validation\n\n## How to Maximize Cashback\n\n- Always click through CouponValley just before checkout\n- Disable VPN and ad-blockers (they interfere with tracking)\n- Don''t open the store in a new tab manually — use our link\n- Stack cashback with coupon codes for double savings\n\n## When Is Cashback Credited?\n\nMost stores validate cashback within 30–90 days after the order is confirmed and the return window closes.',
   '30000000-0000-0000-0000-000000000001',
   'PUBLISHED', now() - INTERVAL '20 days',
   'How Cashback Works on CouponValley — Full Guide 2025',
   'Learn how cashback is tracked, when it''s credited, and how to maximize your earnings on CouponValley.')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. ADDITIONAL BANNERS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO banner (position, title, subtitle, image_url, link_url, active, country_code, placement, starts_at, ends_at)
SELECT v.position::SMALLINT, v.title, v.subtitle, v.image_url, v.link_url,
       TRUE, 'IN', 'HERO_CAROUSEL', now() - INTERVAL '1 day', now() + INTERVAL '60 days'
FROM (VALUES
  (1, 'Big Billion Days Are Back',          'Up to 80% off across all categories',                 '/banners/flash-sale.jpg',  '/stores/flipkart'),
  (2, 'Great Indian Festival',              'Millions of deals — Amazon''s biggest sale',          '/banners/flash-sale.jpg',  '/stores/amazon-india'),
  (3, 'Nykaa Pink Sale',                    'Up to 50% off on beauty & skincare',                  '/banners/fashion.jpg',     '/stores/nykaa'),
  (4, 'Myntra End of Reason Sale',          'Fashion at lowest prices of the season',              '/banners/fashion.jpg',     '/stores/myntra'),
  (5, 'Decathlon Sport Fiesta',             'Sports gear for every athlete — big discounts',       '/banners/flash-sale.jpg',  '/stores/decathlon'),
  (6, 'MakeMyTrip Holiday Bonanza',         'Flights + Hotels at unbeatable prices',               '/banners/travel.jpg',      '/stores/makemytrip'),
  (7, 'PhonePe Diwali Cashback',            'Earn up to ₹500 cashback on every payment',          '/banners/flash-sale.jpg',  '/stores/phonepe'),
  (8, 'Samsung Galaxy Days',                'Up to ₹15,000 off on Galaxy phones',                 '/banners/electronics.jpg', '/stores/samsung-india')
) AS v(position, title, subtitle, image_url, link_url)
WHERE NOT EXISTS (
  SELECT 1 FROM banner WHERE placement = 'HERO_CAROUSEL' AND title = v.title
)
ON CONFLICT DO NOTHING;
