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

import {
  getAuthenticatedIdentity,
  getPasswordRecoveryIdentity,
  hasPasswordRecoveryProof,
  RECOVERY_PROOF_MAX_AGE_SECONDS,
  requireAuthenticatedIdentity,
} from "./identity";

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

describe("hasPasswordRecoveryProof", () => {
  const now = 1_700_000_000;

  it("aceita sessão recente iniciada por link de recuperação (otp) ou recovery", () => {
    expect(hasPasswordRecoveryProof({ sub: "u", amr: [{ method: "otp", timestamp: now - 60 }] }, now)).toBe(true);
    expect(
      hasPasswordRecoveryProof({ sub: "u", amr: [{ method: "recovery", timestamp: now - 60 }] }, now),
    ).toBe(true);
    expect(
      hasPasswordRecoveryProof(
        {
          sub: "u",
          amr: [
            { method: "token_refresh", timestamp: now - 10 },
            { method: "otp", timestamp: now - 120 },
          ],
        },
        now,
      ),
    ).toBe(true);
  });

  it("rejeita sessão comum por senha, prova antiga, entradas malformadas e ausência de amr", () => {
    expect(hasPasswordRecoveryProof({ sub: "u", amr: [{ method: "password", timestamp: now }] }, now)).toBe(false);
    expect(
      hasPasswordRecoveryProof(
        { sub: "u", amr: [{ method: "otp", timestamp: now - RECOVERY_PROOF_MAX_AGE_SECONDS - 1 }] },
        now,
      ),
    ).toBe(false);
    expect(hasPasswordRecoveryProof({ sub: "u", amr: ["otp"] }, now)).toBe(false);
    expect(hasPasswordRecoveryProof({ sub: "u", amr: [{ method: "otp" }] }, now)).toBe(false);
    expect(hasPasswordRecoveryProof({ sub: "u" }, now)).toBe(false);
    expect(hasPasswordRecoveryProof(null, now)).toBe(false);
  });
});

describe("getPasswordRecoveryIdentity", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null para anônimo e para sessão comum por senha", async () => {
    getClaims.mockResolvedValueOnce({ data: null, error: null });
    expect(await getPasswordRecoveryIdentity()).toBeNull();

    getClaims.mockResolvedValueOnce({
      data: { claims: { sub: "user-1", amr: [{ method: "password", timestamp: 1 }] } },
      error: null,
    });
    expect(await getPasswordRecoveryIdentity()).toBeNull();
  });

  it("retorna a identidade para sessão iniciada por link de recuperação", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", amr: [{ method: "otp", timestamp: Math.floor(Date.now() / 1000) }] } },
      error: null,
    });

    expect(await getPasswordRecoveryIdentity()).toEqual({ userId: "user-1" });
  });
});
