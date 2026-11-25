// Pruebas de la pantalla 43 «Progreso e historial» (HU-25 · SCRUM-146).
import { fireEvent, render, screen, within } from "@testing-library/react-native";

import { ProgresoHistorial43 } from "../ProgresoHistorial43";
import { consolidarProgreso } from "../datosDemo";
import type { RepositorioProgreso, TareaProgreso } from "../tipos";

// Jueves 26 de noviembre de 2026.
const HOY = new Date(2026, 10, 26, 17, 0);
const ALUMNO = "11111111-2222-3333-4444-555555555555";

function tarea(id: string, fecha: string, cambios: Partial<TareaProgreso> = {}): TareaProgreso {
  return {
    id,
    fecha,
    hora: "09:00",
    titulo: `Tarea ${id}`,
    ambito: "centro",
    estado: "hecha",
    pendiente_motivo: null,
    plan_b: false,
    emocion: "contento",
    inicio_real: null,
    fin_real: null,
    ...cambios,
  };
}

// Semana del 23 al 29: 7 tareas. Semana anterior: 1.
const TAREAS: TareaProgreso[] = [
  tarea("a1", "2026-11-23", { titulo: "Asamblea" }),
  tarea("a2", "2026-11-23", {
    titulo: "Huerto",
    hora: "11:30",
    plan_b: true,
    emocion: "triste",
  }),
  tarea("a3", "2026-11-23", { titulo: "Preparar la mochila", hora: "19:00", ambito: "hogar" }),
  tarea("a4", "2026-11-24", {
    titulo: "Lectura fácil",
    estado: "pendiente",
    pendiente_motivo: "tiempo_agotado",
    emocion: null,
  }),
  tarea("a5", "2026-11-24", { titulo: "Recreo", hora: "11:00" }),
  tarea("a6", "2026-11-25", { titulo: "Taller", estado: "bloqueada", emocion: null }),
  tarea("a7", "2026-11-26", {
    titulo: "Comedor",
    hora: "13:30",
    estado: "en_curso",
    emocion: null,
  }),
  tarea("b1", "2026-11-17", { titulo: "Tarea antigua" }),
];

function crearRepo(): RepositorioProgreso & { obtener: jest.Mock } {
  return {
    obtener: jest.fn(async (_id: string, desde: string, hasta: string) =>
      consolidarProgreso(
        TAREAS.filter((t) => t.fecha >= desde && t.fecha <= hasta),
        desde <= "2026-11-24" && "2026-11-24" <= hasta
          ? [
              {
                id: "v1",
                necesidad: "urgencia",
                urgencia: true,
                atendido: false,
                creado_en: "2026-11-24T10:00:00.000Z",
              },
            ]
          : [],
        desde,
        hasta,
        { id: ALUMNO, nombre: "Alejandro" },
      ),
    ),
  };
}

async function abrir(repo = crearRepo(), alAtras: (() => void) | null = jest.fn()) {
  await render(
    <ProgresoHistorial43 repo={repo} estudianteId={ALUMNO} alAtras={alAtras} hoy={HOY} />,
  );
  await screen.findByText("Progreso e historial · Alejandro");
  return repo;
}

const ultimaLlamada = (repo: { obtener: jest.Mock }) => repo.obtener.mock.calls.at(-1)?.slice(1);

describe("Pantalla 43 · Progreso e historial (HU-25)", () => {
  it("abre la semana actual con indicadores, tabla y resumen", async () => {
    const repo = await abrir();

    expect(ultimaLlamada(repo)).toEqual(["2026-11-23", "2026-11-29"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent(
      "Esta semana: del 23 al 29 de noviembre",
    );
    expect(within(screen.getByTestId("kpi-completadas")).getByText("4 de 7")).toBeTruthy();
    expect(within(screen.getByTestId("kpi-pendientes")).getByText("3")).toBeTruthy();
    expect(
      within(screen.getByTestId("kpi-pendientes")).getByText(
        "1 sin terminar · 1 en curso · 1 bloqueada",
      ),
    ).toBeTruthy();
    expect(within(screen.getByTestId("kpi-emocion")).getByText("Contento (75 %)")).toBeTruthy();
    // Resumen: Plan B y la urgencia sin atender
    const resumen = screen.getByTestId("resumen-periodo");
    expect(within(resumen).getByText("Plan B activado 1 vez: Huerto (Lun 23).")).toBeTruthy();
    expect(within(resumen).getByText("Hay 1 urgencia sin marcar como atendida.")).toBeTruthy();
  });

  it("cada fila dice día, hora, tarea, ámbito, estado y emoción", async () => {
    await abrir();

    expect(screen.getByTestId("fila-tarea-a2").props.accessibilityLabel).toBe(
      "Lun 23. 11:30. Huerto, clase, con Plan B. Hecha. se sintió triste",
    );
    expect(screen.getByTestId("fila-tarea-a3").props.accessibilityLabel).toContain(
      "Preparar la mochila, casa",
    );
    expect(screen.getByTestId("fila-tarea-a4").props.accessibilityLabel).toContain("Sin terminar");
  });

  it("si no caben todas las filas, va por páginas sin scroll", async () => {
    await abrir();

    // 5 filas de hueco por defecto: 4 tareas y los botones de página
    expect(screen.getByTestId("texto-pagina")).toHaveTextContent("Página 1 de 2");
    expect(screen.queryByTestId("fila-tarea-a5")).toBeNull();
    expect(screen.getByTestId("pagina-anterior")).toBeDisabled();

    await fireEvent.press(screen.getByTestId("pagina-siguiente"));
    expect(screen.getByTestId("texto-pagina")).toHaveTextContent("Página 2 de 2");
    expect(screen.getByTestId("fila-tarea-a7")).toBeTruthy();
    expect(screen.queryByTestId("fila-tarea-a1")).toBeNull();
  });

  it("día, semana y mes; anterior, siguiente y volver a hoy", async () => {
    const repo = await abrir();

    // En el periodo actual no se puede ir al siguiente: no hay historial
    expect(screen.getByTestId("periodo-siguiente")).toBeDisabled();
    expect(screen.queryByTestId("periodo-hoy")).toBeNull();

    await fireEvent.press(screen.getByTestId("periodo-anterior"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-16", "2026-11-22"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent(
      "Semana anterior: del 16 al 22 de noviembre",
    );
    expect(await screen.findByTestId("fila-tarea-b1")).toBeTruthy();
    expect(screen.getByTestId("periodo-siguiente")).toBeEnabled();

    await fireEvent.press(screen.getByTestId("periodo-hoy"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-23", "2026-11-29"]);

    await fireEvent.press(screen.getByTestId("periodo-mes"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-01", "2026-11-30"]);
    expect(screen.getByTestId("periodo-mes").props.accessibilityState).toMatchObject({
      selected: true,
    });

    await fireEvent.press(screen.getByTestId("periodo-dia"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-26", "2026-11-26"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent("Hoy, jueves 26 de noviembre");
    // En un día no hace falta la columna «Día» ni «Ver días»
    expect(screen.queryByTestId("cambiar-vista")).toBeNull();
    expect(
      (await screen.findByTestId("fila-tarea-a7")).props.accessibilityLabel.startsWith("13:30"),
    ).toBe(true);
  });

  it("«Ver días» resume cada día y al tocar uno abre ese día", async () => {
    const repo = await abrir();

    await fireEvent.press(screen.getByTestId("cambiar-vista"));
    expect(screen.getByTestId("fila-dia-2026-11-23").props.accessibilityLabel).toBe(
      "Lun 23: 3 de 3 hechas. Abrir ese día",
    );
    expect(screen.getByTestId("fila-dia-2026-11-24").props.accessibilityLabel).toContain(
      "1 de 2 hechas",
    );

    await fireEvent.press(screen.getByTestId("fila-dia-2026-11-24"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-24", "2026-11-24"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent("Martes 24 de noviembre");
    expect(await screen.findByTestId("fila-tarea-a4")).toBeTruthy();
    expect(screen.queryByTestId("fila-tarea-a1")).toBeNull();
  });

  it("un periodo sin tareas lo dice", async () => {
    const repo = crearRepo();
    await abrir(repo);
    await fireEvent.press(screen.getByTestId("periodo-anterior"));
    await fireEvent.press(screen.getByTestId("periodo-anterior"));

    expect(await screen.findByTestId("sin-tareas")).toHaveTextContent(
      "No hay tareas en este periodo.",
    );
    expect(
      within(screen.getByTestId("resumen-periodo")).getByText(
        "Sin Plan B ni peticiones de ayuda en este periodo.",
      ),
    ).toBeTruthy();
  });

  it("si falla la carga, lo explica y deja reintentar", async () => {
    const repo = crearRepo();
    repo.obtener.mockRejectedValueOnce(
      new Error("No tienes permiso para ver el progreso de este alumno."),
    );
    await render(
      <ProgresoHistorial43 repo={repo} estudianteId={ALUMNO} alAtras={null} hoy={HOY} />,
    );

    expect(await screen.findByTestId("error-progreso")).toHaveTextContent(
      /No tienes permiso para ver el progreso de este alumno/,
    );
    await fireEvent.press(screen.getByTestId("reintentar"));
    expect(await screen.findByText("Progreso e historial · Alejandro")).toBeTruthy();
    expect(repo.obtener).toHaveBeenCalledTimes(2);
  });

  it("«Atrás» vuelve a la pantalla anterior", async () => {
    const alAtras = jest.fn();
    await abrir(crearRepo(), alAtras);

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalledTimes(1);
  });
});
