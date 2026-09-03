// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { REQUEST_ERROR_EVENT, buildRequestErrorContext } from "./request-error";

describe("buildRequestErrorContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nomeia o evento de forma estável", () => {
    expect(REQUEST_ERROR_EVENT).toBe("server.request_error");
  });

  it("usa somente método, template da rota e metadados do erro", () => {
    vi.stubEnv("NODE_ENV", "production");

    const context = buildRequestErrorContext(
      Object.assign(new Error("interno"), { digest: "abc" }),
      { method: "POST" },
      {
        routerKind: "App Router",
        routePath: "/app/login/page",
        routeType: "action",
        renderSource: undefined,
        revalidateReason: undefined,
      },
    );

    expect(context).toEqual({
      errorName: "Error",
      digest: "abc",
      method: "POST",
      routePath: "/app/login/page",
      routeType: "action",
      routerKind: "App Router",
      renderSource: undefined,
      revalidateReason: undefined,
    });
    expect(JSON.stringify(context)).not.toContain("interno");
  });
});
