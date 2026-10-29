// OS Keychain abstraction using Tauri invoke commands with browser fallback

export async function saveDeviceToken(token: string): Promise<void> {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_device_token", { token });
      return;
    } catch (err) {
      console.warn("Tauri keychain save failed, falling back to local storage:", err);
    }
  }
  localStorage.setItem("codehands_device_token", token);
}

export async function getDeviceToken(): Promise<string | null> {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const token = await invoke<string | null>("get_device_token");
      if (token) return token;
    } catch (err) {
      console.warn("Tauri keychain read failed, falling back to local storage:", err);
    }
  }
  return localStorage.getItem("codehands_device_token");
}

export async function deleteDeviceToken(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_device_token");
    } catch (err) {
      console.warn("Tauri keychain delete failed:", err);
    }
  }
  localStorage.removeItem("codehands_device_token");
}

