// Apariencia activa para cualquier pantalla: colores del tema y letra del perfil del estudiante.
// Funciona también fuera de los proveedores (tests, componentes sueltos): entonces usa el tema
// claro («Piedra») y la letra por defecto (Lexend).
import { useMemo } from "react";

import { TEMAS, TEMA_POR_DEFECTO, useTemaOpcional, type Paleta } from "../temas";
import { ratioContraste } from "../temas/contraste";
import { usePreferenciasOpcional } from "../preferencias/PreferenciasProvider";
import {
  FUENTES,
  PREFERENCIAS_POR_DEFECTO,
  TAMANOS_LETRA,
  type ModoCanal,
} from "../preferencias/opciones";

export interface Apariencia {
  colores: Paleta;
  /** true si el tema activo es de fondo oscuro. */
  esOscuro: boolean;
  /** Familias de letra ya cargadas (ver preferencias/fuentes.ts). */
  fuente: { normal: string; negrita: string };
  /** true si el centro enseña en MAYÚSCULAS: todo el texto sale en mayúscula. */
  mayusculas: boolean;
  /** Qué se ve: dibujo y texto, solo dibujo o solo texto (RF3.1). */
  canal: ModoCanal;
  /** Tamaño de letra elegido (1 = normal). Texto lo aplica a toda la app (RF3.3). */
  escalaLetra: number;
}

const FUENTE_POR_DEFECTO = FUENTES[PREFERENCIAS_POR_DEFECTO.fuente];

export function useApariencia(): Apariencia {
  const tema = useTemaOpcional();
  const prefs = usePreferenciasOpcional();
  const colores = tema?.colores ?? TEMAS[TEMA_POR_DEFECTO].paleta;
  const esOscuro = tema?.tema.esOscuro ?? false;
  const normal = prefs?.estilos.fuenteNormal ?? FUENTE_POR_DEFECTO.familiaNormal;
  const negrita = prefs?.estilos.fuenteNegrita ?? FUENTE_POR_DEFECTO.familiaNegrita;
  const mayusculas = prefs?.preferencias.caja === "mayusculas";
  const canal = prefs?.preferencias.canal ?? "ambos";
  const escalaLetra = TAMANOS_LETRA[prefs?.preferencias.tamanoLetra ?? "normal"].escala;
  return useMemo(
    () => ({ colores, esOscuro, fuente: { normal, negrita }, mayusculas, canal, escalaLetra }),
    [colores, esOscuro, normal, negrita, mayusculas, canal, escalaLetra],
  );
}

/**
 * Crea los estilos de un componente a partir de los colores del tema activo. `crear` debe estar
 * definida fuera del componente para que los estilos solo se rehagan al cambiar de tema.
 */
export function useEstilos<T>(crear: (c: Paleta) => T): T {
  const { colores } = useApariencia();
  return useMemo(() => crear(colores), [crear, colores]);
}

/**
 * Blanco o negro, el que más contrasta con `fondo`. Para iconos y textos que van sobre un relleno
 * de color del tema (éxito, aviso, peligro): en los temas oscuros esos rellenos son claros y el
 * blanco dejaría de verse.
 */
export function colorSobre(fondo: string): "#FFFFFF" | "#000000" {
  return ratioContraste("#FFFFFF", fondo) >= ratioContraste("#000000", fondo)
    ? "#FFFFFF"
    : "#000000";
}

/** Medidas comunes del estilo «Piedra»: esquinas suaves, bordes visibles y sin sombras. */
export const FORMA = {
  /** Radio de bloques y tarjetas grandes. */
  radio: 14,
  /** Radio de tarjetas pequeñas, campos y botones secundarios. */
  radioPequeno: 10,
  /** Grosor de borde normal (llega a 3:1 con el color `borde`). */
  borde: 2,
  /** Grosor de borde del elemento destacado («Ahora», opción elegida). */
  bordeDestacado: 4,
} as const;
