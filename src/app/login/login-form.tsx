"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  buttonClassName,
  inputClassName,
  labelClassName,
  linkClassName,
} from "@/components/auth/auth-page";
import { FormMessage } from "@/components/auth/form-message";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { PASSWORD_RECOVERY_PATH } from "@/lib/auth/routes";
import { login } from "./actions";

const MESSAGE_ID = "login-message";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialAuthFormState);
  const hasError = state.status === "error";

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage id={MESSAGE_ID} state={state} />

      <div>
        <label htmlFor="email" className={labelClassName}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? MESSAGE_ID : undefined}
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClassName}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? MESSAGE_ID : undefined}
          className={inputClassName}
        />
      </div>

      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClassName}>
        {pending ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-sm text-slate-600">
        <Link href={PASSWORD_RECOVERY_PATH} className={linkClassName}>
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
