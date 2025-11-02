/**
 * Authentication utility functions for handling JWT tokens
 */

/**
 * Gets the JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("session_token");
}

/**
 * Sets the JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("session_token", token);
}

/**
 * Removes the JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("session_token");
}

/**
 * Makes an authenticated fetch request with JWT token in Authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("🔐 authenticatedFetch - Adding Authorization header");
  } else {
    console.warn("⚠️ authenticatedFetch - No token found in localStorage");
  }

  console.log("📡 authenticatedFetch - URL:", url);

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Checks if user is authenticated by verifying token exists
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

