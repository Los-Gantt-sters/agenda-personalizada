import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { AgendaDelDia } from "../AgendaDelDia";
import { ESTUDIANTE_DEMO, agendaDemo, agendaDemoPendiente } from "../datosDemo";
import { deshacerEmpezar, dividirEnBloques, retomarTarea } from "../logica";
import { crearRepositorioMemoria } from "../repositorioMemoria";
import type { EntradaAgenda } from "../tipos";
import { hoyISO } from "../useAgendaDia";

// La agenda compila el reloj (SVG): sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const FECHA = "2026-11-05";

describe("Tareas por retomar: lógica (SCRUM-264: T-08.6)", () => {
  it("salen en «Hecho», no en «Ahora» ni en «Después»", () => {
    const { hecho, ahora, despues } = dividirEnBloques(agendaDemoPendiente(FECHA));
    expect(hecho.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(ahora?.id).toBe("e3");
    expect(despues.map((e) => e.id)).not.toContain("e2");
  });

  it("no se esconden aunque solo se vea una tarjeta en «Hecho»", () => {
    const { hecho } = dividirEnBloques(agendaDemoPendiente(FECHA), { maxHecho: 1 });
    expect(hecho.map((e) => e.id)).toEqual(["e2"]);
  });

  it("si solo quedan tareas por retomar, el día no ha terminado", () => {
    const entradas = agendaDemoPendiente(FECHA).map((e) =>
      e.id === "e2" ? e : { ...e, estado: "hecha" as const },
    );
    const bloques = dividirEnBloques(entradas);
    expect(bloques.ahora).toBeNull();
    expect(bloques.diaTerminado).toBe(false);
  });

  it("al retomar pasa a «Ahora» y la siguiente sigue en «Después»", () => {
    const retomada = retomarTarea(agendaDemoPendiente(FECHA), "e2", "2026-11-05T10:00:00.000Z");
    const { ahora, despues } = dividirEnBloques(retomada);
    expect(ahora?.id).toBe("e2");
    expect(ahora?.estado).toBe("en_curso");
    expect(ahora?.inicio_real).toBe("2026-11-05T10:00:00.000Z");
    expect(despues[0].id).toBe("e3");
  });

  it("al deshacer vuelve a estar por retomar", () => {
    const retomada = retomarTarea(agendaDemoPendiente(FECHA), "e2");
    const { hecho } = dividirEnBloques(deshacerEmpezar(retomada, "e2"));
    expect(hecho.map((e) => e.id)).toContain("e2");
  });

  it("no se retoma si hay otra en curso ni si no estaba a medias", () => {
    const conOtra = agendaDemoPendiente(FECHA).map((e) =>
      e.id === "e3" ? { ...e, estado: "en_curso" as const } : e,
    );
    expect(retomarTarea(conOtra, "e2").find((e) => e.id === "e2")?.estado).toBe("pendiente");
    const normal = agendaDemo(FECHA);
    expect(retomarTarea(normal, "e3").find((e) => e.id === "e3")?.estado).toBe("pendiente");
  });
});

describe("Pantalla 10b «Retomar tarea» (SCRUM-264: T-08.6)", () => {
  const abrir = async (
    datos: EntradaAgenda[],
    props: Partial<Parameters<typeof AgendaDelDia>[0]> = {},
  ) => {
    const { repo, tutor } = crearRepositorioMemoria(datos);
    const user = userEvent.setup();
    await render(<AgendaDelDia repo={repo} estudianteId={ESTUDIANTE_DEMO} {...props} />);
    return { repo, tutor, user };
  };

  it("la tarjeta se lee como pendiente y abre la pantalla 10b", async () => {
    const { user } = await abrir(agendaDemoPendiente(hoyISO()));
    const tarjeta = await screen.findByTestId("mini-e2");
    expect(tarjeta.props.accessibilityLabel).toContain("pendiente de retomar");

    await user.press(tarjeta);

    expect(screen.getByTestId("pantalla-tarea-pendiente")).toBeTruthy();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent(
      "Lavarse las manos · Pendiente",
    );
    expect(screen.getByText("Te quedó por terminar esta tarea")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retomar tarea" })).toBeTruthy();
  });

  it("dice el motivo real: no culpa al profesor si se acabó el tiempo", async () => {
    const { user } = await abrir(agendaDemoPendiente(hoyISO(), "tiempo_agotado"));
    await user.press(await screen.findByTestId("mini-e2"));
    expect(screen.getByText("Se acabó el tiempo")).toBeTruthy();
    expect(screen.queryByText("Marcada como pendiente por tu profesor")).toBeNull();
  });

  it("«Atrás» vuelve a la agenda sin cambiar la tarea", async () => {
    const { repo, user } = await abrir(agendaDemoPendiente(hoyISO()));
    await user.press(await screen.findByTestId("mini-e2"));

    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(await screen.findByTestId("bloque-ahora")).toBeTruthy();
    const datos = await repo.obtenerSecuenciaDia(ESTUDIANTE_DEMO, hoyISO());
    expect(datos.find((e) => e.id === "e2")?.estado).toBe("pendiente");
  });

  it("«Retomar tarea» abre la tarea y «Atrás» la deja otra vez pendiente", async () => {
    const { repo, user } = await abrir(agendaDemoPendiente(hoyISO()));
    await user.press(await screen.findByTestId("mini-e2"));

    await user.press(screen.getByTestId("retomar-tarea"));
    // HU-10: «Lavarse las manos» tiene pasos, así que se retoma en la 07.
    expect(await screen.findByTestId("pantalla-07-pasos")).toBeTruthy();

    await user.press(screen.getByTestId("btn-barra-atras"));
    const tarjeta = await screen.findByTestId("mini-e2");
    expect(tarjeta.props.accessibilityLabel).toContain("pendiente de retomar");
    await waitFor(async () => {
      const datos = await repo.obtenerSecuenciaDia(ESTUDIANTE_DEMO, hoyISO());
      expect(datos.find((e) => e.id === "e2")?.estado).toBe("pendiente");
    });
  });

  it("vuelve al paso en el que la dejó", async () => {
    const enCurso = agendaDemo(hoyISO()).map((e) =>
      e.id === "e2"
        ? { ...e, estado: "en_curso" as const, inicio_real: new Date().toISOString() }
        : e,
    );
    const { tutor, user } = await abrir(enCurso);
    await screen.findByTestId("pantalla-07-pasos");
    await user.press(screen.getByRole("button", { name: "Siguiente: paso 2" }));
    await user.press(screen.getByRole("button", { name: "Siguiente: paso 3" }));

    // Se le acaba el tiempo con la tarea a medias: sale su 10b (SCRUM-266).
    tutor.modificar("e2", { estado: "pendiente", pendiente_motivo: "tiempo_agotado" });
    expect(await screen.findByTestId("pantalla-tarea-pendiente")).toBeTruthy();
    expect(
      screen.getByText("Puedes retomarla ahora desde el paso en el que la dejaste."),
    ).toBeTruthy();

    await user.press(screen.getByTestId("retomar-tarea"));

    expect(await screen.findByLabelText("Paso 3 de 4: Frota las manos")).toBeTruthy();
  });

  it("una familia la ve, pero no la puede retomar", async () => {
    const { user } = await abrir(agendaDemoPendiente(hoyISO()), {
      soloMirar: true,
      abrirTareaEnCurso: false,
    });
    await user.press(await screen.findByTestId("mini-e2"));

    expect(screen.getByTestId("pantalla-tarea-pendiente")).toBeTruthy();
    expect(screen.queryByTestId("retomar-tarea")).toBeNull();
    expect(screen.getByTestId("nota-pendiente")).toBeTruthy();
  });

  it("con otra tarea en curso no se puede retomar", async () => {
    const datos = agendaDemoPendiente(hoyISO()).map((e) =>
      e.id === "e3"
        ? { ...e, estado: "en_curso" as const, inicio_real: new Date().toISOString() }
        : e,
    );
    const { user } = await abrir(datos, { abrirTareaEnCurso: false });
    await user.press(await screen.findByTestId("mini-e2"));

    expect(screen.queryByTestId("retomar-tarea")).toBeNull();
    expect(screen.getByText("Antes hay que terminar la tarea que está en curso")).toBeTruthy();
  });
});
