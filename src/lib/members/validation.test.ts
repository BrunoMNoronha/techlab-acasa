import { describe, expect, it } from "vitest";
import {
  isValidEmailFormat,
  isValidUuid,
  validateMemberInput,
} from "./validation";

describe("validation", () => {
  describe("isValidUuid", () => {
    it("retorna true para UUIDs válidos", () => {
      expect(isValidUuid("00000000-0000-4000-8000-000000000000")).toBe(true);
      expect(isValidUuid("c74db420-68e0-47d1-b2b6-19e6eecd494f")).toBe(true);
      expect(isValidUuid("22222222-2222-4222-8222-222222222222")).toBe(true);
    });

    it("retorna false para strings não-UUID ou tipos inválidos", () => {
      expect(isValidUuid("")).toBe(false);
      expect(isValidUuid("invalido")).toBe(false);
      expect(isValidUuid("00000000-0000-0000-0000")).toBe(false);
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
      expect(isValidUuid(12345)).toBe(false);
    });
  });

  describe("isValidEmailFormat", () => {
    it("valida formatos aceitáveis de e-mail", () => {
      expect(isValidEmailFormat("associado@example.org")).toBe(true);
      expect(isValidEmailFormat("nome.sobrenome@dominio.com.br")).toBe(true);
    });

    it("rejeita formatos inválidos", () => {
      expect(isValidEmailFormat("invalido")).toBe(false);
      expect(isValidEmailFormat("sem-dominio@")).toBe(false);
      expect(isValidEmailFormat("@sem-usuario.org")).toBe(false);
      expect(isValidEmailFormat("espacos @dominio.com")).toBe(false);
    });
  });

  describe("validateMemberInput", () => {
    it("valida com sucesso entrada mínima de PF", () => {
      const result = validateMemberInput({
        person_type: "PF",
        name: "  Maria da Silva  ",
        membership_category_code: "CONTRIBUINTE",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          person_type: "PF",
          name: "Maria da Silva",
          membership_category_code: "CONTRIBUINTE",
          email: null,
          phone: null,
        });
      }
    });

    it("valida com sucesso entrada completa de PJ com e-mail e telefone", () => {
      const result = validateMemberInput({
        person_type: "PJ",
        name: "Empresa Comunitária LTDA",
        membership_category_code: "FUNDADOR",
        email: "contato@empresa.org ",
        phone: " +55 11 98888-7777 ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          person_type: "PJ",
          name: "Empresa Comunitária LTDA",
          membership_category_code: "FUNDADOR",
          email: "contato@empresa.org",
          phone: "+55 11 98888-7777",
        });
      }
    });

    it("converte strings em branco de campos opcionais em null", () => {
      const result = validateMemberInput({
        person_type: "PF",
        name: "João Santos",
        membership_category_code: "BENEMERITO",
        email: "   ",
        phone: "  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeNull();
        expect(result.data.phone).toBeNull();
      }
    });

    it("rejeita tipo de pessoa inválido", () => {
      const result = validateMemberInput({
        person_type: "OUTRO",
        name: "Teste",
        membership_category_code: "CONTRIBUINTE",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.person_type).toBeDefined();
      }
    });

    it("rejeita nome ausente ou contendo apenas espaços", () => {
      const result = validateMemberInput({
        person_type: "PF",
        name: "   ",
        membership_category_code: "CONTRIBUINTE",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name).toBeDefined();
      }
    });

    it("rejeita categoria estatutária ausente", () => {
      const result = validateMemberInput({
        person_type: "PF",
        name: "Teste",
        membership_category_code: "   ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.membership_category_code).toBeDefined();
      }
    });

    it("rejeita formato de e-mail inválido quando preenchido", () => {
      const result = validateMemberInput({
        person_type: "PF",
        name: "Teste",
        membership_category_code: "CONTRIBUINTE",
        email: "email-invalido",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.email).toBeDefined();
      }
    });
  });
});
