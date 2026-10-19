import type { ApiResponse } from "../types/index.js";

const API_BASE = "/api/v1";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: Response | PromiseLike<Response>) => void;
  reject: (reason?: any) => void;
  input: RequestInfo | URL;
  init?: RequestInit;
}> = [];

const processQueue = (error: Error | null, newToken: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      const updatedInit = { ...prom.init };
      const headers = new Headers(updatedInit.headers || {});
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
      }
      updatedInit.headers = headers;
      fetch(prom.input, updatedInit).then(prom.resolve, prom.reject);
    }
  });
  failedQueue = [];
};

/**
 * Enhanced fetch wrapper with automatic JWT authorization header injection
 * and seamless background token refresh on HTTP 401 Unauthorized responses.
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("cms_token");
  const headers = new Headers(init.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure JSON Content-Type if payload is present and not FormData
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Normalize relative paths with API_BASE
  let targetUrl = input;
  if (typeof input === "string") {
    if (!input.startsWith("http") && !input.startsWith("/api")) {
      targetUrl = input.startsWith("/") ? `${API_BASE}${input}` : `${API_BASE}/${input}`;
    }
  }

  const response = await fetch(targetUrl, { ...init, headers });

  // Handle token expiry / 401
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("cms_refresh_token");

    // Do not attempt refresh for the refresh endpoint itself or login
    const urlString = typeof input === "string" ? input : input.toString();
    if (urlString.includes("/auth/refresh") || urlString.includes("/auth/login") || !refreshToken) {
      return response;
    }

    if (isRefreshing) {
      // Queue requests until refresh completes
      return new Promise<Response>((resolve, reject) => {
        failedQueue.push({ resolve, reject, input, init });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const refreshJson: ApiResponse<{ accessToken: string; refreshToken?: string }> = await refreshRes.json();

      if (refreshRes.ok && refreshJson.success && refreshJson.data) {
        const { accessToken, refreshToken: newRefreshToken } = refreshJson.data;
        localStorage.setItem("cms_token", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("cms_refresh_token", newRefreshToken);
        }

        // Retry the original request with new token
        headers.set("Authorization", `Bearer ${accessToken}`);
        const retryResponse = await fetch(input, { ...init, headers });

        processQueue(null, accessToken);
        return retryResponse;
      } else {
        // Refresh token invalid or expired
        processQueue(new Error("Session expired"), null);
        localStorage.removeItem("cms_token");
        localStorage.removeItem("cms_refresh_token");
        localStorage.removeItem("cms_user");
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return response;
      }
    } catch (err: any) {
      processQueue(err, null);
      return response;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

export const apiClient = {
  fetch: apiFetch,
  async get<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await apiFetch(url, { ...init, method: "GET" });
    return res.json();
  },
  async post<T>(url: string, data?: any, init?: RequestInit): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    const res = await apiFetch(url, {
      ...init,
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
  },
  async patch<T>(url: string, data?: any, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await apiFetch(url, {
      ...init,
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await apiFetch(url, { ...init, method: "DELETE" });
    return res.json();
  },
};
