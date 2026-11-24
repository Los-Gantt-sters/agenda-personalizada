// Pantalla 08b del prototipo definitivo: aviso de que pronto cambia la actividad (T-08.6, SCRUM-264).
// RF4.6: el pictograma de la tarea que viene y cuánto falta. Es una pantalla completa, sin ventanas
// emergentes ni scroll. Se queda hasta pulsar «Vale» o «Atrás», y entonces AgendaDelDia devuelve al
// alumno justo donde estaba. No hace caso durante un momento al aparecer: como llega sin avisar, un
// toque que iba para otra cosa no puede quitarla sin haberla visto.
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSenalAviso } from "./AvisoFlotante";
import { AVISO_POR_DEFECTO, type EventoAviso, type PreferenciasAviso } from "./tipos";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import { BLOQUEO_AL_APARECER_MS } from "../ejecucion-tarea/BotonAccionTarea";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";

const HUECO = 16;
const ALTO_BOTON = 72;
const ANCHO_BOTON = 320;
const TAM_PICTO = 226;
const TAM_PICTO_MINIMO = 96;

export function PantallaAviso({
  aviso,
  preferencias = AVISO_POR_DEFECTO,
  onCerrar,
  conSonido = false,
  bloqueoAlAparecerMs = BLOQUEO_AL_APARECER_MS,
}: {
  aviso: EventoAviso;
  preferencias?: Pick<PreferenciasAviso, "vibracion">;
  /** «Vale» y «Atrás». No cambia nada de la agenda. */
  onCerrar: () => void;
  conSonido?: boolean;
  bloqueoAlAparecerMs?: number;
}) {
  useSenalAviso(aviso, preferencias.vibracion);
  const { colores, canal, escalaLetra: L } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";
  const { tarea } = aviso.entrada;
  const cuando = `En ${aviso.antelacion_min} minutos toca:`;

  const aparecio = useRef(0);
  useEffect(() => {
    aparecio.current = Date.now();
  }, []);
  const cerrar = () => {
    if (Date.now() - aparecio.current >= bloqueoAlAparecerMs) onCerrar();
  };

  // Con poco alto, el dibujo va a un lado y los textos y «Vale» al otro, con letra algo menor.
  const anchoUtil = (area?.width ?? ventana.width) - HUECO * 2;
  const altoUtil = (area?.height ?? ventana.height - 170) - HUECO * 2;
  const altoTextos = verTexto ? (28 + 42) * 1.3 * L + HUECO * 2 : 0;
  const enFila = anchoUtil >= 520 && altoUtil < altoTextos + ALTO_BOTON + HUECO + TAM_PICTO_MINIMO;
  const tamPicto = enFila
    ? Math.min(TAM_PICTO, altoUtil, anchoUtil * 0.4)
    : Math.max(TAM_PICTO_MINIMO, Math.min(TAM_PICTO, altoUtil - altoTextos - ALTO_BOTON - HUECO));
  const anchoBoton = Math.min(ANCHO_BOTON, enFila ? anchoUtil - tamPicto - HUECO : anchoUtil);

  const textoCuando = verTexto ? (
    <Texto style={[e.cuando, enFila && e.cuandoEnFila]}>{cuando}</Texto>
  ) : null;
  const nombre = verTexto ? (
    <Texto style={[e.nombre, enFila && e.nombreEnFila]} numberOfLines={enFila ? 1 : 2}>
      {tarea.titulo}
    </Texto>
  ) : null;
  const dibujo = verDibujo ? <PictogramaTarea tarea={tarea} tam={tamPicto} /> : null;
  const botonVale = (
    <Pressable
      testID="aviso-vale"
      accessibilityRole="button"
      accessibilityLabel="Vale"
      onPress={cerrar}
      style={({ pressed }) => [
        e.boton,
        { minWidth: anchoBoton, minHeight: enFila ? 64 : ALTO_BOTON },
        pressed && e.pulsado,
      ]}
    >
      <Icono nombre="check" color={colores.textoSobrePrimario} tam={30} grosor={3} />
      {verTexto ? <Texto style={e.textoBoton}>Vale</Texto> : null}
    </Pressable>
  );

  return (
    <Pantalla
      titulo="Pronto cambia la actividad"
      simbolo={
        <View style={e.simbolo}>
          <Icono nombre="campana" color={colores.primario} tam={26} />
        </View>
      }
      alAtras={cerrar}
      etiquetaAtras="Atrás: volver a donde estaba"
      conSonido={conSonido}
      testID="pantalla-aviso"
    >
      <View
        style={[e.cuerpo, { flexDirection: enFila ? "row" : "column" }]}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
            setArea({ width, height });
        }}
      >
        {enFila ? (
          <>
            <View
              accessible
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${cuando} ${tarea.titulo}`}
            >
              {dibujo}
            </View>
            <View style={e.columna}>
              {textoCuando}
              {nombre}
              {botonVale}
            </View>
          </>
        ) : (
          <>
            <View
              style={e.anuncio}
              accessible
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${cuando} ${tarea.titulo}`}
            >
              {textoCuando}
              {dibujo}
              {nombre}
            </View>
            {botonVale}
          </>
        )}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    simbolo: {
      width: 42,
      height: 42,
      borderRadius: 10,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    cuerpo: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: HUECO,
      padding: HUECO,
      minHeight: 0,
    },
    anuncio: { alignItems: "center", gap: HUECO, maxWidth: "100%", minHeight: 0 },
    columna: { flexShrink: 1, minWidth: 0, alignItems: "center", gap: 8 },
    cuando: { fontSize: 28, color: c.texto, textAlign: "center" },
    cuandoEnFila: { fontSize: 24 },
    nombre: { fontSize: 42, fontWeight: "700", color: c.texto, textAlign: "center" },
    nombreEnFila: { fontSize: 30 },
    boton: {
      maxWidth: "100%",
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 14,
      backgroundColor: c.primario,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    textoBoton: { fontSize: 28, fontWeight: "700", color: c.textoSobrePrimario },
    pulsado: { opacity: 0.85 },
  });
