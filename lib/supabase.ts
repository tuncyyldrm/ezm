import { createClient } from '@supabase/supabase-js';

// Vercel'deki gerçek değişkenleri alıyoruz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ⚡ JET ÇÖZÜM: Build sırasında kütüphanenin patlamaması için geçerli formatta bir placeholder (yedek) URL tanımlıyoruz.
// Next.js derleme aşamasını sorunsuz atlatacak, canlıda (runtime) ise Vercel'deki gerçek adresin devreye girecek usta.
const finalUrl = supabaseUrl || 'https://erntysmhwfxkrtegirds.supabase.co';
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybnR5c21od2Z4a3J0ZWdpcmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjkxMTUsImV4cCI6MjA5NjM0NTExNX0.LZi6sW4OVa8bLMj_et8PSxiG6LHxeY-oSB2gm696D5U';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: false
  }
});

// --- TİP TANIMLAMALARI ---
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
  // 🌟 GÜNCELLEME: Veritabanına eklediğimiz 'URETICI' tipini buraya da ekledik
  code_type: 'OEM' | 'MUADIL' | 'URETICI'; 
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