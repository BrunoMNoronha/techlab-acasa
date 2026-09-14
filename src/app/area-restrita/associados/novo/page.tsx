import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberAdministration } from "@/lib/auth/member-administration";
import { createMemberAction } from "@/lib/members/actions";
import { getMembershipCategories } from "@/lib/members/repository";
import { MemberForm } from "../member-form";

export const metadata: Metadata = {
  title: "Novo Associado — TechLab+ ACASA",
};

export default async function NovoAssociadoPage() {
  await requireMemberAdministration();

  const categories = await getMembershipCategories();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Navegação estrutural" className="mb-6">
          <Link
            href="/area-restrita/associados"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            ← Voltar para listagem de associados
          </Link>
        </nav>

        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
            Administração — P2-02
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Cadastrar associado
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Preencha os campos mínimos de negócio aprovados para inclusão de associado.
          </p>
        </header>

        <MemberForm
          categories={categories}
          action={createMemberAction}
          submitLabel="Cadastrar associado"
        />
      </div>
    </main>
  );
}
