// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const requireAuthenticatedIdentity = vi.fn();
const rpc = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("./identity", () => ({
  requireAuthenticatedIdentity: () => requireAuthenticatedIdentity(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

import {
  MemberAdministrationAccessDeniedError,
  requireMemberAdministration,
} from "./member-administration";

describe("requireMemberAdministration", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("preserva a negação/redirecionamento do mecanismo de identidade para anônimo", async () => {
    requireAuthenticatedIdentity.mockRejectedValue(new Error("REDIRECT:/login"));

    await expect(requireMemberAdministration()).rejects.toThrow("REDIRECT:/login");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("nega usuário autenticado sem concessão", async () => {
    requireAuthenticatedIdentity.mockResolvedValue({ userId: "user-a" });
    rpc.mockResolvedValue({ data: false, error: null });

    await expect(requireMemberAdministration()).rejects.toBeInstanceOf(
      MemberAdministrationAccessDeniedError,
    );
    expect(rpc).toHaveBeenCalledWith("can_manage_members");
  });

  it("permite usuário autenticado com concessão e devolve a identidade verificada", async () => {
    const identity = { userId: "user-b" };
    requireAuthenticatedIdentity.mockResolvedValue(identity);
    rpc.mockResolvedValue({ data: true, error: null });

    await expect(requireMemberAdministration()).resolves.toEqual(identity);
    expect(rpc).toHaveBeenCalledWith("can_manage_members");
  });

  it("nega quando o banco retorna erro", async () => {
    requireAuthenticatedIdentity.mockResolvedValue({ userId: "user-a" });
    rpc.mockResolvedValue({ data: null, error: { message: "database unavailable" } });

    await expect(requireMemberAdministration()).rejects.toBeInstanceOf(
      MemberAdministrationAccessDeniedError,
    );
  });

  it.each([null, undefined, 1, "true", {}, [true]])(
    "nega resposta inesperada do RPC: %j",
    async (data) => {
      requireAuthenticatedIdentity.mockResolvedValue({ userId: "user-a" });
      rpc.mockResolvedValue({ data, error: null });

      await expect(requireMemberAdministration()).rejects.toBeInstanceOf(
        MemberAdministrationAccessDeniedError,
      );
    },
  );

  it("nega exceções de criação ou consulta do cliente Supabase", async () => {
    requireAuthenticatedIdentity.mockResolvedValue({ userId: "user-a" });
    createSupabaseServerClient.mockRejectedValueOnce(new Error("timeout"));

    await expect(requireMemberAdministration()).rejects.toBeInstanceOf(
      MemberAdministrationAccessDeniedError,
    );
  });

  it("não envia identidade ao RPC e reconsulta a autorização em cada chamada", async () => {
    requireAuthenticatedIdentity.mockResolvedValue({ userId: "client-controlled-id" });
    rpc.mockResolvedValue({ data: true, error: null });

    await requireMemberAdministration();
    await requireMemberAdministration();

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(1, "can_manage_members");
    expect(rpc).toHaveBeenNthCalledWith(2, "can_manage_members");
    expect(createSupabaseServerClient).toHaveBeenCalledTimes(2);
  });
});
