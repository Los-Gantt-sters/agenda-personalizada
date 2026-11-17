// «¿Cómo te has sentido?» al terminar cada tarea (mejora de la profesora). Cinco emociones básicas
// con los pictogramas de caras de ARASAAC, de la misma serie para que se parezcan entre sí.
import type { NombrePictogramaInterfaz } from "../../ui";

export type Emocion = "contento" | "tranquilo" | "cansado" | "triste" | "enfadado";

export const EMOCIONES: readonly {
  clave: Emocion;
  etiqueta: string;
  pictograma: NombrePictogramaInterfaz;
}[] = [
  { clave: "contento", etiqueta: "Contento", pictograma: "contento" },
  { clave: "tranquilo", etiqueta: "Tranquilo", pictograma: "tranquilo" },
  { clave: "cansado", etiqueta: "Cansado", pictograma: "cansado" },
  { clave: "triste", etiqueta: "Triste", pictograma: "triste" },
  { clave: "enfadado", etiqueta: "Enfadado", pictograma: "enfadado" },
];
