// Paletas de color de la interfaz (T-04.1, HU-04). Cada tema define los mismos colores con nombre,
// así que cambiar de tema es cambiar de objeto sin tocar los componentes.
// RNF3.2: todas las paletas cumplen como mínimo el contraste AA de WCAG 2.1 (se comprueba en los tests).

export type NombreTema =
  "claro" | "oscuro" | "pastel" | "altoContrasteClaro" | "altoContrasteOscuro";

export interface Paleta {
  /** Fondo general de la pantalla. */
  fondo: string;
  /** Fondo de tarjetas, paneles y modales. */
  superficie: string;
  /** Fondo destacado suave (tarea «Ahora», elemento seleccionado). */
  superficieDestacada: string;
  /** Texto principal. */
  texto: string;
  /** Texto de apoyo (subtítulos, ayudas). */
  textoSecundario: string;
  /** Color de acción: botones principales y enlaces. */
  primario: string;
  /** Texto o icono que va encima del color primario. */
  textoSobrePrimario: string;
  /** Bordes de tarjetas, campos y botones. */
  borde: string;
  /** Anillo de foco visible al navegar con teclado o pulsador. */
  foco: string;
  /** Tarea hecha o acción correcta. */
  exito: string;
  /** Error o alerta importante. */
  peligro: string;
  /** Aviso o tiempo que se acaba. */
  aviso: string;
}

export interface InfoTema {
  nombre: NombreTema;
  /** Nombre corto para mostrar en el selector, en Lectura Fácil. */
  etiqueta: string;
  /** true si el tema es de fondo oscuro. */
  esOscuro: boolean;
  /** true si es una variante de alto contraste (objetivo AAA, 7:1). */
  esAltoContraste: boolean;
  paleta: Paleta;
}

export const TEMA_POR_DEFECTO: NombreTema = "claro";

export const TEMAS: Record<NombreTema, InfoTema> = {
  claro: {
    nombre: "claro",
    etiqueta: "Claro",
    esOscuro: false,
    esAltoContraste: false,
    // «Piedra»: grises cálidos y el granate del logo del colegio (Hermanas Hospitalarias –
    // Fundación Purísima Concepción) como único color. Pocos estímulos: sin degradados ni sombras.
    // El turquesa del logo (#76D3D7) no llega a 3:1 sobre blanco, así que no se usa en texto ni bordes.
    paleta: {
      fondo: "#F1F1EF",
      superficie: "#FFFFFF",
      superficieDestacada: "#EDE6E9",
      texto: "#22211F",
      textoSecundario: "#55524E",
      primario: "#7D1D4F",
      textoSobrePrimario: "#FFFFFF",
      borde: "#7B7772",
      foco: "#155E63",
      exito: "#2D6A3E",
      peligro: "#B3261E",
      aviso: "#7A5600",
    },
  },
  oscuro: {
    nombre: "oscuro",
    etiqueta: "Oscuro",
    esOscuro: true,
    esAltoContraste: false,
    paleta: {
      fondo: "#11161F",
      superficie: "#1B2230",
      superficieDestacada: "#23314B",
      texto: "#EEF2F8",
      textoSecundario: "#B8C2D6",
      primario: "#86B7FF",
      textoSobrePrimario: "#0B1220",
      borde: "#7F8CA6",
      foco: "#FFFFFF",
      exito: "#74D69F",
      peligro: "#FF8A8A",
      aviso: "#F0C445",
    },
  },
  pastel: {
    nombre: "pastel",
    etiqueta: "Pastel",
    esOscuro: false,
    esAltoContraste: false,
    paleta: {
      fondo: "#EAF5F1",
      superficie: "#FBFFFD",
      superficieDestacada: "#D3ECE4",
      texto: "#1D3832",
      textoSecundario: "#3F5A53",
      primario: "#2C7363",
      textoSobrePrimario: "#FFFFFF",
      borde: "#5E8A7F",
      foco: "#14423A",
      exito: "#2B6B3F",
      peligro: "#A83A32",
      aviso: "#7A5A00",
    },
  },
  altoContrasteClaro: {
    nombre: "altoContrasteClaro",
    etiqueta: "Alto contraste claro",
    esOscuro: false,
    esAltoContraste: true,
    paleta: {
      fondo: "#FFFFFF",
      superficie: "#FFFFFF",
      superficieDestacada: "#E6E6FF",
      texto: "#000000",
      textoSecundario: "#1A1A1A",
      primario: "#0000CC",
      textoSobrePrimario: "#FFFFFF",
      borde: "#000000",
      foco: "#000000",
      exito: "#005A1E",
      peligro: "#B00000",
      aviso: "#6B4B00",
    },
  },
  altoContrasteOscuro: {
    nombre: "altoContrasteOscuro",
    etiqueta: "Alto contraste oscuro",
    esOscuro: true,
    esAltoContraste: true,
    paleta: {
      fondo: "#000000",
      superficie: "#0B0B0B",
      superficieDestacada: "#1B1900",
      texto: "#FFFFFF",
      textoSecundario: "#F2F2F2",
      primario: "#FFD400",
      textoSobrePrimario: "#000000",
      borde: "#FFFFFF",
      foco: "#FFD400",
      exito: "#7CFF8A",
      peligro: "#FF6B6B",
      aviso: "#FFD400",
    },
  },
};

/** Lista ordenada para pintar el selector de temas. */
export const NOMBRES_TEMAS: NombreTema[] = [
  "claro",
  "oscuro",
  "pastel",
  "altoContrasteClaro",
  "altoContrasteOscuro",
];

/** Devuelve true si el valor recibido es un nombre de tema válido (útil con datos de la base). */
export function esNombreTema(valor: unknown): valor is NombreTema {
  return typeof valor === "string" && Object.prototype.hasOwnProperty.call(TEMAS, valor);
}
