export type PosicionBotonNecesidades =
  "inferior-izquierda" | "inferior-derecha" | "superior-izquierda" | "superior-derecha";

export type VarianteColorNecesidades = "estandar" | "alto-contraste" | "pastel";

export type ModoCanalNecesidades = "ambos" | "soloPictograma" | "soloTexto";

export type ClaveNecesidadBasica = "bano" | "agua" | "descanso";

export type ClaveNecesidad = ClaveNecesidadBasica | "urgencia";

/**
 * Una ayuda que el adulto ha elegido en la pantalla 26 (MOD HU-18, máximo 3). Se guarda completa
 * para que la pantalla 14 la pinte sin pedir nada a la red.
 */
export interface AyudaElegida {
  /** "arasaac:<idPictograma>" o "propio:<idPictogramaPropio>". */
  id: string;
  texto: string;
  imagenUrl: string;
  origen: "arasaac" | "biblioteca";
  /**
   * Solo en las de Mi biblioteca: ruta del archivo en el bucket privado `pictogramas-propios`.
   * `imagenUrl` es una URL firmada que caduca; con la ruta se podrá volver a firmar.
   */
  rutaStorage?: string;
}

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

/** Lo que pide el alumno en la 14: una de sus ayudas o «Urgencia» (MOD HU-18). */
export type SolicitudAyuda = AyudaElegida | "urgencia";

export interface PantallaNecesidadesProps {
  visible: boolean;
  /** Ayudas que ve este alumno (de 1 a 3, las elige el adulto en la 26). */
  ayudas: readonly AyudaElegida[];
  alSolicitar: (solicitud: SolicitudAyuda) => void;
  alCerrar: () => void;
  /** Lo recién enviado: la pantalla pasa a «Aviso enviado» (14b). */
  solicitudEnviada?: SolicitudAyuda | null;
  /** Ya no se enseña (la 14b solo dice «Solicitud enviada»); se acepta por compatibilidad. */
  nombreTutora?: string;
  variante?: VarianteColorNecesidades;
  canal?: ModoCanalNecesidades;
}
