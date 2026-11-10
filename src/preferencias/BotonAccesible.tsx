// Botón con las medidas de .sbtn del prototipo, que obedece al tamaño y la forma elegidos.
import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { useTema } from "../temas";
import { usePreferencias } from "./PreferenciasProvider";

interface Props {
  etiqueta: string;
  onPress: () => void;
  /** "principal" (color de acción) o "suave" (.sbtn.ghost: fondo de tarjeta y borde de línea). */
  variante?: "principal" | "suave";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function BotonAccesible({
  etiqueta,
  onPress,
  variante = "principal",
  accessibilityLabel,
  style,
}: Props) {
  const { colores } = useTema();
  const { estilos } = usePreferencias();
  const { boton } = estilos;
  const principal = variante === "principal";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      onPress={onPress}
      style={[
        styles.base,
        {
          minHeight: boton.altoMinimo,
          minWidth: boton.anchoMinimo,
          paddingHorizontal: boton.paddingHorizontal,
          borderRadius: boton.radio,
          borderWidth: boton.borde,
          backgroundColor: principal ? colores.primario : colores.superficie,
          borderColor: principal ? colores.primario : colores.borde,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: principal ? colores.textoSobrePrimario : colores.texto,
          fontFamily: estilos.fuenteNegrita,
          fontSize: boton.tamanoTexto,
          fontWeight: "700",
        }}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
});
