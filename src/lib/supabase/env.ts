export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

const URL_VARIABLE = "NEXT_PUBLIC_SUPABASE_URL";
const KEY_VARIABLE = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

/** Prefixo das chaves secretas do Supabase; jamais podem ser públicas. */
const SECRET_KEY_PREFIX = "sb_secret_";

/**
 * As mensagens nomeiam a variável e o problema, mas nunca ecoam o valor
 * recebido: podem acabar em logs, terminal de CI ou relatórios.
 */
function configError(variable: string, problem: string): Error {
  return new Error(`Configuração Supabase inválida: ${variable} ${problem}.`);
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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

  if (!url) {
    throw configError(URL_VARIABLE, "não está definida");
  }

  if (!isHttpUrl(url)) {
    throw configError(URL_VARIABLE, "não é uma URL http(s) válida");
  }

  if (!publishableKey) {
    throw configError(KEY_VARIABLE, "não está definida");
  }

  if (publishableKey.startsWith(SECRET_KEY_PREFIX)) {
    // Uma chave secreta com prefixo NEXT_PUBLIC_ seria incorporada ao bundle do navegador.
    throw configError(
      KEY_VARIABLE,
      "contém uma chave secreta; use somente a chave publicável (sb_publishable_...)",
    );
  }

  return { url, publishableKey };
}
