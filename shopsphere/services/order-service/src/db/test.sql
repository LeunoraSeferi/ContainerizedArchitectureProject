SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) NOT NULL DEFAULT 0;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name='orders'
ORDER BY ordinal_position;

SELECT * FROM orders ORDER BY id DESC;

SELECT * FROM order_items ORDER BY order_id DESC, id DESC;


SELECT * FROM orders ORDER BY id DESC;
SELECT * FROM order_items ORDER BY id DESC;

