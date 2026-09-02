import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { getAuthenticatedIdentity } from "@/lib/auth/identity";
import { PASSWORD_RECOVERY_PATH } from "@/lib/auth/routes";
import { PasswordResetForm } from "./password-reset-form";

export const metadata: Metadata = {
  title: "Definir nova senha — TechLab+ ACASA",
};

export default async function PasswordResetPage() {
  // A sessão de recuperação é criada pelo callback PKCE e validada aqui no servidor.
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    redirect(`${PASSWORD_RECOVERY_PATH}?erro=sessao-invalida`);
  }

  return (
    <AuthPage
      title="Definir nova senha"
      description="Escolha uma nova senha para a sua conta."
    >
      <PasswordResetForm />
    </AuthPage>
  );
}
