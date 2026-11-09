import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Platform } from "react-native";
import { BotonNecesidadesProps, PosicionBotonNecesidades } from "./tipos";

export const getEstiloPosicion = (posicion: PosicionBotonNecesidades): ViewStyle => {
  switch (posicion) {
    case "inferior-derecha":
      return { bottom: 16, right: 16 };
    case "superior-izquierda":
      return { top: 16, left: 16 };
    case "superior-derecha":
      return { top: 16, right: 16 };
    case "inferior-izquierda":
    default:
      // RNF11.3: El botón de necesidades estará siempre en la esquina inferior izquierda
      return { bottom: 16, left: 16 };
  }
};

export const BotonNecesidades: React.FC<BotonNecesidadesProps> = ({
  onPress,
  posicion = "inferior-izquierda",
  tamanio = 84, // Tamaño estándar del prototipo 84x84 px (>= 48x48 px de WCAG RNF14.3)
  variante = "estandar",
  canal = "ambos",
  etiqueta = "Ayuda",
  testID = "btn-necesidades-flotante",
}) => {
  const dimension = Math.max(tamanio, 48);
  const estiloPosicion = getEstiloPosicion(posicion);

  // Paletas de color accesibles según prototipo tuagendita
  // Estándar: fondo rojo-granate (#C0392B), texto blanco
  // Alto contraste: fondo negro o amarillo con texto negro puro y borde blanco
  const esAltoContraste = variante === "alto-contraste";

  const colorFondo = esAltoContraste ? "#FF5A5A" : variante === "pastel" ? "#B8433A" : "#C0392B";

  const colorTexto = esAltoContraste ? "#000000" : "#FFFFFF";
  const colorBorde = esAltoContraste ? "#FFFFFF" : "#FFFFFF";

  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Necesito ayuda o pedir necesidades básicas"
      accessibilityHint="Abre las opciones para pedir agua, ir al baño, descansar o pedir urgencia"
      testID={testID}
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        estilos.botonFlotante,
        estiloPosicion,
        {
          width: dimension,
          height: dimension,
          backgroundColor: colorFondo,
          borderColor: colorBorde,
          borderRadius: 18,
        },
      ]}
    >
      {verDibujo && (
        <Text
          style={[
            estilos.iconoMano,
            canal === "soloPictograma" && { fontSize: 40, lineHeight: 44 },
          ]}
        >
          ✋
        </Text>
      )}
      {verTexto && (
        <Text
          style={[
            estilos.textoEtiqueta,
            { color: colorTexto },
            canal === "soloTexto" && { fontSize: 18 },
          ]}
          numberOfLines={1}
        >
          {etiqueta}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  botonFlotante: {
    position: "absolute",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    padding: 4,
    gap: 2,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.25)",
      },
      default: {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  },
  iconoMano: {
    fontSize: 32,
    lineHeight: 34,
  },
  textoEtiqueta: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
});
