// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { authMessages } from "@/lib/auth/messages";

const resetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { resetPasswordForEmail } }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "http://127.0.0.1:3000" }),
}));

import { requestPasswordRecovery } from "./actions";

function formDataOf(email: string) {
  const formData = new FormData();
  formData.append("email", email);
  return formData;
}

describe("requestPasswordRecovery", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("valida o formato do e-mail antes de chamar o Auth", async () => {
    const state = await requestPasswordRecovery(initialAuthFormState, formDataOf("invalido"));

    expect(state).toEqual({ status: "error", message: authMessages.invalidEmail });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("solicita recuperação com callback PKCE interno e responde de forma genérica", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });

    const state = await requestPasswordRecovery(
      initialAuthFormState,
      formDataOf("pessoa@exemplo.org"),
    );

    expect(resetPasswordForEmail).toHaveBeenCalledWith("pessoa@exemplo.org", {
      redirectTo: "http://127.0.0.1:3000/auth/callback?next=%2Fredefinir-senha",
    });
    expect(state).toEqual({ status: "success", message: authMessages.recoveryRequested });
  });

  it("mantém a mesma resposta quando o Auth retorna erro, sem registrar o e-mail", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    resetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found", code: "user_not_found", status: 400 },
    });

    const state = await requestPasswordRecovery(
      initialAuthFormState,
      formDataOf("ninguem@exemplo.org"),
    );

    expect(state).toEqual({ status: "success", message: authMessages.recoveryRequested });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(consoleError.mock.calls[0])).not.toContain("ninguem@exemplo.org");
  });
});
