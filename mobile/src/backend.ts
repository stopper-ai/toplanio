import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState as NativeAppState, Platform } from "react-native";
import { createClient, processLock } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import { validateDraft } from "./domain";
import type { Community } from "./domain";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const backendConfigured = Boolean(url && anonKey);
const client = backendConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

if (client && Platform.OS !== "web") {
  if (NativeAppState.currentState === "active") client.auth.startAutoRefresh();
  NativeAppState.addEventListener("change", (state) => {
    if (state === "active") client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
}

function backend() {
  if (!client)
    throw new Error(
      "Sunucu bağlantısı henüz yapılandırılmadı. Supabase proje adresi ve açık API anahtarı gerekiyor.",
    );
  return client;
}
function authError(message: string): Error {
  if (/invalid login credentials/i.test(message))
    return new Error("E-posta adresi veya parola yanlış.");
  if (/email not confirmed/i.test(message))
    return new Error("Giriş yapmadan önce e-posta adresinizi doğrulayın.");
  if (/rate limit|too many/i.test(message))
    return new Error(
      "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.",
    );
  return new Error(
    "Hesap işlemi tamamlanamadı. Bağlantınızı ve bilgilerinizi kontrol edip tekrar deneyin.",
  );
}

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await backend().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw authError(error.message);
  return data.user;
}
export async function signUp(
  email: string,
  password: string,
): Promise<{ user: User | null; confirmationRequired: boolean }> {
  if (password.length < 8)
    throw new Error("Parolanız en az 8 karakter olmalı.");
  const { data, error } = await backend().auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw authError(error.message);
  return { user: data.user, confirmationRequired: !data.session };
}
export async function signOut(): Promise<void> {
  const { error } = await backend().auth.signOut({ scope: "local" });
  if (error) throw authError(error.message);
}
export async function getCurrentUser(): Promise<User | null> {
  const { data: sessionData, error: sessionError } =
    await backend().auth.getSession();
  if (sessionError) throw authError(sessionError.message);
  if (!sessionData.session) return null;
  const { data, error } = await backend().auth.getUser();
  if (error) throw authError(error.message);
  return data.user;
}
async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Bu işlem için hesabınıza giriş yapın.");
  return user;
}
type CommunityRow = {
  id: string;
  name: string;
  type: string;
  slug: string;
  description: string;
  color: string;
  logo_url: string | null;
  created_at: string;
};
function toCommunity(row: CommunityRow): Community {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    slug: row.slug,
    description: row.description,
    color: row.color,
    createdAt: row.created_at,
    ...(row.logo_url ? { logoUri: row.logo_url } : {}),
  };
}
const columns = "id,name,type,slug,description,color,logo_url,created_at";
export async function fetchCommunities(): Promise<Community[]> {
  const user = await requireUser();
  const { data, error } = await backend()
    .from("communities")
    .select(columns)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(
      "Topluluklarınız sunucudan alınamadı. Lütfen tekrar deneyin.",
    );
  return (data as CommunityRow[]).map(toCommunity);
}
const LOGO_BUCKET = "community-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function prepareLogo(
  logoUri: string | undefined,
  userId: string,
): Promise<{ url: string | null; uploadedPath?: string }> {
  if (!logoUri) return { url: null };
  if (/^https:\/\//i.test(logoUri)) return { url: logoUri };
  const match =
    /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(
      logoUri,
    );
  if (!match)
    throw new Error(
      "Logo için PNG, JPEG veya WebP biçiminde bir görsel seçin.",
    );
  const contentType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const encoded = match[2];
  if (
    !encoded.length ||
    encoded.length % 4 !== 0 ||
    encoded.length > Math.ceil(MAX_LOGO_BYTES / 3) * 4
  ) {
    throw new Error(
      "Logo en fazla 2 MB olabilir. Daha küçük bir görsel seçin.",
    );
  }
  const body = decode(encoded);
  if (!body.byteLength || body.byteLength > MAX_LOGO_BYTES)
    throw new Error("Logo en fazla 2 MB olabilir.");
  const bytes = new Uint8Array(body);
  const validHeader =
    contentType === "image/png"
      ? bytes.length >= 8 &&
        [137, 80, 78, 71, 13, 10, 26, 10].every(
          (value, index) => bytes[index] === value,
        )
      : contentType === "image/jpeg"
        ? bytes.length >= 3 &&
          bytes[0] === 255 &&
          bytes[1] === 216 &&
          bytes[2] === 255
        : bytes.length >= 12 &&
          String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
          String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!validHeader)
    throw new Error("Logo dosyası okunamadı. Başka bir görsel seçin.");
  const extension =
    contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
  const path = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}.${extension}`;
  const { error } = await backend()
    .storage.from(LOGO_BUCKET)
    .upload(path, body, { contentType, upsert: false });
  if (error)
    throw new Error(
      "Logo yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
    );
  const { data } = backend().storage.from(LOGO_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, uploadedPath: path };
}

export async function publishCommunity(
  community: Community,
): Promise<Community> {
  const validation = validateDraft(community);
  if (validation) throw new Error(validation);
  const user = await requireUser();
  const logo = await prepareLogo(community.logoUri, user.id);
  try {
    const { data, error } = await backend()
      .from("communities")
      .insert({
        owner_id: user.id,
        name: community.name.trim(),
        type: community.type,
        slug: community.slug,
        description: community.description.trim(),
        color: community.color.toUpperCase(),
        logo_url: logo.url,
      })
      .select(columns)
      .single();
    if (error) {
      if (error.code === "23505")
        throw new Error(
          "Bu topluluk adresi kullanılıyor. Başka bir adres seçin.",
        );
      throw new Error(
        "Topluluk sunucuya kaydedilemedi. Lütfen tekrar deneyin.",
      );
    }
    return toCommunity(data as CommunityRow);
  } catch (error) {
    if (logo.uploadedPath) {
      await backend()
        .storage.from(LOGO_BUCKET)
        .remove([logo.uploadedPath])
        .catch(() => undefined);
    }
    throw error;
  }
}
