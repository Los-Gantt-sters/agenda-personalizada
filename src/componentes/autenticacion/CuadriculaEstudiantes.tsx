// Alumnos de una clase (pantallas 02 y 02b, HU-01). Desde la MOD HU-01 (SCRUM-247) no hay scroll:
// 9 alumnos por página y «Más alumnos» para ver los siguientes (CuadriculaPaginada).
import React from "react";

import { Estudiante } from "../../tipos/estudiante";
import { CuadriculaPaginada } from "./CuadriculaPaginada";
import { TarjetaEstudiante } from "./TarjetaEstudiante";

export interface CuadriculaEstudiantesProps {
  estudiantes: Estudiante[];
  alSeleccionarEstudiante: (estudiante: Estudiante) => void;
  estudianteSeleccionadoId?: string;
  /** Alto mínimo de cada tarjeta; nunca baja de 120 px (RNF1.1). */
  tamanioMinimoTarjeta?: number;
  /** Avisa de la página que se enseña (0 = la primera), para poner «Página 2». */
  alCambiarPagina?: (pagina: number) => void;
}

export const CuadriculaEstudiantes: React.FC<CuadriculaEstudiantesProps> = ({
  estudiantes,
  alSeleccionarEstudiante,
  estudianteSeleccionadoId,
  tamanioMinimoTarjeta = 120,
  alCambiarPagina,
}) => (
  <CuadriculaPaginada
    elementos={estudiantes}
    clave={(estudiante) => estudiante.id}
    queHayMas="alumnos"
    alCambiarPagina={alCambiarPagina}
    testID="cuadricula-estudiantes"
    pintar={(estudiante) => (
      <TarjetaEstudiante
        estudiante={estudiante}
        alSeleccionar={alSeleccionarEstudiante}
        seleccionado={estudiante.id === estudianteSeleccionadoId}
        tamanioMinimo={tamanioMinimoTarjeta}
      />
    )}
  />
);
