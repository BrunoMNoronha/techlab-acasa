import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { Notice } from "@/components/auth/form-message";
import { loginNotices, resolveNotice } from "@/lib/auth/messages";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — TechLab+ ACASA",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { status } = await searchParams;

  return (
    <AuthPage
      title="Entrar"
      description="Acesse com o e-mail e a senha da sua conta."
    >
      <Notice message={resolveNotice(loginNotices, status)} />
      <LoginForm />
    </AuthPage>
  );
}
