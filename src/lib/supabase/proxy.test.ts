// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };
type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[]) => void;
};

const getClaims = vi.fn();
const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));
let refreshedCookies: CookieToSet[] = [];

vi.mock("@/lib/observability/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/observability/logger")>();

  return { ...actual, logger: { info: vi.fn(), warn, error: vi.fn() } };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: CookieAdapter }) => ({
    auth: {
      getClaims: async () => {
        // Simula a renovação da sessão: o Supabase regrava cookies antes de responder.
        if (refreshedCookies.length > 0) {
          options.cookies.setAll(refreshedCookies);
        }

        return getClaims();
      },
    },
  }),
}));

import { updateSession } from "./proxy";

function makeRequest(path: string, cookie?: string) {
  return new NextRequest(`http://127.0.0.1:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("updateSession", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_teste");
    refreshedCookies = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    getClaims.mockReset();
    warn.mockClear();
  });

  it("redireciona anônimo que tenta acessar rota protegida para o login", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    const response = await updateSession(makeRequest("/area-restrita?x=1"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
  });

  it("deixa passar anônimo em rotas públicas", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    for (const path of ["/", "/login", "/recuperar-acesso", "/auth/callback?code=x"]) {
      const response = await updateSession(makeRequest(path));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("permite acesso à rota protegida com claims verificadas", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", role: "authenticated" } },
      error: null,
    });

    const response = await updateSession(makeRequest("/area-restrita", "sb-token=abc"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona usuário autenticado que abre o login para a área restrita", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

    const response = await updateSession(makeRequest("/login"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/area-restrita");
  });

  it("preserva os cookies renovados na resposta, inclusive em redirecionamentos", async () => {
    refreshedCookies = [
      { name: "sb-token", value: "renovado", options: { path: "/", httpOnly: true } },
    ];
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

    const passthrough = await updateSession(makeRequest("/area-restrita", "sb-token=antigo"));
    expect(passthrough.cookies.get("sb-token")?.value).toBe("renovado");

    const redirected = await updateSession(makeRequest("/login", "sb-token=antigo"));
    expect(redirected.status).toBe(307);
    expect(redirected.cookies.get("sb-token")?.value).toBe("renovado");
  });

  it("trata erro ou exceção na verificação como anônimo", async () => {
    getClaims.mockResolvedValueOnce({ data: null, error: { message: "invalid" } });
    const withError = await updateSession(makeRequest("/area-restrita"));
    expect(withError.status).toBe(307);
    // Sessão inválida é fluxo normal: sem log.
    expect(warn).not.toHaveBeenCalled();

    getClaims.mockRejectedValueOnce(new TypeError("fetch failed"));
    const withException = await updateSession(makeRequest("/area-restrita", "sb-token=abc"));
    expect(withException.status).toBe(307);
    // Exceção técnica: registrada apenas com nome do erro e contexto, sem cookies.
    expect(warn).toHaveBeenCalledWith(
      "auth.session_check_failed",
      expect.objectContaining({ errorName: "TypeError", routeType: "proxy" }),
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain("sb-token");
  });
});
