import { createClient } from '@supabase/supabase-js';

// --- BAĞLANTI ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export { supabase };

// --- TİPLER ---
type Table = 'products' | 'categories' | 'brands' | 'product_codes' | 'product_vehicles';
type Bucket = 'product-images';

export interface Category {
  id: number; name: string; slug: string; parent_id?: number | null;
  image_url?: string | null; created_at?: string; updated_at?: string;
}

export interface Brand {
  id: number; name: string; slug?: string | null; logo_url?: string | null;
  created_at?: string; updated_at?: string;
}

export interface ProductCode {
  id?: number;
  product_id?: number;
  code_value: string;
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
  id: number; sku: string; title: string; category_id: number | null;
  pin_count: number; image_url?: string | null; is_new?: boolean;
  is_active?: boolean; sort_order?: number; created_at?: string;
  categories?: Category | null;
  product_codes?: ProductCode[] | null;
  product_vehicles?: ProductVehicle[] | null;
}

// --- UTILITY FONKSİYONLARI ---
const slugify = (text: string) => text
  .toLowerCase()
  .replace(/[üğşıöç]/g, c => ({ü:'u', ğ:'g', ı:'i', ş:'s', ö:'o', ç:'c'}[c] || c))
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const generateSkuUtil = (prefix = 'EZM') => 
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

export { generateSkuUtil as generateSku };

// --- STORAGE İŞLEMLERİ ---
const storage = {
  upload: async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('product-images' as Bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  },
  
  delete: async (url: string) => {
    const path = url.split('/product-images/')[1];
    if (path) await supabase.storage.from('product-images').remove([path]);
  }
};

// --- GENERIC CRUD İŞLEMLERİ ---
const db = {
  getAll: async <T>(table: Table, select = '*') => {
    const { data, error } = await supabase.from(table).select(select).order('created_at', { ascending: false });
    if (error) throw error;
    return data as T[];
  },
  
  getById: async <T>(table: Table, id: number, select = '*') => {
    const { data, error } = await supabase.from(table).select(select).eq('id', id).single();
    if (error) throw error;
    return data as T;
  },
  
  insert: async <T>(table: Table, data: any) => {
    const { data: result, error } = await supabase.from(table).insert(data).select().single();
    if (error) throw error;
    return result as T;
  },
  
  update: async (table: Table, id: number, data: any) => {
    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) throw error;
  },
  
  delete: async (table: Table, id: number, field = 'id') => {
    const { error } = await supabase.from(table).delete().eq(field, id);
    if (error) throw error;
  }
};

// --- ÜRÜN SERVİSİ ---
const productSelect = `
  *, categories(id, name, slug),
  product_codes(id, code_value, code_type),
  product_vehicles(id, brand_id, brands(name))
`;

export const productService = {
  getAll: () => db.getAll<Product>('products', productSelect),
  getById: (id: number) => db.getById<Product>('products', id, productSelect),
  
  create: async (data: any, codes: any[], brandIds: number[], image?: File) => {
    data.sku = data.sku || generateSkuUtil();
    if (image) data.image_url = await storage.upload(image, `products/${data.sku}.${image.name.split('.').pop()}`);
    
    const product = await db.insert<Product>('products', data);
    
    const relations = [
      codes?.length && db.insert('product_codes', codes.map(c => ({ ...c, product_id: product.id }))),
      brandIds?.length && db.insert('product_vehicles', brandIds.map(b => ({ product_id: product.id, brand_id: b })))
    ];
    await Promise.all(relations.filter(Boolean));
    
    return product;
  },
  
  update: async (id: number, data: any, codes: any[], brandIds: number[], image?: File) => {
    if (image) {
      const old = await db.getById<Product>('products', id, 'image_url');
      if (old?.image_url) await storage.delete(old.image_url);
      data.image_url = await storage.upload(image, `products/${data.sku || old.sku}.${image.name.split('.').pop()}`);
    }
    
    await db.update('products', id, data);
    await Promise.all([
      db.delete('product_codes', id, 'product_id'),
      db.delete('product_vehicles', id, 'product_id')
    ]);
    
    const relations = [
      codes?.length && db.insert('product_codes', codes.map(c => ({ ...c, product_id: id }))),
      brandIds?.length && db.insert('product_vehicles', brandIds.map(b => ({ product_id: id, brand_id: b })))
    ];
    await Promise.all(relations.filter(Boolean));
  },
  
  delete: async (id: number) => {
    const product = await db.getById<Product>('products', id, 'image_url');
    if (product?.image_url) await storage.delete(product.image_url);
    await db.delete('products', id);
  }
};

// --- KATEGORİ VE MARKA SERVİSLERİ ---
// lib/supabase.ts - SADECE DEĞİŞEN KISIMLAR

// --- KATEGORİ SERVİSİ ---
export const categoryService = {
  getAll: () => db.getAll<Category>('categories'),
  
  create: async (name: string, parentId?: number, image?: File) => {
    const slug = slugify(name);
    let imageUrl: string | null = null;
    
    if (image) {
      const ext = image.name.split('.').pop();
      imageUrl = await storage.upload(image, `${slug}.${ext}`);
    }
    
    return db.insert<Category>('categories', { 
      name, 
      slug, 
      parent_id: parentId || null, 
      image_url: imageUrl 
    });
  },
  
  update: async (id: number, name: string, parentId?: number, image?: File, oldImageUrl?: string) => {
    const slug = slugify(name);
    let imageUrl = oldImageUrl || null;
    
    if (image) {
      const ext = image.name.split('.').pop();
      imageUrl = await storage.upload(image, `${slug}.${ext}`);
    }
    
    return db.update('categories', id, {
      name,
      slug,
      parent_id: parentId || null,
      image_url: imageUrl
    });
  },
  
  delete: async (id: number, imageUrl?: string) => {
    if (imageUrl) await storage.delete(imageUrl);
    return db.delete('categories', id);
  }
};

export const brandService = {
  getAll: () => db.getAll<Brand>('brands'),
  create: (name: string) => db.insert<Brand>('brands', { name, slug: slugify(name) }),
  delete: (id: number) => db.delete('brands', id)
};

// --- YARDIMCI FONKSİYONLAR ---
export const uploadProductImage = (file: File, sku: string) => 
  storage.upload(file, `products/${sku}.${file.name.split('.').pop()}`);

export const uploadCategoryImage = (file: File, slug: string) => 
  storage.upload(file, `categories/${slug}.${file.name.split('.').pop()}`);

export const deleteImage = (url: string) => storage.delete(url);
export const deleteProductImage = deleteImage;

export const createSlug = slugify;

export const validateImageFile = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) return { valid: false, error: 'Sadece JPEG, PNG, WebP ve GIF dosyaları desteklenir.' };
  if (file.size > 5 * 1024 * 1024) return { valid: false, error: 'Dosya boyutu 5MB\'ı geçmemelidir.' };
  return { valid: true };
};

// Eski API uyumluluğu için
export const getProducts = productService.getAll;
export const getProductById = productService.getById;
export const createProduct = productService.create;
export const updateProduct = productService.update;
export const deleteProduct = productService.delete;
export const getCategories = categoryService.getAll;
export const createCategory = categoryService.create;
export const deleteCategory = categoryService.delete;
export const getBrands = brandService.getAll;
export const createBrand = brandService.create;