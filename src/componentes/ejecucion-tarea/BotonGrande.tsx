// Botón grande de una sola pulsación (T-08.1, HU-08), p. ej. «Seguir» tras el refuerzo positivo.
// RNF6.3: área táctil mínima de 48 × 48 px (aquí bastante más).
import { Pressable, StyleSheet, Text } from "react-native";
import { colores } from "../agenda/colores";

export function BotonGrande({
  texto,
  onPress,
  color = colores.primario,
  testID,
}: {
  texto: string;
  onPress: () => void;
  color?: string;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: color },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={estilos.texto}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minWidth: 160,
    minHeight: 72,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: { color: colores.textoSobrePrimario, fontSize: 26, fontWeight: "800" },
});
