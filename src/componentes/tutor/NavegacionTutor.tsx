/**
 * Flujo integrado de navegación del Tutor por las Pantallas 35 -> 36 -> 37 (SCRUM-233).
 * Conecta:
 *   - Pantalla 35 (`SelectorAulasTutor`): 9 clases sin paginación
 *   - Pantalla 36 (`BuscadorAlumnosAula`): buscador de alumnos por nombre en el aula elegida
 *   - Pantalla 37 (`FichaAlumnoTutor`): ficha limpia sin etiquetas RGPD y enlaces a 39, 43, 16, 26d y 47b
 *   - Pantalla 47b (`PantallaPlanB`): Plan B del alumno, con los datos de ejemplo de este flujo
 */

import React, { useState } from "react";
import { PantallaEjecucionRestringida07e, PantallaPermisosAlumno26d } from "../permisos-alumno";
import { BuscadorAlumnosAula } from "./BuscadorAlumnosAula";
import { FichaAlumnoTutor, type DestinoFichaTutor } from "./FichaAlumnoTutor";
import { SelectorAulasTutor } from "./SelectorAulasTutor";
import { hoyISO } from "../agenda/useAgendaDia";
import { crearRepositorioPlanBDemo, PantallaPlanB } from "../plan-b";
import { TODOS_ESTUDIANTES_TUTOR } from "./datosAulasTutor";

export type PasoNavegacionTutor = "35" | "36" | "37" | "26d" | "07e" | "47b";

export interface NavegacionTutorProps {
  /** Pantalla inicial del flujo (`35` por defecto). */
  pasoInicial?: PasoNavegacionTutor;
  /** Aula seleccionada inicialmente (`cua` por defecto). */
  aulaInicialId?: string;
  /** Alumno seleccionado inicialmente (`luc` por defecto). */
  alumnoInicialId?: string;
  /** Nombre del tutor autenticado. */
  nombreTutor?: string;
  /** Se invoca al pulsar uno de los 5 destinos de la ficha (`39`, `43`, `16`, `26d`, `47b`). */
  alAbrirDestinoFicha?: (destino: DestinoFichaTutor, alumnoId: string) => void;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

/**
 * Orquesta la navegación completa del Tutor entre las pantallas 35, 36 y 37.
 * @param props Configuración inicial y callbacks de navegación externa
 * @returns Pantalla activa del flujo del tutor
 */
export function NavegacionTutor({
  pasoInicial = "35",
  aulaInicialId = "cua",
  alumnoInicialId = "luc",
  nombreTutor = "María Carmen",
  alAbrirDestinoFicha,
  alCerrarSesion,
}: NavegacionTutorProps) {
  const [paso, setPaso] = useState<PasoNavegacionTutor>(pasoInicial);
  const [aulaId, setAulaId] = useState<string>(aulaInicialId);
  const [alumnoId, setAlumnoId] = useState<string>(alumnoInicialId);
  const [repoPlanB] = useState(() => crearRepositorioPlanBDemo());

  if (paso === "35") {
    return (
      <SelectorAulasTutor
        nombreTutor={nombreTutor}
        alElegirAula={(id) => {
          setAulaId(id);
          setPaso("36");
        }}
        alAdelante={() => setPaso("36")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (paso === "36") {
    return (
      <BuscadorAlumnosAula
        aulaId={aulaId}
        nombreTutor={nombreTutor}
        alElegirAlumno={(id) => {
          setAlumnoId(id);
          setPaso("37");
        }}
        alAtras={() => setPaso("35")}
        alAdelante={() => setPaso("37")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (paso === "26d") {
    return (
      <PantallaPermisosAlumno26d
        alumnoId={alumnoId}
        nombreTutor={nombreTutor}
        alAbrirVistaPrevia07e={() => setPaso("07e")}
        alGuardar={() => setPaso("37")}
        alAtras={() => setPaso("37")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (paso === "47b") {
    return (
      <PantallaPlanB
        repo={repoPlanB}
        estudianteIds={[alumnoId]}
        fecha={hoyISO()}
        nombreAlumno={TODOS_ESTUDIANTES_TUTOR.find((a) => a.id === alumnoId)?.nombre ?? "alumno"}
        nombreTutor={nombreTutor}
        alAtras={() => setPaso("37")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (paso === "07e") {
    return (
      <PantallaEjecucionRestringida07e
        alAtras={() => setPaso("26d")}
        alTerminarTarea={() => setPaso("26d")}
      />
    );
  }

  return (
    <FichaAlumnoTutor
      alumnoId={alumnoId}
      nombreTutor={nombreTutor}
      alNavegarDestino={(destino, id) => {
        if (alAbrirDestinoFicha) {
          alAbrirDestinoFicha(destino, id);
          return;
        }
        if (destino === "26d" || destino === "47b") {
          setAlumnoId(id);
          setPaso(destino);
        }
      }}
      alAtras={() => setPaso("36")}
      alCerrarSesion={alCerrarSesion}
    />
  );
}
