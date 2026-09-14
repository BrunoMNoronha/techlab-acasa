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

vi.mock("@/lib/members/actions", () => ({
  updateMemberAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

import EditarAssociadoPage from "./page";

describe("EditarAssociadoPage", () => {
  const validId = "123e4567-e89b-12d3-a456-426614174000";

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

    await expect(
      EditarAssociadoPage({ params: Promise.resolve({ id: validId }) }),
    ).rejects.toThrow("Acesso negado.");

    expect(getMemberById).not.toHaveBeenCalled();
  });

  it("chama notFound se o ID não for um UUID válido", async () => {
    await expect(
      EditarAssociadoPage({ params: Promise.resolve({ id: "invalido" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("chama notFound se o associado não existir", async () => {
    getMemberById.mockResolvedValue(null);

    await expect(
      EditarAssociadoPage({ params: Promise.resolve({ id: validId }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("renderiza o formulário de edição com dados existentes", async () => {
    getMemberById.mockResolvedValue({
      id: validId,
      person_type: "PF",
      name: "Ana Pereira",
      membership_category_code: "CONTRIBUINTE",
      email: "ana@example.org",
      phone: "+55 11 97777-6666",
      created_at: "2026-09-14T12:00:00Z",
      updated_at: "2026-09-14T12:00:00Z",
    });

    render(
      await EditarAssociadoPage({ params: Promise.resolve({ id: validId }) }),
    );

    expect(screen.getByRole("heading", { level: 1, name: "Editar associado" })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome completo ou razão social/i)).toHaveValue("Ana Pereira");
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue("ana@example.org");
    expect(screen.getByLabelText(/telefone/i)).toHaveValue("+55 11 97777-6666");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });
});
