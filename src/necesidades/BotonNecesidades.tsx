import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, Platform, View } from "react-native";
import { BotonNecesidadesProps, PosicionBotonNecesidades } from "./tipos";
import { PictogramaInterfaz, Texto, colorSobre } from "../ui";

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

/**
 * Rojo suavizado de «Ayuda» (MOD HU-18, SCRUM-267): el colegio dijo que el botón era «demasiado
 * grande y vistoso» y daba ganas de tocarlo. Con blanco da ~4,1:1, así que el texto va en negrita
 * y a 19 px (texto grande en WCAG, basta 3:1).
 */
export const COLOR_AYUDA_SUAVE = "#C95A54";

export const BotonNecesidades: React.FC<BotonNecesidadesProps> = ({
  onPress,
  posicion = "inferior-izquierda",
  tamanio = 84, // Tamaño estándar del prototipo 84x84 px (>= 48x48 px de WCAG RNF14.3)
  variante = "estandar",
  canal = "ambos",
  etiqueta = "Ayuda",
  testID = "btn-necesidades-flotante",
  enBarra,
}) => {
  const dimension = Math.max(tamanio, 48);
  // En la barra, pictograma y texto van en fila (boceto 14): así «Ayuda» cabe a 19 px en 72 px.
  const estiloPosicion: ViewStyle = enBarra
    ? {
        position: "relative",
        zIndex: 0,
        width: enBarra.ancho,
        height: enBarra.alto,
        flexDirection: "row",
        gap: 10,
      }
    : getEstiloPosicion(posicion);

  // Rojo suavizado del boceto definitivo; con la variante «alto-contraste» se fuerza el rojo claro
  // del prototipo, con borde blanco. El texto va en blanco sobre el rojo suave (como en el boceto).
  const colorFondo = variante === "alto-contraste" ? "#FF5A5A" : COLOR_AYUDA_SUAVE;
  const colorTexto = variante === "alto-contraste" ? colorSobre(colorFondo) : "#FFFFFF";

  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";
  const ladoDibujo = verTexto
    ? Math.round(dimension * (enBarra ? 0.56 : 0.5))
    : Math.round(dimension * 0.72);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Necesito ayuda o pedir necesidades básicas"
      accessibilityHint="Abre las opciones para pedir agua, ir al baño, descansar o pedir urgencia"
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        estilos.botonFlotante,
        {
          width: dimension,
          height: dimension,
          backgroundColor: colorFondo,
          borderColor: enBarra ? colorFondo : "#FFFFFF",
          borderRadius: 16,
        },
        estiloPosicion,
      ]}
    >
      {verDibujo && (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PictogramaInterfaz nombre="ayuda" etiqueta="ayuda" tam={ladoDibujo} />
        </View>
      )}
      {verTexto && (
        <Texto
          style={[
            estilos.textoEtiqueta,
            { color: colorTexto },
            canal === "soloTexto" && { fontSize: 21 },
          ]}
          numberOfLines={1}
        >
          {etiqueta}
        </Texto>
      )}
    </TouchableOpacity>
  );
};

// Sin sombra: se separa de la pantalla por el color y el borde blanco de 3 px.
const estilos = StyleSheet.create({
  botonFlotante: {
    position: "absolute",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    padding: 4,
    gap: 4,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
      },
      default: {},
    }),
  },
  textoEtiqueta: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
});
