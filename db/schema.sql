SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(190) NULL,
  customer_type VARCHAR(30) NOT NULL DEFAULT 'retail',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  vehicle VARCHAR(255) NULL,
  address TEXT NULL,
  loyalty_points INT NOT NULL DEFAULT 0,
  loyalty_tier VARCHAR(30) NOT NULL DEFAULT 'bronze',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_status (status),
  INDEX idx_customers_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(20) NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'manager',
  permissions_json JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admin_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  name_fa VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  parent_id CHAR(36) NULL,
  description TEXT NULL,
  data_json JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_parent (parent_id),
  INDEX idx_categories_active (is_active),
  INDEX idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(190) NOT NULL UNIQUE,
  name_fa VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  oem_number VARCHAR(150) NULL,
  part_number VARCHAR(150) NULL,
  category_slug VARCHAR(150) NOT NULL,
  manufacturer VARCHAR(190) NULL,
  grade VARCHAR(50) NULL,
  price BIGINT UNSIGNED NOT NULL DEFAULT 0,
  discount_price BIGINT UNSIGNED NULL,
  stock INT NOT NULL DEFAULT 0,
  reserved_stock INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  images_json JSON NULL,
  specs_json JSON NULL,
  fitments_json JSON NULL,
  data_json JSON NOT NULL,
  short_description TEXT NULL,
  description LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category_slug),
  INDEX idx_products_oem (oem_number),
  INDEX idx_products_stock (stock),
  FULLTEXT INDEX ft_products_search (name_fa, name_en, oem_number, part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id CHAR(36) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
  customer_snapshot JSON NOT NULL,
  shipping_snapshot JSON NULL,
  payment_method VARCHAR(80) NULL,
  subtotal BIGINT UNSIGNED NOT NULL DEFAULT 0,
  discount_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
  shipping_fee BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total BIGINT UNSIGNED NOT NULL DEFAULT 0,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  payment_authority VARCHAR(190) NULL,
  payment_reference VARCHAR(190) NULL,
  paid_at DATETIME NULL,
  reservation_expires_at DATETIME NULL,
  tracking_code VARCHAR(190) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NULL,
  sku VARCHAR(100) NULL,
  product_name VARCHAR(255) NOT NULL,
  oem_number VARCHAR(150) NULL,
  unit_price BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total BIGINT UNSIGNED NOT NULL,
  metadata_json JSON NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  provider VARCHAR(30) NOT NULL,
  gateway_order_id BIGINT UNSIGNED NOT NULL,
  amount_toman BIGINT UNSIGNED NOT NULL,
  amount_rial BIGINT UNSIGNED NOT NULL,
  authority VARCHAR(255) NULL,
  reference_id VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'created',
  provider_response_json JSON NULL,
  callback_json JSON NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY uq_payment_gateway_order (provider, gateway_order_id),
  INDEX idx_payment_order (order_id),
  INDEX idx_payment_authority (authority),
  INDEX idx_payment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(190) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_type VARCHAR(30) NOT NULL,
  actor_id VARCHAR(100) NULL,
  action_name VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id VARCHAR(100) NULL,
  ip_address VARCHAR(64) NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor (actor_type, actor_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Safe forward-compatible additions for installations initialized with older schema versions.
ALTER TABLE products ADD COLUMN IF NOT EXISTS data_json JSON NULL AFTER fitments_json;
UPDATE products
SET data_json = JSON_OBJECT(
  'id', id,
  'sku', sku,
  'slug', slug,
  'nameFa', name_fa,
  'nameEn', COALESCE(name_en, ''),
  'oemNumber', COALESCE(oem_number, ''),
  'partNumber', COALESCE(part_number, ''),
  'categorySlug', category_slug,
  'brandManufacturer', COALESCE(manufacturer, ''),
  'grade', COALESCE(grade, 'aftermarket'),
  'price', price,
  'discountPrice', discount_price,
  'stock', stock,
  'stockStatus', CASE WHEN stock <= 0 THEN 'out_of_stock' WHEN stock <= 3 THEN 'low_stock' ELSE 'in_stock' END,
  'images', COALESCE(images_json, JSON_ARRAY()),
  'technicalSpecs', COALESCE(specs_json, JSON_OBJECT()),
  'fitments', COALESCE(fitments_json, JSON_ARRAY()),
  'shortDescription', COALESCE(short_description, ''),
  'description', COALESCE(description, '')
)
WHERE data_json IS NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INT NOT NULL DEFAULT 0 AFTER stock;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reservation_expires_at DATETIME NULL AFTER paid_at;
