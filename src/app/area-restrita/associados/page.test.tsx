import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireMemberAdministration = vi.fn();
const listMembers = vi.fn();
const getMembershipCategories = vi.fn();

vi.mock("@/lib/auth/member-administration", () => ({
  requireMemberAdministration: () => requireMemberAdministration(),
}));

vi.mock("@/lib/members/repository", () => ({
  listMembers: (params: unknown) => listMembers(params),
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

  it("renderiza estado vazio quando não há associados cadastrados (sem filtros)", async () => {
    listMembers.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 25,
      totalCount: 0,
      totalPages: 1,
    });

    render(await AssociadosPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "Associados" })).toBeInTheDocument();
    expect(screen.getByText("Nenhum associado cadastrado até o momento.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Novo associado" })).toHaveAttribute(
      "href",
      "/area-restrita/associados/novo",
    );
    expect(screen.getByLabelText("Nome ou razão social")).toHaveValue("");
    expect(screen.getByLabelText("Tipo de pessoa")).toHaveValue("");
    expect(screen.getByLabelText("Categoria estatutária")).toHaveValue("");
  });

  it("renderiza estado vazio diferenciado quando nenhum associado corresponde aos filtros", async () => {
    listMembers.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 25,
      totalCount: 0,
      totalPages: 1,
    });

    render(
      await AssociadosPage({
        searchParams: Promise.resolve({ q: "Inexistente", personType: "PJ" }),
      }),
    );

    expect(
      screen.getByText("Nenhum associado encontrado para os filtros informados."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Limpar todos os filtros" }),
    ).toHaveAttribute("href", "/area-restrita/associados");
  });

  it("renderiza lista filtrada com dados mínimos e paginação", async () => {
    listMembers.mockResolvedValue({
      items: [
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
      ],
      page: 1,
      pageSize: 25,
      totalCount: 50,
      totalPages: 2,
    });

    render(
      await AssociadosPage({
        searchParams: Promise.resolve({
          q: "Maria",
          personType: "PF",
          category: "CONTRIBUINTE",
          page: "1",
        }),
      }),
    );

    expect(listMembers).toHaveBeenCalledWith({
      q: "Maria",
      personType: "PF",
      category: "CONTRIBUINTE",
      page: 1,
    });

    expect(screen.getByText("Maria da Silva")).toBeInTheDocument();
    expect(screen.getByText("PF")).toBeInTheDocument();
    expect(screen.getAllByText("Contribuinte")).toHaveLength(2); // No option do select e na célula da tabela
    expect(screen.getByText("maria@example.org")).toBeInTheDocument();
    expect(screen.getByText("+55 11 99999-1111")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes" })).toHaveAttribute(
      "href",
      "/area-restrita/associados/123e4567-e89b-12d3-a456-426614174000",
    );

    // Controles de paginação
    expect(screen.getByText(/Mostrando página 1 de 2/)).toBeInTheDocument();
    expect(screen.getByText("← Anterior")).toHaveAttribute("aria-disabled", "true");
    const nextLink = screen.getByRole("link", { name: "Próxima →" });
    expect(nextLink).toHaveAttribute(
      "href",
      "/area-restrita/associados?q=Maria&personType=PF&category=CONTRIBUINTE&page=2",
    );
  });

  it("renderiza link Anterior ativo e Próxima desabilitado na última página", async () => {
    listMembers.mockResolvedValue({
      items: [
        {
          id: "222e4567-e89b-12d3-a456-426614174000",
          person_type: "PJ",
          name: "Empresa Z",
          membership_category_code: "FUNDADOR",
          email: null,
          phone: null,
          created_at: "2026-09-14T12:00:00Z",
          updated_at: "2026-09-14T12:00:00Z",
        },
      ],
      page: 2,
      pageSize: 25,
      totalCount: 30,
      totalPages: 2,
    });

    render(
      await AssociadosPage({
        searchParams: Promise.resolve({ page: "2" }),
      }),
    );

    const prevLink = screen.getByRole("link", { name: "← Anterior" });
    expect(prevLink).toHaveAttribute("href", "/area-restrita/associados");
    expect(screen.getByText("Próxima →")).toHaveAttribute("aria-disabled", "true");
  });
});
