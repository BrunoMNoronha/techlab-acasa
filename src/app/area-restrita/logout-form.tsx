"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/auth/form-message";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { logout } from "./actions";

const MESSAGE_ID = "logout-message";

export function LogoutForm() {
  const [state, formAction, pending] = useActionState(logout, initialAuthFormState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <FormMessage id={MESSAGE_ID} state={state} />

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        aria-describedby={state.status === "error" ? MESSAGE_ID : undefined}
        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saindo…" : "Sair"}
      </button>
    </form>
  );
}
