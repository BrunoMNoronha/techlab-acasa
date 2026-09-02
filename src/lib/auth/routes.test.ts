// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  LOGIN_PATH,
  PROTECTED_HOME_PATH,
  isAnonymousOnlyPath,
  isProtectedPath,
  resolveSafeRedirectPath,
} from "./routes";

describe("isProtectedPath", () => {
  it("protege a área restrita e seus subcaminhos", () => {
    expect(isProtectedPath(PROTECTED_HOME_PATH)).toBe(true);
    expect(isProtectedPath(`${PROTECTED_HOME_PATH}/qualquer`)).toBe(true);
  });

  it("não protege rotas públicas nem prefixos parecidos", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath(LOGIN_PATH)).toBe(false);
    expect(isProtectedPath(`${PROTECTED_HOME_PATH}-publica`)).toBe(false);
  });
});

describe("isAnonymousOnlyPath", () => {
  it("considera apenas o login como rota exclusiva de anônimos", () => {
    expect(isAnonymousOnlyPath(LOGIN_PATH)).toBe(true);
    expect(isAnonymousOnlyPath("/recuperar-acesso")).toBe(false);
    expect(isAnonymousOnlyPath("/")).toBe(false);
  });
});

describe("resolveSafeRedirectPath", () => {
  const fallback = "/padrao";

  it("aceita caminhos internos relativos", () => {
    expect(resolveSafeRedirectPath("/redefinir-senha", fallback)).toBe("/redefinir-senha");
    expect(resolveSafeRedirectPath("/a/b?c=1", fallback)).toBe("/a/b?c=1");
  });

  it("usa o fallback quando não há candidato", () => {
    expect(resolveSafeRedirectPath(null, fallback)).toBe(fallback);
    expect(resolveSafeRedirectPath(undefined, fallback)).toBe(fallback);
    expect(resolveSafeRedirectPath("", fallback)).toBe(fallback);
  });

  it("rejeita open redirect para outros hosts", () => {
    expect(resolveSafeRedirectPath("https://evil.example", fallback)).toBe(fallback);
    expect(resolveSafeRedirectPath("//evil.example/x", fallback)).toBe(fallback);
    expect(resolveSafeRedirectPath("/\\evil.example", fallback)).toBe(fallback);
    expect(resolveSafeRedirectPath("javascript:alert(1)", fallback)).toBe(fallback);
    expect(resolveSafeRedirectPath("/ /evil", fallback)).toBe(fallback);
  });
});
