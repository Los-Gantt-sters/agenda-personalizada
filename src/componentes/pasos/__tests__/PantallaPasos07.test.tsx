import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { createAudioPlayer } from "expo-audio";
import { PantallaPasos07 } from "../PantallaPasos07";
import { PantallaTodosPasos07f, pasosPorPagina } from "../PantallaTodosPasos07f";
import { formatoInicial, formatosPermitidos } from "../formatosPaso";
import type { EntradaAgenda, PasoTarea } from "../../agenda/tipos";
import { detenerVoz, leer } from "../../../servicios/voz";
import { firmarRuta } from "../../../servicios/pasosService";
import { ESPERA_AUDIO_MS, FotoPaso } from "../MultimediaPaso";
import { PreferenciasProvider } from "../../../preferencias";
import { TemaProvider } from "../../../temas";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
jest.mock("../../../servicios/pasosService", () => ({
  firmarRuta: jest.fn(async (ruta: string) => `https://nueva/${ruta}`),
}));
jest.mock("../../../servicios/voz", () => ({
  leer: jest.fn(),
  detenerVoz: jest.fn(),
  puedeLeer: true,
}));

const PASOS: PasoTarea[] = [
  {
    orden: 1,
    titulo: "Abre el grifo",
    texto: "Gira el grifo despacio para que salga agua templada.",
    pictograma_url: "https://picto/grifo.png",
    foto: { url: "https://firmada/grifo.jpg" },
  },
  { orden: 2, titulo: "Echa jabón", texto: "Pon una gota de jabón en la palma de tu mano." },
  {
    orden: 3,
    titulo: "Sécate",
    texto: "Coge la toalla limpia y sécate bien las dos manos.",
    video: { url: "https://firmada/secar.mp4" },
    audio: { url: "https://firmada/secar.m4a" },
  },
];

const entrada = (extra: Partial<EntradaAgenda["tarea"]> = {}): EntradaAgenda => ({
  id: "e2",
  estudiante_id: "al",
  tarea_id: "t2",
  fecha: "2026-11-24",
  hora_inicio: "09:30",
  duracion_prevista_min: 45,
  orden: 1,
  estado: "en_curso",
  inicio_real: new Date(2026, 10, 24, 9, 30).toISOString(),
  tarea: { id: "t2", titulo: "Lavarse las manos", pasos: PASOS, ...extra },
});

const insignia = () => screen.getByTestId("insignia-paso");

describe("formatos del paso (SCRUM-95: T-10.2)", () => {
  it("salen solo los que permite el profesor; si no dice nada, los 5", () => {
    expect(formatosPermitidos({})).toEqual(["pictograma", "texto", "foto", "video", "audio"]);
    expect(formatosPermitidos({ formatos_permitidos: ["audio", "pictograma"] })).toEqual([
      "pictograma",
      "audio",
    ]);
  });

  it("se empieza por el de Preferencias, si está permitido", () => {
    expect(formatoInicial("ambos", ["pictograma", "texto"])).toBe("pictograma");
    expect(formatoInicial("soloTexto", ["pictograma", "texto"])).toBe("texto");
    expect(formatoInicial("soloTexto", ["pictograma", "audio"])).toBe("pictograma");
    expect(formatoInicial("ambos", ["texto", "audio"])).toBe("texto");
  });
});

describe("Pantalla 07: tarea paso a paso (SCRUM-95: T-10.2)", () => {
  afterEach(() => jest.clearAllMocks());

  it("empieza en el Paso 1 con el reloj arriba y el pictograma con su etiqueta", async () => {
    await render(<PantallaPasos07 entrada={entrada()} alSalir={() => {}} />);
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Lavarse las manos");
    expect(insignia()).toHaveTextContent("Paso 1 de 3");
    expect(screen.getByTestId("reloj-pasos")).toBeTruthy();
    expect(screen.getByText("Empezaste a las 9:30")).toBeTruthy();
    expect(screen.getByTestId("titulo-paso")).toHaveTextContent("Abre el grifo");
    // Los 5 botones, con su etiqueta, debajo del paso.
    for (const f of ["Pictograma", "Texto", "Foto", "Vídeo", "Audio"])
      expect(screen.getByText(f)).toBeTruthy();
  });

  it("Texto (07b) enseña solo el texto del paso actual en Lectura Fácil", async () => {
    await render(<PantallaPasos07 entrada={entrada()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-texto"));
    expect(screen.getByTestId("texto-paso")).toHaveTextContent(
      "Gira el grifo despacio para que salga agua templada.",
    );
    expect(screen.queryByText("Pon una gota de jabón en la palma de tu mano.")).toBeNull();
  });

  it("Foto (07c) enseña la foto real; si el paso no tiene, el botón está apagado", async () => {
    await render(<PantallaPasos07 entrada={entrada()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-foto"));
    expect(screen.getByTestId("foto-paso").props.source).toEqual({
      uri: "https://firmada/grifo.jpg",
    });

    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(insignia()).toHaveTextContent("Paso 2 de 3");
    // El paso 2 no tiene foto: se ve el pictograma y «Foto» no se puede pulsar.
    expect(screen.queryByTestId("foto-paso")).toBeNull();
    expect(screen.getByTestId("btn-formato-foto").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.getByTestId("btn-formato-video").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("Audio suena sin cambiar lo que se ve: voz de la tableta si no hay grabación", async () => {
    await render(<PantallaPasos07 entrada={entrada()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    expect(leer).toHaveBeenCalledWith(
      "Paso 1. Abre el grifo. Gira el grifo despacio para que salga agua templada.",
      expect.any(Object),
    );
    expect(screen.getByTestId("titulo-paso")).toHaveTextContent("Abre el grifo");
    expect(screen.getByText("Escuchando el paso…")).toBeTruthy();
  });

  it("en el último paso «Siguiente» pasa a ser «Terminar tarea» (→ 08)", async () => {
    const alTerminar = jest.fn();
    await render(
      <PantallaPasos07 entrada={entrada()} alSalir={() => {}} alTerminar={alTerminar} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Siguiente: paso 2" }));
    await fireEvent.press(screen.getByRole("button", { name: "Siguiente: paso 3" }));
    expect(insignia()).toHaveTextContent("Paso 3 de 3");
    expect(screen.queryByRole("button", { name: /^Siguiente/ })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Terminar tarea" }));
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it("«Atrás» vuelve al paso anterior y, en el Paso 1, sale", async () => {
    const alSalir = jest.fn();
    await render(
      <PantallaPasos07
        entrada={entrada()}
        alSalir={alSalir}
        vistaInicial={{ paso: 1, formato: null }}
      />,
    );
    expect(insignia()).toHaveTextContent("Paso 2 de 3");
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(insignia()).toHaveTextContent("Paso 1 de 3");
    expect(alSalir).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it("solo salen los botones que permite el profesor y se respeta Preferencias", async () => {
    await render(
      <TemaProvider>
        <PreferenciasProvider preferenciasIniciales={{ canal: "soloTexto" }}>
          <PantallaPasos07
            entrada={entrada({ formatos_permitidos: ["pictograma", "texto"] })}
            alSalir={() => {}}
          />
        </PreferenciasProvider>
      </TemaProvider>,
    );
    expect(screen.queryByTestId("btn-formato-foto")).toBeNull();
    expect(screen.queryByTestId("btn-formato-audio")).toBeNull();
    expect(screen.getByTestId("btn-formato-texto").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("texto-paso")).toBeTruthy();
  });

  it("sin la preferencia «Reloj» no se ve el reloj", async () => {
    await render(<PantallaPasos07 entrada={entrada()} alSalir={() => {}} verReloj={false} />);
    expect(screen.queryByTestId("reloj-pasos")).toBeNull();
  });
});

describe("Pantalla 07f: todos los pasos (SCRUM-95: T-10.2)", () => {
  afterEach(() => jest.clearAllMocks());

  it("enseña todos los pasos a la vez, con su título y su texto", async () => {
    await render(
      <PantallaTodosPasos07f tarea={entrada().tarea} alAtras={() => {}} onEmpezar={() => {}} />,
    );
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent(
      "Lavarse las manos · Todos los pasos",
    );
    for (const n of [1, 2, 3]) expect(screen.getByTestId(`tarjeta-paso-${n}`)).toBeTruthy();
    expect(screen.getByText("Echa jabón")).toBeTruthy();
    expect(screen.getByText("Coge la toalla limpia y sécate bien las dos manos.")).toBeTruthy();
  });

  it("«Empezar tarea» y «Atrás» hacen lo suyo; sin onEmpezar no hay botón", async () => {
    const onEmpezar = jest.fn();
    const alAtras = jest.fn();
    const { rerender } = await render(
      <PantallaTodosPasos07f tarea={entrada().tarea} alAtras={alAtras} onEmpezar={onEmpezar} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Empezar tarea" }));
    expect(onEmpezar).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalledTimes(1);

    await rerender(<PantallaTodosPasos07f tarea={entrada().tarea} alAtras={alAtras} />);
    expect(screen.queryByRole("button", { name: "Empezar tarea" })).toBeNull();
  });

  it("Audio lee todos los pasos seguidos", async () => {
    await render(<PantallaTodosPasos07f tarea={entrada().tarea} alAtras={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    expect(leer).toHaveBeenCalledWith(
      expect.stringMatching(/^Paso 1\. .*Paso 3\. Sécate/),
      expect.any(Object),
    );
  });

  it("caben hasta 5 pasos por fila según el ancho", () => {
    expect(pasosPorPagina(980)).toBe(5);
    expect(pasosPorPagina(400)).toBe(2);
    expect(pasosPorPagina(100)).toBe(1);
  });
});

describe("Multimedia de los pasos cuando algo falla (revisión de Jaime)", () => {
  type Oyente = (estado: Record<string, unknown>) => void;
  let oyente: Oyente | null;
  let reproductor: { play: jest.Mock; remove: jest.Mock; addListener: jest.Mock };

  beforeEach(() => {
    oyente = null;
    reproductor = {
      play: jest.fn(),
      remove: jest.fn(),
      addListener: jest.fn((_evento: string, f: Oyente) => {
        oyente = f;
      }),
    };
    (createAudioPlayer as jest.Mock).mockImplementation(() => reproductor);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const pasoConAudio = (): EntradaAgenda =>
    entrada({
      pasos: [
        {
          orden: 1,
          titulo: "Sécate",
          texto: "Coge la toalla.",
          audio: { ruta: "t2/audio/a.m4a", url: "https://caducada/a.m4a" },
        },
        { orden: 2, titulo: "Cuelga la toalla", texto: "En su gancho." },
      ],
    });

  it("la grabación suena con una URL recién firmada (la de la mañana puede haber caducado)", async () => {
    await render(<PantallaPasos07 entrada={pasoConAudio()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    expect(firmarRuta).toHaveBeenCalledWith("t2/audio/a.m4a");
    expect(createAudioPlayer).toHaveBeenCalledWith({ uri: "https://nueva/t2/audio/a.m4a" });
    expect(leer).not.toHaveBeenCalled();
  });

  it("si la grabación falla, la lee la voz de la tableta (no se queda en silencio)", async () => {
    await render(<PantallaPasos07 entrada={pasoConAudio()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    await act(async () => oyente?.({ playbackState: "failed", playing: false }));
    expect(leer).toHaveBeenCalledWith("Paso 1. Sécate. Coge la toalla.", expect.any(Object));
    expect(reproductor.remove).toHaveBeenCalled();
  });

  it("si la grabación no empieza a sonar en unos segundos, también la lee la tableta", async () => {
    jest.useFakeTimers();
    await render(<PantallaPasos07 entrada={pasoConAudio()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    expect(leer).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(ESPERA_AUDIO_MS);
    });
    expect(leer).toHaveBeenCalledTimes(1);
  });

  it("si la grabación suena bien, no se lee encima", async () => {
    jest.useFakeTimers();
    await render(<PantallaPasos07 entrada={pasoConAudio()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    await act(async () => oyente?.({ playing: true, playbackState: "playing" }));
    await act(async () => {
      jest.advanceTimersByTime(ESPERA_AUDIO_MS * 2);
    });
    expect(leer).not.toHaveBeenCalled();
  });

  it("se calla al cambiar de paso", async () => {
    await render(<PantallaPasos07 entrada={pasoConAudio()} alSalir={() => {}} />);
    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    expect(screen.getByText("Escuchando el paso…")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Siguiente: paso 2" }));
    expect(reproductor.remove).toHaveBeenCalled();
    expect(detenerVoz).toHaveBeenCalled();
    expect(screen.queryByText("Escuchando el paso…")).toBeNull();
  });

  it("la foto con la URL caducada pide otra una vez y, si tampoco carga, avisa", async () => {
    await render(
      <FotoPaso
        recurso={{ ruta: "t2/foto/g.jpg", url: "https://caducada/g.jpg" }}
        ancho={200}
        alto={200}
      />,
    );
    await fireEvent(screen.getByTestId("foto-paso"), "error");
    expect(firmarRuta).toHaveBeenCalledWith("t2/foto/g.jpg");
    expect(screen.getByTestId("foto-paso").props.source).toEqual({
      uri: "https://nueva/t2/foto/g.jpg",
    });
    await fireEvent(screen.getByTestId("foto-paso"), "error");
    expect(screen.getByText("No se puede ver la foto")).toBeTruthy();
    expect(firmarRuta).toHaveBeenCalledTimes(1);
  });

  it("la foto que no se pudo firmar al abrir la tarea se vuelve a pedir", async () => {
    await render(
      <FotoPaso recurso={{ ruta: "t2/foto/g.jpg", url: null }} ancho={200} alto={200} />,
    );
    expect(await screen.findByTestId("foto-paso")).toBeTruthy();
    expect(screen.getByTestId("foto-paso").props.source).toEqual({
      uri: "https://nueva/t2/foto/g.jpg",
    });
  });
});
