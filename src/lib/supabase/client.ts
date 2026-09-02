import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./env";

/**
 * Cliente Supabase para Client Components. Usa apenas variáveis públicas e
 * armazena a sessão em cookies, compartilhados com o servidor via `@supabase/ssr`.
 */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabasePublicConfig();

  return createBrowserClient(url, publishableKey);
}
