// Pruebas de usabilidad cognitiva con perfiles no lectores (HU-01, T-01.4 · SCRUM-53)
//
// Simulan a un alumno que NO sabe leer recorriendo el inicio de sesión:
//   clase -> foto -> 3 dibujos
// y comprueban que nada imprescindible depende de leer texto.
//
// Criterios (ver docs/calidad/SCRUM-53_Pruebas_Usabilidad_No_Lectores.tex):
//   NL-01 Todo lo pulsable se anuncia por voz (rol + etiqueta accesible)
//   NL-02 Todo botón lleva un símbolo visual además del texto
//   NL-03 Tamaños táctiles: fotos y clases >= 120 dp, dibujos >= 96 dp, resto >= 44 dp (WCAG 2.5.5 AAA)
//   NL-04 En pantallas estrechas la cuadrícula baja de fila en vez de encoger las fotos
//   NL-05 Feedback sonoro en cada toque del recorrido principal
//   NL-06 Recorrido completo sin teclado y en 5 toques
//   NL-07 Los errores se pueden deshacer y se muestran con icono, no solo con texto
import React from "react";
import { StyleSheet } from "react-native";
import { render, screen, userEvent, within } from "@testing-library/react-native";

import LoginEstudiantesScreen from "../../../../app/login-estudiantes";
import { TarjetaEstudiante } from "../TarjetaEstudiante";
import { CuadriculaEstudiantes } from "../CuadriculaEstudiantes";
import { ModalConfirmacionEstudiante } from "../ModalConfirmacionEstudiante";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";
import { reproducirSonido } from "../../../servicios/sonidos";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

const sonar = reproducirSonido as jest.Mock;

// Emojis, flechas y símbolos (⬅ ⌫ ✓ ⚠️ ...): lo que un no lector puede "leer" sin leer
const SIMBOLO_VISUAL = /[\p{Extended_Pictographic}←-⇿⌀-⏿✀-➿⬀-⯿]/u;

const TAM_FOTO_Y_CLASE = 120;
const TAM_DIBUJO = 96;
const TAM_MINIMO_WCAG = 44;

/** Estilo final (aplanado) de un elemento. */
const estiloDe = (elemento: { props: { style?: unknown } }) =>
  StyleSheet.flatten(elemento.props.style as never) ?? {};

/**
 * Lado mínimo garantizado de un elemento táctil (minWidth/minHeight o width/height).
 * Si el botón no fija ancho (botones de texto), el ancho crece con el texto y manda la altura.
 */
const ladoMinimo = (elemento: { props: { style?: unknown } }) => {
  const e = estiloDe(elemento) as Record<string, unknown>;
  const ancho = Number(e.minWidth ?? e.width ?? 0);
  const alto = Number(e.minHeight ?? e.height ?? 0);
  return ancho > 0 ? Math.min(ancho, alto || ancho) : alto;
};

/** Cuenta los campos de texto (teclado) que hay en pantalla. */
const camposDeTexto = () => screen.container.queryAll((n) => n.type === "TextInput").length;

/** Recorre las 3 pantallas del login y devuelve los botones visibles en cada una. */
async function botonesDelRecorrido() {
  const user = userEvent.setup();
  await render(<LoginEstudiantesScreen />);
  const pantallaClases = screen.getAllByRole("button");

  await user.press(screen.getByTestId("tarjeta-clase-tri"));
  const pantallaFotos = screen.getAllByRole("button");

  await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
  const pantallaDibujos = within(screen.getByTestId("modal-confirmacion-estudiante")).getAllByRole(
    "button",
  );

  return { pantallaClases, pantallaFotos, pantallaDibujos };
}

describe("SCRUM-53 · Usabilidad cognitiva con perfiles no lectores (HU-01)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("NL-01 · Todo lo pulsable se puede anunciar por voz", () => {
    it("cada botón del recorrido tiene rol 'button' y una etiqueta accesible no vacía", async () => {
      const { pantallaClases, pantallaFotos, pantallaDibujos } = await botonesDelRecorrido();

      for (const boton of [...pantallaClases, ...pantallaFotos, ...pantallaDibujos]) {
        expect(boton.props.accessibilityLabel).toEqual(expect.stringMatching(/\S/));
      }
    });
  });

  describe("NL-02 · Ningún botón depende solo del texto", () => {
    it("cada botón del recorrido muestra un símbolo, emoji o foto además de su texto", async () => {
      const { pantallaClases, pantallaFotos, pantallaDibujos } = await botonesDelRecorrido();
      const sinSimbolo: string[] = [];

      for (const boton of [...pantallaClases, ...pantallaFotos, ...pantallaDibujos]) {
        const textos = within(boton)
          .queryAllByText(/.*/)
          .map((t) => String(t.props.children));
        const tieneImagen = boton.queryAll((n) => n.type === "Image").length > 0;
        if (!tieneImagen && !textos.some((t) => SIMBOLO_VISUAL.test(t))) {
          sinSimbolo.push(boton.props.accessibilityLabel);
        }
      }

      expect(sinSimbolo).toEqual([]);
    });

    it("las instrucciones de cada paso van acompañadas de un pictograma", async () => {
      const user = userEvent.setup();
      await render(<LoginEstudiantesScreen />);
      // Los pictogramas decorativos se ocultan al lector de pantalla, pero se ven en pantalla
      const visibles = { includeHiddenElements: true };
      expect(screen.getByText("🏫", visibles)).toBeTruthy(); // ¿Cuál es tu clase?

      await user.press(screen.getByTestId("tarjeta-clase-tri"));
      expect(screen.getByText("👆", visibles)).toBeTruthy(); // Busca tu dibujo o foto y tócalo

      await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
      expect(screen.getByText(/🔑/)).toBeTruthy(); // Toca tus 3 dibujos en orden
    });
  });

  describe("NL-03 · Tamaños táctiles adecuados para motricidad fina reducida", () => {
    it(`las clases y las fotos miden al menos ${TAM_FOTO_Y_CLASE} dp`, async () => {
      const { pantallaClases, pantallaFotos } = await botonesDelRecorrido();
      const clases = pantallaClases.filter((b) => b.props.testID?.startsWith("tarjeta-clase-"));
      const fotos = pantallaFotos.filter((b) => b.props.testID?.startsWith("tarjeta-estudiante-"));

      expect(clases.length).toBeGreaterThan(0);
      expect(fotos.length).toBeGreaterThan(0);
      for (const tarjeta of [...clases, ...fotos]) {
        expect(ladoMinimo(tarjeta)).toBeGreaterThanOrEqual(TAM_FOTO_Y_CLASE);
      }
    });

    it(`la foto nunca baja de ${TAM_FOTO_Y_CLASE} dp aunque se pida un tamaño menor`, async () => {
      await render(
        <TarjetaEstudiante
          estudiante={ESTUDIANTES_MOCK[0]}
          alSeleccionar={jest.fn()}
          tamanioMinimo={60}
        />,
      );
      const tarjeta = screen.getByTestId(`tarjeta-estudiante-${ESTUDIANTES_MOCK[0].id}`);
      expect(ladoMinimo(tarjeta)).toBeGreaterThanOrEqual(TAM_FOTO_Y_CLASE);
    });

    it(`los dibujos de la credencial miden al menos ${TAM_DIBUJO} dp`, async () => {
      const { pantallaDibujos } = await botonesDelRecorrido();
      const dibujos = pantallaDibujos.filter((b) =>
        b.props.testID?.startsWith("dibujo-credencial-"),
      );

      expect(dibujos).toHaveLength(9);
      for (const dibujo of dibujos) {
        expect(ladoMinimo(dibujo)).toBeGreaterThanOrEqual(TAM_DIBUJO);
      }
    });

    it(`el resto de botones cumple el mínimo WCAG 2.5.5 AAA (${TAM_MINIMO_WCAG} dp)`, async () => {
      const { pantallaClases, pantallaFotos, pantallaDibujos } = await botonesDelRecorrido();

      for (const boton of [...pantallaClases, ...pantallaFotos, ...pantallaDibujos]) {
        expect(ladoMinimo(boton)).toBeGreaterThanOrEqual(TAM_MINIMO_WCAG);
      }
    });
  });

  describe("NL-04 · Pantallas pequeñas", () => {
    it("la cuadrícula de fotos baja de fila (wrap) en vez de encoger las fotos", async () => {
      await render(
        <CuadriculaEstudiantes
          estudiantes={ESTUDIANTES_MOCK}
          alSeleccionarEstudiante={jest.fn()}
        />,
      );
      const cuadricula = estiloDe(screen.getByTestId("cuadricula-estudiantes")) as Record<
        string,
        unknown
      >;
      expect(cuadricula.flexDirection).toBe("row");
      expect(cuadricula.flexWrap).toBe("wrap");
    });
  });

  describe("NL-05 · Feedback sonoro", () => {
    it("suena algo en cada uno de los 5 toques del recorrido principal", async () => {
      const user = userEvent.setup();
      await render(<LoginEstudiantesScreen alCompletarCredencialVisual={jest.fn()} />);

      await user.press(screen.getByTestId("tarjeta-clase-tri"));
      await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
      for (const dibujo of ["manzana", "perro", "estrella"]) {
        await user.press(screen.getByTestId(`dibujo-credencial-${dibujo}`));
      }

      expect(sonar.mock.calls.map(([nombre]) => nombre)).toEqual([
        "toque", // clase
        "toque", // foto
        "toque", // dibujo 1
        "toque", // dibujo 2
        "acierto", // dibujo 3
      ]);
    });
  });

  describe("NL-06 · Recorrido corto y sin teclado", () => {
    it("ninguna pantalla del login pide escribir", async () => {
      const user = userEvent.setup();
      await render(<LoginEstudiantesScreen />);
      expect(camposDeTexto()).toBe(0);

      await user.press(screen.getByTestId("tarjeta-clase-tri"));
      expect(camposDeTexto()).toBe(0);

      await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
      expect(camposDeTexto()).toBe(0);
    });

    it("se entra con 5 toques: clase + foto + 3 dibujos", async () => {
      const user = userEvent.setup();
      const credencial = jest.fn();
      await render(<LoginEstudiantesScreen alCompletarCredencialVisual={credencial} />);

      let toques = 0;
      const tocar = async (testID: string) => {
        toques += 1;
        await user.press(screen.getByTestId(testID));
      };
      await tocar("tarjeta-clase-tri");
      await tocar("tarjeta-estudiante-ale");
      await tocar("dibujo-credencial-manzana");
      await tocar("dibujo-credencial-perro");
      await tocar("dibujo-credencial-estrella");

      expect(credencial).toHaveBeenCalledWith("ale", ["manzana", "perro", "estrella"]);
      expect(toques).toBeLessThanOrEqual(5);
    });
  });

  describe("NL-07 · Errores recuperables y comprensibles sin leer", () => {
    const alumno = ESTUDIANTES_MOCK[0];

    it("un dibujo equivocado se puede borrar y el hueco vuelve a quedar libre", async () => {
      const user = userEvent.setup();
      const alConfirmar = jest.fn();
      await render(
        <ModalConfirmacionEstudiante
          estudiante={alumno}
          visible
          alConfirmar={alConfirmar}
          alCancelar={jest.fn()}
        />,
      );

      await user.press(screen.getByTestId("dibujo-credencial-gato")); // se equivoca
      await user.press(screen.getByTestId("btn-borrar-dibujo"));
      for (const dibujo of ["manzana", "perro", "estrella"]) {
        await user.press(screen.getByTestId(`dibujo-credencial-${dibujo}`));
      }

      expect(alConfirmar).toHaveBeenCalledWith(alumno, ["manzana", "perro", "estrella"]);
    });

    it("el aviso de error lleva un icono, no solo texto", async () => {
      await render(
        <ModalConfirmacionEstudiante
          estudiante={alumno}
          visible
          alConfirmar={jest.fn()}
          alCancelar={jest.fn()}
          mensajeError="Esos dibujos no son. Prueba otra vez"
        />,
      );
      const aviso = screen.getByTestId("error-credencial-visual");
      expect(within(aviso).getByText(SIMBOLO_VISUAL)).toBeTruthy();
    });

    it("«No soy yo» devuelve a la cuadrícula de fotos sin perder la clase elegida", async () => {
      const user = userEvent.setup();
      await render(<LoginEstudiantesScreen />);

      await user.press(screen.getByTestId("tarjeta-clase-tri"));
      await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
      await user.press(screen.getByTestId("btn-cancelar-estudiante"));

      expect(screen.queryByText("¿Eres Alejandro?")).toBeNull();
      expect(screen.getByTestId("tarjeta-estudiante-mir")).toBeTruthy();
    });
  });
});
