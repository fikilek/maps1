// storage/authStorage.js
// import { authKV } from './authKV'

import { authKV } from "./mmkv";

const AUTH_CACHE_KEY = "auth_state";

export function saveAuthState(data) {
  authKV.set(
    AUTH_CACHE_KEY,
    JSON.stringify({
      ...data,
      persistedAt: Date.now(),
    })
  );
}

export function loadAuthState() {
  const raw = authKV.getString(AUTH_CACHE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthState() {
  authKV.remove(AUTH_CACHE_KEY);
}
