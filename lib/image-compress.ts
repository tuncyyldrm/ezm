/**
 * Tarayıcı tarafında görselleri otomatik boyutlandırıp WebP formatına sıkıştırır.
 * Supabase Storage kotasının dolmasını ve yükleme gecikmelerini önler.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<File> {
  // Görsel değilse veya tarayıcı ortamında değilse orijinal dosyayı döndür
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  // SVG veya GIF dosyalarını sıkıştırmaya çalışma (vektör veya animasyon bozulmasın)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = document.createElement('img');

      img.onload = () => {
        let { width, height } = img;

        // En boy oranını koruyarak maksimum sınırları uygula
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Arka planı şeffaf olan PNG'ler için temiz çizim
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Eğer sıkıştırılmış boyut orijinalden büyükse orijinali kullan
              resolve(file);
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${cleanName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
