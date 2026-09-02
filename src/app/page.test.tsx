import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("apresenta a fundação técnica sem antecipar regras de negócio", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /fundação técnica pronta para evoluir/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/sem antecipar regras de negócio ainda não implementadas/i),
    ).toBeInTheDocument();
  });
});
