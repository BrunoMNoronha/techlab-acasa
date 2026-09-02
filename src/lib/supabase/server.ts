import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Integra com `cookies()` do Next.js usando exclusivamente `getAll`/`setAll`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components não podem gravar cookies. É seguro ignorar aqui
          // porque o Proxy (`src/proxy.ts`) renova a sessão e regrava os cookies.
        }
      },
    },
  });
}
