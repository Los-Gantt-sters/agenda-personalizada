// Marco común de todas las pantallas (mejoras de la profesora, noviembre de 2026):
// - Cabecera arriba con el nombre de la pantalla: el alumno sabe siempre dónde está.
// - Barra abajo, siempre igual y en el mismo sitio: un hueco a la izquierda, «Atrás» y «Adelante» en
//   el centro y un hueco a la derecha. Pantalla pone «Ayuda» y «Accesibilidad» en los huecos.
// - En medio, el contenido: cabe en una sola pantalla, sin scroll.
// Las pantallas de Ayuda y de Accesibilidad también usan este marco, con `encima`: tapan la pantalla
// de debajo sin quitarla (no hay ventanas emergentes, pero lo de debajo no se pierde ni se recarga).
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePreferenciasOpcional } from "../preferencias/PreferenciasProvider";
import { reproducirSonido } from "../servicios/sonidos";
import type { Paleta } from "../temas";
import { Icono, type NombreIcono } from "../ui/Icono";
import { Texto } from "../ui/Texto";
import { useApariencia, useEstilos } from "../ui/apariencia";

/** Alto de los botones de la barra inferior (muy por encima de los 48 px mínimos). */
export const ALTO_BOTON_BARRA = 72;
/** Ancho de los botones de los lados («Ayuda» y «Accesibilidad»). */
export const ANCHO_BOTON_LADO = 160;

export interface MarcoPantallaProps {
  /** Nombre de la pantalla, en pocas palabras. */
  titulo: string;
  /** Dibujo que acompaña al título. */
  simbolo?: ReactNode;
  /** Algo a la derecha de la cabecera: la fecha, cerrar sesión... */
  derecha?: ReactNode;
  /** Qué hace «Atrás»; con null el botón se ve pero está desactivado. */
  atras: (() => void) | null;
  /** Qué hace «Adelante»; sin indicar o con null está desactivado. */
  adelante?: (() => void) | null;
  etiquetaAtras?: string;
  etiquetaAdelante?: string;
  /** Texto visible de «Adelante» cuando avanzar es una acción concreta («Entrar», «Seguir»). */
  textoAdelante?: string;
  /** Sonido suave al pulsar Atrás y Adelante (pantallas del alumno, T-01.3). */
  conSonido?: boolean;
  /** Hueco izquierdo de la barra (en Pantalla, «Ayuda»). */
  barraIzquierda?: ReactNode;
  /** Hueco derecho de la barra (en Pantalla, «Accesibilidad»). */
  barraDerecha?: ReactNode;
  /** Se pinta encima de la pantalla actual, tapándola entera (pantallas de Ayuda y Accesibilidad). */
  encima?: boolean;
  children: ReactNode;
  testID?: string;
  idTitulo?: string;
  idAtras?: string;
  idAdelante?: string;
}

export function MarcoPantalla({
  titulo,
  simbolo,
  derecha,
  atras,
  adelante = null,
  etiquetaAtras = "Atrás",
  etiquetaAdelante,
  textoAdelante = "Adelante",
  conSonido = false,
  barraIzquierda,
  barraDerecha,
  encima = false,
  children,
  testID,
  idTitulo = "titulo-pantalla",
  idAtras = "btn-barra-atras",
  idAdelante = "btn-barra-adelante",
}: MarcoPantallaProps) {
  const e = useEstilos(crearEstilos);
  const canal = usePreferenciasOpcional()?.preferencias.canal ?? "ambos";

  const conToque = (accion: () => void) => () => {
    if (conSonido) reproducirSonido("toque");
    accion();
  };

  return (
    <View
      style={[e.raiz, encima && e.encima]}
      testID={testID}
      accessibilityViewIsModal={encima || undefined}
    >
      <SafeAreaView edges={["top"]} style={e.cabecera}>
        <View style={e.filaCabecera}>
          {simbolo ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {simbolo}
            </View>
          ) : null}
          <Texto style={e.titulo} accessibilityRole="header" numberOfLines={1} testID={idTitulo}>
            {titulo}
          </Texto>
          {derecha ? <View style={e.derecha}>{derecha}</View> : null}
        </View>
      </SafeAreaView>

      <View style={e.contenido}>{children}</View>

      <SafeAreaView edges={["bottom"]} style={e.barra}>
        <View style={e.filaBarra} accessibilityRole="toolbar">
          {/* Los dos lados ocupan lo mismo aunque estén vacíos: las flechas quedan en el centro. */}
          <View style={e.lado}>{barraIzquierda}</View>
          <View style={e.centro}>
            <BotonBarra
              icono="flechaAtras"
              texto="Atrás"
              etiqueta={etiquetaAtras}
              canal={canal}
              alPulsar={atras ? conToque(atras) : null}
              testID={idAtras}
            />
            <BotonBarra
              icono="adelante"
              texto={textoAdelante}
              etiqueta={etiquetaAdelante ?? textoAdelante}
              canal={canal}
              alPulsar={adelante ? conToque(adelante) : null}
              iconoDetras
              destacado={Boolean(adelante) && textoAdelante !== "Adelante"}
              testID={idAdelante}
            />
          </View>
          <View style={[e.lado, e.ladoDerecho]}>{barraDerecha}</View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Botón de la barra inferior: siempre con icono y texto (o solo uno, según «Qué se ve»). */
export function BotonBarra({
  icono,
  texto,
  etiqueta,
  canal,
  alPulsar,
  iconoDetras = false,
  destacado = false,
  ancho,
  textoPequeno = false,
  testID,
}: {
  icono: NombreIcono;
  texto: string;
  etiqueta: string;
  canal: string;
  /** null: desactivado (se ve, pero apagado y con borde discontinuo). */
  alPulsar: (() => void) | null;
  iconoDetras?: boolean;
  destacado?: boolean;
  ancho?: number;
  textoPequeno?: boolean;
  testID?: string;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const activo = alPulsar !== null;
  const colorTinta = destacado ? colores.textoSobrePrimario : colores.texto;
  const colorIcono = !activo
    ? colores.textoSecundario
    : destacado
      ? colores.textoSobrePrimario
      : colores.primario;
  // Las flechas se ven siempre: en «Solo texto» quitan el dibujo, pero una flecha no distrae.
  const verTexto = canal !== "soloPictograma";
  const dibujoFinal = <Icono nombre={icono} color={colorIcono} tam={32} />;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !activo }}
      disabled={!activo}
      onPress={alPulsar ?? undefined}
      testID={testID}
      style={({ pressed }) => [
        e.botonBarra,
        ancho ? { width: ancho } : null,
        textoPequeno && e.botonVertical,
        destacado && e.botonDestacado,
        !activo && e.botonApagado,
        pressed && e.pulsado,
      ]}
    >
      {!iconoDetras || textoPequeno ? dibujoFinal : null}
      {verTexto ? (
        <Texto
          // «Accesibilidad» va en un botón de ancho fijo: con letra extra grande no cabría.
          escalar={!textoPequeno}
          style={[
            e.textoBoton,
            textoPequeno && e.textoPequeno,
            { color: activo ? colorTinta : colores.textoSecundario },
          ]}
          numberOfLines={1}
        >
          {texto}
        </Texto>
      ) : null}
      {iconoDetras && !textoPequeno ? dibujoFinal : null}
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    raiz: { flex: 1, backgroundColor: c.fondo },
    // Tapa toda la pantalla de debajo (sin fondo transparente: no es una ventana emergente).
    encima: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 50,
      elevation: 50,
    },
    cabecera: {
      backgroundColor: c.superficie,
      borderBottomWidth: 2,
      borderBottomColor: c.borde,
    },
    filaCabecera: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    titulo: { flex: 1, fontSize: 26, fontWeight: "700", color: c.texto },
    derecha: { flexShrink: 0, alignItems: "flex-end" },
    contenido: { flex: 1, overflow: "hidden" },
    barra: {
      backgroundColor: c.superficie,
      borderTopWidth: 2,
      borderTopColor: c.borde,
    },
    filaBarra: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    lado: { flex: 1, flexDirection: "row", alignItems: "center" },
    ladoDerecho: { justifyContent: "flex-end" },
    centro: { flexDirection: "row", alignItems: "center", gap: 16 },
    botonBarra: {
      minHeight: ALTO_BOTON_BARRA,
      minWidth: 160,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 18,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    botonVertical: { flexDirection: "column", gap: 4, minWidth: 0, paddingHorizontal: 6 },
    botonDestacado: { backgroundColor: c.primario },
    botonApagado: { borderStyle: "dashed", borderColor: c.borde, borderWidth: 2, opacity: 0.55 },
    pulsado: { opacity: 0.8 },
    textoBoton: { fontSize: 22, fontWeight: "700" },
    textoPequeno: { fontSize: 15 },
  });
