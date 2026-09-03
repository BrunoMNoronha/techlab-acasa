// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabasePublicConfig } from "./env";

describe("getSupabasePublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna somente URL e chave publicável quando configuradas", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_teste");

    expect(getSupabasePublicConfig()).toEqual({
      url: "http://127.0.0.1:54321",
      publishableKey: "sb_publishable_teste",
    });
  });

  it("falha de forma explícita quando a configuração está ausente", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(() => getSupabasePublicConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_URL não está definida/);
  });

  it("falha quando somente a chave está ausente", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(() => getSupabasePublicConfig()).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não está definida/,
    );
  });

  it("rejeita URL que não é http(s) sem ecoar o valor recebido", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "postgres://usuario:senha-secreta@host/db");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_teste");

    expect(() => getSupabasePublicConfig()).toThrow(/não é uma URL http\(s\) válida/);
    expect(() => getSupabasePublicConfig()).not.toThrow(/senha-secreta/);
  });

  it("rejeita chave secreta na variável pública sem ecoar o valor recebido", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_nao_vazar");

    let message = "";
    try {
      getSupabasePublicConfig();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toMatch(/contém uma chave secreta/);
    expect(message).not.toContain("nao_vazar");
  });
});
