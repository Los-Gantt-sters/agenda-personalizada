// Formas geométricas predeterminadas para el icono de un aula (pantalla 48b · SCRUM-259).
// Los identificadores son los de FormaClase (src/ui/FormaClase.tsx). El administrador también puede
// poner un pictograma de ARASAAC o una imagen propia, que sustituye a la forma (aulas.icono_url).

export interface FormaAula {
  id: string;
  nombre: string;
  /** Emoji de respaldo para FormaClase. */
  simbolo: string;
}

export const FORMAS_AULA: readonly FormaAula[] = [
  { id: "tri", nombre: "Triángulo", simbolo: "🔺" },
  { id: "cir", nombre: "Círculo", simbolo: "🔵" },
  { id: "cua", nombre: "Cuadrado", simbolo: "🟩" },
  { id: "est", nombre: "Estrella", simbolo: "⭐" },
  { id: "rom", nombre: "Rombo", simbolo: "🔷" },
  { id: "hex", nombre: "Hexágono", simbolo: "⬢" },
  { id: "pen", nombre: "Pentágono", simbolo: "⬟" },
  { id: "ova", nombre: "Óvalo", simbolo: "🥚" },
  { id: "oct", nombre: "Octógono", simbolo: "🛑" },
];

/** Valores antiguos del esquema inicial (`icono_forma` valía triangulo, circulo o cuadrado). */
const FORMAS_ANTIGUAS: Record<string, string> = {
  triangulo: "tri",
  circulo: "cir",
  cuadrado: "cua",
};

/** Identificador de forma que entiende FormaClase, también para los valores antiguos. */
export function idFormaAula(valor: string | undefined | null): string {
  if (!valor) return FORMAS_AULA[0].id;
  return FORMAS_ANTIGUAS[valor] ?? valor;
}

export function nombreFormaAula(valor: string | undefined | null): string {
  const id = idFormaAula(valor);
  return FORMAS_AULA.find((f) => f.id === id)?.nombre ?? "Imagen";
}
