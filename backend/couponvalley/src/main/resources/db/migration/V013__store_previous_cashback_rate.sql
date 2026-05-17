-- V013: Previous cashback rate (used for the "was 2%" social-proof line on
--       homepage cards — shows that the current rate is higher than before).
ALTER TABLE store ADD COLUMN previous_cashback_rate VARCHAR(40);

-- Backfill — most stores show a small previous rate to imply growth.
UPDATE store SET previous_cashback_rate = '2%' WHERE slug = 'amazon-india' AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '2%' WHERE slug = 'flipkart'     AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '3%' WHERE slug = 'myntra'       AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '2%' WHERE slug = 'nykaa'        AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '1%' WHERE slug = 'zomato'       AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '1%' WHERE slug = 'swiggy'       AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '2%' WHERE slug = 'makemytrip'   AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '1%' WHERE slug = 'bigbasket'    AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '2%' WHERE slug = 'ajio'         AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '1%' WHERE slug = 'croma'        AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '3%' WHERE slug = 'tata-1mg'     AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '2%' WHERE slug = 'boat'         AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '2%' WHERE slug = 'puma-india'   AND previous_cashback_rate IS NULL;
UPDATE store SET previous_cashback_rate = '1%' WHERE slug = 'cleartrip'    AND previous_cashback_rate IS NULL;
