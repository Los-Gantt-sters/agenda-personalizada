export type PosicionBotonNecesidades =
  "inferior-izquierda" | "inferior-derecha" | "superior-izquierda" | "superior-derecha";

export type VarianteColorNecesidades = "estandar" | "alto-contraste" | "pastel";

export interface BotonNecesidadesProps {
  onPress: () => void;
  posicion?: PosicionBotonNecesidades;
  tamanio?: number; // Por defecto 84px, garantizando >= 48px
  variante?: VarianteColorNecesidades;
  etiqueta?: string;
  testID?: string;
}
