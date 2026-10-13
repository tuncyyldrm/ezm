-- ============================================================================
-- EZM OTO - Supabase Veritabanı İndeks ve Performans Optimizasyon Betiği
-- Bu SQL kodunu Supabase Dashboard > SQL Editor sekmesinde çalıştırabilirsiniz.
-- Amacı: Arama ve kategori sorgularını hızlandırmak, CPU/RAM ve Disk I/O kotasını korumak.
-- ============================================================================

-- 1. Trigram (Esnek Metin Arama) Eklentisi (Parça kodu ve başlık aramalarını 50x hızlandırır)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Ürünler (Products) Tablosu İndeksleri
-- Kategori sayfası ve aktiflik filtreleri için birleşik indeks
CREATE INDEX IF NOT EXISTS idx_products_category_active 
  ON public.products (category_id, is_active) 
  WHERE is_active = true;

-- SKU aramaları ve tekil eşleştirmeler için
CREATE INDEX IF NOT EXISTS idx_products_sku_lower 
  ON public.products (lower(sku));

-- Başlıkta hızlı arama için GIN Trigram indeksi
CREATE INDEX IF NOT EXISTS idx_products_title_trgm 
  ON public.products USING gin (title gin_trgm_ops);

-- Sıralama ve yeni ürün filtresi için
CREATE INDEX IF NOT EXISTS idx_products_is_new_active 
  ON public.products (is_new, is_active) 
  WHERE is_active = true;

-- 3. Ürün Kodları (Product Codes) Tablosu İndeksleri
-- Ürün ilişkisi için Foreign Key indeksi
CREATE INDEX IF NOT EXISTS idx_product_codes_product_id 
  ON public.product_codes (product_id);

-- OEM ve Muadil kod aramalarını milisaniyelere indiren GIN Trigram indeksi
CREATE INDEX IF NOT EXISTS idx_product_codes_value_trgm 
  ON public.product_codes USING gin (code_value gin_trgm_ops);

-- Kod tipi filtresi için
CREATE INDEX IF NOT EXISTS idx_product_codes_type 
  ON public.product_codes (code_type);

-- 4. Ürün Araç / Marka İlişkileri (Product Vehicles) Tablosu İndeksleri
CREATE INDEX IF NOT EXISTS idx_product_vehicles_product_id 
  ON public.product_vehicles (product_id);

CREATE INDEX IF NOT EXISTS idx_product_vehicles_brand_id 
  ON public.product_vehicles (brand_id);

-- 5. Kategoriler (Categories) Tablosu İndeksleri
CREATE INDEX IF NOT EXISTS idx_categories_slug 
  ON public.categories (slug);

CREATE INDEX IF NOT EXISTS idx_categories_parent_active 
  ON public.categories (parent_id, is_active);

CREATE INDEX IF NOT EXISTS idx_categories_sort_order 
  ON public.categories (sort_order ASC) 
  WHERE is_active = true;

-- 6. Markalar (Brands) Tablosu İndeksleri
CREATE INDEX IF NOT EXISTS idx_brands_name_lower 
  ON public.brands (lower(name));

-- İndeks durumunu ve istatistikleri tazeleyin
ANALYZE public.products;
ANALYZE public.product_codes;
ANALYZE public.product_vehicles;
ANALYZE public.categories;
ANALYZE public.brands;
