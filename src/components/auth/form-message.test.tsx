import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormMessage, Notice } from "./form-message";

describe("FormMessage", () => {
  it("não renderiza nada no estado inicial", () => {
    const { container } = render(<FormMessage id="m" state={{ status: "idle" }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("anuncia erros como alerta e sucessos como status", () => {
    const { rerender } = render(
      <FormMessage id="m" state={{ status: "error", message: "Falhou" }} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");

    rerender(<FormMessage id="m" state={{ status: "success", message: "Ok" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Ok");
  });
});

describe("Notice", () => {
  it("renderiza apenas quando há mensagem", () => {
    const { container, rerender } = render(<Notice />);
    expect(container).toBeEmptyDOMElement();

    rerender(<Notice message="Sessão encerrada." />);
    expect(screen.getByRole("status")).toHaveTextContent("Sessão encerrada.");
  });
});
