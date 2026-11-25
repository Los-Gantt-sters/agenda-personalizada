// Piezas pequeñas de la pantalla 43 (HU-25) que comparten la pantalla y su calendario: el botón de
// la pantalla (los grandes son los de la barra de abajo) y la etiqueta de color de cada estado.
import { Pressable, StyleSheet, View } from "react-native";

import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos, type NombreIcono } from "../../ui";
import type { TonoEstado } from "./resumen";

export function Boton({
  texto,
  icono,
  iconoDetras = false,
  etiqueta,
  lleno = false,
  alPulsar,
  testID,
}: {
  texto?: string;
  icono?: NombreIcono;
  iconoDetras?: boolean;
  etiqueta?: string;
  /** Relleno de color: la acción principal de un grupo («Cerrar» del calendario). */
  lleno?: boolean;
  /** null: desactivado. */
  alPulsar: (() => void) | null;
  testID?: string;
}) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const activo = alPulsar !== null;
  const tinta = !activo
    ? colores.textoSecundario
    : lleno
      ? colores.textoSobrePrimario
      : colores.primario;
  const dibujo = icono ? <Icono nombre={icono} color={tinta} tam={22} /> : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? texto}
      accessibilityState={{ disabled: !activo }}
      disabled={!activo}
      onPress={alPulsar ?? undefined}
      testID={testID}
      style={({ pressed }) => [
        e.boton,
        lleno && e.botonLleno,
        !activo && e.botonApagado,
        pressed && activo && (lleno ? e.pulsadoLleno : e.pulsado),
      ]}
    >
      {!iconoDetras ? dibujo : null}
      {texto ? <Texto style={[e.textoBoton, { color: tinta }]}>{texto}</Texto> : null}
      {iconoDetras ? dibujo : null}
    </Pressable>
  );
}

/** Colores de la etiqueta de un estado: texto, fondo y borde (como en el boceto de la 43). */
export function coloresDeTono(
  tono: TonoEstado,
  c: Paleta,
): { tinta: string; fondo: string; borde: string } {
  switch (tono) {
    case "exito":
      return { tinta: c.exito, fondo: c.exitoSuave, borde: c.exito };
    case "primario":
      return { tinta: c.primario, fondo: c.superficieDestacada, borde: c.primario };
    case "neutro":
      // «Por hacer»: aún no toca, así que va en gris
      return { tinta: c.textoSecundario, fondo: c.fondo, borde: c.borde };
    default:
      // «Pendiente»: amarillo, como en el boceto
      return { tinta: c.aviso, fondo: c.resalteSuave, borde: c.resalte };
  }
}

/** Etiqueta redondeada con el texto del estado («Hecha», «Pendiente»…): color y texto a la vez. */
export function Etiqueta({ texto, tono }: { texto: string; tono: TonoEstado }) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const { tinta, fondo, borde } = coloresDeTono(tono, colores);
  return (
    <View style={[e.etiqueta, { backgroundColor: fondo, borderColor: borde }]}>
      <Texto style={[e.textoEtiqueta, { color: tinta }]} numberOfLines={1}>
        {texto}
      </Texto>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    boton: {
      minHeight: 48,
      minWidth: 48,
      paddingHorizontal: 16,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    botonLleno: {
      backgroundColor: c.primario,
    },
    botonApagado: {
      borderColor: c.borde,
      borderStyle: "dashed",
      backgroundColor: c.fondo,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
    },
    pulsadoLleno: {
      opacity: 0.85,
    },
    textoBoton: {
      fontSize: 17,
      fontWeight: "700",
    },
    etiqueta: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 2,
      borderRadius: 14,
      borderWidth: 1.5,
    },
    textoEtiqueta: {
      fontSize: 15,
      fontWeight: "700",
    },
  });
