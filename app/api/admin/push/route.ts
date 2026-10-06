import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { WebPushError } from "web-push";
import {
  configureWebPush,
  createPushAdminClient,
  hasSameOrigin,
} from "@/lib/push-server";

export const runtime = "nodejs";

type CampaignInput = {
  title?: unknown;
  body?: unknown;
  url?: unknown;
};

async function getAuthorizedAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase authentication environment variables are missing.");
  }

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

  const { data, error } = await authClient.auth.getUser();
  if (error) {
    console.error("[Push] Admin oturumu doğrulanamadı:", error.message);
    throw new Error("Admin oturumu doğrulanamadı.");
  }

  return data.user?.app_metadata?.role === "admin";
}

async function authorize() {
  try {
    const isAdmin = await getAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gerekir." }, { status: 403 });
    }
    return null;
  } catch (error) {
    console.error("[Push] Admin yetkilendirme hatası:", error);
    return NextResponse.json({ error: "Oturum doğrulanamadı." }, { status: 401 });
  }
}

export async function GET() {
  const denied = await authorize();
  if (denied) return denied;

  try {
    const supabase = createPushAdminClient();
    const [subscriptions, campaigns] = await Promise.all([
      supabase
        .from("push_subscriptions")
        .select("endpoint", { count: "exact", head: true }),
      supabase
        .from("push_campaigns")
        .select("id, title, body, target_url, sent_count, failed_count, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (subscriptions.error || campaigns.error) {
      const error = subscriptions.error ?? campaigns.error;
      console.error("[Push] Admin verileri alınamadı:", error?.message);
      return NextResponse.json(
        { error: "Bildirim verileri alınamadı. Veritabanı kurulumunu kontrol edin." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriberCount: subscriptions.count ?? 0,
      campaigns: campaigns.data ?? [],
    });
  } catch (error) {
    console.error("[Push] Admin paneli yapılandırma hatası:", error);
    return NextResponse.json({ error: "Bildirim hizmeti yapılandırılmamış." }, { status: 500 });
  }
}

function resolveTargetUrl(value: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ezmoto.com.tr";
  const site = new URL(siteUrl);

  try {
    if (value.startsWith("//")) return null;
    const target = new URL(value, site);
    if (target.username || target.password) {
      return null;
    }

    if (target.origin === site.origin) {
      return `${target.pathname}${target.search}${target.hash}`;
    }

    if (target.protocol !== "https:") return null;
    return target.href;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  const denied = await authorize();
  if (denied) return denied;

  let input: CampaignInput;
  try {
    input = (await request.json()) as CampaignInput;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.trim().length > 60 ||
    typeof input.body !== "string" ||
    !input.body.trim() ||
    input.body.trim().length > 200 ||
    typeof input.url !== "string" ||
    !input.url.trim() ||
    input.url.length > 2048
  ) {
    return NextResponse.json(
      { error: "Başlık (en fazla 60), mesaj (en fazla 200) ve bağlantı zorunludur." },
      { status: 400 }
    );
  }

  const targetUrl = resolveTargetUrl(input.url.trim());
  if (!targetUrl) {
    return NextResponse.json(
      { error: "Site içi bağlantı veya geçerli bir HTTPS dış bağlantı girin." },
      { status: 400 }
    );
  }

  try {
    const supabase = createPushAdminClient();
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key");

    if (subscriptionsError) {
      console.error("[Push] Aboneler alınamadı:", subscriptionsError.message);
      return NextResponse.json({ error: "Aboneler alınamadı." }, { status: 500 });
    }

    if (!subscriptions?.length) {
      return NextResponse.json(
        { error: "Henüz bildirimlere abone olan kullanıcı yok." },
        { status: 409 }
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("push_campaigns")
      .insert({
        title: input.title.trim(),
        body: input.body.trim(),
        target_url: targetUrl,
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      console.error("[Push] Gönderim kaydı oluşturulamadı:", campaignError?.message);
      return NextResponse.json({ error: "Bildirim gönderimi başlatılamadı." }, { status: 500 });
    }

    const push = configureWebPush();
    let sentCount = 0;
    let failedCount = 0;
    const expiredEndpoints: string[] = [];
    const payload = JSON.stringify({
      title: input.title.trim(),
      body: input.body.trim(),
      url: targetUrl,
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        push.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth_key,
            },
          },
          payload
        )
      )
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        sentCount += 1;
        return;
      }

      failedCount += 1;
      const error = result.reason as WebPushError;
      if (error.statusCode === 404 || error.statusCode === 410) {
        expiredEndpoints.push(subscriptions[index].endpoint);
      } else {
        console.error("[Push] Bildirim gönderilemedi:", error.message);
      }
    });

    if (expiredEndpoints.length) {
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
      if (error) {
        console.error("[Push] Süresi dolan abonelikler temizlenemedi:", error.message);
      }
    }

    const { error: updateError } = await supabase
      .from("push_campaigns")
      .update({ sent_count: sentCount, failed_count: failedCount })
      .eq("id", campaign.id);

    if (updateError) {
      console.error("[Push] Gönderim sonucu kaydedilemedi:", updateError.message);
      return NextResponse.json(
        { error: "Bildirim gönderildi ancak sonuç kaydı güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ sentCount, failedCount });
  } catch (error) {
    console.error("[Push] Bildirim gönderimi başarısız:", error);
    return NextResponse.json(
      { error: "Bildirim gönderilemedi. VAPID ve Supabase ayarlarını kontrol edin." },
      { status: 500 }
    );
  }
}
