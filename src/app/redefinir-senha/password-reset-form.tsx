"use client";

import { useActionState } from "react";
import {
  buttonClassName,
  inputClassName,
  labelClassName,
} from "@/components/auth/auth-page";
import { FormMessage } from "@/components/auth/form-message";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import { updatePassword } from "./actions";

const MESSAGE_ID = "password-reset-message";
const HINT_ID = "password-hint";

export function PasswordResetForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialAuthFormState);
  const hasError = state.status === "error";
  const describedBy = [HINT_ID, hasError ? MESSAGE_ID : null].filter(Boolean).join(" ");

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage id={MESSAGE_ID} state={state} />

      <div>
        <label htmlFor="password" className={labelClassName}>
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={inputClassName}
        />
        <p id={HINT_ID} className="mt-1 text-sm text-slate-600">
          Use pelo menos {MIN_PASSWORD_LENGTH} caracteres.
        </p>
      </div>

      <div>
        <label htmlFor="passwordConfirmation" className={labelClassName}>
          Confirme a nova senha
        </label>
        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? MESSAGE_ID : undefined}
          className={inputClassName}
        />
      </div>

      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClassName}>
        {pending ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
