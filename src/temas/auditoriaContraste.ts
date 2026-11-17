// Auditoría de contraste cromático WCAG 2.1 (T-04.4, HU-04). Recoge las combinaciones de color que
// usan de verdad las pantallas y comprueba en cada tema el mínimo que les toca:
//   - texto: 4,5:1 (AA, criterio 1.4.3); en los temas de alto contraste, 7:1 (AAA, criterio 1.4.6).
//   - componentes de interfaz y gráficos: 3:1 (criterio 1.4.11), igual en todos los temas.
// Cubre RNF3.2 y RNF14.1/14.2. Al añadir una pantalla con una combinación nueva, se añade aquí.
import {
  CONTRASTE_AAA_TEXTO,
  CONTRASTE_AA_COMPONENTES,
  CONTRASTE_AA_TEXTO,
  ratioContraste,
} from "./contraste";
import { InfoTema, NOMBRES_TEMAS, Paleta, TEMAS } from "./paletas";

/** Qué se está comprobando: un texto o el contorno de un componente o gráfico. */
export type TipoCombinacion = "texto" | "componente";

/** Un color: el nombre de un color de la paleta del tema o un hexadecimal fijo (#RRGGBB). */
export type ReferenciaColor = keyof Paleta | `#${string}`;

/** Color de delante y color de detrás. */
export type ParColores = readonly [frente: ReferenciaColor, fondo: ReferenciaColor];

export interface Combinacion {
  /** Identificador corto y estable. */
  id: string;
  /** Qué elemento es, en pocas palabras. */
  elemento: string;
  /** Componente o pantalla donde se usa. */
  usoEn: string;
  tipo: TipoCombinacion;
  /**
   * Pares de colores que se comparan. Si hay varios, basta con que uno llegue al mínimo: un
   * componente se distingue si su borde contrasta con el relleno o si el relleno contrasta con lo
   * que le rodea (WCAG 1.4.11).
   */
  pares: readonly ParColores[];
}

/** Combinaciones que usan las pantallas con los colores del tema activo. */
export const COMBINACIONES_DE_USO: readonly Combinacion[] = [
  // ---- Textos ----
  {
    id: "texto-fondo",
    elemento: "Títulos y textos sobre el fondo de la pantalla",
    usoEn: "PanelPreferencias",
    tipo: "texto",
    pares: [["texto", "fondo"]],
  },
  {
    id: "texto-superficie",
    elemento: "Texto de tarjetas, opciones y pantalla de Accesibilidad",
    usoEn: "OpcionPreferencia, PantallaVistaAccesible, BotonAccesible (suave), BotonVistaAccesible",
    tipo: "texto",
    pares: [["texto", "superficie"]],
  },
  {
    id: "texto-superficieDestacada",
    elemento: "Texto de la opción elegida y de la tarea «Ahora»",
    usoEn: "OpcionPreferencia, PantallaVistaAccesible, vista previa de PanelPreferencias",
    tipo: "texto",
    pares: [["texto", "superficieDestacada"]],
  },
  {
    id: "textoSecundario-fondo",
    elemento: "Subtítulos y ayudas",
    usoEn: "PanelPreferencias",
    tipo: "texto",
    pares: [["textoSecundario", "fondo"]],
  },
  {
    id: "textoSecundario-superficie",
    elemento: "Texto de apoyo dentro de tarjetas",
    usoEn: "Paleta (uso general)",
    tipo: "texto",
    pares: [["textoSecundario", "superficie"]],
  },
  {
    id: "textoSecundario-superficieDestacada",
    elemento: "Rótulo «AHORA» y descripción de la tarea",
    usoEn: "Vista previa de PanelPreferencias",
    tipo: "texto",
    pares: [["textoSecundario", "superficieDestacada"]],
  },
  {
    id: "textoSobrePrimario-primario",
    elemento: "Texto de los botones principales",
    usoEn: "BotonAccesible (principal), botón «Listo» de PantallaVistaAccesible (barra de abajo)",
    tipo: "texto",
    pares: [["textoSobrePrimario", "primario"]],
  },
  {
    id: "primario-fondo",
    elemento: "Muestra «Aa» de cada tema y enlaces",
    usoEn: "PanelPreferencias (selector de tema)",
    tipo: "texto",
    pares: [["primario", "fondo"]],
  },
  {
    id: "primario-superficie",
    elemento: "Enlaces y textos de acción en tarjetas",
    usoEn: "Paleta (uso general)",
    tipo: "texto",
    pares: [["primario", "superficie"]],
  },
  {
    id: "primario-superficieDestacada",
    elemento: "Marca ✓ de la opción elegida",
    usoEn: "OpcionPreferencia",
    tipo: "texto",
    pares: [["primario", "superficieDestacada"]],
  },
  {
    id: "exito-superficie",
    elemento: "Mensaje de tarea hecha",
    usoEn: "Paleta (estados)",
    tipo: "texto",
    pares: [["exito", "superficie"]],
  },
  {
    id: "peligro-superficie",
    elemento: "Mensaje de error",
    usoEn: "Paleta (estados)",
    tipo: "texto",
    pares: [["peligro", "superficie"]],
  },
  {
    id: "aviso-superficie",
    elemento: "Mensaje de aviso",
    usoEn: "Paleta (estados)",
    tipo: "texto",
    pares: [["aviso", "superficie"]],
  },
  {
    id: "exito-fondo",
    elemento: "Mensaje de tarea hecha sobre la pantalla",
    usoEn: "Paleta (estados)",
    tipo: "texto",
    pares: [["exito", "fondo"]],
  },
  {
    id: "peligro-fondo",
    elemento: "Mensaje de error sobre la pantalla",
    usoEn: "Paleta (estados)",
    tipo: "texto",
    pares: [["peligro", "fondo"]],
  },
  {
    id: "aviso-fondo",
    elemento: "Mensaje de aviso sobre la pantalla",
    usoEn: "Paleta (estados)",
    tipo: "texto",
    pares: [["aviso", "fondo"]],
  },

  // ---- Componentes ----
  {
    id: "borde-fondo",
    elemento: "Borde de grupos y de opciones sin elegir",
    usoEn: "PanelPreferencias, OpcionPreferencia",
    tipo: "componente",
    pares: [["borde", "fondo"]],
  },
  {
    id: "borde-superficie",
    elemento: "Borde de tarjetas, chips y botón suave",
    usoEn: "PantallaVistaAccesible, BotonAccesible (suave)",
    tipo: "componente",
    pares: [["borde", "superficie"]],
  },
  {
    id: "primario-fondo-componente",
    elemento: "Borde de la opción elegida, botón principal y botón flotante «Vista»",
    usoEn: "OpcionPreferencia, BotonAccesible, BotonVistaAccesible",
    tipo: "componente",
    pares: [["primario", "fondo"]],
  },
  {
    id: "primario-superficie-componente",
    elemento: "Borde de la opción elegida y del chip elegido",
    usoEn: "PantallaVistaAccesible",
    tipo: "componente",
    pares: [["primario", "superficie"]],
  },
  {
    id: "foco-fondo",
    elemento: "Anillo de foco sobre la pantalla",
    usoEn: "Paleta (navegación con teclado o pulsador)",
    tipo: "componente",
    pares: [["foco", "fondo"]],
  },
  {
    id: "foco-superficie",
    elemento: "Anillo de foco sobre tarjetas",
    usoEn: "Paleta (navegación con teclado o pulsador)",
    tipo: "componente",
    pares: [["foco", "superficie"]],
  },
  {
    id: "caja-pictograma",
    elemento: "Caja blanca del pictograma (borde o relleno frente a la tarea)",
    usoEn: "Vista previa de PanelPreferencias",
    tipo: "componente",
    pares: [
      ["borde", "#FFFFFF"],
      ["#FFFFFF", "superficieDestacada"],
    ],
  },

  // ---- Pictograma (SCRUM-65): marco blanco con el borde del tema y marca de «hecho» ----
  {
    id: "pictograma-marco-fondo",
    elemento: "Marco del pictograma sobre el fondo de la pantalla",
    usoEn: "Pictograma (borde por defecto)",
    tipo: "componente",
    pares: [
      ["borde", "#FFFFFF"],
      ["borde", "fondo"],
      ["#FFFFFF", "fondo"],
    ],
  },
  {
    id: "pictograma-marco-superficie",
    elemento: "Marco del pictograma sobre tarjetas",
    usoEn: "Pictograma (borde por defecto)",
    tipo: "componente",
    pares: [
      ["borde", "#FFFFFF"],
      ["borde", "superficie"],
      ["#FFFFFF", "superficie"],
    ],
  },
  {
    id: "pictograma-marco-superficieDestacada",
    elemento: "Marco del pictograma en la tarea «Ahora» o la opción elegida",
    usoEn: "Pictograma (borde por defecto)",
    tipo: "componente",
    pares: [
      ["borde", "#FFFFFF"],
      ["borde", "superficieDestacada"],
      ["#FFFFFF", "superficieDestacada"],
    ],
  },
  {
    id: "pictograma-hecho",
    elemento: "Marca ✓ de pictograma hecho",
    usoEn: "Pictograma (insignia de completado, COLOR_INSIGNIA_HECHO)",
    tipo: "texto",
    pares: [["#FFFFFF", "#005A1E"]],
  },

  // ---- Reloj visual (HU-09, NC-004): tinta = texto, disco = superficie, sector = peligro ----
  {
    id: "reloj-rotulo",
    elemento: "Rótulo «Quedan X minutos» bajo el reloj",
    usoEn: "RelojVisual",
    tipo: "texto",
    pares: [["texto", "fondo"]],
  },
  {
    id: "reloj-sector",
    elemento: "Sector de tiempo restante sobre el disco",
    usoEn: "RelojVisual",
    tipo: "componente",
    pares: [["peligro", "superficie"]],
  },
  {
    id: "reloj-marcas",
    elemento: "Borde y marcas horarias sobre el disco",
    usoEn: "RelojVisual",
    tipo: "componente",
    pares: [["texto", "superficie"]],
  },

  // ---- Rediseño «Piedra»: iconos sobre rellenos de color (blanco o negro con colorSobre) ----
  {
    id: "sello-hecha",
    elemento: "Marca de tarea hecha sobre el sello verde",
    usoEn: "AgendaTresBloques (sello), RefuerzoPositivo (insignia)",
    tipo: "texto",
    pares: [
      ["#FFFFFF", "exito"],
      ["#000000", "exito"],
    ],
  },
  {
    id: "sello-bloqueada",
    elemento: "Candado de tarea bloqueada sobre el sello de aviso",
    usoEn: "AgendaTresBloques (sello)",
    tipo: "texto",
    pares: [
      ["#FFFFFF", "aviso"],
      ["#000000", "aviso"],
    ],
  },
  {
    id: "boton-ayuda",
    elemento: "Texto «Ayuda» del botón de necesidades",
    usoEn: "BotonNecesidades (relleno peligro)",
    tipo: "texto",
    pares: [
      ["#FFFFFF", "peligro"],
      ["#000000", "peligro"],
    ],
  },
  // ---- Formas de clase (colores fijos copiados de FormaClase) ----
  {
    id: "forma-triangulo",
    elemento: "Forma de la clase Triángulo",
    usoEn: "FormaClase (en los temas oscuros va sobre una placa blanca)",
    tipo: "componente",
    pares: [
      ["#B3261E", "superficie"],
      ["#B3261E", "#FFFFFF"],
    ],
  },
  {
    id: "forma-circulo",
    elemento: "Forma de la clase Círculo",
    usoEn: "FormaClase (en los temas oscuros va sobre una placa blanca)",
    tipo: "componente",
    pares: [
      ["#2F62B8", "superficie"],
      ["#2F62B8", "#FFFFFF"],
    ],
  },
  {
    id: "forma-cuadrado",
    elemento: "Forma de la clase Cuadrado",
    usoEn: "FormaClase (en los temas oscuros va sobre una placa blanca)",
    tipo: "componente",
    pares: [
      ["#2D6A3E", "superficie"],
      ["#2D6A3E", "#FFFFFF"],
    ],
  },
];

export interface ResultadoContraste {
  /** Tema auditado, o null si la combinación solo usa colores fijos. */
  tema: InfoTema | null;
  combinacion: Combinacion;
  /** Par de colores (ya en hexadecimal) que mejor contraste da. */
  frente: string;
  fondo: string;
  ratio: number;
  minimo: number;
  cumple: boolean;
}

/** Mínimo exigido: 3:1 en componentes; 4,5:1 en texto, o 7:1 si el tema es de alto contraste. */
export function minimoExigido(tipo: TipoCombinacion, tema: InfoTema | null): number {
  if (tipo === "componente") return CONTRASTE_AA_COMPONENTES;
  return tema?.esAltoContraste ? CONTRASTE_AAA_TEXTO : CONTRASTE_AA_TEXTO;
}

function resolver(color: ReferenciaColor, paleta: Paleta | null): string {
  if (color.startsWith("#")) return color;
  if (!paleta) {
    throw new Error(`El color «${color}» necesita un tema para resolverse`);
  }
  return paleta[color as keyof Paleta];
}

/** Evalúa una combinación en un tema (o sin tema, si solo usa colores fijos). */
export function evaluarCombinacion(
  combinacion: Combinacion,
  tema: InfoTema | null,
): ResultadoContraste {
  const paleta = tema?.paleta ?? null;
  let mejor: { frente: string; fondo: string; ratio: number } | null = null;
  for (const [frente, fondo] of combinacion.pares) {
    const f = resolver(frente, paleta);
    const b = resolver(fondo, paleta);
    const ratio = ratioContraste(f, b);
    if (!mejor || ratio > mejor.ratio) mejor = { frente: f, fondo: b, ratio };
  }
  if (!mejor) {
    throw new Error(`La combinación «${combinacion.id}» no tiene pares de colores`);
  }
  const minimo = minimoExigido(combinacion.tipo, tema);
  return { tema, combinacion, ...mejor, minimo, cumple: mejor.ratio >= minimo };
}

/** Audita todas las combinaciones de uso en un tema. */
export function auditarTema(tema: InfoTema): ResultadoContraste[] {
  return COMBINACIONES_DE_USO.map((c) => evaluarCombinacion(c, tema));
}

/** Audita los cinco temas. */
export function auditarContraste(): ResultadoContraste[] {
  return NOMBRES_TEMAS.flatMap((nombre) => auditarTema(TEMAS[nombre]));
}

const formatear = (n: number) => n.toFixed(2).replace(".", ",");

/** Tabla en Markdown con el resultado, para el informe de auditoría. */
export function informeMarkdown(resultados: readonly ResultadoContraste[]): string {
  const filas = resultados.map((r) => {
    const tema = r.tema ? r.tema.etiqueta : "Colores fijos";
    const estado = r.cumple ? "Cumple" : "**No cumple**";
    return (
      `| ${tema} | ${r.combinacion.elemento} | ${r.combinacion.tipo} | ` +
      `\`${r.frente}\` / \`${r.fondo}\` | ${formatear(r.ratio)}:1 | ` +
      `${formatear(r.minimo)}:1 | ${estado} |`
    );
  });
  return [
    "| Tema | Elemento | Tipo | Colores | Contraste | Mínimo | Resultado |",
    "|---|---|---|---|---|---|---|",
    ...filas,
  ].join("\n");
}
