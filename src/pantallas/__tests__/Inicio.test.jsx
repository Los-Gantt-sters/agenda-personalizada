import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Inicio from "../Inicio";

describe("Inicio", () => {
  it("muestra el texto Agensible", () => {
    render(
      <BrowserRouter>
        <Inicio />
      </BrowserRouter>,
    );
    expect(screen.getByText("Agensible")).toBeTruthy();
  });
});
