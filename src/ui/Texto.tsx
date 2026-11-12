// Texto con la letra del perfil del estudiante (RF3.2). Sustituye a <Text> de React Native en las
// pantallas: así la letra elegida (Lexend por defecto) se aplica en toda la app y no solo en el
// panel de preferencias.
import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { useApariencia } from "./apariencia";

/** true si el peso pide negrita (las fuentes empaquetadas solo traen 400 y 700). */
function esNegrita(peso: TextStyle["fontWeight"]): boolean {
  if (peso === undefined || peso === null) return false;
  if (peso === "bold") return true;
  const n = Number(peso);
  return Number.isFinite(n) && n >= 600;
}

export interface TextoProps extends TextProps {
  /**
   * Aplicar el tamaño de letra del perfil (por defecto sí). Se quita donde el tamaño ya viene
   * calculado con esa escala (vista previa de preferencias, BotonAccesible).
   */
  escalar?: boolean;
}

export function Texto({ style, escalar = true, ...props }: TextoProps) {
  const { fuente, mayusculas, escalaLetra } = useApariencia();
  const plano = StyleSheet.flatten(style) ?? {};
  // Letra escolar del centro: en MAYÚSCULAS si así lo ha elegido el tutor (salvo que el texto
  // fije otra cosa). Solo cambia cómo se ve: la ayuda de voz lee el mismo texto.
  const caja = mayusculas && !plano.textTransform ? { textTransform: "uppercase" as const } : null;
  // Tamaño de letra del perfil («Grande», «Extra grande»), en toda la app.
  const tamano =
    escalar && escalaLetra !== 1 && typeof plano.fontSize === "number"
      ? {
          fontSize: plano.fontSize * escalaLetra,
          ...(typeof plano.lineHeight === "number"
            ? { lineHeight: plano.lineHeight * escalaLetra }
            : null),
        }
      : null;
  // Si la pantalla ya fija una familia concreta, se respeta.
  if (plano.fontFamily) return <Text {...props} style={[style, caja, tamano]} />;
  const negrita = esNegrita(plano.fontWeight);
  return (
    <Text
      {...props}
      style={[
        style,
        caja,
        tamano,
        // Con fuentes propias la negrita es otra familia: se quita el peso para que el navegador
        // no engorde por su cuenta una letra que ya es negrita.
        negrita
          ? { fontFamily: fuente.negrita, fontWeight: "normal" }
          : { fontFamily: fuente.normal },
      ]}
    />
  );
}
