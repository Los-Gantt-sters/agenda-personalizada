export interface Estudiante {
  id: string;
  nombre: string;
  nombreCompleto: string;
  claseId: string;
  icono: string; // Emoji, pictograma o símbolo que representa al estudiante
  color: string;
  fotoUrl?: string; // URL opcional si usa foto real
  /** Secuencia de 3 dibujos asignada para demostración / pruebas locales. */
  secuenciaDibujosDemo?: [string, string, string];
}

export interface Clase {
  id: string;
  nombre: string;
  simbolo: string;
  color?: string;
}

export interface DibujoCredencialVisual {
  slug: string;
  icono: string;
  etiqueta: string;
}

export const LONGITUD_SECUENCIA_DIBUJOS = 3;

/**
 * Catálogo de 9 dibujos táctiles de la credencial visual del estudiante
 * (alineado con docs/prototipo/03-estudiante-contrasena.html y SCRUM-50 / SCRUM-51).
 */
export const DIBUJOS_CREDENCIAL_VISUAL: DibujoCredencialVisual[] = [
  { slug: "manzana", icono: "🍎", etiqueta: "Manzana" },
  { slug: "perro", icono: "🐶", etiqueta: "Perro" },
  { slug: "estrella", icono: "⭐", etiqueta: "Estrella" },
  { slug: "sol", icono: "🌞", etiqueta: "Sol" },
  { slug: "coche", icono: "🚗", etiqueta: "Coche" },
  { slug: "casa", icono: "🏠", etiqueta: "Casa" },
  { slug: "arcoiris", icono: "🌈", etiqueta: "Arcoíris" },
  { slug: "gato", icono: "🐱", etiqueta: "Gato" },
  { slug: "pelota", icono: "⚽", etiqueta: "Pelota" },
];

export const CLASES: Record<string, Clase> = {
  tri: { id: "tri", nombre: "Triángulo", simbolo: "🔺" },
  cir: { id: "cir", nombre: "Círculo", simbolo: "🔵" },
  cua: { id: "cua", nombre: "Cuadrado", simbolo: "🟩" },
};

export const ESTUDIANTES_MOCK: Estudiante[] = [
  {
    id: "ale",
    nombre: "Alejandro",
    nombreCompleto: "Alejandro Castillo Vega",
    claseId: "tri",
    icono: "🦁",
    color: "#B8492F",
    secuenciaDibujosDemo: ["manzana", "perro", "estrella"],
  },
  {
    id: "mir",
    nombre: "Miriam",
    nombreCompleto: "Miriam Lozano Fuentes",
    claseId: "tri",
    icono: "🦋",
    color: "#7A3FA6",
    secuenciaDibujosDemo: ["sol", "casa", "arcoiris"],
  },
  {
    id: "mar",
    nombre: "Marcos",
    nombreCompleto: "Marcos Benítez Garrido",
    claseId: "tri",
    icono: "🚀",
    color: "#8F6514",
    secuenciaDibujosDemo: ["manzana", "perro", "estrella"],
  },
  {
    id: "ser",
    nombre: "Sergio",
    nombreCompleto: "Sergio Gil",
    claseId: "tri",
    icono: "🐢",
    color: "#44546B",
    secuenciaDibujosDemo: ["coche", "estrella", "pelota"],
  },
  {
    id: "dan",
    nombre: "Daniel",
    nombreCompleto: "Daniel Romero Soto",
    claseId: "cir",
    icono: "🚗",
    color: "#2F62B8",
    secuenciaDibujosDemo: ["coche", "sol", "perro"],
  },
  {
    id: "jav",
    nombre: "Javier",
    nombreCompleto: "Javier Morales Rivas",
    claseId: "cir",
    icono: "🎸",
    color: "#237A5C",
    secuenciaDibujosDemo: ["estrella", "gato", "pelota"],
  },
  {
    id: "ele",
    nombre: "Elena",
    nombreCompleto: "Elena Valero Ortiz",
    claseId: "cir",
    icono: "🌻",
    color: "#A83268",
    secuenciaDibujosDemo: ["sol", "arcoiris", "manzana"],
  },
  {
    id: "nor",
    nombre: "Nora",
    nombreCompleto: "Nora Ruiz",
    claseId: "cir",
    icono: "🐱",
    color: "#1F6F8B",
    secuenciaDibujosDemo: ["gato", "casa", "sol"],
  },
  {
    id: "luc",
    nombre: "Lucas",
    nombreCompleto: "Lucas Mora",
    claseId: "cua",
    icono: "🦖",
    color: "#3E6FA3",
    secuenciaDibujosDemo: ["pelota", "coche", "estrella"],
  },
];
