// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabasePublicConfig } from "./env";

describe("getSupabasePublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna URL e chave publicável quando configuradas", () => {
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

    expect(() => getSupabasePublicConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
