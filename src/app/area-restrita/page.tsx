import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthenticatedIdentity } from "@/lib/auth/identity";
import { LogoutForm } from "./logout-form";

export const metadata: Metadata = {
  title: "Área restrita — TechLab+ ACASA",
};

export default async function ProtectedAreaPage() {
  // Validação server-side própria com getClaims(); não depende do Proxy.
  await requireAuthenticatedIdentity();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 sm:px-10 lg:px-16">
      <section aria-labelledby="page-title" className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
          TechLab+ ACASA
        </p>

        <h1 id="page-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Área restrita
        </h1>

        <p className="mt-4 text-lg text-slate-700">
          Sessão autenticada e validada no servidor.
        </p>

        <div className="mt-6 rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Módulos Administrativos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Acesso condicionado à capacidade correspondente:
          </p>
          <div className="mt-3">
            <Link
              href="/area-restrita/associados"
              className="inline-flex items-center text-sm font-semibold text-slate-900 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              Gestão de associados (P2-02) →
            </Link>
          </div>
        </div>

        <LogoutForm />
      </section>
    </main>
  );
}
