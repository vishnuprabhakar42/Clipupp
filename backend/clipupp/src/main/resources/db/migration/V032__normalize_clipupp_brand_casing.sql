-- V032__normalize_clipupp_brand_casing.sql
-- Rebrand pass: ClipUpp (mid-cap) → Clipupp in all seeded content.
-- Prior versioned migrations + R__seed_dev_data inserted "ClipUpp"; this
-- normalizes existing rows to the canonical "Clipupp" spelling.

UPDATE article         SET title = REPLACE(title, 'ClipUpp', 'Clipupp')                  WHERE title LIKE '%ClipUpp%';
UPDATE article         SET excerpt = REPLACE(excerpt, 'ClipUpp', 'Clipupp')              WHERE excerpt LIKE '%ClipUpp%';
UPDATE article         SET body_md = REPLACE(body_md, 'ClipUpp', 'Clipupp')              WHERE body_md LIKE '%ClipUpp%';
UPDATE article         SET meta_title = REPLACE(meta_title, 'ClipUpp', 'Clipupp')        WHERE meta_title LIKE '%ClipUpp%';
UPDATE article         SET meta_description = REPLACE(meta_description, 'ClipUpp', 'Clipupp') WHERE meta_description LIKE '%ClipUpp%';

UPDATE banner          SET title = REPLACE(title, 'ClipUpp', 'Clipupp')                  WHERE title LIKE '%ClipUpp%';
UPDATE banner          SET subtitle = REPLACE(subtitle, 'ClipUpp', 'Clipupp')            WHERE subtitle LIKE '%ClipUpp%';

UPDATE campaign        SET name = REPLACE(name, 'ClipUpp', 'Clipupp')                    WHERE name LIKE '%ClipUpp%';
UPDATE campaign        SET description = REPLACE(description, 'ClipUpp', 'Clipupp')      WHERE description LIKE '%ClipUpp%';
UPDATE campaign        SET hero_title = REPLACE(hero_title, 'ClipUpp', 'Clipupp')        WHERE hero_title LIKE '%ClipUpp%';
UPDATE campaign        SET hero_subtitle = REPLACE(hero_subtitle, 'ClipUpp', 'Clipupp')  WHERE hero_subtitle LIKE '%ClipUpp%';

UPDATE category        SET title = REPLACE(title, 'ClipUpp', 'Clipupp')                  WHERE title LIKE '%ClipUpp%';
UPDATE category        SET description = REPLACE(description, 'ClipUpp', 'Clipupp')      WHERE description LIKE '%ClipUpp%';
UPDATE category        SET meta_title = REPLACE(meta_title, 'ClipUpp', 'Clipupp')        WHERE meta_title LIKE '%ClipUpp%';
UPDATE category        SET meta_description = REPLACE(meta_description, 'ClipUpp', 'Clipupp') WHERE meta_description LIKE '%ClipUpp%';

UPDATE coupon          SET title = REPLACE(title, 'ClipUpp', 'Clipupp')                  WHERE title LIKE '%ClipUpp%';
UPDATE coupon          SET description = REPLACE(description, 'ClipUpp', 'Clipupp')      WHERE description LIKE '%ClipUpp%';
UPDATE coupon          SET terms = REPLACE(terms, 'ClipUpp', 'Clipupp')                  WHERE terms LIKE '%ClipUpp%';
UPDATE coupon          SET savings_label = REPLACE(savings_label, 'ClipUpp', 'Clipupp')  WHERE savings_label LIKE '%ClipUpp%';
UPDATE coupon          SET meta_title = REPLACE(meta_title, 'ClipUpp', 'Clipupp')        WHERE meta_title LIKE '%ClipUpp%';
UPDATE coupon          SET meta_description = REPLACE(meta_description, 'ClipUpp', 'Clipupp') WHERE meta_description LIKE '%ClipUpp%';

UPDATE faq             SET question = REPLACE(question, 'ClipUpp', 'Clipupp')            WHERE question LIKE '%ClipUpp%';
UPDATE faq             SET answer = REPLACE(answer, 'ClipUpp', 'Clipupp')                WHERE answer LIKE '%ClipUpp%';

UPDATE featured_article SET title = REPLACE(title, 'ClipUpp', 'Clipupp')                 WHERE title LIKE '%ClipUpp%';
UPDATE featured_article SET description = REPLACE(description, 'ClipUpp', 'Clipupp')     WHERE description LIKE '%ClipUpp%';

UPDATE homepage_section SET title = REPLACE(title, 'ClipUpp', 'Clipupp')                 WHERE title LIKE '%ClipUpp%';
UPDATE homepage_section SET subtitle = REPLACE(subtitle, 'ClipUpp', 'Clipupp')           WHERE subtitle LIKE '%ClipUpp%';
UPDATE homepage_section SET config = REPLACE(config::text, 'ClipUpp', 'Clipupp')::jsonb  WHERE config::text LIKE '%ClipUpp%';

UPDATE legal_page      SET title = REPLACE(title, 'ClipUpp', 'Clipupp')                  WHERE title LIKE '%ClipUpp%';
UPDATE legal_page      SET body_md = REPLACE(body_md, 'ClipUpp', 'Clipupp')              WHERE body_md LIKE '%ClipUpp%';
UPDATE legal_page      SET meta_title = REPLACE(meta_title, 'ClipUpp', 'Clipupp')        WHERE meta_title LIKE '%ClipUpp%';
UPDATE legal_page      SET meta_description = REPLACE(meta_description, 'ClipUpp', 'Clipupp') WHERE meta_description LIKE '%ClipUpp%';

UPDATE site_setting    SET value = REPLACE(value::text, 'ClipUpp', 'Clipupp')::jsonb     WHERE value::text LIKE '%ClipUpp%';

UPDATE store           SET name = REPLACE(name, 'ClipUpp', 'Clipupp')                    WHERE name LIKE '%ClipUpp%';
UPDATE store           SET description = REPLACE(description, 'ClipUpp', 'Clipupp')      WHERE description LIKE '%ClipUpp%';
UPDATE store           SET short_description = REPLACE(short_description, 'ClipUpp', 'Clipupp') WHERE short_description LIKE '%ClipUpp%';
UPDATE store           SET tagline = REPLACE(tagline, 'ClipUpp', 'Clipupp')              WHERE tagline LIKE '%ClipUpp%';
UPDATE store           SET cashback_rate = REPLACE(cashback_rate, 'ClipUpp', 'Clipupp')  WHERE cashback_rate LIKE '%ClipUpp%';
UPDATE store           SET meta_title = REPLACE(meta_title, 'ClipUpp', 'Clipupp')        WHERE meta_title LIKE '%ClipUpp%';
UPDATE store           SET meta_description = REPLACE(meta_description, 'ClipUpp', 'Clipupp') WHERE meta_description LIKE '%ClipUpp%';

UPDATE store_top_offer SET text = REPLACE(text, 'ClipUpp', 'Clipupp')                    WHERE text LIKE '%ClipUpp%';
