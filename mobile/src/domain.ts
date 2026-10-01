/** Phase 1 device-local models. These records are not published communities. */
export type Draft = {
  name: string;
  type: string;
  slug: string;
  description: string;
  color: string;
  logoUri?: string;
};
export type Community = Draft & { id: string; createdAt: string };
export type AppState = {
  version: 1;
  communities: Community[];
  draft: Draft;
  displayName: string;
};

export const categories: string[] = [
  "Spor ve outdoor",
  "Üniversite ve öğrenci kulübü",
  "Mezun topluluğu",
  "Hobi ve koleksiyon",
  "Sanat ve kültür",
  "Profesyonel topluluk",
  "Arkadaş grubu",
  "Futbol takımı ve taraftar grubu",
  "Basketbol takımı",
  "Bisiklet grubu",
  "Koşu ve yürüyüş grubu",
  "Yelken ve su sporları",
  "Kamp ve doğa topluluğu",
  "Fitness ve yoga grubu",
  "Oyun ve e-spor ekibi",
  "Kart oyunları topluluğu",
  "Kitap ve okuma kulübü",
  "Sinema kulübü",
  "Tiyatro topluluğu",
  "Müzik grubu",
  "Dans topluluğu",
  "Fotoğrafçılık kulübü",
  "Teknoloji ve yazılım topluluğu",
  "Girişimcilik ve iş ağı",
  "Eğitim ve çalışma grubu",
  "Dernek ve gönüllü ağı",
  "Ebeveyn topluluğu",
  "Evcil hayvan topluluğu",
  "Gastronomi ve yemek kulübü",
  "Diğer",
];

export const emptyDraft: Draft = {
  name: "",
  type: categories[0],
  slug: "",
  description: "",
  color: "#FF4D00",
};
export function initialState(): AppState {
  return {
    version: 1,
    communities: [],
    draft: { ...emptyDraft },
    displayName: "",
  };
}

export function slugify(input: string): string {
  return input
    .trim()
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasDraftShape(value: unknown): value is Draft {
  return (
    isRecord(value) &&
    ["name", "type", "slug", "description", "color"].every(
      (key) => typeof value[key] === "string",
    ) &&
    (value.logoUri === undefined || typeof value.logoUri === "string")
  );
}

export function validateDraft(draft: Draft): string | null {
  if (!hasDraftShape(draft))
    return "Topluluk bilgileri okunamadı. Lütfen alanları kontrol edin.";
  const name = draft.name.trim();
  if (name.length < 2)
    return "Topluluğunuz için en az 2 karakterlik bir ad yazın.";
  if (name.length > 60) return "Topluluk adı en fazla 60 karakter olabilir.";
  if (!categories.includes(draft.type))
    return "Listeden bir topluluk türü seçin.";
  if (!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(draft.slug)) {
    return "Adres 3–48 karakter olmalı; küçük harf, rakam ve tire kullanabilirsiniz.";
  }
  if (draft.description.trim().length > 500)
    return "Açıklama en fazla 500 karakter olabilir.";
  if (!/^#[0-9a-f]{6}$/i.test(draft.color))
    return "Geçerli bir topluluk rengi seçin.";
  return null;
}

export function createCommunity(
  draft: Draft,
  existing: Community[],
): Community {
  const error = validateDraft(draft);
  if (error) throw new Error(error);
  if (
    existing.some(
      (item) => item.slug.toLowerCase() === draft.slug.toLowerCase(),
    )
  ) {
    throw new Error(
      "Bu adresi bu cihazda zaten kullandınız. Başka bir adres seçin.",
    );
  }
  return {
    name: draft.name.trim(),
    type: draft.type,
    slug: draft.slug,
    description: draft.description.trim(),
    color: draft.color.toUpperCase(),
    ...(draft.logoUri ? { logoUri: draft.logoUri } : {}),
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
    createdAt: new Date().toISOString(),
  };
}

/** Reject corruption instead of silently replacing a user's saved work. */
export function parseStoredState(raw: string | null): AppState {
  if (raw === null) return initialState();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "Kaydedilen bilgiler okunamadı. Mevcut verileriniz değiştirilmedi.",
    );
  }
  if (!isRecord(data) || data.version !== 1) {
    throw new Error(
      "Kayıt biçimi bu uygulama sürümüyle uyumlu değil. Mevcut verileriniz değiştirilmedi.",
    );
  }
  if (
    !Array.isArray(data.communities) ||
    !hasDraftShape(data.draft) ||
    typeof data.displayName !== "string"
  ) {
    throw new Error(
      "Kaydedilen bilgiler eksik. Mevcut verileriniz değiştirilmedi.",
    );
  }
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const communities: Community[] = [];
  for (const candidate of data.communities) {
    if (!hasDraftShape(candidate)) {
      throw new Error(
        "Kaydedilen topluluk bilgileri doğrulanamadı. Mevcut verileriniz değiştirilmedi.",
      );
    }
    const entry = candidate as Draft & Record<string, unknown>;
    if (
      validateDraft(entry) ||
      typeof entry.id !== "string" ||
      !entry.id ||
      typeof entry.createdAt !== "string" ||
      !Number.isFinite(Date.parse(entry.createdAt)) ||
      ids.has(entry.id) ||
      slugs.has(entry.slug)
    ) {
      throw new Error(
        "Kaydedilen topluluk bilgileri doğrulanamadı. Mevcut verileriniz değiştirilmedi.",
      );
    }
    ids.add(entry.id);
    slugs.add(entry.slug);
    communities.push({
      name: entry.name,
      type: entry.type,
      slug: entry.slug,
      description: entry.description,
      color: entry.color,
      ...(entry.logoUri ? { logoUri: entry.logoUri } : {}),
      id: entry.id,
      createdAt: entry.createdAt,
    });
  }
  return {
    version: 1,
    communities,
    draft: {
      name: data.draft.name,
      type: data.draft.type,
      slug: data.draft.slug,
      description: data.draft.description,
      color: data.draft.color,
      ...(data.draft.logoUri ? { logoUri: data.draft.logoUri } : {}),
    },
    displayName: data.displayName,
  };
}
