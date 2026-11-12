// Iconos de línea para las pantallas de adultos y para los signos de los botones (cerrar, seguir...).
// Sustituyen a los emojis: todos tienen el mismo trazo redondeado de 2,4 px, toman el color del texto
// que acompañan y son decorativos (el nombre accesible lo pone el botón o el texto de al lado).
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type NombreIcono =
  | "llave"
  | "alerta"
  | "ojo"
  | "ojoTachado"
  | "atras"
  | "adelante"
  | "cerrar"
  | "check"
  | "candado"
  | "reloj"
  | "altavoz"
  | "calendario"
  | "campana"
  | "paleta"
  | "imagen"
  | "cronometro"
  | "casa"
  | "persona"
  | "personas"
  | "enlace"
  | "salir"
  | "estrella"
  | "reproducir"
  | "flechaAtras"
  | "accesibilidad"
  | "lista";

const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  llave: (
    <>
      <Circle cx={8} cy={15} r={4} />
      <Path d="M11 12l9-9M17 6l3 3M15 8l2 2" />
    </>
  ),
  alerta: (
    <>
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M12 7v6M12 16.5v.5" />
    </>
  ),
  ojo: (
    <>
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
  ojoTachado: (
    <>
      <Path d="M2 12s3.5-7 10-7c2 0 3.7.6 5.1 1.5M22 12s-3.5 7-10 7c-2 0-3.7-.6-5.1-1.5" />
      <Path d="M3 3l18 18" />
    </>
  ),
  atras: <Path d="M15 5l-7 7 7 7" />,
  adelante: <Path d="M5 12h14M13 6l6 6-6 6" />,
  cerrar: <Path d="M6 6l12 12M18 6L6 18" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7" />,
  candado: (
    <>
      <Rect x={5} y={11} width={14} height={10} rx={2} />
      <Path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  reloj: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  altavoz: (
    <>
      <Path d="M4 9v6h4l5 4V5L8 9H4z" />
      <Path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
    </>
  ),
  calendario: (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={2} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  campana: (
    <>
      <Path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16z" />
      <Path d="M10 20.5a2 2 0 004 0" />
    </>
  ),
  paleta: (
    <>
      <Path d="M12 3a9 9 0 100 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 004-4C21 6.6 17 3 12 3z" />
      <Circle cx={7.5} cy={11} r={1} />
      <Circle cx={10.5} cy={7} r={1} />
      <Circle cx={15} cy={7.5} r={1} />
    </>
  ),
  imagen: (
    <>
      <Rect x={3} y={4.5} width={18} height={15} rx={2} />
      <Circle cx={8.5} cy={9.5} r={1.5} />
      <Path d="M21 16l-5-5-8 8.5" />
    </>
  ),
  cronometro: (
    <>
      <Circle cx={12} cy={13.5} r={7.5} />
      <Path d="M12 13.5V10M10 2.5h4M18.5 6.5L17 8" />
    </>
  ),
  casa: (
    <>
      <Path d="M3.5 11L12 4l8.5 7" />
      <Path d="M6 9.5V20h12V9.5M10 20v-5h4v5" />
    </>
  ),
  persona: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
  personas: (
    <>
      <Circle cx={9} cy={8.5} r={3.5} />
      <Path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <Path d="M15.5 5.3a3.5 3.5 0 010 6.4M18 14.8c1.8.8 3 2.6 3.5 5.2" />
    </>
  ),
  enlace: (
    <>
      <Path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4L11.5 6" />
      <Path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1.5-1.4" />
    </>
  ),
  salir: (
    <>
      <Path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
      <Path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  reproducir: (
    <>
      <Rect x={2.5} y={5} width={19} height={14} rx={3} />
      <Path d="M10 9v6l5-3-5-3z" />
    </>
  ),
  flechaAtras: <Path d="M19 12H5M11 6l-6 6 6 6" />,
  // Símbolo internacional de accesibilidad: persona con los brazos abiertos dentro de un círculo.
  accesibilidad: (
    <>
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={6.6} r={1.3} />
      <Path d="M6.5 9.6c3.6.9 7.4.9 11 0M12 10.4v4M12 14.4l-3 4.6M12 14.4l3 4.6" />
    </>
  ),
  lista: <Path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  estrella: <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
};

export interface IconoProps {
  nombre: NombreIcono;
  color: string;
  /** Lado en píxeles. */
  tam?: number;
  /** Grosor del trazo; más grueso para los signos de los botones grandes del alumno. */
  grosor?: number;
  /** Por defecto `icono-<nombre>`, para que los tests sepan que el botón lleva dibujo. */
  testID?: string;
}

export function Icono({ nombre, color, tam = 24, grosor = 2.4, testID }: IconoProps) {
  return (
    <Svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID ?? `icono-${nombre}`}
    >
      {TRAZOS[nombre]}
    </Svg>
  );
}
