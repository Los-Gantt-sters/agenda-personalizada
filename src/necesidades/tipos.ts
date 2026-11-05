export type PosicionBotonNecesidades =
  "inferior-izquierda" | "inferior-derecha" | "superior-izquierda" | "superior-derecha";

export type VarianteColorNecesidades = "estandar" | "alto-contraste" | "pastel";

export type ClaveNecesidadBasica = "bano" | "agua" | "descanso";

export type ClaveNecesidad = ClaveNecesidadBasica | "urgencia";

export interface OpcionNecesidadArasaac {
  clave: ClaveNecesidadBasica;
  etiqueta: string;
  simbolo: string;
  arasaacId: number;
  urlPictograma: string;
  descripcionAlternativa: string;
}

export interface BotonNecesidadesProps {
  onPress: () => void;
  posicion?: PosicionBotonNecesidades;
  tamanio?: number; // Por defecto 84px, garantizando >= 48px
  variante?: VarianteColorNecesidades;
  etiqueta?: string;
  testID?: string;
}

export interface ModalNecesidadesProps {
  visible: boolean;
  alSeleccionarNecesidad: (clave: ClaveNecesidad) => void;
  alCerrar: () => void;
  necesidadEnviada?: ClaveNecesidad | null;
  alConfirmarAvisoEnviado?: () => void;
  nombreTutora?: string;
  variante?: VarianteColorNecesidades;
  mostrarImagenArasaac?: boolean;
}
