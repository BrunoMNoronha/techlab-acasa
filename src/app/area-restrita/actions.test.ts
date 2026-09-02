// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { authMessages } from "@/lib/auth/messages";

const signOut = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { signOut } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

import { logout } from "./actions";

describe("logout", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("encerra a sessão e redireciona ao login com aviso", async () => {
    signOut.mockResolvedValue({ error: null });

    await expect(logout()).rejects.toThrow(
      "REDIRECT:/login?status=sessao-encerrada",
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("informa falha em vez de anunciar logout quando o Auth retorna erro", async () => {
    signOut.mockResolvedValue({ error: { message: "network", status: 503 } });

    expect(await logout()).toEqual({
      status: "error",
      message: authMessages.logoutFailed,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
