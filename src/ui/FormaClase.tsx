// Forma de cada clase (9 formas geométricas: Triángulo, Círculo, Cuadrado, Estrella, Rombo,
// Hexágono, Pentágono, Óvalo y Octógono · SCRUM-252) dibujada en SVG. Sustituye a los emojis:
// se ven igual en todas las tabletas y con el mismo tamaño. Si llega una clase nueva sin
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
  est: {
    color: "#B45309",
    dibujo: (c) => (
      <Path
        d="M12 2.4L14.9 8.6L21.7 9.4L16.7 14L18 20.8L12 17.4L6 20.8L7.3 14L2.3 9.4L9.1 8.6Z"
        fill={c}
      />
    ),
  },
  rom: {
    color: "#7A1F4D",
    dibujo: (c) => <Path d="M12 2.4L21.6 12L12 21.6L2.4 12Z" fill={c} />,
  },
  hex: {
    color: "#0F766E",
    dibujo: (c) => <Path d="M12 2.4L20.4 7.2L20.4 16.8L12 21.6L3.6 16.8L3.6 7.2Z" fill={c} />,
  },
  pen: {
    color: "#6D28D9",
    dibujo: (c) => <Path d="M12 2.6L21.2 9.3L17.7 20.2L6.3 20.2L2.8 9.3Z" fill={c} />,
  },
  ova: {
    color: "#C2410C",
    dibujo: (c) => <Path d="M12 5a9.5 7 0 1 0 0 14a9.5 7 0 1 0 0-14Z" fill={c} />,
  },
  oct: {
    color: "#0369A1",
    dibujo: (c) => (
      <Path
        d="M8.2 2.6L15.8 2.6L21.4 8.2L21.4 15.8L15.8 21.4L8.2 21.4L2.6 15.8L2.6 8.2Z"
        fill={c}
      />
    ),
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
