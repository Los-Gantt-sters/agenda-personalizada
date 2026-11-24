/**
 * Catálogo y datos base de las Pantallas 31 (Biblioteca de tareas),
 * 28 (Editor de datos generales) y 28p (Buscador unificado ARASAAC + Mi biblioteca)
 * según los bocetos definitivos de `BOCETOS_NUEVOS/definitiva_v2/pantallas/`
 * (SCRUM-89 / SCRUM-90 · HU-07).
 */

import { urlImagenPictograma } from "../../arasaac/urls";

export type RolBibliotecaAdulto = "tutor" | "familia";
export type FiltroBiblioteca31 = "all" | "mine";
export type FuentePictograma28p = "all" | "arasaac" | "mio";

export interface PasoTareaEditor28 {
  numero: number;
  titulo: string;
  pictogramaId: number;
  pictogramaUrl: string;
  formatosResumen: string;
}

export interface TareaBiblioteca31 {
  id: string;
  owner: RolBibliotecaAdulto;
  mine: boolean;
  titulo: string;
  descripcion: string;
  pictogramaId: number;
  pictogramaUrl: string;
  pasosCount: number;
  subtitulo: string;
  pasos?: PasoTareaEditor28[];
}

export interface PictogramaBuscador28p {
  id: string;
  titulo: string;
  fuente: "arasaac" | "mio";
  etiquetaFuente: "ARASAAC" | "Mi biblioteca";
  pictogramaId: number;
  pictogramaUrl: string;
}

export const PASOS_EDITOR_28_DEMO: PasoTareaEditor28[] = [
  {
    numero: 1,
    titulo: "Paso 1: Abrir el grifo",
    pictogramaId: 11737,
    pictogramaUrl: urlImagenPictograma(11737),
    formatosResumen: "Pictograma · Texto · Audio",
  },
  {
    numero: 2,
    titulo: "Paso 2: Echar jabón en las manos",
    pictogramaId: 2433,
    pictogramaUrl: urlImagenPictograma(2433),
    formatosResumen: "Pictograma · Texto · Foto",
  },
  {
    numero: 3,
    titulo: "Paso 3: Frotar las manos",
    pictogramaId: 8988,
    pictogramaUrl: urlImagenPictograma(8988),
    formatosResumen: "Pictograma · Texto · Vídeo · Audio",
  },
  {
    numero: 4,
    titulo: "Paso 4: Aclarar con agua",
    pictogramaId: 2248,
    pictogramaUrl: urlImagenPictograma(2248),
    formatosResumen: "Pictograma · Texto · Audio",
  },
  {
    numero: 5,
    titulo: "Paso 5: Secarse con la toalla",
    pictogramaId: 2583,
    pictogramaUrl: urlImagenPictograma(2583),
    formatosResumen: "Pictograma · Texto · Foto",
  },
];

export const CATALOGO_BIBLIOTECA_31: TareaBiblioteca31[] = [
  // Tareas del perfil Tutor (aisladas del perfil Familia)
  {
    id: "t1",
    owner: "tutor",
    mine: true,
    titulo: "Lavarse las manos",
    descripcion: "Tarea de higiene antes del recreo y del comedor con pictogramas y audio.",
    pictogramaId: 2443,
    pictogramaUrl: urlImagenPictograma(2443),
    pasosCount: 5,
    subtitulo: "Creada por mí · 5 pasos",
    pasos: PASOS_EDITOR_28_DEMO,
  },
  {
    id: "t2",
    owner: "tutor",
    mine: true,
    titulo: "Toallitas húmedas en aula",
    descripcion: "Alternativa rápida de higiene en el aula cuando no hay agua disponible.",
    pictogramaId: 35743,
    pictogramaUrl: urlImagenPictograma(35743),
    pasosCount: 3,
    subtitulo: "Creada por mí · Plan B sin agua",
  },
  {
    id: "t3",
    owner: "tutor",
    mine: true,
    titulo: "Asamblea matinal",
    descripcion: "Rutina de bienvenida, pasar lista y revisar la agenda visual del día.",
    pictogramaId: 6980,
    pictogramaUrl: urlImagenPictograma(6980),
    pasosCount: 4,
    subtitulo: "Creada por mí · 4 pasos",
  },
  {
    id: "t4",
    owner: "tutor",
    mine: true,
    titulo: "Encargo de reprografía",
    descripcion: "Recoger fotocopias en conserjería y entregarlas en el aula correspondiente.",
    pictogramaId: 31807,
    pictogramaUrl: urlImagenPictograma(31807),
    pasosCount: 5,
    subtitulo: "Creada por mí · 5 pasos",
  },
  {
    id: "t5",
    owner: "tutor",
    mine: false,
    titulo: "Comedor: Recuento comensales",
    descripcion: "Anotar cuántos alumnos comen en el comedor por cada menú del colegio.",
    pictogramaId: 6456,
    pictogramaUrl: urlImagenPictograma(6456),
    pasosCount: 4,
    subtitulo: "Biblioteca del centro · 4 pasos",
  },
  {
    id: "t6",
    owner: "tutor",
    mine: false,
    titulo: "Repartir menú mensual",
    descripcion: "Entregar las hojas del menú mensual en cada bandeja del aula.",
    pictogramaId: 2462,
    pictogramaUrl: urlImagenPictograma(2462),
    pasosCount: 3,
    subtitulo: "Biblioteca del centro · 3 pasos",
  },

  // Tareas del perfil Familia (aisladas del perfil Tutor)
  {
    id: "f1",
    owner: "familia",
    mine: true,
    titulo: "Preparar la mochila",
    descripcion: "Guardar el estuche, la agenda escolar y la botella de agua para mañana.",
    pictogramaId: 2475,
    pictogramaUrl: urlImagenPictograma(2475),
    pasosCount: 4,
    subtitulo: "Creada por mí · 4 pasos",
  },
  {
    id: "f2",
    owner: "familia",
    mine: true,
    titulo: "Recoger la habitación",
    descripcion: "Guardar juguetes en su caja y colocar la ropa usada en el cesto.",
    pictogramaId: 6964,
    pictogramaUrl: urlImagenPictograma(6964),
    pasosCount: 3,
    subtitulo: "Creada por mí · 3 pasos",
  },
  {
    id: "f3",
    owner: "familia",
    mine: true,
    titulo: "Lavarse los dientes",
    descripcion: "Cepillarse los dientes después de cenar con pasta e hilo dental.",
    pictogramaId: 2326,
    pictogramaUrl: urlImagenPictograma(2326),
    pasosCount: 4,
    subtitulo: "Creada por mí · 4 pasos",
  },
  {
    id: "f4",
    owner: "familia",
    mine: false,
    titulo: "Lavarse las manos",
    descripcion: "Lavarse las manos con agua y jabón al llegar a casa y antes de cenar.",
    pictogramaId: 2443,
    pictogramaUrl: urlImagenPictograma(2443),
    pasosCount: 5,
    subtitulo: "Tarea compartida · 5 pasos",
  },
  {
    id: "f5",
    owner: "familia",
    mine: true,
    titulo: "Cuento antes de dormir",
    descripcion: "Elegir un cuento corto en la estantería y leerlo en la cama.",
    pictogramaId: 2450,
    pictogramaUrl: urlImagenPictograma(2450),
    pasosCount: 2,
    subtitulo: "Creada por mí · 2 pasos",
  },
  {
    id: "f6",
    owner: "familia",
    mine: false,
    titulo: "Poner la mesa en casa",
    descripcion: "Colocar mantel, platos, vasos y servilletas para la cena familiar.",
    pictogramaId: 2503,
    pictogramaUrl: urlImagenPictograma(2503),
    pasosCount: 4,
    subtitulo: "Tarea general hogar · 4 pasos",
  },
];

export const PICTOGRAMAS_BUSCADOR_28P: PictogramaBuscador28p[] = [
  {
    id: "p-arasaac-agua",
    titulo: "Agua / Aclarar",
    fuente: "arasaac",
    etiquetaFuente: "ARASAAC",
    pictogramaId: 2248,
    pictogramaUrl: urlImagenPictograma(2248),
  },
  {
    id: "p-arasaac-lavar",
    titulo: "Lavarse las manos",
    fuente: "arasaac",
    etiquetaFuente: "ARASAAC",
    pictogramaId: 2443,
    pictogramaUrl: urlImagenPictograma(2443),
  },
  {
    id: "p-arasaac-grifo",
    titulo: "Grifo",
    fuente: "arasaac",
    etiquetaFuente: "ARASAAC",
    pictogramaId: 11737,
    pictogramaUrl: urlImagenPictograma(11737),
  },
  {
    id: "p-arasaac-jabon",
    titulo: "Jabón",
    fuente: "arasaac",
    etiquetaFuente: "ARASAAC",
    pictogramaId: 2433,
    pictogramaUrl: urlImagenPictograma(2433),
  },
  {
    id: "p-arasaac-frotar",
    titulo: "Frotar las manos",
    fuente: "arasaac",
    etiquetaFuente: "ARASAAC",
    pictogramaId: 8988,
    pictogramaUrl: urlImagenPictograma(8988),
  },
  {
    id: "p-mio-dispensador",
    titulo: "Dispensador del aula",
    fuente: "mio",
    etiquetaFuente: "Mi biblioteca",
    pictogramaId: 2433,
    pictogramaUrl: urlImagenPictograma(2433),
  },
  {
    id: "p-mio-toallitas",
    titulo: "Toallitas húmedas",
    fuente: "mio",
    etiquetaFuente: "Mi biblioteca",
    pictogramaId: 35743,
    pictogramaUrl: urlImagenPictograma(35743),
  },
  {
    id: "p-mio-papel",
    titulo: "Papel secamanos",
    fuente: "mio",
    etiquetaFuente: "Mi biblioteca",
    pictogramaId: 2583,
    pictogramaUrl: urlImagenPictograma(2583),
  },
];

/**
 * Filtra las tareas de la Biblioteca (Pantalla 31) aislando estrictamente por rol activo,
 * filtro («Todas las tareas» vs «Creadas por mí») y texto de búsqueda.
 * @param tareas Catálogo completo de tareas
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @param filtro Filtro activo (`"all"` o `"mine"`)
 * @param busqueda Texto buscado por título o subtítulo
 * @returns Lista de tareas visibles para el rol activo
 */
export function filtrarTareasBiblioteca31(
  tareas: TareaBiblioteca31[],
  rol: RolBibliotecaAdulto,
  filtro: FiltroBiblioteca31 = "all",
  busqueda: string = "",
): TareaBiblioteca31[] {
  const termino = busqueda.trim().toLowerCase();
  return tareas.filter((t) => {
    if (t.owner !== rol) return false;
    if (filtro === "mine" && !t.mine) return false;
    if (termino.length > 0) {
      const coincideTitulo = t.titulo.toLowerCase().includes(termino);
      const coincideSubtitulo = t.subtitulo.toLowerCase().includes(termino);
      return coincideTitulo || coincideSubtitulo;
    }
    return true;
  });
}
