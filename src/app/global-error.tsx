"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Fallback para erros no layout raiz. Substitui o layout inteiro, por isso
 * precisa renderizar `<html>`/`<body>` próprios e não recebe os estilos
 * globais (estilos mínimos inline). Nunca exibe detalhes técnicos.
 */
export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#020617",
        }}
      >
        <main
          role="alert"
          aria-labelledby="global-error-title"
          style={{ maxWidth: "28rem", margin: "0 auto", padding: "4rem 1.5rem" }}
        >
          <h1 id="global-error-title" style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
            Algo deu errado
          </h1>

          <p style={{ margin: "0 0 2rem", color: "#475569" }}>
            Ocorreu um erro inesperado. Tente novamente; se o problema persistir,
            entre em contato com a administração.
          </p>

          <button
            type="button"
            onClick={() => retry()}
            style={{
              padding: "0.625rem 1rem",
              borderRadius: "0.5rem",
              border: 0,
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
