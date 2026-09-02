import type { AuthFormState } from "@/lib/auth/form-state";

type FormMessageProps = {
  id: string;
  state: AuthFormState;
};

/** Mensagem de resultado do formulário, anunciada por tecnologias assistivas. */
export function FormMessage({ id, state }: FormMessageProps) {
  if (state.status === "idle") {
    return null;
  }

  const isError = state.status === "error";

  return (
    <p
      id={id}
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
      }
    >
      {state.message}
    </p>
  );
}

type NoticeProps = {
  message?: string;
};

/** Aviso informativo vindo de navegação anterior (ex.: senha atualizada). */
export function Notice({ message }: NoticeProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="status"
      className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
    >
      {message}
    </p>
  );
}
