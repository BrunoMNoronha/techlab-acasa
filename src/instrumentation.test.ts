// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { error } = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock("@/lib/observability/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/observability/logger")>();

  return { ...actual, logger: { info: vi.fn(), warn: vi.fn(), error } };
});

import { onRequestError } from "./instrumentation";

const request = {
  path: "/area-restrita/123?token=abc&email=pessoa%40exemplo.org",
  method: "GET",
  headers: {
    cookie: "sb-127-auth-token=eyJhbGciOiJIUzI1NiJ9.segredo",
    authorization: "Bearer segredo-bearer",
    "x-forwarded-for": "203.0.113.10",
  },
};

const context = {
  routerKind: "App Router" as const,
  routePath: "/app/area-restrita/[id]/page",
  routeType: "render" as const,
  renderSource: "react-server-components" as const,
  revalidateReason: undefined,
};

describe("onRequestError", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("encaminha o erro ao logger com template da rota e contexto seguro", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const thrown = Object.assign(new RangeError("boom"), { digest: "digest-1" });

    await onRequestError(thrown, request, context);

    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("server.request_error", {
      errorName: "RangeError",
      digest: "digest-1",
      method: "GET",
      routePath: "/app/area-restrita/[id]/page",
      routeType: "render",
      routerKind: "App Router",
      renderSource: "react-server-components",
      revalidateReason: undefined,
    });
  });

  it("não envia headers, cookies, request completo nem query string", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await onRequestError(new Error("boom"), request, context);

    const [, payload] = error.mock.calls[0];
    const serialized = JSON.stringify(payload);

    expect(payload).not.toHaveProperty("headers");
    expect(payload).not.toHaveProperty("cookies");
    expect(payload).not.toHaveProperty("path");
    expect(payload).not.toHaveProperty("request");

    for (const forbidden of [
      "token=abc",
      "pessoa",
      "exemplo.org",
      "/area-restrita/123",
      "sb-127-auth-token",
      "eyJhbGciOiJIUzI1NiJ9",
      "Bearer",
      "segredo",
      "203.0.113.10",
      "boom",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("lida com erro que não é instância de Error", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await onRequestError("falha em texto", request, { ...context, routeType: "action" });

    expect(error).toHaveBeenCalledWith(
      "server.request_error",
      expect.objectContaining({ errorName: "string", routeType: "action", method: "GET" }),
    );
  });
});
