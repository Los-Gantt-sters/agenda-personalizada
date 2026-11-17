// Botones gigantes «Empezar» y «Terminar» (T-08.1, HU-08).
// RF6.1: «Empezar» pone la tarea en curso. RF6.4: «Terminar» la da por hecha.
// RNF6.3: área táctil muy por encima de 48 × 48. RNF6.4: solo botones, sin campos de texto.
// Mejora de la profesora (noviembre de 2026): basta con un toque. Ya no hay que mantenerlo pulsado
// ni contestar «¿Seguro?»; si el alumno se equivoca, «Atrás» lo deshace. Esto sustituye a los
// antitoques de T-08.2 (RNF6.1). Se mantiene que, recién aparecido, el botón no haga caso durante
// un momento (al pasar de «Empezar» a «Terminar», el mismo toque no vale para las dos cosas) y que
// solo confirme una vez.
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { Paleta } from "../../temas";
import { Texto, useEstilos } from "../../ui";
import type { AccionTarea } from "./tipos";

/** Lado mínimo del área táctil (RNF6.3). */
export const AREA_TACTIL_MINIMA = 48;
/** Tiempo en que el botón no hace caso al aparecer, para que un mismo toque no valga dos veces. */
export const BLOQUEO_AL_APARECER_MS = 800;

const TEXTOS: Record<AccionTarea, string> = { empezar: "Empezar", terminar: "Terminar" };

export function BotonAccionTarea({
  accion,
  onConfirmar,
  desactivado = false,
  bloqueoAlAparecerMs = BLOQUEO_AL_APARECER_MS,
  anchoMinimo = 300,
}: {
  accion: AccionTarea;
  onConfirmar: () => void;
  desactivado?: boolean;
  bloqueoAlAparecerMs?: number;
  /** Ancho mínimo del botón (siempre muy por encima de los 48 px de RNF6.3). */
  anchoMinimo?: number;
}) {
  const estilos = useEstilos(crearEstilos);
  const texto = TEXTOS[accion];
  const aparecio = useRef(0);
  const confirmado = useRef(false);

  useEffect(() => {
    aparecio.current = Date.now();
  }, []);

  const confirmar = () => {
    if (desactivado || confirmado.current) return;
    if (Date.now() - aparecio.current < bloqueoAlAparecerMs) return;
    confirmado.current = true;
    onConfirmar();
  };

  return (
    <Pressable
      testID={`boton-${accion}`}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={
        accion === "empezar"
          ? "Si te equivocas, pulsa Atrás"
          : "Si no has terminado, pulsa Atrás en la siguiente pantalla"
      }
      accessibilityState={{ disabled: desactivado }}
      disabled={desactivado}
      onPress={confirmar}
      style={({ pressed }) => [
        estilos.boton,
        { minWidth: Math.max(AREA_TACTIL_MINIMA, anchoMinimo) },
        pressed && estilos.pulsado,
        desactivado && { opacity: 0.5 },
      ]}
    >
      <Texto style={estilos.texto}>{texto}</Texto>
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    boton: {
      minHeight: 96,
      minWidth: 300,
      borderRadius: 14,
      paddingHorizontal: 28,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primario,
    },
    pulsado: { opacity: 0.88 },
    texto: { color: c.textoSobrePrimario, fontSize: 36, fontWeight: "700", letterSpacing: 0.5 },
  });
