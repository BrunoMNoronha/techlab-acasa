import type { Metadata } from "next";
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
          Sessão autenticada e validada no servidor. Esta área ainda não possui
          funcionalidades de negócio.
        </p>

        <LogoutForm />
      </section>
    </main>
  );
}
