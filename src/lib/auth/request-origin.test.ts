// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveOriginFromHeaders } from "./request-origin";

describe("resolveOriginFromHeaders", () => {
  it("prefere o cabeçalho origin quando válido", () => {
    const headers = new Headers({ origin: "http://127.0.0.1:3000", host: "outro:1" });

    expect(resolveOriginFromHeaders(headers)).toBe("http://127.0.0.1:3000");
  });

  it("ignora origin malformado e deriva do host", () => {
    const headers = new Headers({ origin: "null", host: "localhost:3000" });

    expect(resolveOriginFromHeaders(headers)).toBe("http://localhost:3000");
  });

  it("usa x-forwarded-host e x-forwarded-proto quando presentes", () => {
    const headers = new Headers({
      host: "interno:3000",
      "x-forwarded-host": "app.exemplo.org",
      "x-forwarded-proto": "https",
    });

    expect(resolveOriginFromHeaders(headers)).toBe("https://app.exemplo.org");
  });

  it("retorna null sem host", () => {
    expect(resolveOriginFromHeaders(new Headers())).toBeNull();
  });
});
