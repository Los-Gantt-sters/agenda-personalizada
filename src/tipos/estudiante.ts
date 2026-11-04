export interface Estudiante {
  id: string;
  nombre: string;
  nombreCompleto: string;
  claseId: string;
  icono: string; // Emoji, pictograma o símbolo que representa al estudiante
  color: string;
  fotoUrl?: string; // URL opcional si usa foto real
}

export interface Clase {
  id: string;
  nombre: string;
  simbolo: string;
  color?: string;
}

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
  },
  {
    id: "mir",
    nombre: "Miriam",
    nombreCompleto: "Miriam Lozano Fuentes",
    claseId: "tri",
    icono: "🦋",
    color: "#7A3FA6",
  },
  {
    id: "mar",
    nombre: "Marcos",
    nombreCompleto: "Marcos Benítez Garrido",
    claseId: "tri",
    icono: "🚀",
    color: "#8F6514",
  },
  {
    id: "ser",
    nombre: "Sergio",
    nombreCompleto: "Sergio Gil",
    claseId: "tri",
    icono: "🐢",
    color: "#44546B",
  },
  {
    id: "dan",
    nombre: "Daniel",
    nombreCompleto: "Daniel Romero Soto",
    claseId: "cir",
    icono: "🚗",
    color: "#2F62B8",
  },
  {
    id: "jav",
    nombre: "Javier",
    nombreCompleto: "Javier Morales Rivas",
    claseId: "cir",
    icono: "🎸",
    color: "#237A5C",
  },
  {
    id: "ele",
    nombre: "Elena",
    nombreCompleto: "Elena Valero Ortiz",
    claseId: "cir",
    icono: "🌻",
    color: "#A83268",
  },
  {
    id: "nor",
    nombre: "Nora",
    nombreCompleto: "Nora Ruiz",
    claseId: "cir",
    icono: "🐱",
    color: "#1F6F8B",
  },
  {
    id: "luc",
    nombre: "Lucas",
    nombreCompleto: "Lucas Mora",
    claseId: "cua",
    icono: "🦖",
    color: "#3E6FA3",
  },
];
