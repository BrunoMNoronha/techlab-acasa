import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireMemberAdministration = vi.fn();
const insertMember = vi.fn();
const updateMember = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/auth/member-administration", () => ({
  requireMemberAdministration: () => requireMemberAdministration(),
}));

vi.mock("./repository", () => ({
  insertMember: (input: unknown) => insertMember(input),
  updateMember: (id: string, input: unknown) => updateMember(id, input),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { createMemberAction, updateMemberAction } from "./actions";

describe("members actions", () => {
  beforeEach(() => {
    requireMemberAdministration.mockResolvedValue({ userId: "admin-user" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createMemberAction", () => {
    it("falha fechado e nega execução se requireMemberAdministration rejeitar", async () => {
      requireMemberAdministration.mockRejectedValue(new Error("Acesso negado."));

      const formData = new FormData();
      formData.set("person_type", "PF");
      formData.set("name", "Teste");
      formData.set("membership_category_code", "CONTRIBUINTE");

      await expect(createMemberAction({ status: "idle" }, formData)).rejects.toThrow(
        "Acesso negado.",
      );

      expect(insertMember).not.toHaveBeenCalled();
    });

    it("retorna erros de campo e não insere se validação falhar", async () => {
      const formData = new FormData();
      formData.set("person_type", "INVALIDO");
      formData.set("name", "");
      formData.set("membership_category_code", "");

      const result = await createMemberAction({ status: "idle" }, formData);

      expect(result.status).toBe("error");
      expect(result.fieldErrors?.person_type).toBeDefined();
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.fieldErrors?.membership_category_code).toBeDefined();
      expect(insertMember).not.toHaveBeenCalled();
    });

    it("insere associado com sucesso, revalida e redireciona", async () => {
      insertMember.mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000",
        person_type: "PF",
        name: "Carlos Alberto",
        membership_category_code: "CONTRIBUINTE",
        email: null,
        phone: null,
      });

      const formData = new FormData();
      formData.set("person_type", "PF");
      formData.set("name", "Carlos Alberto");
      formData.set("membership_category_code", "CONTRIBUINTE");

      await expect(createMemberAction({ status: "idle" }, formData)).rejects.toThrow(
        "REDIRECT:/area-restrita/associados/123e4567-e89b-12d3-a456-426614174000?status=cadastrado",
      );

      expect(insertMember).toHaveBeenCalledWith({
        person_type: "PF",
        name: "Carlos Alberto",
        membership_category_code: "CONTRIBUINTE",
        email: null,
        phone: null,
      });
      expect(revalidatePath).toHaveBeenCalledWith("/area-restrita/associados");
      expect(redirect).toHaveBeenCalledWith(
        "/area-restrita/associados/123e4567-e89b-12d3-a456-426614174000?status=cadastrado",
      );
    });

    it("trata erro do repositório sem vazar detalhes técnicos", async () => {
      insertMember.mockRejectedValue(new Error("Database connection error"));

      const formData = new FormData();
      formData.set("person_type", "PF");
      formData.set("name", "Carlos Alberto");
      formData.set("membership_category_code", "CONTRIBUINTE");

      const result = await createMemberAction({ status: "idle" }, formData);

      expect(result.status).toBe("error");
      expect(result.message).toContain("Não foi possível cadastrar o associado");
      expect(result.message).not.toContain("Database connection error");
    });
  });

  describe("updateMemberAction", () => {
    const validId = "123e4567-e89b-12d3-a456-426614174000";

    it("falha fechado e nega execução se requireMemberAdministration rejeitar", async () => {
      requireMemberAdministration.mockRejectedValue(new Error("Acesso negado."));

      const formData = new FormData();
      formData.set("person_type", "PF");
      formData.set("name", "Teste");
      formData.set("membership_category_code", "CONTRIBUINTE");

      await expect(updateMemberAction(validId, { status: "idle" }, formData)).rejects.toThrow(
        "Acesso negado.",
      );

      expect(updateMember).not.toHaveBeenCalled();
    });

    it("retorna erro se o ID não for um UUID válido", async () => {
      const formData = new FormData();
      formData.set("person_type", "PF");
      formData.set("name", "Teste");
      formData.set("membership_category_code", "CONTRIBUINTE");

      const result = await updateMemberAction("id-invalido", { status: "idle" }, formData);

      expect(result.status).toBe("error");
      expect(result.message).toContain("Identificador de associado inválido");
      expect(updateMember).not.toHaveBeenCalled();
    });

    it("atualiza associado com sucesso, revalida e redireciona", async () => {
      updateMember.mockResolvedValue({
        id: validId,
        person_type: "PF",
        name: "Carlos Alberto Editado",
        membership_category_code: "BENEMERITO",
        email: "carlos@example.org",
        phone: "+55 11 99999-0000",
      });

      const formData = new FormData();
      formData.set("person_type", "PF");
      formData.set("name", "Carlos Alberto Editado");
      formData.set("membership_category_code", "BENEMERITO");
      formData.set("email", "carlos@example.org");
      formData.set("phone", "+55 11 99999-0000");

      await expect(updateMemberAction(validId, { status: "idle" }, formData)).rejects.toThrow(
        `REDIRECT:/area-restrita/associados/${validId}?status=atualizado`,
      );

      expect(updateMember).toHaveBeenCalledWith(validId, {
        person_type: "PF",
        name: "Carlos Alberto Editado",
        membership_category_code: "BENEMERITO",
        email: "carlos@example.org",
        phone: "+55 11 99999-0000",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/area-restrita/associados");
      expect(revalidatePath).toHaveBeenCalledWith(`/area-restrita/associados/${validId}`);
      expect(redirect).toHaveBeenCalledWith(
        `/area-restrita/associados/${validId}?status=atualizado`,
      );
    });

    it("trata erro de atualização sem vazar detalhes técnicos", async () => {
      updateMember.mockRejectedValue(new Error("Unique constraint violation"));

      const formData = new FormData();
      formData.set("person_type", "PF");
      formData.set("name", "Carlos Alberto");
      formData.set("membership_category_code", "CONTRIBUINTE");

      const result = await updateMemberAction(validId, { status: "idle" }, formData);

      expect(result.status).toBe("error");
      expect(result.message).toContain("Não foi possível atualizar o associado");
      expect(result.message).not.toContain("Unique constraint violation");
    });
  });

  describe("ausência de exclusão (DELETE)", () => {
    it("comprova que nenhuma função de exclusão é exposta no módulo", async () => {
      const actionsModule = await import("./actions");
      expect("deleteMember" in actionsModule).toBe(false);
      expect("deleteMemberAction" in actionsModule).toBe(false);
      expect("removeMember" in actionsModule).toBe(false);
    });
  });
});
