import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberAdministration } from "@/lib/auth/member-administration";
import { getMemberById, getMembershipCategories } from "@/lib/members/repository";
import { isValidUuid } from "@/lib/members/validation";

export const metadata: Metadata = {
  title: "Detalhes do Associado — TechLab+ ACASA",
};

interface MemberDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function MemberDetailsPage({
  params,
  searchParams,
}: MemberDetailsPageProps) {
  // A autorização deve ser a primeira barreira antes de qualquer inspeção de ID
  await requireMemberAdministration();

  const [{ id }, { status }] = await Promise.all([params, searchParams]);

  if (!isValidUuid(id)) {
    notFound();
  }

  const [member, categories] = await Promise.all([
    getMemberById(id),
    getMembershipCategories(),
  ]);

  if (!member) {
    notFound();
  }

  const categoryName =
    categories.find((c) => c.code === member.membership_category_code)?.name ??
    member.membership_category_code;

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

        {status === "cadastrado" && (
          <div
            role="status"
            className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
          >
            Associado cadastrado com sucesso.
          </div>
        )}

        {status === "atualizado" && (
          <div
            role="status"
            className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
          >
            Dados do associado atualizados com sucesso.
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
              Administração — P2-02
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {member.name}
            </h1>
          </div>

          <div>
            <Link
              href={`/area-restrita/associados/${member.id}/editar`}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Editar associado
            </Link>
          </div>
        </div>

        <section aria-labelledby="dados-associado" className="mt-8">
          <h2 id="dados-associado" className="sr-only">
            Dados cadastrais do associado
          </h2>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Tipo de pessoa</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {member.person_type === "PF" ? "Pessoa Física (PF)" : "Pessoa Jurídica (PJ)"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500">Categoria estatutária</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{categoryName}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500">E-mail</dt>
                <dd className="mt-1 text-sm text-slate-900">{member.email ?? "Não informado"}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500">Telefone</dt>
                <dd className="mt-1 text-sm text-slate-900">{member.phone ?? "Não informado"}</dd>
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-4 text-xs text-slate-500 flex flex-col sm:flex-row gap-4 justify-between">
                <span>
                  Registro no sistema:{" "}
                  {new Date(member.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>
                  Última alteração:{" "}
                  {new Date(member.updated_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
