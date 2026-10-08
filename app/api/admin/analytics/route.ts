import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("[Analytics] Supabase admin yapılandırması eksik.");
    return NextResponse.json({ error: "Analiz hizmeti yapılandırılmamış." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
  const { data, error: authError } = await authClient.auth.getUser();

  if (authError) {
    console.error("[Analytics] Admin oturumu doğrulanamadı:", authError.message);
    return NextResponse.json({ error: "Oturum doğrulanamadı." }, { status: 401 });
  }
  if (data.user?.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Bu işlem için admin yetkisi gerekir." }, { status: 403 });
  }

  const daysParam = new URL(request.url).searchParams.get("days");
  const days = daysParam === "30" || daysParam === "90" ? Number(daysParam) : 7;
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: analytics, error } = await client.rpc("get_site_analytics", {
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });

  if (error) {
    console.error("[Analytics] Rapor alınamadı:", error.message);
    return NextResponse.json(
      { error: "Analiz raporu alınamadı. Supabase SQL kurulumunu kontrol edin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ days, analytics });
}
