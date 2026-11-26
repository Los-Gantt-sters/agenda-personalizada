// Pantallas 07, 07b, 07c y 07d: la tarea paso a paso (SCRUM-95 · T-10.2, HU-10).
// Según los bocetos definitivos (Drive, Prototipo/definitiva_v2) y los cambios del 17-11:
// - Al pulsar «Empezar tarea» en 06 sale directamente el Paso 1 en grande.
// - Arriba, «Paso X de N» y el reloj («Quedan 45 minutos · Empezaste a las 9:30»). Sin columna a la
//   derecha: la tarjeta del paso va en el centro.
// - Debajo de la tarjeta, 5 botones con pictograma y etiqueta: Pictograma (07), Texto (07b: solo el
//   texto del paso actual en Lectura Fácil), Foto (07c), Vídeo (07d) y Audio (suena sin tapar la
//   imagen). Solo salen los que el profesor permite y se empieza por el de Preferencias.
// - Los pasos se pasan con «Atrás» y «Siguiente» de la barra de abajo. En el último paso,
//   «Siguiente» se cambia por el botón verde «Terminar tarea» (→ 08). «Atrás» en el Paso 1 hace lo
//   que diga quien la usa (en la agenda: «todavía no he empezado»).
// RNF4.1: sin scroll; el contenido se ajusta al hueco.
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import type { EntradaAgenda, FormatoPaso } from "../agenda/tipos";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import { useTranscurrido } from "../ejecucion-tarea/useTranscurrido";
import { RelojVisual } from "../reloj-visual/RelojVisual";
import { textoTiempoRestante } from "../reloj-visual/textoTiempo";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import { FORMA, Texto, useApariencia, useEstilos } from "../../ui";
import {
  formatoInicial,
  formatosPermitidos,
  pasoTiene,
  pasosOrdenados,
  textoVozPaso,
  tituloDe,
} from "./formatosPaso";
import { BotonesFormato, FotoPaso, VideoPaso, useAudioPaso } from "./MultimediaPaso";

/** Por dónde va el alumno: se guarda para volver al mismo paso desde 08 («No, sigo»). */
export interface VistaPasos {
  /** Índice del paso (0 = Paso 1). */
  paso: number;
  formato: FormatoPaso | null;
}

function horaDe(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function PantallaPasos07({
  entrada,
  alTerminar,
  alSalir,
  etiquetaSalir = "Atrás",
  verReloj = true,
  conSonido = false,
  vistaInicial,
  onCambioVista,
  aviso,
  pie,
}: {
  entrada: EntradaAgenda;
  /** «Terminar tarea» del último paso (→ 08). Sin él, el último paso no tiene botón verde. */
  alTerminar?: () => void;
  /** «Atrás» en el Paso 1. */
  alSalir: () => void;
  etiquetaSalir?: string;
  /** Preferencia «Reloj». */
  verReloj?: boolean;
  conSonido?: boolean;
  vistaInicial?: VistaPasos;
  onCambioVista?: (vista: VistaPasos) => void;
  /** Aviso de la tarea siguiente (franja de arriba), si lo hay. */
  aviso?: ReactNode;
  /** Aviso discreto de abajo (sin conexión, no se ha guardado). */
  pie?: ReactNode;
}) {
  const { canal, escalaLetra: L } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);

  const tarea = entrada.tarea;
  const pasos = pasosOrdenados(tarea);
  const total = pasos.length;
  const permitidos = formatosPermitidos(tarea);
  const [indice, setIndice] = useState(() =>
    Math.min(Math.max(0, vistaInicial?.paso ?? 0), Math.max(0, total - 1)),
  );
  const [formatoElegido, setFormatoElegido] = useState<FormatoPaso | null>(
    vistaInicial?.formato ?? null,
  );
  const paso = pasos[Math.min(indice, total - 1)];
  const inicial = formatoInicial(canal, permitidos);
  // Si el paso nuevo no tiene el formato elegido (p. ej. sin vídeo), se ve el de inicio.
  const formato =
    formatoElegido && permitidos.includes(formatoElegido) && paso && pasoTiene(paso, formatoElegido)
      ? formatoElegido
      : inicial;
  const audio = useAudioPaso();

  // Al cambiar de paso se calla el audio del anterior.
  useEffect(() => audio.parar(), [indice]); // eslint-disable-line react-hooks/exhaustive-deps

  const transcurridoMs = useTranscurrido(entrada.inicio_real ?? null);
  const conReloj = verReloj && Boolean(entrada.inicio_real);

  const irA = (n: number) => {
    setIndice(n);
    onCambioVista?.({ paso: n, formato: formatoElegido });
  };
  const elegir = (f: FormatoPaso) => {
    if (f === "audio") {
      if (audio.sonando) audio.parar();
      else if (paso) audio.reproducir(paso, textoVozPaso(paso, indice + 1));
      return;
    }
    setFormatoElegido(f);
    onCambioVista?.({ paso: indice, formato: f });
  };

  if (!paso) return null;
  const esUltimo = indice >= total - 1;
  const titulo = tituloDe(paso);

  // Medidas de la tarjeta: lo que sobra tras la fila de arriba (≈ 80) y los botones (≈ 90).
  const ancho = Math.min((area?.width ?? ventana.width) - 48, 760);
  const alto = (area?.height ?? ventana.height - 170) - 80 - 90 - 40;
  const altoTitulo = 34 * 1.3 * L + 12;
  const ladoMedio = Math.max(96, Math.min(ancho - 40, alto - altoTitulo - 36));

  let contenido: ReactNode;
  if (formato === "texto") {
    contenido = (
      <View style={e.bloqueTexto} testID="vista-texto">
        <Texto style={e.tituloTexto} numberOfLines={2}>
          {titulo}
        </Texto>
        <Texto style={e.textoLF} testID="texto-paso">
          {paso.texto}
        </Texto>
      </View>
    );
  } else {
    const medio =
      formato === "foto" && paso.foto ? (
        <FotoPaso
          recurso={paso.foto}
          ancho={Math.min(ancho - 40, ladoMedio * 1.5)}
          alto={ladoMedio}
        />
      ) : formato === "video" && paso.video ? (
        <VideoPaso
          recurso={paso.video}
          ancho={Math.min(ancho - 40, ladoMedio * 1.6)}
          alto={ladoMedio}
        />
      ) : (
        <PictogramaTarea
          tarea={{
            titulo,
            pictograma_url: paso.pictograma_url ?? tarea.pictograma_url,
            emoji: tarea.emoji,
          }}
          tam={Math.min(ladoMedio, 300)}
        />
      );
    contenido = (
      <>
        {medio}
        {/* Etiqueta siempre visible debajo del dibujo (cambios 17-11). */}
        <Texto style={e.tituloPaso} numberOfLines={2} testID="titulo-paso">
          {titulo}
        </Texto>
      </>
    );
  }

  return (
    <Pantalla
      titulo={tarea.titulo}
      alAtras={indice > 0 ? () => irA(indice - 1) : alSalir}
      etiquetaAtras={indice > 0 ? `Atrás: paso ${indice}` : etiquetaSalir}
      alAdelante={esUltimo ? (alTerminar ?? null) : () => irA(indice + 1)}
      textoAdelante={esUltimo ? "Terminar tarea" : "Siguiente"}
      etiquetaAdelante={esUltimo ? "Terminar tarea" : `Siguiente: paso ${indice + 2}`}
      adelanteVerde={esUltimo}
      conSonido={conSonido}
      testID="pantalla-07-pasos"
    >
      {aviso}
      <View
        style={e.cuerpo}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
            setArea({ width, height });
        }}
      >
        <View style={[e.filaArriba, { width: ancho }]}>
          <View style={e.insigniaPaso} testID="insignia-paso">
            <Texto style={e.textoInsignia} accessibilityLiveRegion="polite">
              {`Paso ${indice + 1} de ${total}`}
            </Texto>
          </View>
          {conReloj ? (
            <View style={e.cajaReloj} testID="reloj-pasos">
              <RelojVisual
                duracionMs={entrada.duracion_prevista_min * 60_000}
                transcurridoMs={transcurridoMs}
                tamano={56}
                mostrarRotulo={false}
              />
              <View>
                <Texto style={e.quedan}>
                  {textoTiempoRestante(entrada.duracion_prevista_min * 60_000 - transcurridoMs)}
                </Texto>
                {entrada.inicio_real ? (
                  <Texto
                    style={e.empezaste}
                  >{`Empezaste a las ${horaDe(entrada.inicio_real)}`}</Texto>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        <View
          style={[e.tarjeta, { width: ancho }]}
          testID="tarjeta-paso"
          accessible
          accessibilityLabel={`Paso ${indice + 1} de ${total}: ${titulo}`}
        >
          {contenido}
        </View>

        <BotonesFormato
          permitidos={permitidos}
          activo={formato}
          disponibles={(f) => pasoTiene(paso, f)}
          sonando={audio.sonando}
          onElegir={elegir}
        />
        {audio.sonando ? (
          <Texto style={e.sonando} accessibilityLiveRegion="polite">
            Escuchando el paso…
          </Texto>
        ) : null}
      </View>
      {pie}
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cuerpo: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: c.fondo,
    },
    filaArriba: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    insigniaPaso: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
    },
    textoInsignia: { fontSize: 20, fontWeight: "700", color: c.primario },
    cajaReloj: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    quedan: { fontSize: 18, fontWeight: "700", color: c.texto },
    empezaste: { fontSize: 14, color: c.textoSecundario },
    tarjeta: {
      flex: 1,
      minHeight: 0,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 18,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    tituloPaso: { fontSize: 34, fontWeight: "700", color: c.texto, textAlign: "center" },
    bloqueTexto: { alignItems: "center", gap: 16, maxWidth: 640 },
    tituloTexto: { fontSize: 34, fontWeight: "700", color: c.texto, textAlign: "center" },
    textoLF: { fontSize: 30, lineHeight: 42, color: c.texto, textAlign: "center" },
    sonando: { fontSize: 16, color: c.textoSecundario },
  });
