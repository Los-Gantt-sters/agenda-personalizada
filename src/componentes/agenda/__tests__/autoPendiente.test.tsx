// SCRUM-266 (T-AUTO.2): cómo se ve una tarea que pasa sola a Pendiente al acabarse su tiempo
// (SCRUM-265). Agenda del alumno (06), agendas de tutor y familia (39, 40) y aviso de 41 y 42b.
import { act, render, screen, userEvent, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { BLOQUEO_AL_APARECER_MS } from "../../ejecucion-tarea/BotonAccionTarea";
import { AVISO_POR_DEFECTO } from "../../aviso-anticipado/tipos";
import { AgendaDelDia } from "../AgendaDelDia";
import { ESTUDIANTE_DEMO, agendaDemo, agendaDemoPendiente } from "../datosDemo";
import { crearRepositorioMemoria } from "../repositorioMemoria";
import type { EntradaAgenda } from "../tipos";
import { hoyISO } from "../useAgendaDia";
import * as servicioVoz from "../../../servicios/voz";
import { AgendaAdultoAlumno } from "../../tutor-familia/AgendaAdultoAlumno";
import { VistaTareaFamiliaCasa42b } from "../../tutor-familia/VistaTareaFamiliaCasa42b";
import { VistaTareaTutor41 } from "../../tutor-familia/VistaTareaTutor41";

// Sin el aviso de 5 minutos (08b): taparía la agenda si se pasan las pruebas justo antes de una tarea.
const SIN_AVISO = { ...AVISO_POR_DEFECTO, activado: false };

// La agenda compila el reloj (SVG): sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
jest.spyOn(servicioVoz, "leer").mockImplementation(() => {});

const abrir = async (datos: EntradaAgenda[]) => {
  const { repo, tutor } = crearRepositorioMemoria(datos);
  const user = userEvent.setup();
  await render(
    <AgendaDelDia preferenciasAviso={SIN_AVISO} repo={repo} estudianteId={ESTUDIANTE_DEMO} />,
  );
  return { repo, tutor, user };
};

/** El alumno está haciendo «Lavarse las manos» (e2). */
const conE2EnCurso = () =>
  agendaDemo(hoyISO()).map((e) =>
    e.id === "e2"
      ? { ...e, estado: "en_curso" as const, inicio_real: new Date().toISOString() }
      : e,
  );

describe("Agenda del alumno (06): tarea que pasa sola a Pendiente (SCRUM-266)", () => {
  it("la tarjeta ámbar dice que se acabó el tiempo", async () => {
    await abrir(agendaDemoPendiente(hoyISO(), "tiempo_agotado"));
    const tarjeta = await screen.findByTestId("mini-e2");

    expect(within(tarjeta).getByText(/· Pendiente \(tiempo agotado\)$/)).toBeTruthy();
    expect(tarjeta.props.accessibilityLabel).toContain(
      "pendiente de retomar porque se acabó el tiempo",
    );
  });

  it("si la dejó pendiente el profesor, la tarjeta no habla del tiempo", async () => {
    await abrir(agendaDemoPendiente(hoyISO(), "profesor"));
    const tarjeta = await screen.findByTestId("mini-e2");

    expect(within(tarjeta).getByText(/· Pendiente$/)).toBeTruthy();
    expect(tarjeta.props.accessibilityLabel).not.toContain("se acabó el tiempo");
  });

  it("si se acaba el tiempo con la tarea abierta, sale la 10b y «Atrás» lleva a la agenda", async () => {
    const { tutor, user } = await abrir(conE2EnCurso());
    await screen.findByTestId("pantalla-tarea-en-curso");

    // Lo que hace el servidor al acabar la franja (SCRUM-265).
    tutor.modificar("e2", { estado: "pendiente", pendiente_motivo: "tiempo_agotado" });

    expect(await screen.findByTestId("pantalla-tarea-pendiente")).toBeTruthy();
    expect(screen.getByText("Se acabó el tiempo")).toBeTruthy();
    expect(screen.getByTestId("retomar-tarea")).toBeTruthy();

    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(await screen.findByTestId("bloque-ahora")).toBeTruthy();
    expect(within(screen.getByTestId("mini-e2")).getByText(/tiempo agotado/)).toBeTruthy();
  });

  it("también si estaba en «¿Has terminado?»", async () => {
    const { tutor, user } = await abrir(conE2EnCurso());
    await screen.findByTestId("pantalla-tarea-en-curso");
    // «Terminar» no hace caso a los toques justo al aparecer (pulsaciones sin querer).
    await act(() => new Promise((listo) => setTimeout(listo, BLOQUEO_AL_APARECER_MS + 50)));
    await user.press(screen.getByRole("button", { name: "Terminar" }));
    expect(screen.getByTestId("pantalla-confirmar-fin")).toBeTruthy();

    tutor.modificar("e2", { estado: "pendiente", pendiente_motivo: "tiempo_agotado" });

    expect(await screen.findByTestId("pantalla-tarea-pendiente")).toBeTruthy();
    expect(screen.queryByTestId("pantalla-confirmar-fin")).toBeNull();
  });

  it("si el profesor la deja pendiente con la tarea abierta, la 10b dice por qué", async () => {
    const { tutor } = await abrir(conE2EnCurso());
    await screen.findByTestId("pantalla-tarea-en-curso");

    tutor.modificar("e2", { estado: "pendiente", pendiente_motivo: "profesor" });

    expect(await screen.findByTestId("pantalla-tarea-pendiente")).toBeTruthy();
    expect(screen.getByText("Marcada como pendiente por tu profesor")).toBeTruthy();
  });

  it("si el alumno vuelve atrás sin terminar, vuelve a la agenda sin 10b", async () => {
    const { user } = await abrir(conE2EnCurso());
    await screen.findByTestId("pantalla-tarea-en-curso");

    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(await screen.findByTestId("bloque-ahora")).toBeTruthy();
    expect(screen.queryByTestId("pantalla-tarea-pendiente")).toBeNull();
  });
});

describe("Agendas de tutor (39) y familia (40) (SCRUM-266)", () => {
  it.each(["tutor", "familia"] as const)(
    "%s: la tarea auto-pendiente se ve en ámbar, con icono y no con un signo suelto",
    async (rol) => {
      await render(<AgendaAdultoAlumno rol={rol} alAbrirTarea={jest.fn()} />);

      const pendiente = screen.getByTestId("tarjeta-hecho-t-rincon-lectura");
      expect(within(pendiente).getByText("Auto-pendiente (tiempo agotado)")).toBeTruthy();
      expect(within(pendiente).queryByText("!")).toBeNull();
      expect(StyleSheet.flatten(pendiente.props.style).borderWidth).toBe(3);

      const hecha = screen.getByTestId("tarjeta-hecho-t-asamblea");
      expect(within(hecha).queryByText("✓")).toBeNull();
      expect(StyleSheet.flatten(hecha.props.style).borderWidth).not.toBe(3);
    },
  );
});

describe("Aviso informativo de 41 y 42b (SCRUM-266)", () => {
  it.each([
    ["41", () => <VistaTareaTutor41 />],
    ["42b", () => <VistaTareaFamiliaCasa42b />],
  ])("%s explica la regla sin emoji", async (pantalla, crear) => {
    await render(crear());

    const aviso = screen.getByTestId(`aviso-auto-pendiente-${pantalla}`);
    expect(
      within(aviso).getByText(
        "Si finaliza el horario programado y no se ha pulsado «Terminar tarea», se marca automáticamente como Pendiente",
      ),
    ).toBeTruthy();
    expect(within(aviso).queryByText(/⏱/)).toBeNull();
  });
});
