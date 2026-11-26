import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { ClienteArasaac } from "../arasaac/clienteArasaac";
import type { PictogramaArasaac } from "../arasaac/tipos";
import type { AyudaElegida } from "../necesidades/tipos";
import { TemaProvider } from "../temas";
import type {
  PictogramaPropio51,
  RolBibliotecaPictogramas51,
} from "../tipos/bibliotecaPictogramas";
import { AYUDAS_POR_DEFECTO, ayudaDesdeCatalogo26 } from "./ayudas";
import {
  CATALOGO_AYUDAS_26,
  PREFERENCIAS_POR_DEFECTO,
  type PreferenciasApariencia,
} from "./opciones";
import { SubpantallaAyuda26 } from "./SubpantallaAyuda26";

let mockRol: string | null = null;
jest.mock("../sesion/SesionProvider", () => ({
  useSesionOpcional: () =>
    mockRol
      ? { sesion: { user: { role: mockRol } }, cargando: false, cerrarSesion: jest.fn() }
      : null,
}));

const PATIO = {
  id: 7,
  palabraClave: "patio",
  palabrasClave: ["patio"],
  urlImagen: "https://x/7.png",
} as unknown as PictogramaArasaac;

const PROPIO: PictogramaPropio51 = {
  id: "p1",
  owner: "tutor",
  palabraClave: "Patio del cole",
  textoAlternativo: "Foto del patio",
  pictogramaId: 1,
  imagenUrl: "https://y/p1.png",
  creadoEn: "2026-11-20T09:00:00.000Z",
};

function cliente(buscar: ClienteArasaac["buscar"]): ClienteArasaac {
  return { buscar, obtener: jest.fn() as never, limpiarCache: jest.fn() };
}

type Cargar = (rol: RolBibliotecaPictogramas51) => Promise<PictogramaPropio51[]>;

async function montar({
  ayudas = [...AYUDAS_POR_DEFECTO],
  busqueda = "",
  buscar = jest.fn(async () => [PATIO]) as ClienteArasaac["buscar"],
  cargarBiblioteca = jest.fn<Cargar>(async () => [PROPIO]),
}: {
  ayudas?: AyudaElegida[];
  busqueda?: string;
  buscar?: ClienteArasaac["buscar"];
  cargarBiblioteca?: Cargar;
} = {}) {
  const actualizarBorrador = jest.fn<(c: Partial<PreferenciasApariencia>) => void>();
  const borrador: PreferenciasApariencia = { ...PREFERENCIAS_POR_DEFECTO, ayudas };
  const vista = await render(
    <TemaProvider>
      <SubpantallaAyuda26
        borrador={borrador}
        busqueda={busqueda}
        onChangeBusqueda={jest.fn()}
        actualizarBorrador={actualizarBorrador}
        alGuardar={jest.fn()}
        clienteArasaac={cliente(buscar)}
        cargarBiblioteca={cargarBiblioteca}
      />
    </TemaProvider>,
  );
  // Deja que termine la carga de Mi biblioteca antes de seguir (si no, se solapa con el siguiente act).
  await act(async () => {});
  return { actualizarBorrador, cargarBiblioteca, unmount: vista.unmount };
}

describe("Subpantalla 26 con buscador real (MOD HU-18, SCRUM-269)", () => {
  beforeEach(() => {
    mockRol = null;
  });

  it("sin texto enseña las sugerencias del catálogo", async () => {
    await montar();
    for (const item of CATALOGO_AYUDAS_26) {
      expect(screen.getByTestId(`resultado-ayuda-${ayudaDesdeCatalogo26(item).id}`)).toBeTruthy();
    }
  });

  it("buscando mezcla ARASAAC y Mi biblioteca, cada uno con su etiqueta", async () => {
    await montar({ busqueda: "patio" });
    const arasaac = await screen.findByTestId("resultado-ayuda-arasaac:7");
    const propio = await screen.findByTestId("resultado-ayuda-propio:p1");
    expect(arasaac).toHaveTextContent(/ARASAAC/);
    expect(propio).toHaveTextContent(/Mi biblioteca/);
    expect(propio).toHaveTextContent(/Patio del cole/);
  });

  it("si ARASAAC falla, se ve un aviso y siguen los de Mi biblioteca", async () => {
    await montar({
      busqueda: "patio",
      buscar: jest.fn(async () => {
        throw new Error("sin red");
      }) as ClienteArasaac["buscar"],
    });
    expect(await screen.findByTestId("error-arasaac-26")).toBeTruthy();
    expect(screen.getByTestId("resultado-ayuda-propio:p1")).toBeTruthy();
  });

  it("la biblioteca es la del rol: familia si entra un familiar, tutor si no", async () => {
    mockRol = "familiar";
    const familia = await montar();
    expect(familia.cargarBiblioteca).toHaveBeenCalledWith("familia");
    await familia.unmount();

    mockRol = "tutor_docente";
    const otra = await montar();
    expect(otra.cargarBiblioteca).toHaveBeenCalledWith("tutor");
  });

  it("elegir guarda la ayuda completa y actualiza las necesidades", async () => {
    const [bano, agua] = AYUDAS_POR_DEFECTO;
    const { actualizarBorrador } = await montar({ ayudas: [bano, agua], busqueda: "patio" });
    await fireEvent.press(await screen.findByTestId("resultado-ayuda-arasaac:7"));
    expect(actualizarBorrador).toHaveBeenCalledWith({
      ayudas: [
        bano,
        agua,
        { id: "arasaac:7", texto: "patio", imagenUrl: "https://x/7.png", origen: "arasaac" },
      ],
      necesidades: ["bano", "agua"],
    });
  });

  it("con 3 elegidas no añade más y con 1 no deja quitarla", async () => {
    const llenas = await montar({ busqueda: "patio" });
    await fireEvent.press(await screen.findByTestId("resultado-ayuda-arasaac:7"));
    expect(llenas.actualizarBorrador).not.toHaveBeenCalled();
    await llenas.unmount();

    const [bano] = AYUDAS_POR_DEFECTO;
    const una = await montar({ ayudas: [bano] });
    await fireEvent.press(screen.getByTestId("resultado-ayuda-arasaac:6929"));
    expect(una.actualizarBorrador).not.toHaveBeenCalled();
  });

  it("los huecos de la derecha enseñan las ayudas elegidas, también las de fuera del catálogo", async () => {
    const libre: AyudaElegida = {
      id: "propio:p1",
      texto: "Patio del cole",
      imagenUrl: "https://y/p1.png",
      origen: "biblioteca",
    };
    await montar({ ayudas: [libre] });
    expect(screen.getByTestId("muestra-ayuda-propio:p1")).toHaveTextContent(/Patio del cole/);
    expect(screen.getByTestId("hueco-vacio-26-1")).toBeTruthy();
  });
});
