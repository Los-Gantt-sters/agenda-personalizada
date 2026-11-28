// HU-23 · SCRUM-141: lo que el tutor deja ver en la 26d se cumple en la pantalla de la tarea del
// alumno (dibujo, texto, «Escuchar» y «Ver vídeo»).
import { render, screen, within } from "@testing-library/react-native";
import { AVISO_POR_DEFECTO } from "../../aviso-anticipado/tipos";
import { AgendaDelDia } from "../AgendaDelDia";
import { ESTUDIANTE_DEMO, agendaDemo } from "../datosDemo";
import { ajustarFormato, formatoPermitido, permisosDeVista } from "../formatosPermitidos";
import { crearRepositorioMemoria } from "../repositorioMemoria";
import type { EntradaAgenda } from "../tipos";
import { hoyISO } from "../useAgendaDia";
import type { FormatoMultimediaAlumno } from "../../../tipos/permisosAlumno";

// La agenda compila el reloj (SVG): sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
// Con voz, para que salga «Escuchar» (en Jest no hay síntesis de voz).
jest.mock("../../../servicios/voz", () => ({ puedeLeer: true, leer: jest.fn() }));

const TITULO = "Lavarse las manos";

/** El alumno está haciendo «Lavarse las manos» (e2), que tiene vídeo. */
const conE2EnCurso = (): EntradaAgenda[] =>
  agendaDemo(hoyISO()).map((e) =>
    e.id === "e2"
      ? {
          ...e,
          estado: "en_curso" as const,
          inicio_real: new Date().toISOString(),
          tarea: { ...e.tarea, video_url: "https://example.org/manos.mp4" },
        }
      : e,
  );

const abrir = async (formatos?: FormatoMultimediaAlumno[]) => {
  const { repo } = crearRepositorioMemoria(conE2EnCurso());
  await render(
    <AgendaDelDia
      repo={repo}
      estudianteId={ESTUDIANTE_DEMO}
      // El aviso de 5 minutos taparía la tarea según la hora a la que se pasen las pruebas.
      preferenciasAviso={{ ...AVISO_POR_DEFECTO, activado: false }}
      formatosPermitidos={formatos}
    />,
  );
  await screen.findByTestId("pantalla-tarea-en-curso");
};

const visual = () => within(screen.getByTestId("tarea-visual"));

describe("formatos permitidos (lógica)", () => {
  it("sin formatos se puede ver todo", () => {
    expect(permisosDeVista(undefined)).toEqual({
      dibujo: true,
      texto: true,
      audio: true,
      video: true,
    });
    expect(permisosDeVista([])).toEqual(permisosDeVista(null));
  });

  it("si se quitan el dibujo y el texto, se deja el dibujo para saber qué tarea es", () => {
    expect(permisosDeVista(["video"])).toEqual({
      dibujo: true,
      texto: false,
      audio: false,
      video: true,
    });
  });

  it("un formato no permitido se cambia por uno permitido", () => {
    const soloDibujo = permisosDeVista(["pictograma"]);
    expect(formatoPermitido("ambos", soloDibujo)).toBe(false);
    expect(ajustarFormato("ambos", soloDibujo)).toBe("soloPictograma");
    expect(ajustarFormato("soloTexto", soloDibujo)).toBe("soloPictograma");

    const soloTexto = permisosDeVista(["texto"]);
    expect(ajustarFormato("ambos", soloTexto)).toBe("soloTexto");
    expect(ajustarFormato("soloPictograma", soloTexto)).toBe("soloTexto");

    const todo = permisosDeVista(null);
    expect(ajustarFormato("soloPictograma", todo)).toBe("soloPictograma");
  });
});

describe("pantalla de la tarea con los formatos de la 26d", () => {
  it("sin restricciones salen los tres formatos, «Escuchar» y «Ver vídeo»", async () => {
    await abrir();
    expect(screen.getByTestId("selector-formato")).toBeTruthy();
    expect(screen.getByTestId("formato-ambos")).toBeTruthy();
    expect(screen.getByTestId("formato-soloPictograma")).toBeTruthy();
    expect(screen.getByTestId("formato-soloTexto")).toBeTruthy();
    expect(screen.getByLabelText("Escuchar")).toBeTruthy();
    expect(screen.getByLabelText("Ver vídeo")).toBeTruthy();
  });

  it("solo pictograma: se ve el dibujo, sin texto, sin elegir formato, sin audio ni vídeo", async () => {
    await abrir(["pictograma"]);
    expect(visual().getByLabelText(`Dibujo de ${TITULO}`)).toBeTruthy();
    expect(visual().queryByText(TITULO)).toBeNull();
    expect(screen.queryByTestId("selector-formato")).toBeNull();
    expect(screen.queryByLabelText("Escuchar")).toBeNull();
    expect(screen.queryByLabelText("Ver vídeo")).toBeNull();
  });

  it("texto y audio: se ve el texto sin dibujo y se puede escuchar", async () => {
    await abrir(["texto", "audio"]);
    expect(visual().getByText(TITULO)).toBeTruthy();
    expect(visual().queryByLabelText(`Dibujo de ${TITULO}`)).toBeNull();
    expect(screen.queryByTestId("selector-formato")).toBeNull();
    expect(screen.getByLabelText("Escuchar")).toBeTruthy();
    expect(screen.queryByLabelText("Ver vídeo")).toBeNull();
  });

  it("dibujo, texto y vídeo: se puede elegir formato y ver el vídeo, pero no escuchar", async () => {
    await abrir(["pictograma", "texto", "video"]);
    expect(screen.getByTestId("selector-formato")).toBeTruthy();
    expect(screen.getByLabelText("Ver vídeo")).toBeTruthy();
    expect(screen.queryByLabelText("Escuchar")).toBeNull();
  });
});
