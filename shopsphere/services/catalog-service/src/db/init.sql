-- =========================
-- CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- =========================
-- PRODUCTS (with description)
-- =========================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand TEXT NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- If products table already existed before you added description,
-- this makes sure the column exists (safe to run many times)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- =========================
-- SEED CATEGORIES
-- =========================
INSERT INTO categories (name)
SELECT 'Perfumes'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Perfumes');

INSERT INTO categories (name)
SELECT 'Cosmetics'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Cosmetics');

-- =========================
-- SEED PRODUCTS (only if not present)
-- =========================
INSERT INTO products (name, price, category_id, brand, in_stock, description)
SELECT
  'Perfume A',
  50,
  (SELECT id FROM categories WHERE name = 'Perfumes'),
  'BrandX',
  true,
  'A fresh everyday fragrance with a clean, elegant vibe. Great for daily wear.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Perfume A');

INSERT INTO products (name, price, category_id, brand, in_stock, description)
SELECT
  'Perfume B',
  80,
  (SELECT id FROM categories WHERE name = 'Perfumes'),
  'BrandY',
  false,
  'Warm floral fragrance with a soft sweet finish. Perfect for evening or special moments.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Perfume B');

-- =========================
-- OPTIONAL: If you already had products before, fill missing descriptions
-- (won't overwrite existing descriptions)



UPDATE products SET description =
  'A fresh everyday fragrance with a clean, elegant vibe. Great for daily wear.'
WHERE name ILIKE '%Iconic%';

UPDATE products SET description =
  'Warm floral fragrance with a soft sweet finish. Perfect for evening or special moments.'
WHERE name ILIKE '%Bella Vita%';

UPDATE products SET description =
  'Sunny tropical scent with creamy notes. Great for summer and vacations.'
WHERE name ILIKE '%sol de Janeiro%';

UPDATE products SET description =
  'Cheirosa 91 body mist with sweet, warm notes. A cozy scent for all day.'
WHERE name ILIKE '%Cheirosa 91%';


