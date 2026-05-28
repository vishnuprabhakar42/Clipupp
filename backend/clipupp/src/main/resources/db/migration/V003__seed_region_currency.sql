-- V003: ISO reference data for region (3166-1 alpha-2) and currency (4217).
-- Seeded with Phase 1 markets only — extend by INSERTing more rows in a
-- repeatable migration (R__seed_*.sql) rather than re-running V003.

CREATE TABLE currency (
    code            CHAR(3) PRIMARY KEY,
    name            TEXT NOT NULL,
    symbol          VARCHAR(8) NOT NULL,
    fraction_digits SMALLINT NOT NULL DEFAULT 2
);

CREATE TABLE region (
    code           CHAR(2) PRIMARY KEY,
    name           TEXT NOT NULL,
    currency_code  CHAR(3) NOT NULL REFERENCES currency(code),
    active         BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO currency (code, name, symbol, fraction_digits) VALUES
    ('INR', 'Indian Rupee',    '₹', 2),
    ('USD', 'US Dollar',       '$', 2),
    ('GBP', 'Pound Sterling',  '£', 2),
    ('EUR', 'Euro',            '€', 2),
    ('AED', 'UAE Dirham',      'د.إ', 2),
    ('SGD', 'Singapore Dollar','S$', 2);

INSERT INTO region (code, name, currency_code, active) VALUES
    ('IN', 'India',          'INR', TRUE),
    ('US', 'United States',  'USD', TRUE),
    ('GB', 'United Kingdom', 'GBP', TRUE),
    ('AE', 'United Arab Emirates', 'AED', TRUE),
    ('DE', 'Germany',        'EUR', TRUE),
    ('FR', 'France',          'EUR', TRUE),
    ('SG', 'Singapore',       'SGD', TRUE);

-- fx_rate is seeded but unused until Phase 2 (cashback wallet).
CREATE TABLE fx_rate (
    snapshot_date DATE NOT NULL,
    base          CHAR(3) NOT NULL REFERENCES currency(code),
    quote         CHAR(3) NOT NULL REFERENCES currency(code),
    rate          NUMERIC(19,8) NOT NULL,
    PRIMARY KEY (snapshot_date, base, quote)
);
