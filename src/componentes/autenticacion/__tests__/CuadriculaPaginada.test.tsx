// MOD HU-01 · SCRUM-247 (T-01.5): 9 elementos por página, «Más …» a la derecha y «Pág. 1» a la
// izquierda, sin scroll (pantallas 01/01b y 02/02b).
import React from "react";
import { Text } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";

import { CuadriculaPaginada, ELEMENTOS_POR_PAGINA, paginar } from "../CuadriculaPaginada";

const numeros = (n: number) => Array.from({ length: n }, (_, i) => `e${i + 1}`);

function pintarCuadricula(elementos: string[], props: Record<string, unknown> = {}) {
  return render(
    <CuadriculaPaginada
      elementos={elementos}
      clave={(x) => x}
      pintar={(x) => <Text>{x}</Text>}
      queHayMas="aulas"
      testID="cuadricula"
      {...props}
    />,
  );
}

describe("paginar", () => {
  it("reparte en páginas de 9", () => {
    expect(ELEMENTOS_POR_PAGINA).toBe(9);
    expect(paginar(numeros(9))).toHaveLength(1);
    expect(paginar(numeros(10)).map((p) => p.length)).toEqual([9, 1]);
    expect(paginar(numeros(19)).map((p) => p.length)).toEqual([9, 9, 1]);
  });

  it("sin elementos devuelve una página vacía", () => {
    expect(paginar([])).toEqual([[]]);
  });
});

describe("CuadriculaPaginada", () => {
  it("con 9 o menos los enseña todos y no pone botones de página", async () => {
    await pintarCuadricula(numeros(9));
    expect(screen.getByText("e1")).toBeTruthy();
    expect(screen.getByText("e9")).toBeTruthy();
    expect(screen.queryByTestId("cuadricula-siguiente")).toBeNull();
    expect(screen.queryByTestId("cuadricula-anterior")).toBeNull();
  });

  it("con más de 9 enseña solo los 9 primeros y el botón «Más aulas»", async () => {
    await pintarCuadricula(numeros(12));
    expect(screen.getByText("e9")).toBeTruthy();
    expect(screen.queryByText("e10")).toBeNull();
    expect(screen.getByLabelText("Más aulas: ver la página 2")).toBeTruthy();
    expect(screen.queryByTestId("cuadricula-anterior")).toBeNull();
  });

  it("«Más aulas» pasa a la página 2 y «Pág. 1» vuelve a la primera", async () => {
    const user = userEvent.setup();
    const alCambiarPagina = jest.fn();
    await pintarCuadricula(numeros(12), { alCambiarPagina });

    await user.press(screen.getByTestId("cuadricula-siguiente"));
    expect(screen.getByTestId("cuadricula-pagina-2")).toBeTruthy();
    expect(screen.getByText("e10")).toBeTruthy();
    expect(screen.getByText("e12")).toBeTruthy();
    expect(screen.queryByText("e1")).toBeNull();
    expect(screen.queryByTestId("cuadricula-siguiente")).toBeNull();
    expect(alCambiarPagina).toHaveBeenLastCalledWith(1);

    await user.press(screen.getByLabelText("Volver a la página 1"));
    expect(screen.getByText("e1")).toBeTruthy();
    expect(screen.queryByText("e10")).toBeNull();
    expect(alCambiarPagina).toHaveBeenLastCalledWith(0);
  });

  it("con tres páginas, la del medio tiene los dos botones", async () => {
    await pintarCuadricula(numeros(20), { paginaInicial: 1 });
    expect(screen.getByText("e10")).toBeTruthy();
    expect(screen.getByLabelText("Volver a la página 1")).toBeTruthy();
    expect(screen.getByLabelText("Más aulas: ver la página 3")).toBeTruthy();
  });

  it("se abre en la página indicada (al volver con «Atrás»)", async () => {
    await pintarCuadricula(numeros(12), { paginaInicial: 1 });
    expect(screen.getByText("e11")).toBeTruthy();
    expect(screen.queryByText("e1")).toBeNull();
  });

  it("si la lista se acorta, no se queda en una página que ya no existe", async () => {
    const { rerender } = await pintarCuadricula(numeros(12), { paginaInicial: 1 });
    await rerender(
      <CuadriculaPaginada
        elementos={numeros(5)}
        clave={(x) => x}
        pintar={(x) => <Text>{x}</Text>}
        queHayMas="aulas"
        testID="cuadricula"
        paginaInicial={1}
      />,
    );
    expect(screen.getByText("e1")).toBeTruthy();
    expect(screen.getByTestId("cuadricula-pagina-1")).toBeTruthy();
  });
});
