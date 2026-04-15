// API Client for frontend to communicate with Express backend
import { getAuthToken } from "../auth/authState.js";

function getRuntimeApiBase() {
  const runtimeBase =
    window.__APP_CONFIG__?.API_BASE || window.__API_BASE__ || "/api";

  return String(runtimeBase).replace(/\/$/, "");
}

const API_BASE = getRuntimeApiBase();

class APIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
  }

  getAuthHeaders() {
    const token = getAuthToken();
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  }

  buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });
    const q = query.toString();
    return q ? `?${q}` : "";
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth API
  auth = {
    register: (data) =>
      this.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data) =>
      this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    profile: () => this.request("/auth/profile"),
    logout: () => {
      localStorage.removeItem("pl_dedup_auth");
      localStorage.removeItem("pl_dedup_user");
    },
  };

  // Price List API (Phase A)
  prices = {
    upload: (data) =>
      this.request("/prices/upload", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getAll: ({ search = "", status = "all" } = {}) =>
      this.request(`/prices${this.buildQuery({ search, status })}`),
    create: (data) =>
      this.request("/prices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      this.request(`/prices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id, data = {}) =>
      this.request(`/prices/${id}`, {
        method: "DELETE",
        body: JSON.stringify(data),
      }),
    getDuplicates: () => this.request("/prices/duplicates"),
    removeDuplicate: (id, data = {}) =>
      this.request(`/prices/remove-duplicate/${id}`, {
        method: "DELETE",
        body: JSON.stringify(data),
      }),
    resolve: (data) =>
      this.request("/prices/resolve", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getStats: () => this.request("/prices/stats"),
    downloadCleaned: () => {
      window.location.href = `${this.baseURL}/prices/download-cleaned`;
    },
  };
}

export default new APIClient();
