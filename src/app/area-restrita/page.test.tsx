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
  logout: vi.fn(),
}));

import ProtectedAreaPage from "./page";

describe("ProtectedAreaPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza conteúdo protegido sem sessão e redireciona para o login", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(ProtectedAreaPage()).rejects.toThrow("REDIRECT:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(screen.queryByRole("heading", { name: /área restrita/i })).not.toBeInTheDocument();
  });

  it("renderiza indicação mínima de sessão e ação de sair quando autenticado", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", email: "pessoa@exemplo.org" } },
      error: null,
    });

    render(await ProtectedAreaPage());

    expect(screen.getByRole("heading", { level: 1, name: /área restrita/i })).toBeInTheDocument();
    expect(screen.getByText(/sessão autenticada e validada no servidor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
    expect(screen.queryByText(/pessoa@exemplo.org/)).not.toBeInTheDocument();
    expect(screen.queryByText(/user-1/)).not.toBeInTheDocument();
  });
});
