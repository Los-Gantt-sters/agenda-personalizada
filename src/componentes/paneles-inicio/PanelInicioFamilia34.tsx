/**
 * Pantalla 34 — Panel de control · Familia
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/34.html`
 * (SCRUM-228 / SCRUM-244 · T-02.5).
 *
 * Características y restricciones clave del boceto definitivo:
 * - Cabecera: «Panel de control · Familia», icono de casa, chip `FG · Familia García` y botón «Salir» (-> 05).
 * - Saludo: «Hola, Familia García · Alumno vinculado: Alejandro».
 * - Exactamente 5 tarjetas en cuadrícula de 2 columnas:
 *   1. «Agenda de Alejandro» (-> 40): destacada en color primario.
 *   2. «Progreso e historial» (-> 43).
 *   3. «Biblioteca de tareas» (-> 31).
 *   4. «Mi biblioteca de pictogramas» (-> 51).
 *   5. «Preferencias» (-> 16).
 * - SIN tarjeta «Ficha de Alejandro» (antigua pantalla 38 eliminada).
 */

import React from "react";
import { PanelAdulto, type AccesoPanel } from "../../pantalla/PanelAdulto";

export type DestinoPanelFamilia34 = "40" | "43" | "31" | "51" | "16";

export interface PanelInicioFamilia34Props {
  /** Nombre de la familia mostrado en cabecera y saludo (`"Familia García"` por defecto). */
  nombreFamilia?: string;
  /** Iniciales del avatar en cabecera (`"FG"` por defecto). */
  inicialesFamilia?: string;
  /** Nombre del alumno vinculado (`"Alejandro"` por defecto, como en 34.html). */
  nombreAlumnoVinculado?: string;
  /** Se invoca al pulsar cualquiera de las 5 tarjetas con su pantalla destino (`"40"`, `"43"`, `"31"`, `"51"`, `"16"`). */
  alNavegar?: (destino: DestinoPanelFamilia34) => void;
  /** Acción al pulsar «Salir» (-> Pantalla 05 `/login`). */
  alCerrarSesion: () => void;
}

/**
 * Renderiza la Pantalla 34 (Panel de control · Familia) con 5 tarjetas y sin la antigua Ficha 38.
 * @param props Propiedades del panel de inicio de la familia
 * @returns Componente de pantalla 34
 */
export function PanelInicioFamilia34({
  nombreFamilia = "Familia García",
  inicialesFamilia = "FG",
  nombreAlumnoVinculado = "Alejandro",
  alNavegar,
  alCerrarSesion,
}: PanelInicioFamilia34Props) {
  const accesos: AccesoPanel[] = [
    {
      id: "agenda-alumno",
      testID: "tarjeta-familia-34-agenda",
      icono: "calendario",
      titulo: `Agenda de ${nombreAlumnoVinculado}`,
      descripcion: `Agenda diaria y semanal de ${nombreAlumnoVinculado}.`,
      etiquetaAccesible: `Agenda de ${nombreAlumnoVinculado}: agenda diaria y semanal`,
      alPulsar: () => alNavegar?.("40"),
    },
    {
      id: "progreso-historial",
      testID: "tarjeta-familia-34-progreso",
      icono: "estrella",
      titulo: "Progreso e historial",
      descripcion: "Resumen por días, semanas y meses.",
      etiquetaAccesible: "Progreso e historial: resumen por días, semanas y meses",
      alPulsar: () => alNavegar?.("43"),
    },
    {
      id: "biblioteca-tareas",
      testID: "tarjeta-familia-34-biblioteca-tareas",
      icono: "lista",
      titulo: "Biblioteca de tareas",
      descripcion:
        "Consulta las tareas que has creado, edítalas o asígnalas en horario de tarde/casa.",
      etiquetaAccesible:
        "Biblioteca de tareas: consulta las tareas que has creado, edítalas o asígnalas en horario de tarde y casa",
      alPulsar: () => alNavegar?.("31"),
    },
    {
      id: "biblioteca-pictogramas",
      testID: "tarjeta-familia-34-biblioteca-pictogramas",
      icono: "imagen",
      titulo: "Mi biblioteca de pictogramas",
      descripcion: "Sube tus propios pictogramas de casa pulsando «+».",
      etiquetaAccesible:
        "Mi biblioteca de pictogramas: sube tus propios pictogramas de casa pulsando más",
      alPulsar: () => alNavegar?.("51"),
    },
    {
      id: "preferencias",
      testID: "tarjeta-familia-34-preferencias",
      icono: "paleta",
      titulo: "Preferencias",
      descripcion: "Colores, tipografía, botones, agenda y hasta 3 ayudas.",
      etiquetaAccesible: "Preferencias: colores, tipografía, botones, agenda y hasta 3 ayudas",
      alPulsar: () => alNavegar?.("16"),
    },
  ];

  return (
    <PanelAdulto
      testID="pantalla-34-panel-familia"
      titulo="Panel de control · Familia"
      iconoCabecera="casa"
      nombreUsuario={nombreFamilia}
      inicialesUsuario={inicialesFamilia}
      saludo={`Hola, ${nombreFamilia} · Alumno vinculado: ${nombreAlumnoVinculado}`}
      accesos={accesos}
      alCerrarSesion={alCerrarSesion}
      etiquetaCerrarSesion="Salir y cerrar sesión"
      textoCerrarSesion="Salir"
    />
  );
}
