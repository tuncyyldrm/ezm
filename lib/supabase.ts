import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL veya Anon Key .env.local dosyasında eksik!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 🚀 DÜZELTME 1: İlişkisel verileri map'lerken hata almamak için opsiyonel id alanlarını ekledik
export interface ProductCode {
  id?: number;
  product_id?: number;
  code_value: string;
  code_type: 'OEM' | 'MUADIL';
}

export interface ProductVehicle {
  id?: number;
  product_id?: number;
  brand_id?: number;
  brands: {
    name: string;
  } | null;
}

export interface Product {
  id: number;
  sku: string;
  title: string;
  category_id: number | null;
  pin_count: number;
  image_url?: string | null;
  is_new?: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  // 🚀 DÜZELTME 2: Kategoriyi iç sorguda (inner join) çektiğimiz için tipi burada da belirtiyoruz usta
  categories?: Category | null; 
  product_codes?: ProductCode[] | null;
  product_vehicles?: ProductVehicle[] | null;
}