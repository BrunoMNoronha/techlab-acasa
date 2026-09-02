// @vitest-environment node
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

import { getAuthenticatedIdentity, requireAuthenticatedIdentity } from "./identity";

describe("getAuthenticatedIdentity", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null sem sessão", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    expect(await getAuthenticatedIdentity()).toBeNull();
  });

  it("retorna null quando a verificação falha", async () => {
    getClaims.mockResolvedValue({ data: null, error: { message: "bad signature" } });

    expect(await getAuthenticatedIdentity()).toBeNull();
  });

  it("retorna somente o identificador do usuário a partir das claims", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", email: "pessoa@exemplo.org", role: "authenticated" } },
      error: null,
    });

    expect(await getAuthenticatedIdentity()).toEqual({ userId: "user-1" });
  });
});

describe("requireAuthenticatedIdentity", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona anônimo para o login", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(requireAuthenticatedIdentity()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("devolve a identidade quando autenticado", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-2" } }, error: null });

    expect(await requireAuthenticatedIdentity()).toEqual({ userId: "user-2" });
    expect(redirect).not.toHaveBeenCalled();
  });
});
