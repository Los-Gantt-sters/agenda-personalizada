// Botones gigantes «EMPEZAR» y «TERMINAR» (T-08.1, HU-08).
// RF6.1: «Empezar» pone la tarea en curso. RF6.4: «Terminar» la da por hecha.
// RNF6.3: área táctil muy por encima de 48 × 48. RNF6.4: solo botones, sin campos de texto.
// Texto grande en mayúsculas y «Mantén pulsado» debajo, sin pictograma (decisión del equipo, 8-nov).
// T-08.2 (RNF6.1) antitoques accidentales, según el perfil del estudiante:
//   - «mantener»: hay que mantenerlo pulsado 1,5 s (BotonMantener); un toque corto no hace nada.
//   - «simple»: un toque pregunta «¿Seguro?» con dos botones grandes, «Sí» y «No».
//   En los dos modos, el botón no hace caso durante un momento al aparecer (al pasar de «Empezar» a
//   «Terminar», el mismo dedo no puede terminar sin querer) y solo confirma una vez.
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BotonMantener } from "../agenda/BotonMantener";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";
import { CONFIRMACION_POR_DEFECTO, type AccionTarea, type PreferenciasConfirmacion } from "./tipos";

/** Lado mínimo del área táctil (RNF6.3). */
export const AREA_TACTIL_MINIMA = 48;
/** Si no contesta a «¿Seguro?» en este tiempo, vuelve al botón normal. */
export const ESPERA_PREGUNTA_MS = 6000;

// Los dos botones van en el color de acción del tema; mientras se mantienen pulsados se llenan con el
// color de «hecho». Se distinguen por la palabra, que es grande y no cambia de sitio.
const TEXTOS: Record<AccionTarea, string> = { empezar: "Empezar", terminar: "Terminar" };

export function BotonAccionTarea({
  accion,
  onConfirmar,
  confirmacion = CONFIRMACION_POR_DEFECTO,
  desactivado = false,
}: {
  accion: AccionTarea;
  onConfirmar: () => void;
  confirmacion?: PreferenciasConfirmacion;
  desactivado?: boolean;
}) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const c = { texto: TEXTOS[accion], color: colores.primario, relleno: colores.exito };
  const [preguntando, setPreguntando] = useState(false);
  const aparecio = useRef(0);
  const confirmado = useRef(false);

  useEffect(() => {
    aparecio.current = Date.now();
  }, []);

  // Sin respuesta a «¿Seguro?», se vuelve al botón normal.
  useEffect(() => {
    if (!preguntando) return;
    const t = setTimeout(() => setPreguntando(false), ESPERA_PREGUNTA_MS);
    return () => clearTimeout(t);
  }, [preguntando]);

  const enBloqueo = () => Date.now() - aparecio.current < confirmacion.bloqueoAlAparecerMs;

  const confirmar = () => {
    if (desactivado || confirmado.current || enBloqueo()) return;
    confirmado.current = true;
    setPreguntando(false);
    onConfirmar();
  };

  if (confirmacion.modo === "mantener") {
    return (
      <BotonMantener
        testID={`boton-${accion}`}
        texto={c.texto}
        grande
        ayuda={confirmacion.duracionMantenerMs > 0 ? "Mantén pulsado" : undefined}
        color={c.color}
        colorRelleno={c.relleno}
        duracionMs={confirmacion.duracionMantenerMs}
        desactivado={desactivado}
        onConfirmar={confirmar}
      />
    );
  }

  if (!preguntando) {
    return (
      <Pressable
        testID={`boton-${accion}`}
        accessibilityRole="button"
        accessibilityLabel={c.texto}
        accessibilityHint="Después te preguntará si estás seguro"
        accessibilityState={{ disabled: desactivado }}
        disabled={desactivado}
        onPress={() => !enBloqueo() && setPreguntando(true)}
        style={({ pressed }) => [
          estilos.boton,
          estilos.botonGrande,
          { backgroundColor: c.color },
          pressed && estilos.pulsado,
          desactivado && { opacity: 0.5 },
        ]}
      >
        <Texto style={[estilos.texto, estilos.textoGrande]}>{c.texto}</Texto>
      </Pressable>
    );
  }

  return (
    <View testID={`pregunta-${accion}`} style={estilos.pregunta} accessibilityLiveRegion="polite">
      <Texto style={estilos.textoPregunta}>¿Seguro?</Texto>
      <View style={estilos.fila}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sí, ${c.texto.toLowerCase()}`}
          onPress={confirmar}
          style={({ pressed }) => [
            estilos.boton,
            estilos.botonRespuesta,
            { backgroundColor: c.color },
            pressed && estilos.pulsado,
          ]}
        >
          <Icono nombre="check" color={colores.textoSobrePrimario} tam={32} grosor={3.2} />
          <Texto style={estilos.texto}>Sí</Texto>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="No"
          onPress={() => setPreguntando(false)}
          style={({ pressed }) => [
            estilos.boton,
            estilos.botonRespuesta,
            estilos.botonNo,
            pressed && estilos.pulsado,
          ]}
        >
          <Icono nombre="cerrar" color={colores.texto} tam={32} grosor={3.2} />
          <Texto style={[estilos.texto, { color: colores.texto }]}>No</Texto>
        </Pressable>
      </View>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    boton: {
      minHeight: 72,
      minWidth: 150,
      borderRadius: 14,
      paddingHorizontal: 28,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    },
    botonGrande: { minHeight: 96, minWidth: 300 },
    botonRespuesta: { minWidth: 150 },
    // «No» con borde y sin relleno: se ve distinto de «Sí» también sin mirar el color.
    botonNo: { backgroundColor: c.superficie, borderWidth: 3, borderColor: c.borde },
    pulsado: { opacity: 0.88 },
    texto: { color: c.textoSobrePrimario, fontSize: 26, fontWeight: "700" },
    textoGrande: { fontSize: 36, fontWeight: "700", letterSpacing: 0.5 },
    pregunta: { alignItems: "center", gap: 10 },
    textoPregunta: { fontSize: 26, fontWeight: "700", color: c.texto },
    // Separación amplia entre «Sí» y «No» para no tocar el otro sin querer.
    fila: { flexDirection: "row", gap: 32 },
  });
