export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

/**
 * Lê a configuração pública do Supabase. Somente variáveis `NEXT_PUBLIC_*`
 * são usadas pela aplicação: a chave publicável pode chegar ao navegador e o
 * acesso a dados continua limitado por autorização server-side e RLS.
 *
 * Os acessos a `process.env.NEXT_PUBLIC_*` são literais para que o Next.js
 * consiga substituí-los em tempo de build nos bundles de cliente.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Configuração Supabase ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}
