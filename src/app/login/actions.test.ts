// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { authMessages } from "@/lib/auth/messages";

const signInWithPassword = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { signInWithPassword } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

import { login } from "./actions";

function formDataOf(entries: Record<string, string>) {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

describe("login", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita entrada incompleta sem chamar o Auth", async () => {
    const state = await login(initialAuthFormState, formDataOf({ email: "x", password: "" }));

    expect(state).toEqual({ status: "error", message: authMessages.missingCredentials });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("devolve mensagem genérica para qualquer falha de autenticação", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });

    const state = await login(
      initialAuthFormState,
      formDataOf({ email: " pessoa@exemplo.org ", password: "segredo" }),
    );

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "pessoa@exemplo.org",
      password: "segredo",
    });
    expect(state).toEqual({ status: "error", message: authMessages.loginFailed });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redireciona para a área restrita após autenticar", async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    await expect(
      login(initialAuthFormState, formDataOf({ email: "pessoa@exemplo.org", password: "segredo" })),
    ).rejects.toThrow("REDIRECT:/area-restrita");
  });
});
