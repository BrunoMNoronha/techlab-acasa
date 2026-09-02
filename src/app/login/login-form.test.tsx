import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  login: vi.fn(),
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("expõe campos acessíveis, submissão e recuperação de acesso", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/senha/i)).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: /entrar/i })).toBeEnabled();
    expect(screen.getByRole("link", { name: /esqueci minha senha/i })).toHaveAttribute(
      "href",
      "/recuperar-acesso",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
