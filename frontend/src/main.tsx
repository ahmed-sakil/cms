import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./index.css";

// Automatically route API and upload requests to remote backend when VITE_API_URL is configured
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
if (API_ORIGIN) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") {
      if (input.startsWith("/api") || input.startsWith("/uploads")) {
        return originalFetch(`${API_ORIGIN}${input}`, init);
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith("/api") || input.pathname.startsWith("/uploads")) {
        const rewritten = new URL(`${API_ORIGIN}${input.pathname}${input.search}`);
        return originalFetch(rewritten, init);
      }
    }
    return originalFetch(input, init);
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
