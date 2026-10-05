"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET_URL =
  "https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/blog-images";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author: string;
  is_published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[ğüşıöç]/g, (c) => {
      const map: Record<string, string> = {
        ğ: "g",
        ü: "u",
        ş: "s",
        ı: "i",
        ö: "o",
        ç: "c",
      };

      return map[c] || c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogAdminPage() {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("EZM OTO");

  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [isPublished, setIsPublished] = useState(false);

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setListLoading(true);

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Blog yükleme hatası:", error);
      alert("Blog yazıları yüklenemedi.");
    }

    setPosts(data || []);
    setListLoading(false);
  };

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setAuthor("EZM OTO");

    setCoverImage("");
    setCoverFile(null);
    setCoverPreview("");

    setSeoTitle("");
    setSeoDescription("");

    setIsPublished(false);

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }

    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const editPost = (post: BlogPost) => {
    setEditId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setAuthor(post.author || "EZM OTO");

    setCoverImage(post.cover_image || "");
    setCoverFile(null);
    setCoverPreview(
      post.cover_image
        ? `${BUCKET_URL}/${post.cover_image}`
        : ""
    );

    setSeoTitle(post.seo_title || "");
    setSeoDescription(post.seo_description || "");

    setIsPublished(post.is_published);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = post.content || "";
      }
    }, 0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const execute = (command: string, value?: string) => {
    editorRef.current?.focus();

    document.execCommand(
      command,
      false,
      value
    );
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);

    if (!editId) {
      setSlug(slugify(value));
    }

    if (!seoTitle) {
      setSeoTitle(value);
    }
  };

  const handleCoverFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCoverImage = async () => {
    if (!coverFile) return coverImage;

    const extension =
      coverFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filename = `${slug}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(filename, coverFile, {
        upsert: true,
        contentType: coverFile.type,
      });

    if (error) {
      throw new Error(
        "Kapak görseli yüklenemedi: " + error.message
      );
    }

    return filename;
  };

  const uploadContentImage = async (
    file: File
  ) => {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filename =
      `content-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${extension}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(filename, file, {
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(
        "İçerik görseli yüklenemedi: " +
          error.message
      );
    }

    return `${BUCKET_URL}/${filename}`;
  };

  const handleContentImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setLoading(true);

      const url =
        await uploadContentImage(file);

      editorRef.current?.focus();

      document.execCommand(
        "insertHTML",
        false,
        `
          <p>
            <img
              src="${url}"
              alt="${title || "EZM OTO blog görseli"}"
              style="max-width:100%;height:auto;border-radius:12px;margin:20px 0;"
            />
          </p>
        `
      );
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Blog başlığı girin.");
      return;
    }

    if (!editorRef.current?.innerHTML.trim()) {
      alert("Blog içeriği boş bırakılamaz.");
      return;
    }

    if (!slug.trim()) {
      alert("URL adresi oluşturulamadı.");
      return;
    }

    setLoading(true);

    try {
      const finalCoverImage =
        await uploadCoverImage();

      const content =
        editorRef.current?.innerHTML || "";

      const now = new Date().toISOString();

      const postData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content,
        cover_image:
          finalCoverImage || null,
        author:
          author.trim() || "EZM OTO",
        is_published: isPublished,
        published_at: isPublished
          ? now
          : null,
        seo_title:
          seoTitle.trim() || title.trim(),
        seo_description:
          seoDescription.trim() ||
          excerpt.trim() ||
          null,
      };

      let error;

      if (editId) {
        const result = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", editId);

        error = result.error;
      } else {
        const result = await supabase
          .from("blog_posts")
          .insert(postData);

        error = result.error;
      }

      if (error) {
        if (
          error.message
            .toLowerCase()
            .includes("duplicate")
        ) {
          throw new Error(
            "Bu URL adresi zaten kullanılıyor."
          );
        }

        throw new Error(error.message);
      }

      alert(
        editId
          ? "Blog yazısı güncellendi."
          : "Blog yazısı oluşturuldu."
      );

      resetForm();
      await loadPosts();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (
    post: BlogPost
  ) => {
    if (
      !confirm(
        `"${post.title}" yazısı silinsin mi?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      alert(
        "Silme hatası: " +
          error.message
      );
      return;
    }

    if (post.cover_image) {
      await supabase.storage
        .from("blog-images")
        .remove([post.cover_image]);
    }

    await loadPosts();

    if (editId === post.id) {
      resetForm();
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.title
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const inputStyle =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 text-sm";

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Blog Yönetimi
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                EZM OTO blog yazılarını oluşturun,
                düzenleyin ve yayınlayın.
              </p>
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600">
                {posts.length} Yazı
              </span>

              <span className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-sm font-bold text-blue-700">
                {posts.filter(
                  (p) => p.is_published
                ).length}{" "}
                Yayında
              </span>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editId
                    ? "Blog Yazısını Düzenle"
                    : "Yeni Blog Yazısı"}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Temel bilgileri ve içeriği girin.
                </p>
              </div>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
                >
                  Yeni Yazı
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* TITLE */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Başlık
              </label>

              <input
                value={title}
                onChange={(e) =>
                  handleTitleChange(
                    e.target.value
                  )
                }
                className={inputStyle}
                placeholder="Örn: Bobin Arızası Nasıl Anlaşılır?"
              />
            </div>

            {/* SLUG */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                URL
              </label>

              <div className="flex items-center">
                <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-3 rounded-l-xl text-sm text-slate-500">
                  /blog/
                </span>

                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      slugify(e.target.value)
                    )
                  }
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* EXCERPT */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Kısa Açıklama
              </label>

              <textarea
                value={excerpt}
                onChange={(e) =>
                  setExcerpt(e.target.value)
                }
                rows={3}
                className={inputStyle}
                placeholder="Google ve blog listeleme alanında kullanılabilecek kısa açıklama..."
              />
            </div>

            {/* COVER */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Kapak Görseli
              </label>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  coverInputRef.current?.click()
                }
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700"
              >
                Görsel Seç
              </button>

              {coverPreview && (
                <div className="mt-4">
                  <img
                    src={coverPreview}
                    alt="Kapak önizleme"
                    className="w-full max-w-xl max-h-72 object-cover rounded-2xl border border-slate-200"
                  />
                </div>
              )}
            </div>

            {/* EDITOR */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                İçerik
              </label>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">

                {/* TOOLBAR */}
                <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-200">

                  <button
                    type="button"
                    onClick={() =>
                      execute("bold")
                    }
                    className="toolbar-btn font-bold"
                  >
                    B
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute("italic")
                    }
                    className="toolbar-btn italic"
                  >
                    I
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute("underline")
                    }
                    className="toolbar-btn underline"
                  >
                    U
                  </button>

                  <span className="toolbar-separator" />

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "formatBlock",
                        "H1"
                      )
                    }
                    className="toolbar-btn font-bold"
                  >
                    H1
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "formatBlock",
                        "H2"
                      )
                    }
                    className="toolbar-btn font-bold"
                  >
                    H2
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "formatBlock",
                        "H3"
                      )
                    }
                    className="toolbar-btn font-bold"
                  >
                    H3
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "formatBlock",
                        "P"
                      )
                    }
                    className="toolbar-btn"
                  >
                    P
                  </button>

                  <span className="toolbar-separator" />

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "justifyLeft"
                      )
                    }
                    className="toolbar-btn"
                  >
                    Sol
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "justifyCenter"
                      )
                    }
                    className="toolbar-btn"
                  >
                    Orta
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "justifyRight"
                      )
                    }
                    className="toolbar-btn"
                  >
                    Sağ
                  </button>

                  <span className="toolbar-separator" />

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "insertUnorderedList"
                      )
                    }
                    className="toolbar-btn"
                  >
                    • Liste
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute(
                        "insertOrderedList"
                      )
                    }
                    className="toolbar-btn"
                  >
                    1. Liste
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url =
                        prompt(
                          "Link adresi:"
                        );

                      if (url) {
                        execute(
                          "createLink",
                          url
                        );
                      }
                    }}
                    className="toolbar-btn"
                  >
                    Link
                  </button>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={
                      handleContentImage
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      imageInputRef.current?.click()
                    }
                    className="toolbar-btn"
                  >
                    Görsel
                  </button>

                  <span className="toolbar-separator" />

                  <button
                    type="button"
                    onClick={() =>
                      execute("undo")
                    }
                    className="toolbar-btn"
                  >
                    Geri
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      execute("redo")
                    }
                    className="toolbar-btn"
                  >
                    İleri
                  </button>
                </div>

                {/* EDITABLE */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="blog-editor"
                  data-placeholder="Blog yazınızı buraya yazın..."
                />
              </div>
            </div>

            {/* SEO */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                SEO
              </h3>

              <div className="grid md:grid-cols-2 gap-5">

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    SEO Başlığı
                  </label>

                  <input
                    value={seoTitle}
                    onChange={(e) =>
                      setSeoTitle(
                        e.target.value
                      )
                    }
                    className={inputStyle}
                    placeholder="Google'da görünecek başlık"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Yazar
                  </label>

                  <input
                    value={author}
                    onChange={(e) =>
                      setAuthor(
                        e.target.value
                      )
                    }
                    className={inputStyle}
                  />
                </div>

              </div>

              <div className="mt-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  SEO Açıklaması
                </label>

                <textarea
                  value={seoDescription}
                  onChange={(e) =>
                    setSeoDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  maxLength={160}
                  className={inputStyle}
                  placeholder="Google sonuçlarında kullanılacak açıklama..."
                />

                <div className="text-xs text-slate-400 mt-1">
                  {seoDescription.length}/160
                </div>
              </div>
            </div>

            {/* PUBLISH */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-6">

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) =>
                    setIsPublished(
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />

                <div>
                  <div className="font-bold text-slate-800">
                    Yayınla
                  </div>

                  <div className="text-xs text-slate-500">
                    İşaretlenirse yazı sitede görünür.
                  </div>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-sm"
              >
                {loading
                  ? "Kaydediliyor..."
                  : editId
                  ? "Yazıyı Güncelle"
                  : "Blog Yazısını Kaydet"}
              </button>
            </div>
          </div>
        </form>

        {/* LIST */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Blog Yazıları
              </h2>

              <p className="text-sm text-slate-500">
                Mevcut yazıları yönetin.
              </p>
            </div>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Yazı ara..."
              className="w-full md:w-72 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
            />
          </div>

          {listLoading ? (
            <div className="p-10 text-center text-slate-500">
              Yükleniyor...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Henüz blog yazısı bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 flex flex-col md:flex-row md:items-center gap-4"
                >

                  {post.cover_image ? (
                    <img
                      src={`${BUCKET_URL}/${post.cover_image}`}
                      alt={post.title}
                      className="w-full md:w-32 h-20 object-cover rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="w-full md:w-32 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Görsel yok
                    </div>
                  )}

                  <div className="flex-1 min-w-0">

                    <h3 className="font-bold text-slate-900 truncate">
                      {post.title}
                    </h3>

                    <div className="text-xs text-slate-400 mt-1">
                      /blog/{post.slug}
                    </div>

                    <div className="mt-2">
                      {post.is_published ? (
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
                          Yayında
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">
                          Taslak
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        editPost(post)
                      }
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deletePost(post)
                      }
                      className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-sm font-bold text-red-600"
                    >
                      Sil
                    </button>

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .toolbar-btn {
          padding: 7px 10px;
          border-radius: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.15s;
        }

        .toolbar-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .toolbar-separator {
          width: 1px;
          background: #e2e8f0;
          margin: 3px 4px;
        }

        .blog-editor {
          min-height: 450px;
          padding: 24px;
          outline: none;
          color: #1e293b;
          line-height: 1.8;
          font-size: 16px;
        }

        .blog-editor:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }

        .blog-editor h1 {
          font-size: 2rem;
          line-height: 1.2;
          font-weight: 800;
          margin: 28px 0 14px;
        }

        .blog-editor h2 {
          font-size: 1.5rem;
          line-height: 1.3;
          font-weight: 800;
          margin: 26px 0 12px;
        }

        .blog-editor h3 {
          font-size: 1.2rem;
          line-height: 1.4;
          font-weight: 800;
          margin: 22px 0 10px;
        }

        .blog-editor p {
          margin: 0 0 16px;
        }

        .blog-editor ul,
        .blog-editor ol {
          margin: 0 0 18px 24px;
        }

        .blog-editor li {
          margin-bottom: 6px;
        }

        .blog-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }

        .blog-editor a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}