import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

const technicalError = Object.assign(new Error("stack interna com senha=abc"), {
  digest: "digest-global",
});

describe("GlobalError", () => {
  it("renderiza fallback genérico com retry e sem detalhes técnicos", () => {
    const retry = vi.fn();
    // `global-error` renderiza <html>/<body>; o jsdom aninha e emite aviso de
    // validação de DOM irrelevante para este teste.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(<GlobalError error={technicalError} retry={retry} />);

    expect(screen.getByRole("heading", { level: 1, name: /algo deu errado/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    screen.getByRole("button", { name: /tentar novamente/i }).click();
    expect(retry).toHaveBeenCalledTimes(1);

    const html = container.innerHTML;
    expect(html).not.toContain("senha=abc");
    expect(html).not.toContain("digest-global");

    consoleError.mockRestore();
  });
});
