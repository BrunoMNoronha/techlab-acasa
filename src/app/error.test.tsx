import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

const technicalError = Object.assign(
  new Error("Supabase falhou: token=sb_secret_abc cookie=sessao email=pessoa@exemplo.org"),
  { digest: "1234567890" },
);

describe("ErrorPage", () => {
  it("exibe mensagem genérica acessível e botão de tentar novamente", () => {
    const retry = vi.fn();

    render(<ErrorPage error={technicalError} retry={retry} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /algo deu errado/i })).toBeInTheDocument();

    screen.getByRole("button", { name: /tentar novamente/i }).click();
    expect(retry).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("link", { name: /página inicial/i })).toHaveAttribute("href", "/");
  });

  it("não revela mensagem interna, digest, token, cookie nem e-mail", () => {
    const { container } = render(<ErrorPage error={technicalError} retry={() => {}} />);
    const html = container.innerHTML;

    for (const forbidden of [
      "Supabase falhou",
      "sb_secret_",
      "cookie=",
      "pessoa@exemplo.org",
      "1234567890",
      "stack",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });
});
