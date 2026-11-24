/**
 * Modelo de datos y tareas de demostración para las pantallas de Tutor y Familia
 * (SCRUM-234 · Pantallas 39, 40, 41, 42 y 42b).
 */

import { urlImagenPictograma } from "../../arasaac/urls";

export type FormatoMultimediaPaso = "pictograma" | "texto" | "foto" | "video" | "audio";

export interface PasoTareaAdulto {
  orden: number;
  texto: string;
  pictogramaId: number;
  pictogramaUrl: string;
  descripcionFoto: string;
  descripcionVideo: string;
}

export interface TareaAgendaAdulto {
  id: string;
  titulo: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  ambito: "escolar" | "hogar";
  estado: "hecha" | "auto_pendiente" | "ahora" | "despues";
  pictogramaId: number;
  pictogramaUrl: string;
  pasos: PasoTareaAdulto[];
}

export const FORMATOS_MULTIMEDIA: {
  clave: FormatoMultimediaPaso;
  etiqueta: string;
  pictogramaId: number;
}[] = [
  { clave: "pictograma", etiqueta: "Pictograma", pictogramaId: 31907 },
  { clave: "texto", etiqueta: "Texto", pictogramaId: 24508 },
  { clave: "foto", etiqueta: "Foto", pictogramaId: 6961 },
  { clave: "video", etiqueta: "Vídeo", pictogramaId: 6247 },
  { clave: "audio", etiqueta: "Audio", pictogramaId: 5993 },
];

export const PASOS_LAVARSE_MANOS: PasoTareaAdulto[] = [
  {
    orden: 1,
    texto: "Abre el grifo con cuidado.",
    pictogramaId: 2414,
    pictogramaUrl: urlImagenPictograma(2414, 500),
    descripcionFoto: "Fotografía real del lavabo del aula con el grifo abierto.",
    descripcionVideo: "Vídeo demostrativo (10 s): abrir el grifo despacio.",
  },
  {
    orden: 2,
    texto: "Pon jabón en las manos.",
    pictogramaId: 2964,
    pictogramaUrl: urlImagenPictograma(2964, 500),
    descripcionFoto: "Fotografía real del dosificador de jabón del colegio.",
    descripcionVideo: "Vídeo demostrativo (12 s): pulsar el jabón una vez.",
  },
  {
    orden: 3,
    texto: "Frota las manos hasta hacer espuma.",
    pictogramaId: 8251,
    pictogramaUrl: urlImagenPictograma(8251, 500),
    descripcionFoto: "Fotografía real frotando palmas y dorso de las manos.",
    descripcionVideo: "Vídeo demostrativo (15 s): frotar las manos con espuma.",
  },
  {
    orden: 4,
    texto: "Aclara con agua y seca las manos con la toalla.",
    pictogramaId: 2566,
    pictogramaUrl: urlImagenPictograma(2566, 500),
    descripcionFoto: "Fotografía real secando las manos con la toalla del aula.",
    descripcionVideo: "Vídeo demostrativo (12 s): aclarar y secar las manos.",
  },
];

export const PASOS_PREPARAR_MOCHILA: PasoTareaAdulto[] = [
  {
    orden: 1,
    texto: "Abre la mochila encima de la mesa de tu habitación.",
    pictogramaId: 2475,
    pictogramaUrl: urlImagenPictograma(2475, 500),
    descripcionFoto: "Fotografía real de la mochila abierta en casa.",
    descripcionVideo: "Vídeo doméstico: colocar la mochila sobre la mesa.",
  },
  {
    orden: 2,
    texto: "Guarda el cuaderno y el estuche para mañana.",
    pictogramaId: 24508,
    pictogramaUrl: urlImagenPictograma(24508, 500),
    descripcionFoto: "Fotografía real del cuaderno y el estuche de Lucas.",
    descripcionVideo: "Vídeo doméstico: meter el cuaderno y el estuche.",
  },
  {
    orden: 3,
    texto: "Mete la botella de agua en el bolsillo lateral.",
    pictogramaId: 2248,
    pictogramaUrl: urlImagenPictograma(2248, 500),
    descripcionFoto: "Fotografía real de la botella reutilizable de Lucas.",
    descripcionVideo: "Vídeo doméstico: colocar la botella en el bolsillo.",
  },
  {
    orden: 4,
    texto: "Cierra la cremallera y deja la mochila junto a la puerta.",
    pictogramaId: 2475,
    pictogramaUrl: urlImagenPictograma(2475, 500),
    descripcionFoto: "Fotografía real de la mochila cerrada junto a la entrada.",
    descripcionVideo: "Vídeo doméstico: cerrar la cremallera y dejarla lista.",
  },
];

export const TAREA_ESCOLAR_LAVARSE_MANOS: TareaAgendaAdulto = {
  id: "t-lavarse-manos",
  titulo: "Lavarse las manos",
  horaInicio: "09:30",
  horaFin: "10:15",
  duracionMinutos: 45,
  ambito: "escolar",
  estado: "ahora",
  pictogramaId: 8975,
  pictogramaUrl: urlImagenPictograma(8975, 500),
  pasos: PASOS_LAVARSE_MANOS,
};

export const TAREA_HOGAR_PREPARAR_MOCHILA: TareaAgendaAdulto = {
  id: "t-preparar-mochila",
  titulo: "Preparar la mochila",
  horaInicio: "18:00",
  horaFin: "18:30",
  duracionMinutos: 30,
  ambito: "hogar",
  estado: "ahora",
  pictogramaId: 2475,
  pictogramaUrl: urlImagenPictograma(2475, 500),
  pasos: PASOS_PREPARAR_MOCHILA,
};

export const AGENDA_ADULTO_DEMO: {
  hecho: TareaAgendaAdulto[];
  ahora: TareaAgendaAdulto;
  despues: TareaAgendaAdulto[];
  restantesDespues: number;
} = {
  hecho: [
    {
      id: "t-asamblea",
      titulo: "Asamblea",
      horaInicio: "09:00",
      horaFin: "09:15",
      duracionMinutos: 15,
      ambito: "escolar",
      estado: "hecha",
      pictogramaId: 27574,
      pictogramaUrl: urlImagenPictograma(27574, 500),
      pasos: [],
    },
    {
      id: "t-rincon-lectura",
      titulo: "Rincón de lectura",
      horaInicio: "09:15",
      horaFin: "09:30",
      duracionMinutos: 15,
      ambito: "escolar",
      estado: "auto_pendiente",
      pictogramaId: 7141,
      pictogramaUrl: urlImagenPictograma(7141, 500),
      pasos: [],
    },
  ],
  ahora: TAREA_ESCOLAR_LAVARSE_MANOS,
  despues: [
    {
      id: "t-desayuno",
      titulo: "Desayuno",
      horaInicio: "10:15",
      horaFin: "10:45",
      duracionMinutos: 30,
      ambito: "escolar",
      estado: "despues",
      pictogramaId: 4625,
      pictogramaUrl: urlImagenPictograma(4625, 500),
      pasos: [],
    },
    {
      id: "t-reprografia",
      titulo: "Reprografía",
      horaInicio: "10:45",
      horaFin: "11:30",
      duracionMinutos: 45,
      ambito: "escolar",
      estado: "despues",
      pictogramaId: 3092,
      pictogramaUrl: urlImagenPictograma(3092, 500),
      pasos: [],
    },
    {
      id: "t-recreo",
      titulo: "Recreo",
      horaInicio: "11:30",
      horaFin: "12:00",
      duracionMinutos: 30,
      ambito: "escolar",
      estado: "despues",
      pictogramaId: 7137,
      pictogramaUrl: urlImagenPictograma(7137, 500),
      pasos: [],
    },
  ],
  restantesDespues: 1,
};
