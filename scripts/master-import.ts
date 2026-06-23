import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env.local dosyasını kesin olarak yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error("❌ HATA: .env.local içinde SUPABASE_SERVICE_ROLE_KEY bulunamadı!");
  process.exit(1);
}

// Admin yetkisiyle bağlanıyoruz (RLS Bypass ve rahat güncelleme için)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Dinamik Kategori Adı Düzeltici
function formatCategoryName(rawName: string): string {
  const specialCases: Record<string, string> = {
    'abssensoru': 'Abs Sensörü',
    'frenmusuru': 'Fren Müşürü',
    'oksijensensoru': 'Oksijen Sensörü',
    'hararetsensoru': 'Hararet Sensörü'
  };

  const lowerRaw = rawName.toLowerCase().trim();
  if (specialCases[lowerRaw]) return specialCases[lowerRaw];

  return rawName
    .replace(/I/g, 'ı')
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Güvenli slug üretici
function slugify(text: string) {
  let str = text.toString().trim().replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
  const trMap: Record<string, string> = { 'ç': 'c', 'ğ': 'g', 'ş': 's', 'ü': 'u', 'ö': 'o', 'ı': 'i' };
  for (const key in trMap) { str = str.replace(new RegExp(key, 'g'), trMap[key]); }
  return str.replace(/[\s_]+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

// Ürün adından PIN sayısını bulur
function extractPinCount(text: string): number {
  const match = text.match(/(\d+)\s*P[İI]N/i);
  return match ? parseInt(match[1]) : 0;
}

async function processFile(filePath: string, fileName: string) {
  const rawCategoryName = path.parse(fileName).name; 
  const mainCategoryName = formatCategoryName(rawCategoryName);
  const catSlug = slugify(mainCategoryName);
  let mainCategoryId: number;

  // Kategori kontrol et veya oluştur
  const { data: existingCat } = await supabase.from('categories').select('id').eq('slug', catSlug).maybeSingle();

  if (existingCat) {
    mainCategoryId = existingCat.id;
    console.log(`\n📂 [${mainCategoryName}] Kategorisi Hazır.`);
  } else {
    const { data: newCat, error: catErr } = await supabase
      .from('categories')
      .insert({ name: mainCategoryName, slug: catSlug })
      .select('id')
      .single();

    if (catErr || !newCat) {
      console.error(`❌ Kategori oluşturulamadı (${mainCategoryName}):`, catErr?.message);
      return;
    }
    mainCategoryId = newCat.id;
    console.log(`\n🆕 Yeni Kategori Eklendi: [${mainCategoryName}]`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  // Satır sonlarındaki gizli \r karakterlerini temizlemek için split mantığı
  const lines = fileContent.split(/\r?\n/);
  let insertedCount = 0;
  let updatedCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Başlık satırını veya boş satırları atla
    if (!trimmedLine || trimmedLine.startsWith('SKOD') || trimmedLine.startsWith('SKU')) continue;

    const columns = trimmedLine.split('\t');
    if (columns.length < 4) continue;

    const sku = columns[0].trim();        
    const rawBrands = columns[1].trim();  
    const title = columns[3].trim();      
    const oemField = columns[5]?.trim();   

    // 🚀 MUHTEŞEM DÜZELTME: 6. sütundan (columns[6]) satırın en sonuna kadar olan 
    // tüm Tab sütunlarını diziye alıyoruz. Böylece yan yana kaç muadil olursa olsun kaybolmuyor usta!
    const muadilFields = columns.slice(6).map(m => m.trim()).filter(m => m.length > 1 && m !== '-');

    if (!sku || !title) continue;

    try {
      const pinCount = extractPinCount(title);
      let productId: number;
      let isUpdate = false;

      // 🔄 Ürün kontrolü
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, title, category_id, pin_count')
        .eq('sku', sku)
        .maybeSingle();

      if (existingProduct) {
        productId = existingProduct.id;
        isUpdate = true;

        // Herhangi bir değişiklik varsa ürün tablosunu güncelliyoruz
        if (
          existingProduct.title !== title || 
          existingProduct.category_id !== mainCategoryId || 
          existingProduct.pin_count !== pinCount
        ) {
          const { error: upErr } = await supabase
            .from('products')
            .update({
              title: title,
              category_id: mainCategoryId,
              pin_count: pinCount
            })
            .eq('id', productId);

          if (upErr) {
            console.error(`❌ Ürün güncellenirken hata oluştu [${sku}]:`, upErr.message);
            continue;
          }
          updatedCount++;
        }
      } else {
        // Ürün tamamen yeniyse sıfırdan ekle
        const { data: newProduct, error: pErr } = await supabase
          .from('products')
          .insert({
            sku: sku,
            title: title,
            category_id: mainCategoryId,
            pin_count: pinCount,
            is_active: true
          })
          .select('id')
          .maybeSingle();

        if (pErr || !newProduct) {
          console.error(`❌ Ürün eklenemedi [${sku}]:`, pErr?.message);
          continue;
        }
        productId = newProduct.id;
        insertedCount++;
      }

      // 🔄 MÜKERRER TEMİZLİĞİ: Güncelleme modundaysak, kodların ve markaların eski 
      // ilişkilerini uçuruyoruz ki yenilerle çakışmasın veya eski veriler birikmesin.
      if (isUpdate) {
        await supabase.from('product_vehicles').delete().eq('product_id', productId);
        await supabase.from('product_codes').delete().eq('product_id', productId);
      }

      // Markaları ve Araçları İşleme
      if (rawBrands && rawBrands !== '-') {
        const brandNames = rawBrands
          .split(/[-–]/)
          .map(b => b.trim())
          .filter(b => b.length > 0 && b !== '');

        for (const bName of brandNames) {
          let brandId: number;
          const { data: existingBrand } = await supabase.from('brands').select('id').eq('name', bName).maybeSingle();

          if (existingBrand) {
            brandId = existingBrand.id;
          } else {
            const { data: newBrand } = await supabase.from('brands').insert({ name: bName }).select('id').maybeSingle();
            if (newBrand) brandId = newBrand.id;
            else continue;
          }

          await supabase.from('product_vehicles').insert({ product_id: productId, brand_id: brandId });
        }
      }

      // OEM ve Çoklu Muadil Kodları Hazırlama
      const codesPayload: { product_id: number; code_value: string; code_type: 'OEM' | 'MUADIL' }[] = [];

      // OEM alanını işle
      if (oemField && oemField !== '-') {
        oemField.split(/(?:\s+[-–]\s+)|,+/).map(c => c.trim()).filter(c => c.length > 1).forEach(oemCode => {
          if (!oemCode.includes('***') && !oemCode.toLowerCase().includes('tarih')) {
            codesPayload.push({ product_id: productId, code_value: oemCode.toUpperCase(), code_type: 'OEM' });
          }
        });
      }

      // 🔗 ÇOKLU MUADİL YAKALAYICI:
      // columns.slice(6) sayesinde verideki yan yana duran tüm muadil sütunları tek tek taranıyor usta.
      if (muadilFields.length > 0) {
        muadilFields.forEach(rawMuadilItem => {
          // Hücre içinde ola ki boşluk veya virgülle ayrılmış ek muadiller varsa onları da garantiye alıyoruz
          rawMuadilItem.split(/(?:\s+)|,+/).map(m => m.trim()).filter(m => m.length > 1).forEach(muadilCode => {
            codesPayload.push({ 
              product_id: productId, 
              code_value: muadilCode.toUpperCase(), 
              code_type: 'MUADIL' 
            });
          });
        });
      }

      // Toplu insert işlemi tek hamlede veritabanına yollanıyor
      if (codesPayload.length > 0) {
        await supabase.from('product_codes').insert(codesPayload);
      }

    } catch (lineError: any) {
      console.error(`❌ Sku [${sku}] işlenirken satır hatası:`, lineError.message);
    }
  }

  console.log(`📈 [${mainCategoryName}] Özeti -> Yeni Eklenen: ${insertedCount} | Güncellenen/Kontrol Edilen: ${updatedCount}`);
}

async function main() {
  console.log('🚀 TOPLU, GÜNCELLEME VE ARKA ARKAYA ÇOKLU MUADİL DESTEKLİ IMPORT MOTORU BAŞLATILDI...\n');

  const dataDir = path.resolve(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Hata: ${dataDir} klasörü bulunamadı!`);
    return;
  }

  // 📂 Klasördeki bütün .txt uzantılı dosyaları tarıyoruz
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.txt'));

  if (files.length === 0) {
    console.error(`❌ Hata: data/ klasörünün içinde hiç .txt dosyası bulunamadı!`);
    return;
  }

  console.log(`📋 Bulunan Toplam Dosya Sayısı: ${files.length}. Sırayla işleniyor...`);

  // Bütün dosyaları sırayla senkron bir döngüde çalıştırıyoruz
  for (const file of files) {
    const fullPath = path.join(dataDir, file);
    console.log(`--------------------------------------------------`);
    console.log(`📦 Dosya Okunuyor: ${file}`);
    await processFile(fullPath, file);
  }

  console.log(`\n🏁 MUHTEŞEM! Tüm klasör başarıyla tarandı, değişiklikler güncellendi ve tüm bağlı ürünler eksiksiz bağlandı usta.`);
}

main();