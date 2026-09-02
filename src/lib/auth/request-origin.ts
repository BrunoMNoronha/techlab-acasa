import { headers } from "next/headers";

/**
 * Deriva a origem (esquema + host) da requisição atual. O Supabase valida o
 * `redirectTo` contra a allow-list configurada (`site_url` e
 * `additional_redirect_urls`), o que impede redirecionamento para hosts
 * não autorizados mesmo que os cabeçalhos sejam manipulados.
 */
export function resolveOriginFromHeaders(requestHeaders: Headers): string | null {
  const origin = requestHeaders.get("origin");

  if (origin && /^https?:\/\/[^/\s]+$/.test(origin)) {
    return origin;
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return null;
  }

  const protocol = requestHeaders.get("x-forwarded-proto") === "https" ? "https" : "http";

  return `${protocol}://${host}`;
}

export async function getRequestOrigin(): Promise<string | null> {
  return resolveOriginFromHeaders(await headers());
}
