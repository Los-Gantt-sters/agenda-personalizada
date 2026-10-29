import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import {
  CENTRO_RELOJ,
  LADO_RELOJ,
  fraccionRestante,
  marcasReloj,
  trazadoSector,
} from "./calculoReloj";

// Medidas del prototipo (pantallas 09-11): borde en r=96, disco en r=88 y marcas de r=92 a r=84
const RADIO_BORDE = 96;
const RADIO_DISCO = 88;
const MARCAS = marcasReloj(92, 84);

/** Colores del reloj. Por defecto, los del tema claro del prototipo. */
export type ColoresReloj = {
  disco: string;
  fondo: string;
  tinta: string;
};

const COLORES_TEMA_CLARO: ColoresReloj = {
  disco: "#d1495b",
  fondo: "#ffffff",
  tinta: "#14213d",
};

type Props = {
  /** Duración prevista de la tarea, en milisegundos. */
  duracionMs: number;
  /** Tiempo que ha pasado desde que empezó la tarea, en milisegundos. */
  transcurridoMs: number;
  /** Ancho y alto del reloj en píxeles. */
  tamano?: number;
  colores?: Partial<ColoresReloj>;
};

/**
 * Reloj visual tipo Time Timer (HU-09, T-09.1): un disco de color que se reduce
 * en proporción al tiempo que queda. Solo dibuja; la cuenta atrás, el rótulo
 * y la alarma los gestiona quien lo usa.
 */
export function RelojVisual({ duracionMs, transcurridoMs, tamano = 240, colores }: Props) {
  const { disco, fondo, tinta } = { ...COLORES_TEMA_CLARO, ...colores };
  const fraccion = fraccionRestante(duracionMs, transcurridoMs);
  const sector = trazadoSector(fraccion, RADIO_DISCO);

  return (
    <View
      style={[styles.contenedor, { width: tamano, height: tamano }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Reloj visual: queda ${Math.round(fraccion * 100)} % del tiempo`}
    >
      <Svg width={tamano} height={tamano} viewBox={`0 0 ${LADO_RELOJ} ${LADO_RELOJ}`}>
        <Circle
          cx={CENTRO_RELOJ}
          cy={CENTRO_RELOJ}
          r={RADIO_BORDE}
          fill={fondo}
          stroke={tinta}
          strokeWidth={4}
        />
        {sector && <Path d={sector} fill={disco} />}
        {MARCAS.map((marca, i) => (
          <Line key={i} {...marca} stroke={tinta} strokeWidth={3} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", justifyContent: "center" },
});
