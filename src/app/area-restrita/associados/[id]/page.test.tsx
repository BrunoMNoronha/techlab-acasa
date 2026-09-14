import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireMemberAdministration = vi.fn();
const getMemberById = vi.fn();
const getMembershipCategories = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/lib/auth/member-administration", () => ({
  requireMemberAdministration: () => requireMemberAdministration(),
}));

vi.mock("@/lib/members/repository", () => ({
  getMemberById: (id: string) => getMemberById(id),
  getMembershipCategories: () => getMembershipCategories(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

import MemberDetailsPage from "./page";

describe("MemberDetailsPage", () => {
  const validId = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    requireMemberAdministration.mockResolvedValue({ userId: "admin-1" });
    getMembershipCategories.mockResolvedValue([
      { code: "CONTRIBUINTE", name: "Contribuinte" },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("nega acesso e falha fechado se requireMemberAdministration falhar", async () => {
    requireMemberAdministration.mockRejectedValue(new Error("Acesso negado."));

    await expect(
      MemberDetailsPage({
        params: Promise.resolve({ id: validId }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("Acesso negado.");

    expect(getMemberById).not.toHaveBeenCalled();
  });

  it("chama notFound se o ID não for um UUID válido", async () => {
    await expect(
      MemberDetailsPage({
        params: Promise.resolve({ id: "id-invalido" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
    expect(getMemberById).not.toHaveBeenCalled();
  });

  it("chama notFound se o associado não existir", async () => {
    getMemberById.mockResolvedValue(null);

    await expect(
      MemberDetailsPage({
        params: Promise.resolve({ id: validId }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("renderiza os detalhes do associado quando encontrado", async () => {
    getMemberById.mockResolvedValue({
      id: validId,
      person_type: "PF",
      name: "João da Silva",
      membership_category_code: "CONTRIBUINTE",
      email: "joao@example.org",
      phone: "+55 11 98888-2222",
      created_at: "2026-09-14T12:00:00Z",
      updated_at: "2026-09-14T12:00:00Z",
    });

    render(
      await MemberDetailsPage({
        params: Promise.resolve({ id: validId }),
        searchParams: Promise.resolve({ status: "atualizado" }),
      }),
    );

    expect(screen.getByRole("heading", { level: 1, name: "João da Silva" })).toBeInTheDocument();
    expect(screen.getByText("Pessoa Física (PF)")).toBeInTheDocument();
    expect(screen.getByText("Contribuinte")).toBeInTheDocument();
    expect(screen.getByText("joao@example.org")).toBeInTheDocument();
    expect(screen.getByText("+55 11 98888-2222")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar associado" })).toHaveAttribute(
      "href",
      `/area-restrita/associados/${validId}/editar`,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Dados do associado atualizados com sucesso.");
  });
});
