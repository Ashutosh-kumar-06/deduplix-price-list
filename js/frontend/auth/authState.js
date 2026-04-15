// ==================== AUTH STATE MANAGER ====================

const AUTH_STORAGE_KEY = "pl_dedup_auth";
const USER_STORAGE_KEY = "pl_dedup_user";

export function getAuthToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export function getCurrentAuthUser() {
  const json = localStorage.getItem(USER_STORAGE_KEY);
  return json ? JSON.parse(json) : null;
}

export function setAuth(token, user) {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function isAuthenticated() {
  return !!getAuthToken();
}
