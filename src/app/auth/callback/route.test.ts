// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

import { GET } from "./route";

function requestFor(query: string) {
  return new NextRequest(`http://127.0.0.1:3000/auth/callback${query}`);
}

describe("GET /auth/callback", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona para a recuperação quando não há código", async () => {
    await expect(GET(requestFor(""))).rejects.toThrow(
      "REDIRECT:/recuperar-acesso?erro=link-invalido",
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redireciona para a recuperação quando a troca do código falha", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "invalid" } });

    await expect(GET(requestFor("?code=abc&next=%2Fredefinir-senha"))).rejects.toThrow(
      "REDIRECT:/recuperar-acesso?erro=link-invalido",
    );
  });

  it("troca o código pela sessão e segue para o caminho interno solicitado", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    await expect(GET(requestFor("?code=abc&next=%2Fredefinir-senha"))).rejects.toThrow(
      "REDIRECT:/redefinir-senha",
    );
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
  });

  it("ignora destinos externos e usa o caminho padrão", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    await expect(GET(requestFor("?code=abc&next=https%3A%2F%2Fevil.example"))).rejects.toThrow(
      "REDIRECT:/area-restrita",
    );
  });
});
