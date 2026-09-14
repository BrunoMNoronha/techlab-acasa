import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberAdministration } from "@/lib/auth/member-administration";
import { updateMemberAction } from "@/lib/members/actions";
import { getMemberById, getMembershipCategories } from "@/lib/members/repository";
import { isValidUuid } from "@/lib/members/validation";
import { MemberForm } from "../../member-form";

export const metadata: Metadata = {
  title: "Editar Associado — TechLab+ ACASA",
};

interface EditarAssociadoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarAssociadoPage({ params }: EditarAssociadoPageProps) {
  await requireMemberAdministration();

  const { id } = await params;

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

  const updateAction = updateMemberAction.bind(null, member.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Navegação estrutural" className="mb-6">
          <Link
            href={`/area-restrita/associados/${member.id}`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            ← Voltar para detalhes do associado
          </Link>
        </nav>

        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
            Administração — P2-02
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Editar associado
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Atualize exclusivamente os dados de negócio permitidos. O identificador e os registros de auditoria do banco são imutáveis.
          </p>
        </header>

        <MemberForm
          initialData={member}
          categories={categories}
          action={updateAction}
          submitLabel="Salvar alterações"
        />
      </div>
    </main>
  );
}
