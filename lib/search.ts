export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function compactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/[\s\-_./]/g, "");
}

export function createTurkishSearchPattern(value: string): string {
  return normalizeSearchText(value)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[i]/g, "[iIİı]")
    .replace(/[s]/g, "[sSşŞ]")
    .replace(/[c]/g, "[cCçÇ]")
    .replace(/[g]/g, "[gGğĞ]")
    .replace(/[u]/g, "[uUüÜ]")
    .replace(/[o]/g, "[oOöÖ]");
}
