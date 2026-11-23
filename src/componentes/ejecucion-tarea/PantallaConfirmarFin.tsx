// Pantalla 08 del prototipo definitivo: «¿Has terminado?» (T-08.4, SCRUM-262).
// Sale al pulsar «Terminar». «Sí, he terminado» pasa a la felicitación; «No, sigo» y «Atrás» vuelven
// a la tarea, en el mismo paso y con el mismo formato (eso lo guarda AgendaDelDia).
// Es una pantalla completa, con su cabecera y su barra de abajo: sin ventanas emergentes ni scroll.
// «Sí» no hace caso durante un momento al aparecer: el toque que abrió la pantalla (o un segundo
// toque sin querer) no puede dar la tarea por terminada.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { BLOQUEO_AL_APARECER_MS } from "./BotonAccionTarea";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import type { Tarea } from "../agenda/tipos";
import { Pantalla } from "../../pantalla";
import type { Paleta } from "../../temas";
import { Icono, Texto, colorSobre, useApariencia, useEstilos } from "../../ui";

const PREGUNTA = "¿Has terminado?";
const ALTO_BOTON = 94;
/** En pantallas muy bajas los botones encogen, siempre por encima de los 48 px de RNF6.3. */
const ALTO_BOTON_MINIMO = 64;
const ANCHO_BOTON = 350;
const HUECO = 20;
const HUECO_BOTONES = 24;
/** Lado del dibujo cuando hay sitio (como en el prototipo). */
const TAM_PICTO = 200;
const TAM_PICTO_MINIMO = 72;

export function PantallaConfirmarFin({
  tarea,
  onSi,
  onNo,
  conSonido = false,
  bloqueoAlAparecerMs = BLOQUEO_AL_APARECER_MS,
}: {
  tarea: Pick<Tarea, "titulo" | "pictograma_url" | "emoji">;
  /** «Sí, he terminado». */
  onSi: () => void;
  /** «No, sigo» y «Atrás»: vuelve al último paso de la tarea. */
  onNo: () => void;
  conSonido?: boolean;
  bloqueoAlAparecerMs?: number;
}) {
  const { colores, canal, escalaLetra: L } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";

  const aparecio = useRef(0);
  const confirmado = useRef(false);
  useEffect(() => {
    aparecio.current = Date.now();
  }, []);
  const decirSi = () => {
    if (confirmado.current || Date.now() - aparecio.current < bloqueoAlAparecerMs) return;
    confirmado.current = true;
    onSi();
  };

  // Sin scroll: los botones van primero (en fila si caben). Con lo que sobra se enseña la pregunta,
  // que ya está en la cabecera y es lo primero que se quita, y el dibujo.
  const anchoUtil = (area?.width ?? ventana.width) - HUECO * 2;
  const altoUtil = (area?.height ?? ventana.height - 170) - HUECO * 2;
  const enFila = anchoUtil >= Math.max(ANCHO_BOTON, 320 * L) + ANCHO_BOTON + HUECO_BOTONES;
  const altoBoton = enFila
    ? ALTO_BOTON
    : Math.max(ALTO_BOTON_MINIMO, Math.min(ALTO_BOTON, (altoUtil - HUECO_BOTONES) / 2));
  const sitio = altoUtil - (enFila ? altoBoton : altoBoton * 2 + HUECO_BOTONES);
  const altoPregunta = 38 * 1.3 * L + HUECO;
  const verPregunta =
    verTexto && sitio >= altoPregunta + (verDibujo ? TAM_PICTO_MINIMO + HUECO : 0);
  const sitioDibujo = sitio - (verPregunta ? altoPregunta : 0) - HUECO;
  const conDibujo = verDibujo && sitioDibujo >= TAM_PICTO_MINIMO;
  const tamPicto = Math.min(TAM_PICTO, sitioDibujo);
  const anchoBoton = Math.min(ANCHO_BOTON, anchoUtil);
  const colorSi = colorSobre(colores.exito);

  return (
    <Pantalla
      titulo={PREGUNTA}
      simbolo={
        <View style={e.simbolo}>
          <Icono nombre="check" color={colores.primario} tam={26} />
        </View>
      }
      alAtras={onNo}
      etiquetaAtras="Atrás: sigo con la tarea"
      conSonido={conSonido}
      testID="pantalla-confirmar-fin"
    >
      <View
        style={e.cuerpo}
        accessibilityLiveRegion="polite"
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
            setArea({ width, height });
        }}
      >
        {conDibujo ? <PictogramaTarea tarea={tarea} tam={tamPicto} /> : null}
        {verPregunta ? <Texto style={e.pregunta}>{PREGUNTA}</Texto> : null}
        <View style={[e.botones, { flexDirection: enFila ? "row" : "column" }]}>
          {/* Terminar va a la derecha: es la dirección de avance, como «Adelante» en la barra. */}
          <Boton
            texto="No, sigo"
            verTexto={verTexto}
            alto={altoBoton}
            ancho={anchoBoton}
            onPress={onNo}
            testID="confirmar-fin-no"
            estilo={e.botonNo}
            colorTexto={colores.texto}
            icono={<Icono nombre="cerrar" color={colores.texto} tam={30} />}
          />
          <Boton
            texto="Sí, he terminado"
            verTexto={verTexto}
            alto={altoBoton}
            ancho={anchoBoton}
            onPress={decirSi}
            testID="confirmar-fin-si"
            estilo={e.botonSi}
            colorTexto={colorSi}
            icono={<Icono nombre="check" color={colorSi} tam={32} grosor={3} />}
          />
        </View>
      </View>
    </Pantalla>
  );
}

function Boton({
  texto,
  verTexto,
  alto,
  ancho,
  onPress,
  testID,
  estilo,
  colorTexto,
  icono,
}: {
  texto: string;
  verTexto: boolean;
  alto: number;
  ancho: number;
  onPress: () => void;
  testID: string;
  estilo: object;
  colorTexto: string;
  icono: ReactNode;
}) {
  const e = useEstilos(crearEstilos);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => [
        e.boton,
        { minHeight: alto, minWidth: ancho },
        estilo,
        pressed && e.pulsado,
      ]}
    >
      {icono}
      {verTexto ? (
        <Texto style={[e.textoBoton, { color: colorTexto }]} numberOfLines={2}>
          {texto}
        </Texto>
      ) : null}
    </Pressable>
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
    pregunta: { fontSize: 38, fontWeight: "700", color: c.texto, textAlign: "center" },
    botones: {
      maxWidth: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: HUECO_BOTONES,
    },
    boton: {
      maxWidth: "100%",
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 14,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    botonSi: { backgroundColor: c.exito },
    botonNo: { backgroundColor: c.superficie, borderWidth: 2, borderColor: c.borde },
    textoBoton: { flexShrink: 1, fontSize: 28, fontWeight: "700", textAlign: "center" },
    pulsado: { opacity: 0.85 },
  });
