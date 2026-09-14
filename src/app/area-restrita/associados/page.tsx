import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMemberAdministration } from "@/lib/auth/member-administration";
import { getMembershipCategories, listMembers } from "@/lib/members/repository";
import { normalizeMemberListParams } from "@/lib/members/validation";

export const metadata: Metadata = {
  title: "Gestão de Associados — TechLab+ ACASA",
};

interface AssociadosPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    personType?: string;
    category?: string;
    page?: string;
  }>;
}

function buildQueryString(params: {
  q?: string;
  personType?: string;
  category?: string;
  page?: number;
}): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.personType) query.set("personType", params.personType);
  if (params.category) query.set("category", params.category);
  if (params.page && params.page > 1) query.set("page", String(params.page));

  const str = query.toString();
  return str ? `?${str}` : "";
}

export default async function AssociadosPage({ searchParams }: AssociadosPageProps) {
  await requireMemberAdministration();

  const rawParams = await searchParams;
  const listParams = normalizeMemberListParams(rawParams);

  const [result, categories] = await Promise.all([
    listMembers(listParams),
    getMembershipCategories(),
  ]);

  const { items: members, page, totalCount, totalPages } = result;

  // Redirecionamento canônico: quando há registros (totalCount > 0) e a página solicitada
  // excede totalPages, redireciona para a última página válida preservando os filtros.
  if (totalCount > 0 && page > totalPages) {
    const canonicalQuery = buildQueryString({
      q: listParams.q,
      personType: listParams.personType,
      category: listParams.category,
      page: totalPages,
    });
    redirect(`/area-restrita/associados${canonicalQuery}`);
  }

  const categoryMap = new Map(categories.map((c) => [c.code, c.name]));
  const hasActiveFilters = Boolean(listParams.q || listParams.personType || listParams.category);

  const prevQuery = buildQueryString({
    q: listParams.q,
    personType: listParams.personType,
    category: listParams.category,
    page: page - 1,
  });

  const nextQuery = buildQueryString({
    q: listParams.q,
    personType: listParams.personType,
    category: listParams.category,
    page: page + 1,
  });

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
        {rawParams.status === "cadastrado" && (
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
              Administração — P2-03
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Associados
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta, pesquisa textual e filtros do cadastro administrativo.
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

        {/* Formulário de Pesquisa e Filtros */}
        <section aria-labelledby="filtros-titulo" className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 id="filtros-titulo" className="text-base font-semibold text-slate-900">
            Filtrar associados
          </h2>
          <form method="GET" action="/area-restrita/associados" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div>
              <label htmlFor="q" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Nome ou razão social
              </label>
              <input
                type="search"
                id="q"
                name="q"
                defaultValue={listParams.q ?? ""}
                placeholder="Pesquisar por nome..."
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label htmlFor="personType" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tipo de pessoa
              </label>
              <select
                id="personType"
                name="personType"
                defaultValue={listParams.personType ?? ""}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">Todos os tipos</option>
                <option value="PF">Pessoa Física (PF)</option>
                <option value="PJ">Pessoa Jurídica (PJ)</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Categoria estatutária
              </label>
              <select
                id="category"
                name="category"
                defaultValue={listParams.category ?? ""}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Aplicar filtros
              </button>
              {hasActiveFilters && (
                <Link
                  href="/area-restrita/associados"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  Limpar
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Listagem */}
        <section aria-labelledby="lista-associados" className="mt-8">
          <h2 id="lista-associados" className="sr-only">
            Lista de associados cadastrados
          </h2>

          {members.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              {hasActiveFilters ? (
                <>
                  <p className="text-base font-medium text-slate-700">
                    Nenhum associado encontrado para os filtros informados.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Tente ajustar o termo de pesquisa ou selecionar outros filtros.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/area-restrita/associados"
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      Limpar todos os filtros
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-medium text-slate-700">
                    Nenhum associado cadastrado até o momento.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Utilize o botão acima para incluir o primeiro associado.
                  </p>
                </>
              )}
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
                            className="font-semibold text-slate-900 underline hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação acessível */}
              <nav
                aria-label="Paginação de associados"
                className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row"
              >
                <p className="text-sm text-slate-600">
                  {`Mostrando página ${page} de ${totalPages} (total de ${totalCount} associado${totalCount === 1 ? "" : "s"})`}
                </p>

                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={`/area-restrita/associados${prevQuery}`}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      ← Anterior
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="inline-flex cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400"
                    >
                      ← Anterior
                    </span>
                  )}

                  {page < totalPages ? (
                    <Link
                      href={`/area-restrita/associados${nextQuery}`}
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      Próxima →
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="inline-flex cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400"
                    >
                      Próxima →
                    </span>
                  )}
                </div>
              </nav>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
