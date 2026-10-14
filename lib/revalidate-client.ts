/**
 * Admin panelinden canlı site önbelleğini anında temizleyip güncellemeyi tetikler.
 */
export async function triggerRevalidate(path = "all"): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Önbellek yenilenemedi.");
    }

    return {
      success: true,
      message: data?.message || "Önbellek başarıyla temizlendi.",
    };
  } catch (error) {
    console.error("Revalidate tetikleme hatası:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Önbellek yenilenemedi.",
    };
  }
}
