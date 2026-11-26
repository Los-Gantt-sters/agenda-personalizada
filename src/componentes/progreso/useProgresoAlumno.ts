// Carga el progreso del alumno para el periodo elegido (pantalla 43, HU-25). Si se cambia de
// periodo antes de que llegue la respuesta anterior, esa respuesta se descarta. Mientras llega la
// nueva se siguen viendo los datos anteriores (con `cargando`), para que la pantalla no parpadee.
import { useCallback, useEffect, useState } from "react";
import type { Periodo } from "./periodos";
import type { ProgresoAlumno, RepositorioProgreso } from "./tipos";

interface Estado {
  /** Petición a la que corresponde lo guardado. */
  clave: string | null;
  datos: ProgresoAlumno | null;
  error: string | null;
}

export function useProgresoAlumno(
  repo: RepositorioProgreso,
  estudianteId: string,
  periodo: Periodo,
) {
  const { desde, hasta } = periodo;
  const [intento, setIntento] = useState(0);
  const clave = `${estudianteId}|${desde}|${hasta}|${intento}`;
  const [estado, setEstado] = useState<Estado>({ clave: null, datos: null, error: null });

  useEffect(() => {
    let vigente = true;
    repo.obtener(estudianteId, desde, hasta).then(
      (datos) => {
        if (vigente) setEstado({ clave, datos, error: null });
      },
      (e: unknown) => {
        if (vigente)
          setEstado({
            clave,
            datos: null,
            error: e instanceof Error ? e.message : "No se ha podido cargar el progreso.",
          });
      },
    );
    return () => {
      vigente = false;
    };
  }, [repo, estudianteId, desde, hasta, clave]);

  /** Vuelve a pedir el mismo periodo (botón «Reintentar»). */
  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  const cargando = estado.clave !== clave;
  return { datos: estado.datos, cargando, error: cargando ? null : estado.error, recargar };
}
