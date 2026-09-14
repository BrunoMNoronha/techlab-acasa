// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockIlike = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: (table: string) => mockFrom(table),
  })),
}));

import {
  DEFAULT_PAGE_SIZE,
  getMembershipCategories,
  listMembers,
} from "./repository";

describe("members repository", () => {
  let queryBuilder: Record<string, unknown>;

  beforeEach(() => {
    queryBuilder = {
      select: mockSelect,
      ilike: mockIlike,
      eq: mockEq,
      order: mockOrder,
      range: mockRange,
      insert: mockInsert,
      update: mockUpdate,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    };

    mockFrom.mockReturnValue(queryBuilder);
    mockSelect.mockReturnValue(queryBuilder);
    mockIlike.mockReturnValue(queryBuilder);
    mockEq.mockReturnValue(queryBuilder);
    mockOrder.mockReturnValue(queryBuilder);
    mockRange.mockReturnValue(queryBuilder);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getMembershipCategories", () => {
    it("retorna categorias ordenadas por nome", async () => {
      mockOrder.mockResolvedValueOnce({
        data: [
          { code: "BENEMERITO", name: "Benemérito" },
          { code: "CONTRIBUINTE", name: "Contribuinte" },
        ],
        error: null,
      });

      const categories = await getMembershipCategories();

      expect(mockFrom).toHaveBeenCalledWith("membership_categories");
      expect(mockSelect).toHaveBeenCalledWith("code, name");
      expect(mockOrder).toHaveBeenCalledWith("name", { ascending: true });
      expect(categories).toHaveLength(2);
      expect(categories[0].code).toBe("BENEMERITO");
    });

    it("propaga erro sanitizado em caso de falha no banco", async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      await expect(getMembershipCategories()).rejects.toThrow(
        "Falha ao consultar catálogo de categorias estatutárias.",
      );
    });
  });

  describe("listMembers (P2-03)", () => {
    it("executa consulta padrão com ordenação determinística e paginação na primeira página", async () => {
      mockRange.mockResolvedValueOnce({
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            person_type: "PF",
            name: "Ana Clara",
            membership_category_code: "CONTRIBUINTE",
            email: null,
            phone: null,
            created_at: "2026-09-14T10:00:00Z",
            updated_at: "2026-09-14T10:00:00Z",
          },
        ],
        count: 1,
        error: null,
      });

      const result = await listMembers();

      expect(mockFrom).toHaveBeenCalledWith("members");
      expect(mockSelect).toHaveBeenCalledWith(
        "id, person_type, name, membership_category_code, email, phone, created_at, updated_at",
        { count: "exact" },
      );
      // Não deve chamar ilike ou eq se não houver filtros
      expect(mockIlike).not.toHaveBeenCalled();
      expect(mockEq).not.toHaveBeenCalled();

      // Ordenação determinística: name ASC e id ASC
      expect(mockOrder).toHaveBeenNthCalledWith(1, "name", { ascending: true });
      expect(mockOrder).toHaveBeenNthCalledWith(2, "id", { ascending: true });

      // Range padrão da página 1: [0, 24] (25 itens)
      expect(mockRange).toHaveBeenCalledWith(0, DEFAULT_PAGE_SIZE - 1);

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(result.totalCount).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("aplica filtro de pesquisa textual por nome com escape de wildcards", async () => {
      mockRange.mockResolvedValueOnce({
        data: [],
        count: 0,
        error: null,
      });

      await listMembers({ q: "Maria%Silva" });

      expect(mockIlike).toHaveBeenCalledWith("name", "%Maria\\%Silva%");
    });

    it("aplica filtro por tipo de pessoa (PF/PJ)", async () => {
      mockRange.mockResolvedValueOnce({
        data: [],
        count: 0,
        error: null,
      });

      await listMembers({ personType: "PF" });

      expect(mockEq).toHaveBeenCalledWith("person_type", "PF");
    });

    it("aplica filtro por categoria estatutária", async () => {
      mockRange.mockResolvedValueOnce({
        data: [],
        count: 0,
        error: null,
      });

      await listMembers({ category: "FUNDADOR" });

      expect(mockEq).toHaveBeenCalledWith("membership_category_code", "FUNDADOR");
    });

    it("combina pesquisa, tipo de pessoa e categoria estatutária", async () => {
      mockRange.mockResolvedValueOnce({
        data: [],
        count: 0,
        error: null,
      });

      await listMembers({
        q: "Acme",
        personType: "PJ",
        category: "BENEMERITO",
      });

      expect(mockIlike).toHaveBeenCalledWith("name", "%Acme%");
      expect(mockEq).toHaveBeenCalledWith("person_type", "PJ");
      expect(mockEq).toHaveBeenCalledWith("membership_category_code", "BENEMERITO");
    });

    it("calcula range e totalPages corretamente para páginas subsequentes", async () => {
      mockRange.mockResolvedValueOnce({
        data: [],
        count: 60,
        error: null,
      });

      const result = await listMembers({ page: 3 });

      // Página 3: from = 2 * 25 = 50, to = 50 + 24 = 74
      expect(mockRange).toHaveBeenCalledWith(50, 74);
      expect(result.page).toBe(3);
      expect(result.totalCount).toBe(60);
      expect(result.totalPages).toBe(3); // ceil(60 / 25) = 3
    });

    it("propaga erro sanitizado em caso de falha na consulta", async () => {
      mockRange.mockResolvedValueOnce({
        data: null,
        count: null,
        error: { message: "Query error" },
      });

      await expect(listMembers({ page: 2 })).rejects.toThrow(
        "Falha ao consultar listagem de associados.",
      );
    });
  });
});
