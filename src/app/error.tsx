"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Fallback genérico para erros inesperados de renderização no App Router.
 * Não exibe mensagem interna, stack, `digest` nem configuração: o registro
 * server-side é feito centralmente por `onRequestError` (`src/instrumentation.ts`).
 */
export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 sm:px-10">
      <section
        role="alert"
        aria-labelledby="error-title"
        className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
          TechLab+ ACASA
        </p>

        <h1 id="error-title" className="text-2xl font-semibold tracking-tight">
          Algo deu errado
        </h1>

        <p className="mt-2 text-slate-600">
          Ocorreu um erro inesperado ao carregar esta página. Tente novamente; se o
          problema persistir, entre em contato com a administração.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800"
          >
            Tentar novamente
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-800 hover:bg-slate-100"
          >
            Ir para a página inicial
          </Link>
        </div>
      </section>
    </main>
  );
}
