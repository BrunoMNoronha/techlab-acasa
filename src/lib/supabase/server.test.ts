// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };
type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieToSet[]) => void;
};

const createServerClient = vi.fn(
  (_url: string, _key: string, options: { cookies: CookieAdapter }) => ({
    cookies: options.cookies,
  }),
);

const cookieStore = {
  getAll: vi.fn(() => [{ name: "sb-token", value: "abc" }]),
  set: vi.fn(),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: [string, string, { cookies: CookieAdapter }]) =>
    createServerClient(...args),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import { createSupabaseServerClient } from "./server";

describe("createSupabaseServerClient", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_teste");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("usa a API getAll/setAll integrada aos cookies do Next.js", async () => {
    const client = (await createSupabaseServerClient()) as unknown as {
      cookies: CookieAdapter;
    };

    expect(createServerClient).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "sb_publishable_teste",
      expect.objectContaining({ cookies: expect.any(Object) }),
    );

    expect(client.cookies.getAll()).toEqual([{ name: "sb-token", value: "abc" }]);

    client.cookies.setAll([{ name: "sb-token", value: "novo", options: { path: "/" } }]);

    expect(cookieStore.set).toHaveBeenCalledWith("sb-token", "novo", { path: "/" });
  });

  it("ignora a impossibilidade de gravar cookies em Server Components", async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("Cookies can only be modified in a Server Action or Route Handler");
    });

    const client = (await createSupabaseServerClient()) as unknown as {
      cookies: CookieAdapter;
    };

    expect(() => client.cookies.setAll([{ name: "sb-token", value: "x" }])).not.toThrow();
  });
});
