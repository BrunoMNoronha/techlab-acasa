// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLogger,
  describeError,
  pickAllowedContext,
  type LogLevel,
} from "./logger";

const FIXED_DATE = new Date("2026-09-02T12:00:00.000Z");

function captureLogger() {
  const lines: Array<{ level: LogLevel; line: string }> = [];
  const logger = createLogger({
    sink: (level, line) => lines.push({ level, line }),
    environment: () => "test",
    now: () => FIXED_DATE,
  });

  return { logger, lines, last: () => JSON.parse(lines[lines.length - 1].line) };
}

describe("createLogger", () => {
  it("produz um evento JSON por linha com timestamp, level, event e environment", () => {
    const { logger, lines, last } = captureLogger();

    logger.info("app.started");

    expect(lines).toHaveLength(1);
    expect(lines[0].line).not.toContain("\n");
    expect(last()).toEqual({
      timestamp: "2026-09-02T12:00:00.000Z",
      level: "info",
      event: "app.started",
      environment: "test",
    });
  });

  it("preserva nível e evento para info, warn e error", () => {
    const { logger, lines } = captureLogger();

    logger.info("evento.info");
    logger.warn("evento.warn");
    logger.error("evento.error");

    expect(lines.map((entry) => entry.level)).toEqual(["info", "warn", "error"]);
    expect(lines.map((entry) => JSON.parse(entry.line).event)).toEqual([
      "evento.info",
      "evento.warn",
      "evento.error",
    ]);
  });

  it("aceita contexto seguro da allow-list", () => {
    const { logger, last } = captureLogger();

    logger.error("server.request_error", {
      method: "POST",
      routePath: "/app/login/page",
      routeType: "action",
      routerKind: "App Router",
      errorName: "TypeError",
      digest: "123456",
      errorCode: "over_email_send_rate_limit",
      status: 429,
    });

    expect(last()).toMatchObject({
      method: "POST",
      routePath: "/app/login/page",
      routeType: "action",
      routerKind: "App Router",
      errorName: "TypeError",
      digest: "123456",
      errorCode: "over_email_send_rate_limit",
      status: 429,
    });
  });

  it("descarta undefined, null, NaN e valores não serializáveis", () => {
    const { logger, last } = captureLogger();

    logger.warn("evento", {
      method: undefined,
      routePath: null as unknown as string,
      status: Number.NaN,
      errorName: { nested: true } as unknown as string,
      digest: (() => "fn") as unknown as string,
    });

    expect(last()).toEqual({
      timestamp: "2026-09-02T12:00:00.000Z",
      level: "warn",
      event: "evento",
      environment: "test",
    });
  });

  it("não inclui campos que não foram explicitamente autorizados", () => {
    const { logger, lines, last } = captureLogger();

    logger.error("evento", {
      routeType: "render",
      // Campos perigosos passados por engano: devem ser ignorados.
      headers: { authorization: "Bearer abc.def.ghi", cookie: "sb-access-token=xyz" },
      cookies: "sb-refresh-token=segredo",
      password: "senha-super-secreta",
      token: "token-secreto",
      access_token: "access-secreto",
      refresh_token: "refresh-secreto",
      email: "pessoa@exemplo.org",
      path: "/area-restrita?token=abc",
      env: process.env,
    } as never);

    const serialized = lines[0].line;

    expect(last()).toMatchObject({ routeType: "render" });
    expect(Object.keys(last())).toEqual([
      "timestamp",
      "level",
      "event",
      "environment",
      "routeType",
    ]);

    for (const forbidden of [
      "authorization",
      "Bearer",
      "cookie",
      "sb-access-token",
      "sb-refresh-token",
      "senha-super-secreta",
      "token-secreto",
      "access-secreto",
      "refresh-secreto",
      "pessoa@exemplo.org",
      "?token=",
      "NEXT_PUBLIC",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("trunca textos longos para limitar payloads acidentais", () => {
    const { logger, last } = captureLogger();

    logger.info("evento", { routePath: "x".repeat(1000) });

    expect(last().routePath).toHaveLength(201);
    expect(last().routePath.endsWith("…")).toBe(true);
  });

  it("escreve em stdout/stderr por padrão via console", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const logger = createLogger({ environment: () => "test" });
    logger.info("i");
    logger.warn("w");
    logger.error("e");

    expect(log).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(error.mock.calls[0][0] as string)).toMatchObject({ level: "error", event: "e" });

    vi.restoreAllMocks();
  });
});

describe("pickAllowedContext", () => {
  it("retorna objeto vazio para contexto ausente ou inválido", () => {
    expect(pickAllowedContext(undefined)).toEqual({});
    expect(pickAllowedContext("texto" as never)).toEqual({});
  });
});

describe("describeError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("extrai nome, digest e código conhecido de um Error", () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = Object.assign(new TypeError("falhou com token=abc"), {
      digest: "987",
      code: "known_code",
    });

    expect(describeError(error)).toEqual({
      errorName: "TypeError",
      digest: "987",
      errorCode: "known_code",
    });
  });

  it("nunca inclui message ou stack fora de development", () => {
    for (const env of ["production", "test"]) {
      vi.stubEnv("NODE_ENV", env);

      const described = describeError(new Error("mensagem com senha=123"));
      const serialized = JSON.stringify(described);

      expect(described.errorMessage).toBeUndefined();
      expect(serialized).not.toContain("senha=123");
      expect(serialized).not.toContain("stack");
    }
  });

  it("inclui somente a mensagem em development, nunca a stack", () => {
    vi.stubEnv("NODE_ENV", "development");

    const described = describeError(new Error("detalhe de desenvolvimento"));

    expect(described.errorMessage).toBe("detalhe de desenvolvimento");
    expect(JSON.stringify(described)).not.toContain("at ");
  });

  it("lida com valores que não são Error", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(describeError("texto")).toEqual({ errorName: "string" });
    expect(describeError(undefined)).toEqual({ errorName: "undefined" });
    expect(describeError(null)).toEqual({ errorName: "object" });
    expect(describeError({ digest: "d1" })).toEqual({ errorName: "Error", digest: "d1" });
  });
});
