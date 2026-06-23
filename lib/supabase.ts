import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ⚡ DÜZELTME: 'throw new Error' yerine 'console.warn' kullanarak build'in çökmesini engelledik usta!
// Canlıya (runtime) geçtiğinde env değişkenleri Vercel tarafından inject edileceği için sorunsuz çalışacaktır.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL veya Anon Key bulunamadı! (Build aşamasında bu uyarı normaldir.)');
}

// Fallback (yedek) placeholder değerler vererek createClient'ın boş değerle çökmesini önlüyoruz
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

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
  categories?: Category | null; 
  product_codes?: ProductCode[] | null;
  product_vehicles?: ProductVehicle[] | null;
}