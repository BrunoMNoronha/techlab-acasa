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
import { LOGIN_PATH } from "@/lib/auth/routes";
import { requestPasswordRecovery } from "./actions";

const MESSAGE_ID = "recovery-message";

export function RecoveryForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordRecovery,
    initialAuthFormState,
  );
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

      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClassName}>
        {pending ? "Enviando…" : "Enviar instruções"}
      </button>

      <p className="text-sm text-slate-600">
        <Link href={LOGIN_PATH} className={linkClassName}>
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
