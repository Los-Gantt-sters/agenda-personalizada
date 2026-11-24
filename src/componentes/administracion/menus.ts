// Tipos de menú y alérgenos de las pantallas 46 y 46b (SCRUM-260). Los identificadores se guardan
// en la base de datos (alumnos.dieta_comedor y alumnos.alergias); los nombres son lo que se lee.
import type { DietaComedor } from "../../tipos/alumnos";

export const TIPOS_MENU: readonly { id: DietaComedor; nombre: string }[] = [
  { id: "normal", nombre: "Normal" },
  { id: "turmix", nombre: "Triturado líquido (túrmix)" },
  { id: "texturizada", nombre: "Triturado con textura" },
  { id: "sin_gluten", nombre: "Sin gluten" },
  { id: "sin_lactosa", nombre: "Sin lactosa" },
  { id: "cetogenica", nombre: "Cetogénica" },
  { id: "especial", nombre: "Especial" },
];

export const IDS_TIPOS_MENU: readonly string[] = TIPOS_MENU.map((t) => t.id);

export function nombreTipoMenu(id: string | undefined | null): string {
  return TIPOS_MENU.find((t) => t.id === id)?.nombre ?? "Normal";
}

/** Alérgenos más habituales; cualquier otra alergia se escribe a mano y se guarda como texto. */
export const ALERGENOS_FIJOS: readonly { id: string; nombre: string }[] = [
  { id: "frutos_secos", nombre: "Frutos secos" },
  { id: "cacahuete", nombre: "Cacahuete" },
  { id: "huevo", nombre: "Huevo" },
  { id: "leche", nombre: "Leche" },
  { id: "pescado", nombre: "Pescado" },
  { id: "marisco", nombre: "Marisco" },
  { id: "gluten", nombre: "Gluten" },
  { id: "soja", nombre: "Soja" },
  { id: "sesamo", nombre: "Sésamo" },
  { id: "mostaza", nombre: "Mostaza" },
];

export const IDS_ALERGENOS_FIJOS: readonly string[] = ALERGENOS_FIJOS.map((a) => a.id);

/** Nombre legible de una alergia: el de la lista fija o, si es texto libre, el propio texto. */
export function nombreAlergia(valor: string): string {
  return ALERGENOS_FIJOS.find((a) => a.id === valor)?.nombre ?? valor;
}
