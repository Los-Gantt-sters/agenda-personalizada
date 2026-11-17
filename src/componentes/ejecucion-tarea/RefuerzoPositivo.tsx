// Refuerzo positivo al terminar una tarea (T-08.1, HU-08), como la pantalla 12 del prototipo.
// RF6.4: animación y sonido según el perfil del estudiante. Con «reducir movimiento» del sistema o
// con la animación «ninguna», todo aparece ya quieto.
// RNF6.4: nada que escribir; basta con «Seguir».
// Estilo sereno: un anillo verde que se dibuja despacio alrededor del pictograma «¡Muy bien!» de
// ARASAAC. Sin rebotes ni confeti; con «estrellas», unas pocas estrellas que aparecen quietas.
// Mejora de la profesora (noviembre de 2026): junto a la felicitación se pregunta «¿Cómo te has
// sentido?» con cinco caras. Contestar no es obligatorio: «Seguir» funciona siempre.
// Es una pantalla más, con su cabecera y su barra de abajo (Ayuda, Atrás, Adelante, Accesibilidad),
// no una ventana emergente. «Atrás» deshace «Terminar» por si el alumno se ha equivocado.
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { BotonGrande } from "./BotonGrande";
import { EMOCIONES, type Emocion } from "./emociones";
import { reproducirSonido } from "../../servicios/sonidos";
import type { Paleta } from "../../temas";
import { Pantalla } from "../../pantalla";
import { Icono, PictogramaInterfaz, Texto, useApariencia, useEstilos, colorSobre } from "../../ui";
import type { PreferenciasRefuerzo } from "./tipos";

/** Lo que tarda el anillo en dibujarse. */
export const DURACION_ANILLO_MS = 600;

const LADO = 200;
const GROSOR = 8;
const RADIO_ANILLO = (LADO - GROSOR) / 2;
const PERIMETRO = 2 * Math.PI * RADIO_ANILLO;
const ESTRELLAS = 5;

function useReducirMovimiento(): boolean {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => montado && setReducir(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReducir);
    return () => {
      montado = false;
      sub?.remove();
    };
  }, []);
  return reducir;
}

export function RefuerzoPositivo({
  tarea,
  nombre,
  preferencias,
  onSeguir,
  onDeshacer,
  onEmocion,
}: {
  /** Título de la tarea terminada; con null no se enseña nada. */
  tarea: string | null;
  /** Nombre del estudiante para «¡Muy bien, Marcos!». */
  nombre?: string;
  preferencias: PreferenciasRefuerzo;
  onSeguir: () => void;
  /** «Atrás»: no había terminado. Sin él, «Atrás» está desactivado. */
  onDeshacer?: () => void;
  /** Cómo se ha sentido el alumno (si lo contesta). Se llama al pulsar «Seguir». */
  onEmocion?: (emocion: Emocion) => void;
}) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const reducir = useReducirMovimiento();
  const conMovimiento = preferencias.animacion !== "ninguna" && !reducir;
  // 0 → anillo vacío, 1 → anillo completo. Sin movimiento se ve completo desde el principio.
  const [progreso, setProgreso] = useState(0);
  const [emocion, setEmocion] = useState<Emocion | null>(null);
  const [tareaAnimada, setTareaAnimada] = useState(tarea);
  if (tarea !== tareaAnimada) {
    // Otra tarea terminada: el anillo y la pregunta vuelven a empezar (en el render, no en un efecto).
    setTareaAnimada(tarea);
    setProgreso(0);
    setEmocion(null);
  }
  const avance = conMovimiento ? progreso : 1;

  useEffect(() => {
    if (!tarea) return;
    if (preferencias.sonido) reproducirSonido("refuerzo", 0.5);
    if (!conMovimiento) return;
    const valor = new Animated.Value(0);
    const id = valor.addListener(({ value }) => setProgreso(value));
    const anim = Animated.timing(valor, {
      toValue: 1,
      duration: DURACION_ANILLO_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      valor.removeListener(id);
    };
  }, [tarea, preferencias.sonido, conMovimiento]);

  const titulo = nombre ? `¡Muy bien, ${nombre}!` : "¡Muy bien!";

  const elegir = (clave: Emocion) => {
    // RF6.4: si el perfil no quiere sonido, tampoco suena al elegir.
    if (preferencias.sonido) reproducirSonido("toque");
    setEmocion((actual) => (actual === clave ? null : clave));
  };

  const seguir = () => {
    if (emocion) onEmocion?.(emocion);
    onSeguir();
  };

  if (tarea === null) return null;

  return (
    <Pantalla
      titulo="¡Tarea terminada!"
      simbolo={<Icono nombre="check" color={colores.exito} tam={36} grosor={3.4} />}
      alAtras={onDeshacer ?? null}
      etiquetaAtras="Atrás: todavía no he terminado"
      alAdelante={seguir}
      textoAdelante="Seguir"
      etiquetaAdelante="Seguir con la agenda"
      conSonido={preferencias.sonido}
    >
      <View testID="refuerzo-positivo" style={estilos.fondo} accessibilityLiveRegion="assertive">
        <View style={estilos.contenido}>
          {/* Izquierda: la felicitación */}
          <View style={estilos.columna}>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel="Tarea terminada"
              style={estilos.escenario}
            >
              <Svg width={LADO} height={LADO} style={StyleSheet.absoluteFill}>
                <Circle
                  cx={LADO / 2}
                  cy={LADO / 2}
                  r={RADIO_ANILLO}
                  stroke={colores.exito}
                  strokeWidth={GROSOR}
                  strokeLinecap="round"
                  fill={colores.superficie}
                  strokeDasharray={`${PERIMETRO} ${PERIMETRO}`}
                  strokeDashoffset={PERIMETRO * (1 - avance)}
                  transform={`rotate(-90 ${LADO / 2} ${LADO / 2})`}
                />
              </Svg>
              <PictogramaInterfaz nombre="muyBien" etiqueta="Muy bien" tam={132} />
              <View style={[estilos.insignia, { opacity: avance }]}>
                <Icono nombre="check" color={colorSobre(colores.exito)} tam={28} grosor={3.4} />
              </View>
              {preferencias.animacion === "estrellas" &&
                Array.from({ length: ESTRELLAS }, (_, i) => {
                  const angulo = (i / ESTRELLAS) * 2 * Math.PI - Math.PI / 2;
                  const r = LADO / 2 + 28;
                  return (
                    <View
                      key={i}
                      style={[
                        estilos.estrella,
                        {
                          opacity: avance,
                          left: LADO / 2 + Math.cos(angulo) * r - 14,
                          top: LADO / 2 + Math.sin(angulo) * r - 14,
                        },
                      ]}
                    >
                      <Icono nombre="estrella" color={colores.aviso} tam={28} grosor={2.2} />
                    </View>
                  );
                })}
            </View>
            <Texto style={estilos.titulo} accessibilityRole="header">
              {titulo}
            </Texto>
            {tarea ? <Texto style={estilos.subtitulo}>Has terminado: {tarea}</Texto> : null}
          </View>

          {/* Derecha: ¿cómo te has sentido? (se puede no contestar) */}
          <View style={estilos.columnaPregunta}>
            <Texto style={estilos.pregunta}>¿Cómo te has sentido?</Texto>
            <View
              style={estilos.emociones}
              accessibilityRole="radiogroup"
              accessibilityLabel="¿Cómo te has sentido?"
              testID="emociones-refuerzo"
            >
              {EMOCIONES.map((e) => {
                const elegida = emocion === e.clave;
                return (
                  <Pressable
                    key={e.clave}
                    onPress={() => elegir(e.clave)}
                    accessibilityRole="radio"
                    accessibilityLabel={e.etiqueta}
                    accessibilityState={{ checked: elegida, selected: elegida }}
                    testID={`emocion-${e.clave}`}
                    style={({ pressed }) => [
                      estilos.emocion,
                      elegida && estilos.emocionElegida,
                      pressed && estilos.pulsado,
                    ]}
                  >
                    <PictogramaInterfaz nombre={e.pictograma} etiqueta={e.etiqueta} tam={76} />
                    <Texto style={estilos.etiquetaEmocion} numberOfLines={1}>
                      {e.etiqueta}
                    </Texto>
                    {elegida ? (
                      <View style={estilos.marca}>
                        <Icono
                          nombre="check"
                          color={colores.textoSobrePrimario}
                          tam={20}
                          grosor={3.4}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <BotonGrande
              texto="Seguir"
              onPress={seguir}
              icono={
                <Icono nombre="adelante" color={colores.textoSobrePrimario} tam={30} grosor={3} />
              }
            />
          </View>
        </View>
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    fondo: { flex: 1, backgroundColor: c.fondo },
    contenido: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      alignContent: "center",
      justifyContent: "center",
      gap: 40,
      padding: 20,
    },
    columna: { alignItems: "center", gap: 14, maxWidth: 360 },
    escenario: { width: LADO, height: LADO, alignItems: "center", justifyContent: "center" },
    insignia: {
      position: "absolute",
      right: 4,
      bottom: 4,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.exito,
      borderWidth: 3,
      borderColor: c.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
    estrella: { position: "absolute" },
    titulo: { fontSize: 34, fontWeight: "700", color: c.texto, textAlign: "center" },
    subtitulo: { fontSize: 22, color: c.textoSecundario, textAlign: "center" },
    columnaPregunta: { alignItems: "center", gap: 18 },
    pregunta: { fontSize: 28, fontWeight: "700", color: c.texto, textAlign: "center" },
    emociones: { flexDirection: "row", gap: 12 },
    emocion: {
      width: 104,
      paddingVertical: 10,
      alignItems: "center",
      gap: 6,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    emocionElegida: {
      borderWidth: 4,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    pulsado: { opacity: 0.8 },
    etiquetaEmocion: { fontSize: 16, fontWeight: "700", color: c.texto },
    marca: {
      position: "absolute",
      top: -10,
      right: -10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primario,
      borderWidth: 2,
      borderColor: c.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
  });
