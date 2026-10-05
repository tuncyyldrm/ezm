import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const BUCKET_URL =
  "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/blog-images";

export const metadata = {
  title: "Blog | EZM OTO",
  description:
    "Otomotiv yedek parçaları, araç bakımı, arıza belirtileri ve otomotiv dünyasından güncel bilgiler.",
};

export default async function BlogPage() {
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select(
      "id,title,slug,excerpt,cover_image,author,published_at"
    )
    .eq("is_published", true)
    .order("published_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">
            EZM OTO Blog
          </span>

          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Otomotiv dünyasından
            <br />
            faydalı bilgiler
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-slate-600 leading-relaxed">
            Araç bakımı, yedek parçalar, arıza belirtileri
            ve otomotiv dünyasına dair pratik bilgiler.
          </p>

        </div>
      </section>

      {/* POSTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {!posts || posts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-900">
              Henüz blog yazısı bulunmuyor.
            </h2>

            <p className="mt-2 text-slate-500">
              Yakında yeni içerikler burada olacak.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">

            {posts.map((post) => (
              <article
                key={post.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >

                <Link href={`/blog/${post.slug}`}>

                  {post.cover_image ? (
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      <Image
                        src={`${BUCKET_URL}/${post.cover_image}`}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-400 font-bold">
                        EZM OTO
                      </span>
                    </div>
                  )}

                  <div className="p-6">

                    <div className="text-xs text-slate-400 font-medium">
                      {post.published_at
                        ? new Date(
                            post.published_at
                          ).toLocaleDateString(
                            "tr-TR"
                          )
                        : ""}
                    </div>

                    <h2 className="mt-2 text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="mt-5 text-sm font-bold text-blue-600">
                      Yazıyı Oku →
                    </div>

                  </div>

                </Link>
              </article>
            ))}

          </div>
        )}

      </section>
    </main>
  );
}