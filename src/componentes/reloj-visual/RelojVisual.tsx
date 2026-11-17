import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import {
  CENTRO_RELOJ,
  LADO_RELOJ,
  fraccionRestante,
  marcasReloj,
  trazadoSector,
} from "./calculoReloj";
import { useTemaOpcional } from "../../temas";
import { Texto as Text } from "../../ui/Texto";
import { textoTiempoRestante } from "./textoTiempo";
import { useAlarmaSuave } from "./useAlarmaSuave";

// Medidas del prototipo (pantallas 09-11): borde en r=96, disco en r=88 y marcas de r=92 a r=84
const RADIO_BORDE = 96;
const RADIO_DISCO = 88;
const MARCAS = marcasReloj(92, 84);

/**
 * Colores del reloj: `disco` es el sector que se reduce, `fondo` el círculo y `tinta` el borde,
 * las marcas y el rótulo. Salen del tema activo; los fijos solo se usan fuera de <TemaProvider>.
 */
export type ColoresReloj = {
  disco: string;
  fondo: string;
  tinta: string;
};

// Sin tema (p. ej. en tests), los del tema claro del prototipo
const COLORES_SIN_TEMA: ColoresReloj = {
  disco: "#d1495b",
  fondo: "#ffffff",
  tinta: "#14213d",
};

type Props = {
  /** Duración prevista de la tarea, en milisegundos. */
  duracionMs: number;
  /** Tiempo que ha pasado desde que empezó la tarea, en milisegundos. */
  transcurridoMs: number;
  /** Ancho y alto del disco en píxeles. */
  tamano?: number;
  /** Solo para casos especiales: por encima de los colores del tema activo. */
  colores?: Partial<ColoresReloj>;
  /** Muestra debajo el rótulo en Lectura Fácil («Quedan 3 minutos»). Se puede desactivar por alumno. */
  mostrarRotulo?: boolean;
  /** Suena una campanita suave al acabarse el tiempo. */
  sonidoAlTerminar?: boolean;
  /** El reloj parpadea despacio tres veces al acabarse el tiempo (nunca con «reducir movimiento»). */
  parpadeoAlTerminar?: boolean;
  /** Se llama una vez en el momento en que se agota el tiempo. */
  onTiempoAgotado?: () => void;
};

/**
 * Reloj visual tipo Time Timer (HU-09): un disco de color que se reduce en proporción
 * al tiempo que queda (T-09.1), con un rótulo opcional del tiempo restante (T-09.2)
 * y un aviso suave al llegar a cero (T-09.3). La cuenta atrás la lleva quien lo usa.
 */
export function RelojVisual({
  duracionMs,
  transcurridoMs,
  tamano = 240,
  colores,
  mostrarRotulo = true,
  sonidoAlTerminar = true,
  parpadeoAlTerminar = true,
  onTiempoAgotado,
}: Props) {
  // NC-004: con colores fijos, el rótulo no se leía en los temas oscuros (contraste 1,13:1)
  const tema = useTemaOpcional();
  const coloresTema: Partial<ColoresReloj> = tema
    ? { disco: tema.colores.peligro, fondo: tema.colores.superficie, tinta: tema.colores.texto }
    : {};
  const { disco, fondo, tinta } = { ...COLORES_SIN_TEMA, ...coloresTema, ...colores };
  const fraccion = fraccionRestante(duracionMs, transcurridoMs);
  const sector = trazadoSector(fraccion, RADIO_DISCO);
  const rotulo = textoTiempoRestante(duracionMs - transcurridoMs);
  const opacidad = useAlarmaSuave(fraccion, {
    sonido: sonidoAlTerminar,
    parpadeo: parpadeoAlTerminar,
    onTiempoAgotado,
  });

  return (
    <View
      style={[styles.contenedor, { width: tamano }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Reloj visual: ${rotulo}`}
    >
      <Animated.View style={{ opacity: opacidad }}>
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
      </Animated.View>
      {mostrarRotulo && <Text style={[styles.rotulo, { color: tinta }]}>{rotulo}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", justifyContent: "center", gap: 10 },
  // Como el .lbl del prototipo: 1,3 veces el texto base y en negrita
  rotulo: { fontSize: 21, fontWeight: "700", textAlign: "center" },
});
