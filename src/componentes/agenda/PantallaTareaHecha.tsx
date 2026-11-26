// Pantalla 10 del prototipo definitivo: detalle de una tarea ya hecha (T-08.5, SCRUM-263).
// Enseña únicamente el tick verde grande, el pictograma, «Tarea hecha» y el nombre de la tarea: sin
// descripción, pasos, horas ni valoración. «Atrás» vuelve a la agenda.
// Sin scroll: si la pantalla es baja, el tick y el dibujo se ponen al lado del texto.
import { useState, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import type { Tarea } from "./tipos";
import { PictogramaTarea } from "./PictogramaTarea";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import { Icono, Texto, colorSobre, useApariencia, useEstilos } from "../../ui";

const HUECO = 16;
/** Medidas del prototipo, cuando hay sitio. */
const TAM_TICK = 124;
const TAM_PICTO = 210;
const TAM_TICK_MINIMO = 56;
const TAM_PICTO_MINIMO = 72;
const LETRA_ESTADO = 38;
const LETRA_NOMBRE = 34;

export function PantallaTareaHecha({
  tarea,
  alAtras,
  conSonido = false,
  derecha,
}: {
  tarea: Pick<Tarea, "titulo" | "pictograma_url" | "emoji">;
  alAtras: () => void;
  conSonido?: boolean;
  /** Arriba a la derecha: el nombre del alumno (como en los bocetos). */
  derecha?: ReactNode;
}) {
  const { colores, canal, escalaLetra: L } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";

  const anchoUtil = (area?.width ?? ventana.width) - HUECO * 2;
  const altoUtil = (area?.height ?? ventana.height - 170) - HUECO * 2;
  const altoTextos = verTexto ? (LETRA_ESTADO + LETRA_NOMBRE) * 1.3 * L + HUECO : 0;
  const altoCompleto =
    TAM_TICK + (verDibujo ? TAM_PICTO + HUECO : 0) + (verTexto ? altoTextos + HUECO : 0);
  // Baja y ancha: todo en fila. Si no, en columna, encogiendo el tick y el dibujo a la vez.
  const enFila = altoUtil < altoCompleto * 0.75 && anchoUtil >= 560;
  let tamTick: number;
  let tamPicto: number;
  if (enFila) {
    tamTick = Math.max(TAM_TICK_MINIMO, Math.min(TAM_TICK, altoUtil * 0.6));
    const anchoTexto = verTexto ? 270 * L + HUECO : 0;
    tamPicto = Math.max(
      TAM_PICTO_MINIMO,
      Math.min(TAM_PICTO, altoUtil, anchoUtil - tamTick - HUECO - anchoTexto),
    );
  } else {
    const sitio = altoUtil - (verTexto ? altoTextos + HUECO : 0) - (verDibujo ? HUECO : 0);
    const escala = Math.min(1, sitio / (TAM_TICK + (verDibujo ? TAM_PICTO : 0)));
    tamTick = Math.max(TAM_TICK_MINIMO, TAM_TICK * escala);
    tamPicto = Math.max(TAM_PICTO_MINIMO, TAM_PICTO * escala);
  }
  const colorTick = colorSobre(colores.exito);

  return (
    <Pantalla
      titulo={tarea.titulo}
      derecha={derecha}
      alAtras={alAtras}
      etiquetaAtras="Atrás: volver a la agenda"
      conSonido={conSonido}
      testID="pantalla-tarea-hecha"
    >
      <View
        style={[e.cuerpo, { flexDirection: enFila ? "row" : "column" }]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Tarea hecha: ${tarea.titulo}`}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
            setArea({ width, height });
        }}
      >
        <View
          testID="tick-tarea-hecha"
          style={[e.tick, { width: tamTick, height: tamTick, borderRadius: tamTick / 2 }]}
        >
          <Icono nombre="check" color={colorTick} tam={tamTick * 0.58} grosor={3.5} />
        </View>
        {verDibujo ? <PictogramaTarea tarea={tarea} tam={tamPicto} /> : null}
        {verTexto ? (
          <View style={[e.textos, enFila && e.textosEnFila]}>
            <Texto style={e.estado} numberOfLines={1}>
              Tarea hecha
            </Texto>
            <Texto style={e.nombre} numberOfLines={2}>
              {tarea.titulo}
            </Texto>
          </View>
        ) : null}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cuerpo: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: HUECO,
      padding: HUECO,
      minHeight: 0,
    },
    tick: { backgroundColor: c.exito, alignItems: "center", justifyContent: "center" },
    textos: { alignItems: "center", gap: HUECO / 2, maxWidth: "100%" },
    textosEnFila: { flexShrink: 1, minWidth: 0 },
    estado: {
      fontSize: LETRA_ESTADO,
      fontWeight: "700",
      color: c.exito,
      textAlign: "center",
    },
    nombre: {
      fontSize: LETRA_NOMBRE,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
  });
