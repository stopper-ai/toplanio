import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseStoredState } from "./domain";
import type { AppState } from "./domain";

export const STORAGE_KEY = "@toplanio/mobile/state/v1";

export async function loadState(): Promise<AppState> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error("Cihazınızdaki bilgiler açılamadı. Lütfen tekrar deneyin.");
  }
  return parseStoredState(raw);
}

let pending: Promise<void> = Promise.resolve();
export function saveState(state: AppState): Promise<void> {
  let serialized: string;
  try {
    serialized = JSON.stringify(state);
    parseStoredState(serialized);
  } catch (error) {
    return Promise.reject(
      error instanceof Error
        ? error
        : new Error("Bilgiler kaydedilmeye uygun değil."),
    );
  }
  const write = pending
    .catch(() => undefined)
    .then(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, serialized);
      } catch {
        throw new Error(
          "Değişiklikler cihaza kaydedilemedi. Lütfen tekrar deneyin.",
        );
      }
    });
  pending = write;
  return write;
}
