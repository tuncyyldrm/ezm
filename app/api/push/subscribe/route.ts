import { NextResponse } from "next/server";
import { createPushAdminClient, hasSameOrigin } from "@/lib/push-server";

export const runtime = "nodejs";

type SubscriptionInput = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function isValidSubscription(value: SubscriptionInput) {
  if (
    typeof value.endpoint !== "string" ||
    value.endpoint.length > 2048 ||
    typeof value.keys?.p256dh !== "string" ||
    typeof value.keys.auth !== "string"
  ) {
    return false;
  }

  try {
    return new URL(value.endpoint).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  let body: SubscriptionInput;

  try {
    body = (await request.json()) as SubscriptionInput;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (!isValidSubscription(body)) {
    return NextResponse.json({ error: "Geçersiz bildirim aboneliği." }, { status: 400 });
  }

  try {
    const supabase = createPushAdminClient();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: body.endpoint,
        p256dh: body.keys!.p256dh,
        auth_key: body.keys!.auth,
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[Push] Abonelik kaydedilemedi:", error.message);
      return NextResponse.json(
        { error: "Bildirim aboneliği kaydedilemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "subscribed" });
  } catch (error) {
    console.error("[Push] Abonelik yapılandırma hatası:", error);
    return NextResponse.json(
      { error: "Bildirim hizmeti şu anda kullanılamıyor." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "İstek kaynağı doğrulanamadı." }, { status: 403 });
  }

  let body: { endpoint?: unknown };

  try {
    body = (await request.json()) as { endpoint?: unknown };
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (typeof body.endpoint !== "string" || body.endpoint.length > 2048) {
    return NextResponse.json({ error: "Geçersiz abonelik." }, { status: 400 });
  }

  try {
    const supabase = createPushAdminClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint);

    if (error) {
      console.error("[Push] Abonelik silinemedi:", error.message);
      return NextResponse.json(
        { error: "Bildirim aboneliği kapatılamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "unsubscribed" });
  } catch (error) {
    console.error("[Push] Abonelik yapılandırma hatası:", error);
    return NextResponse.json(
      { error: "Bildirim hizmeti şu anda kullanılamıyor." },
      { status: 500 }
    );
  }
}
