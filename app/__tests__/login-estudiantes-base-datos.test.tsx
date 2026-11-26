// MOD HU-01 · SCRUM-249 (T-01.7): las aulas de la pantalla 01 son las que configura el
// administrador en la 48b, y los alumnos de la 02 salen de la base de datos. Flujo 01 → 02 → 03.
import { act, render, screen, userEvent } from "@testing-library/react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginEstudiantesScreen from "../login-estudiantes";
import { obtenerAlumnosAcceso, obtenerAulasAcceso } from "../../src/servicios/accesoAlumnosService";
import { obtenerAlumnoTableta, recordarAlumnoTableta } from "../../src/servicios/tabletaPersonal";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock("../../src/servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
jest.mock("../../src/servicios/accesoAlumnosService", () => ({
  usaBaseDatos: () => true,
  obtenerAulasAcceso: jest.fn(),
  obtenerAlumnosAcceso: jest.fn(),
}));

const mockAulas = obtenerAulasAcceso as jest.Mock;
const mockAlumnos = obtenerAlumnosAcceso as jest.Mock;

const AULAS = [
  { id: "aula-cir", nombre: "Clase Círculo", iconoForma: "cir", iconoUrl: null },
  { id: "aula-sol", nombre: "Aula Sol", iconoForma: "tri", iconoUrl: "https://picto/sol.png" },
];
const ALUMNOS_CIRCULO = [
  { id: "al-1", nombre: "Lucía", icono: "🦋", color: "#7A3FA6" },
  { id: "al-2", nombre: "Hugo", icono: null, color: null },
];
const ok = <T,>(datos: T[]) => ({ estado: "ok", datos });

/** Promesa que se resuelve cuando lo dice la prueba (para simular respuestas lentas). */
function respuestaPendiente() {
  let resolver: (valor: unknown) => void = () => {};
  const promesa = new Promise((r) => (resolver = r));
  return { promesa, resolver };
}

describe("Acceso del alumno con aulas y alumnos de la base de datos (SCRUM-249)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAulas.mockResolvedValue(ok(AULAS));
    mockAlumnos.mockResolvedValue(ok(ALUMNOS_CIRCULO));
  });

  it("la pantalla 01 enseña las aulas del administrador, con su nombre y en su orden", async () => {
    await render(<LoginEstudiantesScreen />);

    expect(await screen.findByText("Clase Círculo")).toBeTruthy();
    // El nombre sale tal cual lo puso el administrador, sin añadir otro «Clase»
    expect(screen.getByText("Aula Sol")).toBeTruthy();
    expect(screen.queryByText("Clase Aula Sol")).toBeNull();
    // No salen las clases de prueba
    expect(screen.queryByTestId("tarjeta-clase-tri")).toBeNull();
    // El aula con imagen la enseña en vez de la forma
    expect(screen.getByTestId("icono-aula-imagen", { includeHiddenElements: true })).toBeTruthy();
  });

  it("flujo 01 → 02 → 03: aula, alumno y contraseña de 3 dibujos", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await user.press(await screen.findByTestId("tarjeta-clase-aula-cir"));
    expect(mockAlumnos).toHaveBeenCalledWith("aula-cir");
    expect(await screen.findByText("Lucía")).toBeTruthy();
    expect(screen.getByText("Hugo")).toBeTruthy();

    await user.press(screen.getByTestId("tarjeta-estudiante-al-1"));
    expect(screen.getByText("¿Eres Lucía?")).toBeTruthy();
    expect(screen.getByTestId("cuadricula-dibujos-credencial")).toBeTruthy();
  });

  it("con más de 9 aulas, «Más aulas» lleva a la pantalla 01b", async () => {
    const user = userEvent.setup();
    mockAulas.mockResolvedValue(
      ok(
        Array.from({ length: 11 }, (_, i) => ({
          id: `aula-${i + 1}`,
          nombre: `Aula ${i + 1}`,
          iconoForma: "cua",
          iconoUrl: null,
        })),
      ),
    );
    await render(<LoginEstudiantesScreen />);

    expect(await screen.findByText("Aula 9")).toBeTruthy();
    expect(screen.queryByText("Aula 10")).toBeNull();
    await user.press(screen.getByLabelText("Más aulas: ver la página 2"));
    expect(screen.getByText("Aula 10")).toBeTruthy();
    expect(screen.getByText("Página 2")).toBeTruthy();
  });

  it("mientras llegan las aulas se ve «Cargando…», no las clases de prueba", async () => {
    const lenta = respuestaPendiente();
    mockAulas.mockReturnValue(lenta.promesa);
    await render(<LoginEstudiantesScreen />);

    expect(screen.getByTestId("aviso-cargando")).toBeTruthy();
    expect(screen.queryByTestId("tarjeta-clase-tri")).toBeNull();

    await act(async () => lenta.resolver(ok(AULAS)));
    expect(screen.getByText("Clase Círculo")).toBeTruthy();
  });

  it("si las aulas no llegan, avisa y «Volver a probar» las pide otra vez", async () => {
    const user = userEvent.setup();
    mockAulas.mockResolvedValueOnce({ estado: "error" });
    await render(<LoginEstudiantesScreen />);

    expect(await screen.findByTestId("aviso-error-carga")).toBeTruthy();
    expect(screen.getByText("No se han podido cargar las clases.")).toBeTruthy();
    // Con Supabase nunca se enseñan clases de prueba en su lugar
    expect(screen.queryByTestId("tarjeta-clase-tri")).toBeNull();

    await user.press(screen.getByTestId("btn-volver-a-probar"));
    expect(await screen.findByText("Clase Círculo")).toBeTruthy();
    expect(mockAulas).toHaveBeenCalledTimes(2);
  });

  it("si los alumnos no llegan, avisa y se pueden pedir otra vez (el error no se guarda)", async () => {
    const user = userEvent.setup();
    mockAlumnos.mockResolvedValueOnce({ estado: "error" });
    await render(<LoginEstudiantesScreen />);

    await user.press(await screen.findByTestId("tarjeta-clase-aula-cir"));
    expect(
      await screen.findByText("No se han podido cargar los alumnos de esta clase."),
    ).toBeTruthy();

    await user.press(screen.getByTestId("btn-volver-a-probar"));
    expect(await screen.findByText("Lucía")).toBeTruthy();
  });

  it("si se cambia de aula rápido, la respuesta tardía de la primera no pisa la segunda", async () => {
    const user = userEvent.setup();
    const lentaCirculo = respuestaPendiente();
    mockAlumnos.mockImplementation((aulaId: string) =>
      aulaId === "aula-cir"
        ? lentaCirculo.promesa
        : Promise.resolve(ok([{ id: "al-9", nombre: "Nuria", icono: "🌞", color: null }])),
    );
    await render(<LoginEstudiantesScreen />);

    await user.press(await screen.findByTestId("tarjeta-clase-aula-cir"));
    await user.press(screen.getByTestId("btn-barra-atras"));
    await user.press(screen.getByTestId("tarjeta-clase-aula-sol"));
    expect(await screen.findByText("Nuria")).toBeTruthy();

    // Llega tarde la respuesta de Círculo: el aula abierta sigue siendo Sol
    await act(async () => lentaCirculo.resolver(ok(ALUMNOS_CIRCULO)));
    expect(screen.getByText("Nuria")).toBeTruthy();
    expect(screen.queryByText("Lucía")).toBeNull();
  });

  describe("modo tableta personal con alumnos de la base de datos", () => {
    beforeEach(async () => {
      await AsyncStorage.clear();
    });

    it("si la tableta recuerda a un alumno real, abre directamente su contraseña", async () => {
      await recordarAlumnoTableta("al-1", "aula-cir");
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      expect(await screen.findByText("¿Eres Lucía?")).toBeTruthy();
      expect(mockAlumnos).toHaveBeenCalledWith("aula-cir");
    });

    it("«Atrás» (no soy yo) vuelve a los alumnos de su aula y la tableta lo olvida", async () => {
      const user = userEvent.setup();
      await recordarAlumnoTableta("al-1", "aula-cir");
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      await screen.findByText("¿Eres Lucía?");
      await user.press(screen.getByTestId("btn-barra-atras"));

      expect(screen.getByText("Hugo")).toBeTruthy();
      expect(await obtenerAlumnoTableta()).toBeNull();
    });

    it("si el alumno ya no está en esa aula, enseña las aulas como siempre y lo olvida", async () => {
      await recordarAlumnoTableta("al-9", "aula-cir");
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      expect(await screen.findByText("Clase Círculo")).toBeTruthy();
      await act(async () => {}); // deja terminar la búsqueda del alumno
      expect(screen.queryByText(/¿Eres/)).toBeNull();
      expect(await obtenerAlumnoTableta()).toBeNull();
    });
  });
});
