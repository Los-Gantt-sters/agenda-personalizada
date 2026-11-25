// Pruebas de la pantalla 43 «Progreso e historial» (HU-25 · SCRUM-146).
import { fireEvent, render, screen, within } from "@testing-library/react-native";

import { ProgresoHistorial43, iniciales } from "../ProgresoHistorial43";
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

async function abrir(
  repo = crearRepo(),
  alAtras: (() => void) | null = jest.fn(),
  extra: { usuario?: string; alCerrarSesion?: () => void } = {},
) {
  await render(
    <ProgresoHistorial43
      repo={repo}
      estudianteId={ALUMNO}
      alAtras={alAtras}
      hoy={HOY}
      {...extra}
    />,
  );
  await screen.findByText("Progreso e historial · Alejandro");
  return repo;
}

const ultimaLlamada = (repo: { obtener: jest.Mock }) => repo.obtener.mock.calls.at(-1)?.slice(1);

describe("Pantalla 43 · Progreso e historial (HU-25)", () => {
  it("abre la semana actual con indicadores, tabla y resumen en tarjetas", async () => {
    const repo = await abrir();

    expect(ultimaLlamada(repo)).toEqual(["2026-11-23", "2026-11-29"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent(
      "Esta semana: del 23 al 29 de noviembre de 2026",
    );
    expect(within(screen.getByTestId("kpi-completadas")).getByText("4 de 7")).toBeTruthy();
    expect(
      within(screen.getByTestId("kpi-completadas")).getByText("57 % de las tareas"),
    ).toBeTruthy();
    expect(within(screen.getByTestId("kpi-pendientes")).getByText("3")).toBeTruthy();
    expect(
      within(screen.getByTestId("kpi-pendientes")).getByText(
        "1 sin terminar · 1 en curso · 1 bloqueada",
      ),
    ).toBeTruthy();
    expect(within(screen.getByTestId("kpi-emocion")).getByText("Contento (75 %)")).toBeTruthy();
    // Resumen a la derecha, en tarjetas
    expect(screen.getByTestId("resumen-dias")).toHaveTextContent(
      "Días con todo hecho: 1 de 4 (lunes 23).",
    );
    expect(screen.getByTestId("resumen-plan-b")).toHaveTextContent(
      "Plan B activado 1 vez: Huerto (lunes 23).",
    );
    expect(screen.getByTestId("resumen-ayuda")).toHaveTextContent(
      "Ha pedido ayuda 1 vez: urgencia (1).",
    );
    expect(screen.getByTestId("resumen-sin-terminar")).toHaveTextContent(
      "Sin terminar o bloqueadas: Lectura fácil (martes 24) y Taller (bloqueada, miércoles 25).",
    );
    expect(screen.getByTestId("resumen-urgencias")).toHaveTextContent(
      /^Urgencia sin atender: martes 24 a las/,
    );
  });

  it("si el resumen no cabe, nombra menos ejemplos sin perder las cifras", async () => {
    await abrir();
    const medir = (testID: string, height: number) =>
      fireEvent(screen.getByTestId(testID), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 280, height } },
      });

    // Cabe: se queda con dos ejemplos
    await medir("resumen-periodo", 400);
    await medir("contenido-resumen", 380);
    expect(screen.getByTestId("resumen-sin-terminar")).toHaveTextContent(
      "Sin terminar o bloqueadas: Lectura fácil (martes 24) y Taller (bloqueada, miércoles 25).",
    );

    // No cabe: un ejemplo y cuántos más, en dos líneas como mucho
    await medir("contenido-resumen", 450);
    expect(screen.getByTestId("resumen-sin-terminar")).toHaveTextContent(
      "Sin terminar o bloqueadas: Lectura fácil (martes 24) y 1 más.",
    );
    expect(
      within(screen.getByTestId("resumen-sin-terminar")).getByText(/Lectura fácil/).props
        .numberOfLines,
    ).toBe(2);
    expect(screen.getByTestId("resumen-dias")).toHaveTextContent(
      "Días con todo hecho: 1 de 4 (lunes 23).",
    );
  });

  it("en compacto, aunque no haya ejemplos que quitar, corta en dos líneas", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("abrir-calendario"));
    await fireEvent.press(screen.getByTestId("cal-semana-2026-11-09"));
    await screen.findByTestId("sin-tareas");
    const lineas = () =>
      within(screen.getByTestId("resumen-plan-b")).getByText(/no se ha activado/).props
        .numberOfLines;
    expect(lineas()).toBeUndefined(); // completo: el texto entero

    await fireEvent(screen.getByTestId("resumen-periodo"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 280, height: 100 } },
    });
    await fireEvent(screen.getByTestId("contenido-resumen"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 280, height: 160 } },
    });
    expect(lineas()).toBe(2);
  });

  it("cada fila dice cuándo, tarea, ámbito, estado (etiqueta de color con texto) y emoción", async () => {
    await abrir();

    expect(screen.getByTestId("fila-tarea-a2").props.accessibilityLabel).toBe(
      "Lun 23. 11:30. Huerto, clase, con Plan B. Hecha. se sintió triste",
    );
    expect(screen.getByTestId("fila-tarea-a2")).toHaveTextContent(/Lun 23 · 11:30/);
    expect(screen.getByTestId("fila-tarea-a3").props.accessibilityLabel).toContain(
      "Preparar la mochila, casa",
    );
    expect(within(screen.getByTestId("fila-tarea-a4")).getByText("Sin terminar")).toBeTruthy();
    expect(within(screen.getByTestId("fila-tarea-a1")).getByText("Hecha")).toBeTruthy();
  });

  it("si no caben todas las filas, va por páginas sin scroll", async () => {
    await abrir();

    // 5 filas por página: las 5 primeras tareas y, en la segunda página, las otras 2
    expect(screen.getByTestId("texto-pagina")).toHaveTextContent("Página 1 de 2");
    expect(screen.getByTestId("fila-tarea-a5")).toBeTruthy();
    expect(screen.queryByTestId("fila-tarea-a6")).toBeNull();
    expect(screen.getByTestId("pagina-anterior")).toBeDisabled();

    await fireEvent.press(screen.getByTestId("pagina-siguiente"));
    expect(screen.getByTestId("texto-pagina")).toHaveTextContent("Página 2 de 2");
    expect(within(screen.getByTestId("fila-tarea-a6")).getByText("Bloqueada")).toBeTruthy();
    expect(within(screen.getByTestId("fila-tarea-a7")).getByText("En curso")).toBeTruthy();
    expect(screen.queryByTestId("fila-tarea-a1")).toBeNull();
    expect(screen.getByTestId("pagina-siguiente")).toBeDisabled();
  });

  it("el calendario se abre en el sitio de la tabla y deja elegir otra semana", async () => {
    const repo = await abrir();

    await fireEvent.press(screen.getByTestId("abrir-calendario"));
    expect(screen.getByTestId("abrir-calendario").props.accessibilityState).toMatchObject({
      expanded: true,
    });
    // Sin ventana flotante: ocupa el sitio de los indicadores, la tabla y el resumen
    expect(screen.getByTestId("calendario-periodo")).toBeTruthy();
    expect(screen.queryByTestId("tabla-progreso")).toBeNull();
    expect(screen.queryByTestId("kpi-completadas")).toBeNull();
    expect(screen.getByTestId("cal-titulo")).toHaveTextContent("Elige la semana");
    expect(screen.getByTestId("cal-mes-texto")).toHaveTextContent("Noviembre");
    expect(screen.getByTestId("cal-semana-2026-11-23").props.accessibilityState).toMatchObject({
      selected: true,
    });
    // Lo que aún no ha llegado no se puede elegir
    expect(screen.getByTestId("cal-semana-2026-11-30")).toBeDisabled();
    expect(screen.getByTestId("cal-mes-siguiente")).toBeDisabled();
    expect(screen.getByTestId("cal-anio-siguiente")).toBeDisabled();

    await fireEvent.press(screen.getByTestId("cal-semana-2026-11-16"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-16", "2026-11-22"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent(
      "Semana anterior: del 16 al 22 de noviembre de 2026",
    );
    expect(screen.queryByTestId("calendario-periodo")).toBeNull();
    expect(await screen.findByTestId("fila-tarea-b1")).toBeTruthy();

    // «Hoy» vuelve a esta semana; «Cerrar» lo deja como estaba
    await fireEvent.press(screen.getByTestId("abrir-calendario"));
    await fireEvent.press(screen.getByTestId("cal-hoy"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-23", "2026-11-29"]);
    await fireEvent.press(screen.getByTestId("abrir-calendario"));
    await fireEvent.press(screen.getByTestId("cal-cerrar"));
    expect(screen.queryByTestId("calendario-periodo")).toBeNull();
    expect(screen.getByTestId("tabla-progreso")).toBeTruthy();
  });

  it("por meses se llega, por ejemplo, a septiembre del año pasado", async () => {
    const repo = await abrir();

    await fireEvent.press(screen.getByTestId("periodo-mes"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-01", "2026-11-30"]);
    expect(screen.getByTestId("periodo-mes").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent("Este mes: noviembre de 2026");

    await fireEvent.press(screen.getByTestId("abrir-calendario"));
    expect(screen.getByTestId("cal-titulo")).toHaveTextContent("Elige el mes");
    expect(screen.queryByTestId("cal-mes-anterior")).toBeNull(); // en meses solo se cambia el año
    expect(screen.getByTestId("cal-mes-2026-12")).toBeDisabled();

    await fireEvent.press(screen.getByTestId("cal-anio-anterior"));
    expect(screen.getByTestId("cal-anio-texto")).toHaveTextContent("2025");
    expect(screen.getByTestId("cal-mes-2025-12")).toBeEnabled();
    await fireEvent.press(screen.getByTestId("cal-mes-2025-09"));
    expect(ultimaLlamada(repo)).toEqual(["2025-09-01", "2025-09-30"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent("Septiembre de 2025");
  });

  it("por días: un día concreto del calendario y sin columna de día ni «Ver días»", async () => {
    const repo = await abrir();

    await fireEvent.press(screen.getByTestId("periodo-dia"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-26", "2026-11-26"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent(
      "Hoy, jueves 26 de noviembre de 2026",
    );
    expect(screen.queryByTestId("cambiar-vista")).toBeNull();
    expect(
      (await screen.findByTestId("fila-tarea-a7")).props.accessibilityLabel.startsWith("13:30"),
    ).toBe(true);

    await fireEvent.press(screen.getByTestId("abrir-calendario"));
    expect(screen.getByTestId("cal-titulo")).toHaveTextContent("Elige el día");
    expect(screen.getByTestId("cal-dia-2026-11-27")).toBeDisabled();
    await fireEvent.press(screen.getByTestId("cal-mes-anterior"));
    expect(screen.getByTestId("cal-mes-texto")).toHaveTextContent("Octubre");
    await fireEvent.press(screen.getByTestId("cal-mes-siguiente"));
    await fireEvent.press(screen.getByTestId("cal-dia-2026-11-24"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-24", "2026-11-24"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent("Martes 24 de noviembre de 2026");
  });

  it("«Ver días» resume cada día y al tocar uno abre ese día", async () => {
    const repo = await abrir();

    await fireEvent.press(screen.getByTestId("cambiar-vista"));
    expect(screen.getByTestId("fila-dia-2026-11-23").props.accessibilityLabel).toBe(
      "Lun 23: 3 de 3 hechas. Abrir ese día",
    );
    expect(within(screen.getByTestId("fila-dia-2026-11-23")).getByText("100 %")).toBeTruthy();
    expect(screen.getByTestId("fila-dia-2026-11-24").props.accessibilityLabel).toContain(
      "1 de 2 hechas",
    );

    await fireEvent.press(screen.getByTestId("fila-dia-2026-11-24"));
    expect(ultimaLlamada(repo)).toEqual(["2026-11-24", "2026-11-24"]);
    expect(screen.getByTestId("texto-periodo")).toHaveTextContent("Martes 24 de noviembre de 2026");
    expect(await screen.findByTestId("fila-tarea-a4")).toBeTruthy();
    expect(screen.queryByTestId("fila-tarea-a1")).toBeNull();
  });

  it("un periodo sin tareas lo dice", async () => {
    const repo = crearRepo();
    await abrir(repo);
    await fireEvent.press(screen.getByTestId("abrir-calendario"));
    await fireEvent.press(screen.getByTestId("cal-semana-2026-11-09"));

    expect(await screen.findByTestId("sin-tareas")).toHaveTextContent(
      "No hay tareas en este periodo.",
    );
    expect(screen.getByTestId("resumen-plan-b")).toHaveTextContent("Plan B: no se ha activado.");
    expect(screen.getByTestId("resumen-ayuda")).toHaveTextContent("Ayuda: no ha pedido ayuda.");
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

  it("arriba a la derecha salen quién ha entrado y «Salir»", async () => {
    const alCerrarSesion = jest.fn();
    await abrir(crearRepo(), jest.fn(), { usuario: "Carmen Ruiz", alCerrarSesion });

    expect(screen.getByTestId("usuario-cabecera").props.accessibilityLabel).toBe(
      "Has entrado como Carmen Ruiz",
    );
    expect(within(screen.getByTestId("usuario-cabecera")).getByText("CR")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("cerrar-sesion"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("sin sesión (demo) no salen ni el usuario ni «Salir»", async () => {
    await abrir();
    expect(screen.queryByTestId("usuario-cabecera")).toBeNull();
    expect(screen.queryByTestId("cerrar-sesion")).toBeNull();
  });

  it("iniciales del usuario a partir del nombre o del correo", () => {
    expect(iniciales("Carmen Ruiz Morales")).toBe("CR");
    expect(iniciales("tutor.docente@purisima.es")).toBe("TD");
    expect(iniciales("Rosa")).toBe("R");
  });

  it("«Atrás» vuelve a la pantalla anterior", async () => {
    const alAtras = jest.fn();
    await abrir(crearRepo(), alAtras);

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalledTimes(1);
  });
});
