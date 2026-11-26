// Componentes visuales y columna derecha «Así se ve» (390 px) del panel de preferencias (SCRUM-240).
import React, { type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { urlImagenPictograma } from "../arasaac/urls";
import { PictogramaTarea } from "../componentes/agenda/PictogramaTarea";
import { RelojVisual } from "../componentes/reloj-visual/RelojVisual";
import { TEMAS, type Paleta } from "../temas";
import { Icono } from "../ui/Icono";
import { Texto as Text } from "../ui/Texto";
import { useApariencia, useEstilos } from "../ui/apariencia";
import { estilosApariencia } from "./estilos";
import {
  FORMAS_BOTON,
  TAREAS_VISIBLES,
  type AvisoPrevio25,
  type PreferenciasApariencia,
} from "./opciones";

export type ApartadoPreferencias16 =
  | "queSeVe17"
  | "fondoColores18"
  | "textoTipografia19"
  | "botones22"
  | "agenda24"
  | "reloj25"
  | "ayuda26"
  | "barridoPulsadores";

const TAL_CUAL = { textTransform: "none" } as const;

export const PICTOGRAMA_MUESTRA = {
  titulo: "Lavarse las manos",
  emoji: "🧼",
  pictograma_url: urlImagenPictograma(8975, 300),
};

/** Botón de opción (.opt / .opt.on) idéntico a BOCETOS_NUEVOS (17.html, 18.html, 19.html, 22.html, 24.html, 25.html). */
export function BotonOpcionBoceto({
  etiqueta,
  activo,
  onPress,
  insigniaIzquierda,
  forzarTextoTalCual = false,
  testID,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  insigniaIzquierda?: ReactNode;
  forzarTextoTalCual?: boolean;
  testID?: string;
}) {
  const e = useEstilos(crearEstilos);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={etiqueta}
      accessibilityState={{ checked: activo, selected: activo }}
      onPress={onPress}
      style={({ pressed }) => [
        e.opcionBoceto,
        activo && e.opcionBocetoActiva,
        pressed && e.pulsado,
      ]}
    >
      {activo ? (
        <View style={e.circuloCheckBoceto} testID="icono-check">
          <Text style={e.textoCheckBoceto}>✓</Text>
        </View>
      ) : null}
      {insigniaIzquierda}
      <Text style={[e.textoOpcionBoceto, forzarTextoTalCual ? TAL_CUAL : null]} numberOfLines={2}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

/** Icono/dibujo superior de cada una de las tarjetas del menú 16 (16.html). */
export function MuestraApartado16({
  apartado,
  preferencias: p,
}: {
  apartado: ApartadoPreferencias16;
  preferencias: PreferenciasApariencia;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  let contenido: ReactNode;
  switch (apartado) {
    case "queSeVe17":
      contenido = <Icono nombre="imagen" color={colores.primario} tam={28} />;
      break;
    case "fondoColores18":
    case "textoTipografia19":
      contenido = <Text style={e.letrasMuestra16}>Aa</Text>;
      break;
    case "botones22": {
      const radio = Math.min(FORMAS_BOTON[p.forma].radioBoton, 13);
      contenido = <View style={[e.botonMuestra16, { borderRadius: radio }]} />;
      break;
    }
    case "agenda24":
      contenido = (
        <View style={e.filaMuestra}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[e.cuadroTarea16, { borderColor: colores.primario }]} />
          ))}
        </View>
      );
      break;
    case "reloj25":
      contenido = <Icono nombre="reloj" color={colores.primario} tam={28} />;
      break;
    case "ayuda26":
      contenido = <Icono nombre="campana" color={colores.primario} tam={28} />;
      break;
    case "barridoPulsadores":
      contenido = <Icono nombre="accesibilidad" color={colores.primario} tam={28} />;
      break;
  }
  return (
    <View
      style={e.muestra16}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {contenido}
    </View>
  );
}

/** Columna derecha «Así se ve» (390 px) que refleja en vivo el borrador antes de guardar (RF3.15). */
export function VistaPreviaEnVivo({
  apartado,
  borrador: p,
}: {
  apartado: ApartadoPreferencias16;
  borrador: PreferenciasApariencia;
}) {
  const e = useEstilos(crearEstilos);
  const paletaBorrador = TEMAS[p.tema].paleta;
  const estilosBorrador = estilosApariencia(p);
  const verDibujo = p.canal === "ambos" || p.canal === "soloPictograma";
  const verTexto = p.canal === "ambos" || p.canal === "soloTexto";
  const enMayusculas = p.caja === "mayusculas";

  return (
    <View style={e.columnaPrevia}>
      <Text style={e.leyenda}>Así se ve</Text>
      <View
        accessibilityLabel="Vista previa de la agenda con tus elecciones"
        style={[
          e.vistaPrevia,
          {
            borderRadius: estilosBorrador.radioTarjeta,
            backgroundColor: paletaBorrador.superficie,
            borderColor: paletaBorrador.borde,
          },
        ]}
      >
        {apartado === "agenda24" ? (
          <BloquesMuestra24 tareasVisibles={p.tareasVisibles} />
        ) : apartado === "reloj25" ? (
          <RelojMuestra25 verReloj={p.reloj} avisoPrevio={p.avisoPrevio} />
        ) : (
          <>
            <View
              style={[
                e.tareaAhora,
                {
                  borderRadius: estilosBorrador.radioTarjeta,
                  borderColor:
                    apartado === "barridoPulsadores" && p.modoBarrido !== "desactivado"
                      ? paletaBorrador.peligro
                      : paletaBorrador.primario,
                  borderWidth:
                    apartado === "barridoPulsadores" && p.modoBarrido !== "desactivado" ? 5 : 3,
                  backgroundColor: paletaBorrador.superficie,
                },
              ]}
            >
              <View style={e.filaContenidoTarea}>
                {verDibujo && (
                  <View
                    testID="preview-pictograma"
                    style={[
                      e.cajaPictograma,
                      {
                        width: p.canal === "soloPictograma" ? 96 : 70,
                        height: p.canal === "soloPictograma" ? 96 : 70,
                      },
                    ]}
                  >
                    <PictogramaTarea
                      tarea={PICTOGRAMA_MUESTRA}
                      tam={p.canal === "soloPictograma" ? 88 : 64}
                    />
                  </View>
                )}
                {verTexto && (
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      escalar={false}
                      style={{
                        color: paletaBorrador.primario,
                        fontFamily: estilosBorrador.fuenteNegrita,
                        fontSize: estilosBorrador.texto(14),
                        fontWeight: "700",
                        textTransform: enMayusculas ? "uppercase" : "none",
                      }}
                    >
                      Ahora
                    </Text>
                    <Text
                      escalar={false}
                      testID="preview-titulo-texto"
                      style={{
                        color: paletaBorrador.texto,
                        fontFamily: estilosBorrador.fuenteNegrita,
                        fontSize:
                          p.canal === "soloTexto"
                            ? estilosBorrador.texto(25)
                            : estilosBorrador.texto(21),
                        fontWeight: "700",
                        textTransform: enMayusculas ? "uppercase" : "none",
                      }}
                    >
                      Lavarse las manos
                    </Text>
                    <Text
                      escalar={false}
                      testID="preview-descripcion-texto"
                      style={{
                        color: paletaBorrador.textoSecundario,
                        fontFamily: estilosBorrador.fuenteNormal,
                        fontSize: estilosBorrador.texto(15),
                        textTransform: enMayusculas ? "uppercase" : "none",
                      }}
                    >
                      Usa agua y jabón.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={e.botonesVista}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Empezar"
                onPress={() => {}}
                style={{
                  minHeight: estilosBorrador.boton.altoMinimo,
                  minWidth: Math.max(172, estilosBorrador.boton.anchoMinimo),
                  paddingHorizontal: estilosBorrador.boton.paddingHorizontal,
                  borderRadius: estilosBorrador.boton.radio,
                  backgroundColor: paletaBorrador.primario,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  escalar={false}
                  style={{
                    color: paletaBorrador.textoSobrePrimario,
                    fontFamily: estilosBorrador.fuenteNegrita,
                    fontSize: estilosBorrador.boton.tamanoTexto,
                    fontWeight: "700",
                    textTransform: enMayusculas ? "uppercase" : "none",
                  }}
                >
                  Empezar
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

/** Muestra de «Agenda (vistas y tareas visibles)» en Pantalla 24. */
function BloquesMuestra24({
  tareasVisibles,
}: {
  tareasVisibles: PreferenciasApariencia["tareasVisibles"];
}) {
  const e = useEstilos(crearEstilos);
  const max = TAREAS_VISIBLES[tareasVisibles].maximo;
  const n = max > 5 ? 6 : max;
  const columna = (titulo: string) => (
    <View style={e.columnaBloque}>
      <Text style={e.tituloBloque}>{titulo}</Text>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={[e.tarjetaBloque, n > 3 ? e.tarjetaBloqueBaja : null]}
          testID={`muestra-${titulo}-${i}`}
        />
      ))}
    </View>
  );
  return (
    <View style={e.bloquesMuestra}>
      {columna("Hecho")}
      <View style={[e.columnaBloque, e.columnaAhora]}>
        <Text style={[e.tituloBloque, e.tituloAhora]}>Ahora</Text>
        <PictogramaTarea tarea={PICTOGRAMA_MUESTRA} tam={72} />
      </View>
      {columna("Después")}
    </View>
  );
}

/** Muestra de «Reloj en la tarea» en Pantalla 25 (25.html). */
function RelojMuestra25({
  verReloj,
  avisoPrevio,
}: {
  verReloj: PreferenciasApariencia["reloj"];
  avisoPrevio: AvisoPrevio25;
}) {
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.relojMuestra}>
      <PictogramaTarea tarea={PICTOGRAMA_MUESTRA} tam={120} />
      {verReloj === "si" ? (
        <View testID="muestra-reloj" style={{ alignItems: "center", gap: 4 }}>
          <RelojVisual
            duracionMs={10 * 60_000}
            transcurridoMs={4 * 60_000}
            tamano={110}
            sonidoAlTerminar={false}
            parpadeoAlTerminar={false}
          />
          <Text style={e.textoQuedan6Min25}>Quedan 6 minutos</Text>
        </View>
      ) : null}
      {avisoPrevio === "si" ? (
        <Text testID="muestra-aviso-5m" style={e.pildoraAviso5m}>
          🔔 Aviso 5 min antes (08b)
        </Text>
      ) : null}
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    pulsado: { opacity: 0.85 },
    muestra16: { height: 34, justifyContent: "center" },
    letrasMuestra16: { fontSize: 25, fontWeight: "700", color: c.primario },
    botonMuestra16: { width: 52, height: 26, backgroundColor: c.primario },
    cuadroTarea16: { width: 14, height: 24, borderRadius: 4, borderWidth: 2.5 },
    filaMuestra: { flexDirection: "row", alignItems: "center", gap: 4 },
    opcionBoceto: {
      flex: 1,
      minWidth: 118,
      minHeight: 66,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      position: "relative",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    opcionBocetoActiva: {
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    circuloCheckBoceto: {
      position: "absolute",
      right: -9,
      top: -9,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    textoCheckBoceto: { color: c.textoSobrePrimario, fontSize: 15, fontWeight: "700" },
    textoOpcionBoceto: {
      fontSize: 15.5,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    columnaPrevia: { width: 390, gap: 10 },
    leyenda: { fontSize: 18, fontWeight: "700", color: c.texto },
    vistaPrevia: {
      width: 390,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      padding: 16,
      gap: 12,
    },
    tareaAhora: {
      borderWidth: 3,
      borderColor: c.primario,
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    filaContenidoTarea: { flexDirection: "row", alignItems: "center", gap: 14 },
    cajaPictograma: {
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    botonesVista: { flexDirection: "row", justifyContent: "flex-start" },
    bloquesMuestra: { flexDirection: "row", gap: 10, height: 180 },
    columnaBloque: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.fondo,
      padding: 8,
      gap: 6,
      alignItems: "center",
    },
    columnaAhora: { borderWidth: 3, borderColor: c.primario, backgroundColor: c.superficie },
    tituloBloque: { fontSize: 14, fontWeight: "700", color: c.textoSecundario },
    tituloAhora: { color: c.primario },
    tarjetaBloque: {
      width: "100%",
      flex: 1,
      minHeight: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    tarjetaBloqueBaja: { minHeight: 12 },
    relojMuestra: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingVertical: 6,
    },
    textoQuedan6Min25: { fontSize: 16, fontWeight: "700", color: c.texto },
    pildoraAviso5m: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primario,
      backgroundColor: c.superficieDestacada,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
  });
