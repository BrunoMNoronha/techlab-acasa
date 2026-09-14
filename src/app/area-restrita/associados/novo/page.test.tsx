import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireMemberAdministration = vi.fn();
const getMembershipCategories = vi.fn();

vi.mock("@/lib/auth/member-administration", () => ({
  requireMemberAdministration: () => requireMemberAdministration(),
}));

vi.mock("@/lib/members/repository", () => ({
  getMembershipCategories: () => getMembershipCategories(),
}));

vi.mock("@/lib/members/actions", () => ({
  createMemberAction: vi.fn(),
}));

import NovoAssociadoPage from "./page";

describe("NovoAssociadoPage", () => {
  beforeEach(() => {
    requireMemberAdministration.mockResolvedValue({ userId: "admin-1" });
    getMembershipCategories.mockResolvedValue([
      { code: "FUNDADOR", name: "Fundador" },
      { code: "CONTRIBUINTE", name: "Contribuinte" },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("nega acesso se requireMemberAdministration rejeitar", async () => {
    requireMemberAdministration.mockRejectedValue(new Error("Acesso negado."));

    await expect(NovoAssociadoPage()).rejects.toThrow("Acesso negado.");
    expect(getMembershipCategories).not.toHaveBeenCalled();
  });

  it("renderiza o formulário de cadastro com categorias estatutárias", async () => {
    render(await NovoAssociadoPage());

    expect(screen.getByRole("heading", { level: 1, name: "Cadastrar associado" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome completo ou razão social/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria estatutária/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar associado" })).toBeInTheDocument();
  });
});
