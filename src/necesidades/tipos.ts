export type PosicionBotonNecesidades =
  "inferior-izquierda" | "inferior-derecha" | "superior-izquierda" | "superior-derecha";

export type VarianteColorNecesidades = "estandar" | "alto-contraste" | "pastel";

export type ModoCanalNecesidades = "ambos" | "soloPictograma" | "soloTexto";

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
  canal?: ModoCanalNecesidades;
  etiqueta?: string;
  testID?: string;
  /** Dentro de la barra inferior de la pantalla: sin posición fija y con este ancho. */
  enBarra?: { ancho: number; alto: number };
}

export interface PantallaNecesidadesProps {
  visible: boolean;
  alSeleccionarNecesidad: (clave: ClaveNecesidad) => void;
  alCerrar: () => void;
  necesidadEnviada?: ClaveNecesidad | null;
  alConfirmarAvisoEnviado?: () => void;
  nombreTutora?: string;
  variante?: VarianteColorNecesidades;
  canal?: ModoCanalNecesidades;
  mostrarImagenArasaac?: boolean;
  /** Necesidades que ve este alumno (las elige el tutor en Preferencias). Sin indicar, todas. */
  necesidades?: readonly ClaveNecesidadBasica[];
}
