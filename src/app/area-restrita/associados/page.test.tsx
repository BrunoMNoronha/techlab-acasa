import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireMemberAdministration = vi.fn();
const listMembers = vi.fn();
const getMembershipCategories = vi.fn();

vi.mock("@/lib/auth/member-administration", () => ({
  requireMemberAdministration: () => requireMemberAdministration(),
}));

vi.mock("@/lib/members/repository", () => ({
  listMembers: () => listMembers(),
  getMembershipCategories: () => getMembershipCategories(),
}));

import AssociadosPage from "./page";

describe("AssociadosPage", () => {
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

  it("nega acesso e falha fechado se requireMemberAdministration falhar", async () => {
    requireMemberAdministration.mockRejectedValue(new Error("Acesso negado."));

    await expect(
      AssociadosPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("Acesso negado.");

    expect(listMembers).not.toHaveBeenCalled();
  });

  it("renderiza estado vazio quando não há associados", async () => {
    listMembers.mockResolvedValue([]);

    render(await AssociadosPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "Associados" })).toBeInTheDocument();
    expect(screen.getByText("Nenhum associado cadastrado até o momento.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Novo associado" })).toHaveAttribute(
      "href",
      "/area-restrita/associados/novo",
    );
  });

  it("renderiza lista com os dados mínimos aprovados", async () => {
    listMembers.mockResolvedValue([
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        person_type: "PF",
        name: "Maria da Silva",
        membership_category_code: "CONTRIBUINTE",
        email: "maria@example.org",
        phone: "+55 11 99999-1111",
        created_at: "2026-09-14T12:00:00Z",
        updated_at: "2026-09-14T12:00:00Z",
      },
    ]);

    render(await AssociadosPage({ searchParams: Promise.resolve({ status: "cadastrado" }) }));

    expect(screen.getByText("Maria da Silva")).toBeInTheDocument();
    expect(screen.getByText("PF")).toBeInTheDocument();
    expect(screen.getByText("Contribuinte")).toBeInTheDocument();
    expect(screen.getByText("maria@example.org")).toBeInTheDocument();
    expect(screen.getByText("+55 11 99999-1111")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes" })).toHaveAttribute(
      "href",
      "/area-restrita/associados/123e4567-e89b-12d3-a456-426614174000",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Associado cadastrado com sucesso.");
  });
});
