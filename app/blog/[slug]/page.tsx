import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/site";
import { supabase } from "@/lib/supabase";

const BUCKET_URL =
  "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/blog-images";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function getPost(slug: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

function removeSiteName(title: string): string {
  return title.replace(/(?:\s*[|–—-]\s*EZM OTO)+\s*$/i, "").trim();
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Blog Yazısı",
    };
  }

  const postTitle = removeSiteName(post.seo_title || post.title);
  const fullTitle = `${postTitle} | EZM OTO`;

  return {
    title: postTitle,

    description:
      post.seo_description ||
      post.excerpt ||
      "",

    alternates: {
      canonical: `/blog/${post.slug}`,
    },

    openGraph: {
      title: fullTitle,

      description:
        post.seo_description ||
        post.excerpt ||
        "",

      type: "article",

      publishedTime:
        post.published_at ||
        undefined,

      authors: [
        post.author || "EZM OTO",
      ],

      images: post.cover_image
        ? [
            {
              url: `${BUCKET_URL}/${post.cover_image}`,
            },
          ]
        : [],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: Props) {
  const { slug } = await params;

  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const imageUrl = post.cover_image
    ? `${BUCKET_URL}/${post.cover_image}`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",

    headline: post.title,

    description:
      post.seo_description ||
      post.excerpt ||
      "",

    author: {
      "@type": "Organization",
      name: post.author || "EZM OTO",
    },

    publisher: {
      "@type": "Organization",
      name: "EZM OTO",
    },

    datePublished:
      post.published_at ||
      post.created_at,

    dateModified:
      post.updated_at,

    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getAbsoluteUrl(`/blog/${post.slug}`),
    },

    ...(imageUrl
      ? {
          image: [imageUrl],
        }
      : {}),
  };

  return (
    <main className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLd
          ),
        }}
      />

      {/* HEADER */}
      <article>

        <header className="bg-slate-50 border-b border-slate-200">

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

            <div className="text-sm font-bold text-blue-600">
              EZM OTO BLOG
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-5 text-lg md:text-xl text-slate-600 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">

              <span>
                {post.author || "EZM OTO"}
              </span>

              <span>•</span>

              <time
                dateTime={
                  post.published_at ||
                  post.created_at
                }
              >
                {new Date(
                  post.published_at ||
                    post.created_at
                ).toLocaleDateString(
                  "tr-TR",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </time>

            </div>

          </div>

        </header>

        {/* COVER */}
        {imageUrl && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

            <Image
              src={imageUrl}
              alt={post.title}
              width={1200}
              height={560}
              unoptimized
              className="w-full max-h-[560px] object-cover rounded-2xl shadow-sm"
            />

          </div>
        )}

        {/* CONTENT */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{
              __html: post.content,
            }}
          />

        </div>

      </article>
    </main>
  );
}