// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { authMessages } from "@/lib/auth/messages";

const signOut = vi.fn();
const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/observability/logger", () => ({
  logger: { info: vi.fn(), warn, error: vi.fn() },
}));

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
    expect(warn).not.toHaveBeenCalled();
  });

  it("informa falha em vez de anunciar logout quando o Auth retorna erro", async () => {
    signOut.mockResolvedValue({
      error: { message: "network failure for token abc", code: "unexpected_failure", status: 503 },
    });

    expect(await logout()).toEqual({
      status: "error",
      message: authMessages.logoutFailed,
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("auth.logout_failed", {
      errorCode: "unexpected_failure",
      status: 503,
    });
    expect(JSON.stringify(warn.mock.calls[0])).not.toContain("token abc");
  });
});
