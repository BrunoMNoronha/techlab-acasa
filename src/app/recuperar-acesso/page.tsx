import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { Notice } from "@/components/auth/form-message";
import { recoveryNotices, resolveNotice } from "@/lib/auth/messages";
import { RecoveryForm } from "./recovery-form";

export const metadata: Metadata = {
  title: "Recuperar acesso — TechLab+ ACASA",
};

type RecoveryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const { erro } = await searchParams;

  return (
    <AuthPage
      title="Recuperar acesso"
      description="Informe o e-mail da sua conta para receber instruções de redefinição de senha."
    >
      <Notice message={resolveNotice(recoveryNotices, erro)} />
      <RecoveryForm />
    </AuthPage>
  );
}
