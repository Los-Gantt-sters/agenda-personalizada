// Botón grande de una sola pulsación (T-08.1, HU-08), p. ej. «Seguir» tras el refuerzo positivo.
// RNF6.3: área táctil mínima de 48 × 48 px (aquí bastante más).
import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { Paleta } from "../../temas";
import { Texto, useApariencia, useEstilos } from "../../ui";

export function BotonGrande({
  texto,
  onPress,
  color,
  icono,
  testID,
}: {
  texto: string;
  onPress: () => void;
  color?: string;
  /** Signo decorativo al final (p. ej. una flecha); el nombre accesible es solo `texto`. */
  icono?: ReactNode;
  testID?: string;
}) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: color ?? colores.primario },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Texto style={estilos.texto}>{texto}</Texto>
      {icono}
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    boton: {
      minWidth: 160,
      minHeight: 72,
      paddingHorizontal: 32,
      borderRadius: 14,
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    texto: { color: c.textoSobrePrimario, fontSize: 26, fontWeight: "700" },
  });
