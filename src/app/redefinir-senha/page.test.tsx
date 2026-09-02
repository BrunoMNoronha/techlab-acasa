import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { getClaims } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

vi.mock("./actions", () => ({
  updatePassword: vi.fn(),
}));

import PasswordResetPage from "./page";

describe("PasswordResetPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona anônimo para a recuperação de acesso", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(PasswordResetPage()).rejects.toThrow(
      "REDIRECT:/recuperar-acesso?erro=sessao-invalida",
    );
  });

  it("recusa sessão comum iniciada por senha", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) }] } },
      error: null,
    });

    await expect(PasswordResetPage()).rejects.toThrow(
      "REDIRECT:/recuperar-acesso?erro=sessao-invalida",
    );
    expect(screen.queryByLabelText(/nova senha/i)).not.toBeInTheDocument();
  });

  it("renderiza o formulário para sessão iniciada por link de recuperação", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", amr: [{ method: "otp", timestamp: Math.floor(Date.now() / 1000) }] } },
      error: null,
    });

    render(await PasswordResetPage());

    expect(screen.getByRole("heading", { level: 1, name: /definir nova senha/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nova senha/i)).toHaveAttribute("type", "password");
    expect(screen.getByLabelText(/confirme a nova senha/i)).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: /salvar nova senha/i })).toBeInTheDocument();
  });
});
