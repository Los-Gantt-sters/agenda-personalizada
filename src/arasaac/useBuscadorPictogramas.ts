// Hook de búsqueda de pictogramas para el buscador del formulario de tareas (RF5.5).
import { useEffect, useState } from "react";

import { ClienteArasaac, LONGITUD_MINIMA_TERMINO, clienteArasaac } from "./clienteArasaac";
import { limpiarTermino } from "./texto";
import { ErrorArasaac, PictogramaArasaac } from "./tipos";

export type EstadoBusqueda = "inactivo" | "cargando" | "listo" | "error";

export interface OpcionesBuscador {
  /** Espera tras la última tecla antes de buscar, para no lanzar una petición por letra. */
  retardoMs?: number;
  limite?: number;
  /** Cliente a usar (por defecto, el compartido de la app). */
  cliente?: ClienteArasaac;
}

export interface ResultadoBuscador {
  /** inactivo: texto demasiado corto · cargando · listo (puede ser lista vacía) · error. */
  estado: EstadoBusqueda;
  resultados: PictogramaArasaac[];
  error: ErrorArasaac | null;
}

const INACTIVO: ResultadoBuscador = { estado: "inactivo", resultados: [], error: null };
const CARGANDO: ResultadoBuscador = { estado: "cargando", resultados: [], error: null };

interface RespuestaGuardada {
  /** Texto al que pertenece la respuesta; si el usuario ya escribió otra cosa, se ignora. */
  termino: string;
  resultado: ResultadoBuscador;
}

export function useBuscadorPictogramas(
  termino: string,
  { retardoMs = 400, limite, cliente = clienteArasaac }: OpcionesBuscador = {},
): ResultadoBuscador {
  const [respuesta, setRespuesta] = useState<RespuestaGuardada | null>(null);
  const terminoLimpio = limpiarTermino(termino);
  const buscable = terminoLimpio.length >= LONGITUD_MINIMA_TERMINO;

  useEffect(() => {
    if (!buscable) return;

    const controlador = new AbortController();
    const temporizador = setTimeout(() => {
      cliente
        .buscar(terminoLimpio, { limite, senal: controlador.signal })
        .then((resultados) => {
          if (controlador.signal.aborted) return;
          setRespuesta({
            termino: terminoLimpio,
            resultado: { estado: "listo", resultados, error: null },
          });
        })
        .catch((error: unknown) => {
          if (controlador.signal.aborted) return;
          const errorArasaac =
            error instanceof ErrorArasaac ? error : new ErrorArasaac("sin_conexion");
          setRespuesta({
            termino: terminoLimpio,
            resultado: { estado: "error", resultados: [], error: errorArasaac },
          });
        });
    }, retardoMs);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [terminoLimpio, buscable, retardoMs, limite, cliente]);

  if (!buscable) return INACTIVO;
  // Mientras no llegue la respuesta del texto actual, se muestra «cargando»
  return respuesta?.termino === terminoLimpio ? respuesta.resultado : CARGANDO;
}
