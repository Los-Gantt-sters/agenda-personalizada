/**
 * Aulas y alumnos de la pantalla de acceso del alumno (MOD HU-01 · SCRUM-249 · T-01.7).
 * Esa pantalla se ve antes de iniciar sesión, así que no lee las tablas (RLS solo deja a usuarios
 * con sesión): llama a dos funciones de la base de datos que devuelven lo justo para las tarjetas
 * (supabase/migrations/20261127000000_acceso_alumnos_sin_sesion.sql).
 * - Pantallas 01/01b: las aulas que configura el administrador en la 48b, en su orden.
 * - Pantallas 02/02b: nombre de pila, icono y color de los alumnos activos del aula (sin foto).
 *
 * Tres resultados posibles:
 * - "sin-supabase": la app no tiene proyecto de Supabase (pruebas, demos): la pantalla usa sus
 *   datos de prueba.
 * - "error": no se ha podido leer (sin red, migración sin aplicar...): la pantalla avisa y deja
 *   volver a probar; nunca enseña datos de prueba en su lugar.
 * - "ok": los datos.
 */
import { supabase, supabaseConfigurado } from "../lib/supabaseClient";

export type ResultadoAcceso<T> =
  { estado: "sin-supabase" } | { estado: "error" } | { estado: "ok"; datos: T[] };

export interface AulaAcceso {
  id: string;
  nombre: string;
  /** Forma geométrica (ids de FormaClase; también los antiguos triangulo, circulo...). */
  iconoForma: string | null;
  /** Pictograma o imagen propia; si hay, sustituye a la forma. */
  iconoUrl: string | null;
}

export interface AlumnoAcceso {
  id: string;
  /** Solo el nombre de pila: los apellidos no salen de la base de datos. */
  nombre: string;
  icono: string | null;
  color: string | null;
}

/** Fila de aulas_acceso(). */
interface FilaAula {
  id: string;
  nombre: string | null;
  icono_forma: string | null;
  icono_url: string | null;
}

/** Fila de alumnos_acceso(aula). */
interface FilaAlumno {
  id: string;
  nombre: string | null;
  icono_personal: string | null;
  color_identificativo: string | null;
}

/** true si la pantalla debe pedir los datos a la base de datos (hay Supabase configurado). */
export function usaBaseDatos(): boolean {
  return supabaseConfigurado;
}

async function llamar<F, T>(
  funcion: string,
  parametros: Record<string, unknown> | undefined,
  convertir: (fila: F) => T,
): Promise<ResultadoAcceso<T>> {
  if (!supabaseConfigurado) return { estado: "sin-supabase" };
  try {
    const { data, error } = await supabase.rpc(funcion, parametros);
    if (error) return { estado: "error" };
    return { estado: "ok", datos: ((data ?? []) as F[]).map(convertir) };
  } catch {
    return { estado: "error" };
  }
}

/** Aulas para la pantalla 01, en el orden de la 48b. */
export function obtenerAulasAcceso(): Promise<ResultadoAcceso<AulaAcceso>> {
  return llamar<FilaAula, AulaAcceso>("aulas_acceso", undefined, (fila) => ({
    id: fila.id,
    nombre: fila.nombre ?? "",
    iconoForma: fila.icono_forma ?? null,
    iconoUrl: fila.icono_url ?? null,
  }));
}

/** Alumnos activos de un aula para la pantalla 02. */
export function obtenerAlumnosAcceso(aulaId: string): Promise<ResultadoAcceso<AlumnoAcceso>> {
  return llamar<FilaAlumno, AlumnoAcceso>("alumnos_acceso", { p_aula: aulaId }, (fila) => ({
    id: fila.id,
    nombre: fila.nombre ?? "",
    icono: fila.icono_personal ?? null,
    color: fila.color_identificativo ?? null,
  }));
}
