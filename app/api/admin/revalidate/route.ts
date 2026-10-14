import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function isAuthorizedAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return false;

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data } = await authClient.auth.getUser();
  const role = data.user?.app_metadata?.role || data.user?.user_metadata?.role;
  return role === "admin";
}

export async function POST(request: Request) {
  const isAdmin = await isAuthorizedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Bu işlem için admin yetkisi gerekir." }, { status: 403 });
  }

  try {
    let body: { path?: string; type?: "page" | "layout" } = {};
    try {
      body = await request.json();
    } catch {
      // JSON body opsiyoneldir
    }

    const { searchParams } = new URL(request.url);
    const targetPath = (body.path || searchParams.get("path") || "all").trim();

    if (targetPath === "all") {
      // Tüm sitenin önbelleğini kökten temizler
      revalidatePath("/", "layout");
      revalidatePath("/sitemap.xml");
      return NextResponse.json({
        revalidated: true,
        scope: "all",
        message: "Canlı site önbelleği başarıyla yenilendi. Tüm sayfalar güncellendi.",
        now: Date.now(),
      });
    }

    if (targetPath === "blog") {
      revalidatePath("/blog");
      revalidatePath("/sitemap.xml");
      return NextResponse.json({
        revalidated: true,
        scope: "blog",
        message: "Blog önbelleği başarıyla yenilendi.",
        now: Date.now(),
      });
    }

    // Belirli bir yol verildiğinde
    if (body.type === "layout") {
      revalidatePath(targetPath, "layout");
    } else {
      revalidatePath(targetPath);
    }

    // Her durumda sitemap'i de tazele
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      revalidated: true,
      path: targetPath,
      message: `"${targetPath}" önbelleği başarıyla yenilendi.`,
      now: Date.now(),
    });
  } catch (error) {
    console.error("[Revalidate API Hatası]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Önbellek yenilenemedi." },
      { status: 500 }
    );
  }
}
