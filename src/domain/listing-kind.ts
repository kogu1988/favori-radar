import type { ListingKind } from "./models";

const FIELD_GROUPS: Record<
  ListingKind,
  Array<{ title: string; fields: string[] }>
> = {
  car: [
    { title: "Araç", fields: ["Marka", "Seri", "Model", "Yıl", "Araç Durumu", "Kasa Tipi"] },
    { title: "Motor ve performans", fields: ["Yakıt", "Vites", "Motor Hacmi", "Motor Gücü", "Çekiş"] },
    { title: "Kullanım", fields: ["KM", "Renk", "Garanti", "Takas", "Kimden"] },
    { title: "Hasar ve kayıt", fields: ["Ağır Hasar Kayıtlı", "Plaka / Uyruk"] }
  ],
  motorcycle: [
    { title: "Motosiklet", fields: ["Marka", "Model", "Tipi", "Yıl", "Araç Durumu", "Renk"] },
    { title: "Motor", fields: ["Motor Hacmi", "Motor Gücü", "Zamanlama Tipi", "Silindir Sayısı", "Soğutma"] },
    { title: "Kullanım", fields: ["KM", "Vites", "Menşei", "Plaka / Uyruk", "Kimden", "Takas"] },
    { title: "Hasar", fields: ["Ağır Hasar Kayıtlı"] }
  ],
  housing: [
    { title: "Konut", fields: ["Emlak Tipi", "m² (Brüt)", "m² (Net)", "Oda Sayısı", "Bina Yaşı", "Bulunduğu Kat", "Kat Sayısı"] },
    { title: "Kullanım", fields: ["Isıtma", "Banyo Sayısı", "Mutfak", "Balkon", "Asansör", "Otopark", "Eşyalı"] },
    { title: "Durum", fields: ["Kullanım Durumu", "Site İçerisinde", "Aidat (TL)", "Krediye Uygun", "Tapu Durumu"] },
    { title: "İlan", fields: ["Kimden", "Takas"] }
  ],
  land: [
    { title: "Arsa", fields: ["İmar Durumu", "m²", "m² Fiyatı", "Ada No", "Parsel No", "Pafta No"] },
    { title: "Konum ve yapı", fields: ["Kaks (Emsal)", "Gabari", "Tapu Durumu", "Kat Karşılığı", "Krediye Uygun"] },
    { title: "İlan", fields: ["Kimden", "Takas"] }
  ],
  other: [{ title: "Özellikler", fields: [] }]
};

export function detectListingKind(
  favoriteListName: string | null,
  category: string | null
): ListingKind {
  const value = `${favoriteListName ?? ""} ${category ?? ""}`.toLocaleLowerCase("tr-TR");
  if (/motosiklet/.test(value)) return "motorcycle";
  if (/otomobil|arazi, suv|minivan|ticari araç|vasıta/.test(value)) return "car";
  if (/arsa/.test(value)) return "land";
  if (/konut|daire|villa|müstakil|rezidans|ev/.test(value)) return "housing";
  return "other";
}

export function groupAttributes(
  kind: ListingKind,
  attributes: Record<string, string>
): Array<{ title: string; entries: Array<[string, string]> }> {
  const used = new Set<string>();
  const groups = FIELD_GROUPS[kind].flatMap((group) => {
    const entries = group.fields.flatMap((field) => {
      const value = attributes[field];
      if (!value) return [];
      used.add(field);
      return [[field, value] as [string, string]];
    });
    return entries.length ? [{ title: group.title, entries }] : [];
  });
  const remaining = Object.entries(attributes).filter(([key]) => !used.has(key));
  if (remaining.length) groups.push({ title: kind === "other" ? "Özellikler" : "Diğer bilgiler", entries: remaining });
  return groups;
}
