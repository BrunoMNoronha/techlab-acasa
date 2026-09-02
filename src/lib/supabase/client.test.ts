// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.fn<(url: string, key: string) => { marker: string }>(() => ({
  marker: "browser-client",
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (url: string, key: string) => createBrowserClient(url, key),
}));

import { createSupabaseBrowserClient } from "./client";

describe("createSupabaseBrowserClient", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_teste");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    createBrowserClient.mockClear();
  });

  it("cria o cliente de navegador somente com variáveis públicas", () => {
    const client = createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "sb_publishable_teste",
    );
    expect(client).toEqual({ marker: "browser-client" });
  });
});
