import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Página inicial", () => {
  it("identifica o projeto com um único h1", () => {
    render(<Home />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe("TechLab+ ACASA");
  });

  it("indica que se trata do sistema de gestão da ACASA", () => {
    render(<Home />);

    const main = screen.getByRole("main");
    expect(main.textContent).toMatch(/sistema de gestão da ACASA/i);
  });

  it("possui os landmarks banner, main e contentinfo", () => {
    render(<Home />);

    expect(screen.getByRole("banner")).not.toBeNull();
    expect(screen.getByRole("main")).not.toBeNull();
    expect(screen.getByRole("contentinfo")).not.toBeNull();
  });

  it("aponta para a documentação oficial do projeto", () => {
    render(<Home />);

    const link = screen.getByRole("link", { name: "Documentação do projeto" });
    expect(link.getAttribute("href")).toBe(
      "https://github.com/BrunoMNoronha/techlab-acasa",
    );
  });
});
