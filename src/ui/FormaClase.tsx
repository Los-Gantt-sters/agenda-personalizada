// Forma de cada clase (Triángulo, Círculo, Cuadrado) dibujada en SVG. Sustituye a los emojis
// 🔺 🔵 🟩: se ven igual en todas las tabletas y con el mismo tamaño. Si llega una clase nueva sin
// forma conocida, se enseña su símbolo tal cual. En los temas oscuros la forma va sobre una placa
// blanca, igual que los pictogramas: sobre un fondo oscuro estos colores no llegan a 3:1.
import { Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useApariencia } from "./apariencia";

/** Colores de cada forma: todos llegan a 3:1 sobre blanco (WCAG 1.4.11). */
const FORMAS: Record<string, { color: string; dibujo: (c: string) => React.ReactNode }> = {
  tri: {
    color: "#B3261E",
    dibujo: (c) => <Path d="M12 3.2L21.5 20H2.5z" fill={c} stroke={c} strokeLinejoin="round" />,
  },
  cir: { color: "#2F62B8", dibujo: (c) => <Circle cx={12} cy={12} r={9.5} fill={c} /> },
  cua: {
    color: "#2D6A3E",
    dibujo: (c) => <Rect x={3} y={3} width={18} height={18} rx={2.5} fill={c} />,
  },
};

export function FormaClase({
  claseId,
  simbolo,
  tam = 64,
}: {
  claseId: string;
  /** Emoji de la clase en los datos; solo se usa si la forma no es conocida. */
  simbolo: string;
  tam?: number;
}) {
  const { esOscuro } = useApariencia();
  const forma = FORMAS[claseId];
  if (!forma) {
    return (
      <Text style={{ fontSize: tam * 0.8 }} accessibilityElementsHidden>
        {simbolo}
      </Text>
    );
  }
  const dibujo = (
    <Svg
      width={esOscuro ? Math.round(tam * 0.78) : tam}
      height={esOscuro ? Math.round(tam * 0.78) : tam}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`forma-${claseId}`}
    >
      {forma.dibujo(forma.color)}
    </Svg>
  );
  if (!esOscuro) return dibujo;
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: Math.round(Math.min(14, tam * 0.16)),
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {dibujo}
    </View>
  );
}
