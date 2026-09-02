// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { authMessages } from "@/lib/auth/messages";

const getClaims = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn(async () => ({ error: null }));
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getClaims, updateUser, signOut } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

import { updatePassword } from "./actions";

function formDataOf(password: string, passwordConfirmation = password) {
  const formData = new FormData();
  formData.append("password", password);
  formData.append("passwordConfirmation", passwordConfirmation);
  return formData;
}

describe("updatePassword", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exige senha com o tamanho mínimo", async () => {
    const state = await updatePassword(initialAuthFormState, formDataOf("curta1"));

    expect(state).toEqual({ status: "error", message: authMessages.passwordTooShort });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("exige confirmação idêntica", async () => {
    const state = await updatePassword(
      initialAuthFormState,
      formDataOf("senha-longa-1", "senha-longa-2"),
    );

    expect(state).toEqual({ status: "error", message: authMessages.passwordMismatch });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("recusa atualização sem sessão", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    const state = await updatePassword(initialAuthFormState, formDataOf("senha-longa-1"));

    expect(state).toEqual({ status: "error", message: authMessages.recoverySessionInvalid });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("recusa sessão comum por senha, que não prova posse do link de recuperação", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }] } },
      error: null,
    });

    const state = await updatePassword(initialAuthFormState, formDataOf("senha-longa-1"));

    expect(state).toEqual({ status: "error", message: authMessages.recoverySessionInvalid });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("traduz erros conhecidos do Auth sem expor detalhes", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", amr: [{ method: "otp", timestamp: Math.floor(Date.now() / 1000) }] } },
      error: null,
    });
    updateUser.mockResolvedValueOnce({ error: { code: "same_password" } });

    expect(await updatePassword(initialAuthFormState, formDataOf("senha-longa-1"))).toEqual({
      status: "error",
      message: authMessages.passwordSameAsCurrent,
    });

    updateUser.mockResolvedValueOnce({ error: { code: "unexpected_failure" } });

    expect(await updatePassword(initialAuthFormState, formDataOf("senha-longa-1"))).toEqual({
      status: "error",
      message: authMessages.passwordUpdateFailed,
    });
  });

  it("atualiza a senha, encerra a sessão de recuperação e redireciona ao login", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", amr: [{ method: "otp", timestamp: Math.floor(Date.now() / 1000) }] } },
      error: null,
    });
    updateUser.mockResolvedValue({ error: null });

    await expect(
      updatePassword(initialAuthFormState, formDataOf("senha-longa-1")),
    ).rejects.toThrow("REDIRECT:/login?status=senha-atualizada");

    expect(updateUser).toHaveBeenCalledWith({ password: "senha-longa-1" });
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
