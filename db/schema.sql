SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_initialized TINYINT(1) NOT NULL DEFAULT 1,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
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
  avatar_url TEXT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'manager',
  permissions_json JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admin_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_brands (
  id CHAR(64) PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  name_fa VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  data_json JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle_brands_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_models (
  id CHAR(64) PRIMARY KEY,
  brand_id CHAR(64) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  name_fa VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  data_json JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle_models_brand (brand_id),
  INDEX idx_vehicle_models_active (is_active),
  CONSTRAINT fk_vehicle_models_brand FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id) ON DELETE CASCADE
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
  archived_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at),
  INDEX idx_orders_archived (archived_at)
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
  gateway_order_id BIGINT UNSIGNED NULL,
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

CREATE TABLE IF NOT EXISTS article_categories (
  id CHAR(64) PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  data_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id CHAR(64) PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category_id CHAR(64) NULL,
  data_json JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_articles_category (category_id),
  INDEX idx_articles_active (is_active),
  FULLTEXT INDEX ft_articles_search (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sliders (
  id CHAR(64) PRIMARY KEY,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  data_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sliders_order (sort_order),
  INDEX idx_sliders_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_pages (
  id CHAR(64) PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  data_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pages_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id CHAR(64) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  points INT NOT NULL,
  transaction_type VARCHAR(40) NOT NULL,
  data_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loyalty_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_loyalty_customer (customer_id),
  INDEX idx_loyalty_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(190) PRIMARY KEY,
  setting_value JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS part_requests (
  id CHAR(64) PRIMARY KEY,
  status VARCHAR(60) NOT NULL DEFAULT 'در حال بررسی',
  data_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_part_requests_status (status),
  INDEX idx_part_requests_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_alerts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notified_at DATETIME NULL,
  CONSTRAINT fk_stock_alert_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_stock_alert_product_phone (product_id, phone),
  INDEX idx_stock_alert_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS search_queries (
  query_key VARCHAR(255) PRIMARY KEY,
  query_text VARCHAR(255) NOT NULL,
  search_count BIGINT UNSIGNED NOT NULL DEFAULT 1,
  last_results_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_searched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_search_count (search_count),
  INDEX idx_search_last (last_searched_at)
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

-- ============================================================================
-- TakRank SEO Native for Chinyadak
-- Native replacement for the WordPress TakRank SEO persistence layer.
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_meta (
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  seo_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  focus_keyword VARCHAR(255) NULL,
  secondary_keywords_json JSON NULL,
  canonical_url TEXT NULL,
  robots_index TINYINT(1) NOT NULL DEFAULT 1,
  robots_follow TINYINT(1) NOT NULL DEFAULT 1,
  og_title VARCHAR(255) NULL,
  og_description TEXT NULL,
  og_image_url TEXT NULL,
  twitter_title VARCHAR(255) NULL,
  twitter_description TEXT NULL,
  twitter_image_url TEXT NULL,
  schema_type VARCHAR(80) NULL,
  cornerstone TINYINT(1) NOT NULL DEFAULT 0,
  breadcrumb_title VARCHAR(255) NULL,
  hreflang_json JSON NULL,
  score INT NOT NULL DEFAULT 0,
  analysis_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_type, entity_id),
  INDEX idx_seo_meta_score (score),
  INDEX idx_seo_meta_focus (focus_keyword),
  INDEX idx_seo_meta_schema (schema_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_key VARCHAR(191) NOT NULL UNIQUE,
  entity_type VARCHAR(32) NULL,
  entity_id VARCHAR(64) NULL,
  url TEXT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'content',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  confidence VARCHAR(20) NOT NULL DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  details LONGTEXT NULL,
  evidence_json JSON NULL,
  action_text LONGTEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  snooze_until DATETIME NULL,
  first_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  INDEX idx_seo_issues_status (status, severity),
  INDEX idx_seo_issues_entity (entity_type, entity_id),
  INDEX idx_seo_issues_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_action_states (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  action_key VARCHAR(191) NOT NULL,
  fingerprint CHAR(64) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  source VARCHAR(32) NOT NULL DEFAULT '',
  label VARCHAR(255) NOT NULL DEFAULT '',
  snooze_until DATETIME NULL,
  last_verified_at DATETIME NULL,
  resolved_at DATETIME NULL,
  updated_by VARCHAR(64) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seo_action_state (action_key, fingerprint),
  INDEX idx_seo_action_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id VARCHAR(64) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(32) NULL,
  entity_id VARCHAR(64) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seo_history_entity (entity_type, entity_id),
  INDEX idx_seo_history_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_knowledge_nodes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity_key VARCHAR(191) NOT NULL UNIQUE,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  url_hash CHAR(64) NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  title TEXT NULL,
  seo_title TEXT NULL,
  meta_description TEXT NULL,
  focus_keyword TEXT NULL,
  secondary_keywords_json JSON NULL,
  headings_json JSON NULL,
  taxonomy_json JSON NULL,
  tokens_json JSON NULL,
  entity_phrases_json JSON NULL,
  facts_json JSON NULL,
  flags_json JSON NULL,
  content_text LONGTEXT NULL,
  content_sample TEXT NULL,
  internal_links_json JSON NULL,
  external_links_json JSON NULL,
  gsc_queries_json JSON NULL,
  content_hash CHAR(64) NOT NULL DEFAULT '',
  build_id VARCHAR(64) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_node_type (entity_type),
  INDEX idx_seo_node_url_hash (url_hash),
  INDEX idx_seo_node_build (build_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_knowledge_edges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source_key VARCHAR(191) NOT NULL,
  target_key VARCHAR(191) NOT NULL,
  relation VARCHAR(40) NOT NULL DEFAULT 'contextual',
  score INT NOT NULL DEFAULT 0,
  confidence VARCHAR(20) NOT NULL DEFAULT 'review',
  reasons_json JSON NULL,
  signals_json JSON NULL,
  build_id VARCHAR(64) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seo_edge (source_key, target_key),
  INDEX idx_seo_edge_source_score (source_key, score),
  INDEX idx_seo_edge_target (target_key),
  INDEX idx_seo_edge_build (build_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_redirects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(500) NOT NULL,
  source_key CHAR(64) NOT NULL DEFAULT '',
  target TEXT NULL,
  match_type VARCHAR(20) NOT NULL DEFAULT 'exact',
  status_code INT NOT NULL DEFAULT 301,
  hits BIGINT UNSIGNED NOT NULL DEFAULT 0,
  last_hit DATETIME NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seo_redirect_source (source_key, match_type),
  INDEX idx_seo_redirect_enabled (enabled),
  INDEX idx_seo_redirect_hits (hits)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_404 (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  url_hash CHAR(64) NOT NULL UNIQUE,
  url TEXT NOT NULL,
  referrer TEXT NULL,
  user_agent VARCHAR(255) NULL,
  hits BIGINT UNSIGNED NOT NULL DEFAULT 1,
  first_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  decision VARCHAR(24) NOT NULL DEFAULT 'open',
  decision_note TEXT NULL,
  classification VARCHAR(40) NULL,
  INDEX idx_seo_404_resolved (resolved, last_seen),
  INDEX idx_seo_404_hits (hits)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(80) NOT NULL,
  payload_json JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at DATETIME NULL,
  last_error TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_jobs_queue (status, available_at),
  INDEX idx_seo_jobs_locked (locked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_gsc_daily (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  data_date DATE NOT NULL,
  query_hash CHAR(64) NOT NULL,
  query_text TEXT NULL,
  page_hash CHAR(64) NOT NULL,
  page_url TEXT NOT NULL,
  device VARCHAR(20) NOT NULL DEFAULT '',
  country VARCHAR(8) NOT NULL DEFAULT '',
  search_type VARCHAR(20) NOT NULL DEFAULT 'web',
  clicks DOUBLE NOT NULL DEFAULT 0,
  impressions DOUBLE NOT NULL DEFAULT 0,
  ctr DOUBLE NOT NULL DEFAULT 0,
  position DOUBLE NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seo_gsc_daily (data_date, query_hash, page_hash, device, country, search_type),
  INDEX idx_seo_gsc_date (data_date),
  INDEX idx_seo_gsc_query (query_hash),
  INDEX idx_seo_gsc_page (page_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_gsc_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dataset VARCHAR(24) NOT NULL,
  search_type VARCHAR(20) NOT NULL DEFAULT 'web',
  dim1_hash CHAR(64) NOT NULL,
  dim1 TEXT NULL,
  dim2_hash CHAR(64) NOT NULL,
  dim2 TEXT NULL,
  clicks DOUBLE NOT NULL DEFAULT 0,
  impressions DOUBLE NOT NULL DEFAULT 0,
  ctr DOUBLE NOT NULL DEFAULT 0,
  position DOUBLE NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seo_gsc_metric (dataset, search_type, dim1_hash, dim2_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_keyword_map (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  query_hash CHAR(64) NOT NULL UNIQUE,
  query_text TEXT NOT NULL,
  preferred_url TEXT NOT NULL,
  preferred_url_hash CHAR(64) NOT NULL,
  owner_source VARCHAR(20) NOT NULL DEFAULT 'manual',
  locked TINYINT(1) NOT NULL DEFAULT 1,
  note TEXT NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_keyword_url (preferred_url_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_performance_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  report_key CHAR(36) NOT NULL UNIQUE,
  run_key CHAR(36) NOT NULL DEFAULT '',
  url_hash CHAR(64) NOT NULL,
  url TEXT NOT NULL,
  strategy VARCHAR(10) NOT NULL DEFAULT 'mobile',
  average_score DECIMAL(6,2) NULL,
  analysis_at DATETIME NULL,
  official_url TEXT NULL,
  result_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seo_performance_url (url_hash, strategy, created_at),
  INDEX idx_seo_performance_run (run_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_ai_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id VARCHAR(64) NULL,
  entity_type VARCHAR(32) NULL,
  entity_id VARCHAR(64) NULL,
  operation VARCHAR(40) NOT NULL,
  provider VARCHAR(30) NOT NULL,
  model VARCHAR(100) NULL,
  prompt_hash CHAR(64) NOT NULL,
  result_json JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  error_text TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seo_ai_entity (entity_type, entity_id),
  INDEX idx_seo_ai_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_runtime_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  event_name VARCHAR(100) NOT NULL,
  context_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seo_runtime_created (created_at),
  INDEX idx_seo_runtime_event (event_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

