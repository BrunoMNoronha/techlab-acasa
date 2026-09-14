import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberAdministration } from "@/lib/auth/member-administration";
import { getMembershipCategories, listMembers } from "@/lib/members/repository";

export const metadata: Metadata = {
  title: "Gestão de Associados — TechLab+ ACASA",
};

interface AssociadosPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AssociadosPage({ searchParams }: AssociadosPageProps) {
  await requireMemberAdministration();

  const [{ status }, members, categories] = await Promise.all([
    searchParams,
    listMembers(),
    getMembershipCategories(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.code, c.name]));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        {/* Navegação / Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-6">
          <Link
            href="/area-restrita"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            ← Voltar para Área restrita
          </Link>
        </nav>

        {/* Feedback de status seguro */}
        {status === "cadastrado" && (
          <div
            role="status"
            className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
          >
            Associado cadastrado com sucesso.
          </div>
        )}

        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
              Administração — P2-02
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Associados
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Cadastro administrativo mínimo utilizável por operadores autorizados.
            </p>
          </div>

          <div>
            <Link
              href="/area-restrita/associados/novo"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Novo associado
            </Link>
          </div>
        </div>

        {/* Listagem */}
        <section aria-labelledby="lista-associados" className="mt-8">
          <h2 id="lista-associados" className="sr-only">
            Lista de associados cadastrados
          </h2>

          {members.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-base font-medium text-slate-700">
                Nenhum associado cadastrado até o momento.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Utilize o botão acima para incluir o primeiro associado.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Nome / Razão social
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Categoria
                      </th>
                      <th scope="col" className="px-6 py-3">
                        E-mail
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Telefone
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                          {member.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                            {member.person_type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {categoryMap.get(member.membership_category_code) ??
                            member.membership_category_code}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {member.email ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {member.phone ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <Link
                            href={`/area-restrita/associados/${member.id}`}
                            className="font-semibold text-slate-900 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-slate-900"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
