import { OpcionNecesidadArasaac, ClaveNecesidad } from "./tipos";

/**
 * Construye la URL oficial del pictograma en el servidor estático de ARASAAC.
 */
export function construirUrlPictogramaArasaac(
  arasaacId: number,
  resolucion: 300 | 500 | 2500 = 500,
): string {
  return `https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_${resolucion}.png`;
}

/**
 * Las 3 opciones gigantes de necesidades fisiológicas básicas de ARASAAC (RF11.2 / SCRUM-87),
 * alineadas con tuagendita-prototipos.html (NEED = { baño, agua, descanso }) y el catálogo ARASAAC:
 * - Baño: ID 6929 ("Quiero ir al baño")
 * - Agua: ID 2248 ("Quiero agua")
 * - Descanso: ID 3299 ("Necesito descansar")
 */
export const OPCIONES_NECESIDADES_BASICAS: readonly OpcionNecesidadArasaac[] = [
  {
    clave: "bano",
    etiqueta: "Quiero ir al baño",
    simbolo: "🚻",
    arasaacId: 6929,
    urlPictograma: construirUrlPictogramaArasaac(6929),
    descripcionAlternativa: "Pictograma ARASAAC de ir al cuarto de baño",
  },
  {
    clave: "agua",
    etiqueta: "Quiero agua",
    simbolo: "💧",
    arasaacId: 2248,
    urlPictograma: construirUrlPictogramaArasaac(2248),
    descripcionAlternativa: "Pictograma ARASAAC de beber un vaso de agua",
  },
  {
    clave: "descanso",
    etiqueta: "Necesito descansar",
    simbolo: "🛋️",
    arasaacId: 3299,
    urlPictograma: construirUrlPictogramaArasaac(3299),
    descripcionAlternativa: "Pictograma ARASAAC de descansar tranquilo",
  },
];

export function obtenerInfoNecesidad(clave: ClaveNecesidad): {
  etiqueta: string;
  simbolo: string;
  arasaacId?: number;
  urlPictograma?: string;
} {
  if (clave === "urgencia") {
    return {
      etiqueta: "Urgencia",
      simbolo: "🆘",
    };
  }
  const encontrada = OPCIONES_NECESIDADES_BASICAS.find((op) => op.clave === clave);
  if (encontrada) {
    return encontrada;
  }
  return OPCIONES_NECESIDADES_BASICAS[0];
}
