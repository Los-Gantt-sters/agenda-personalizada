// Tareas de los 7 días de una semana (SCRUM-124 · T-17.1, MOD HU-17, pantalla 06b).
// Usa el mismo repositorio que la agenda del día (Supabase con secuencia_dia o la demo en memoria):
// pide los 7 días a la vez y se vuelve a cargar si el tutor cambia algo (RF4.7).
import { useCallback, useEffect, useRef, useState } from "react";
import type { EntradaAgenda, RepositorioAgenda } from "../agenda/tipos";
import { ordenarSecuencia } from "../agenda/logica";
import { diasDeLaSemana } from "./semana";

export interface DiaSemana {
  fecha: string;
  /** Tareas del día en orden (sin las canceladas). */
  entradas: EntradaAgenda[];
}

export function useSemana(repo: RepositorioAgenda, estudianteId: string, lunes: string) {
  const [dias, setDias] = useState<DiaSemana[]>(() =>
    diasDeLaSemana(lunes).map((fecha) => ({ fecha, entradas: [] })),
  );
  // Semana que ya se ha cargado (la primera vez, o al cambiar de semana, aún no es esta).
  const [cargadaLunes, setCargadaLunes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const peticion = useRef(0);

  const cargar = useCallback(async () => {
    const n = ++peticion.current;
    const fechas = diasDeLaSemana(lunes);
    try {
      const datos = await Promise.all(fechas.map((f) => repo.obtenerSecuenciaDia(estudianteId, f)));
      if (n !== peticion.current) return; // ya se ha pedido otra semana
      setDias(fechas.map((fecha, i) => ({ fecha, entradas: ordenarSecuencia(datos[i]) })));
      setError(null);
    } catch (e: unknown) {
      if (n === peticion.current)
        setError(e instanceof Error ? e.message : "No se ha podido cargar la semana");
    } finally {
      if (n === peticion.current) setCargadaLunes(lunes);
    }
  }, [repo, estudianteId, lunes]);

  // RF4.7: si el tutor crea o cambia tareas, se ve sin recargar. La suscripción de Supabase es por
  // estudiante (no filtra por día), así que basta una para toda la semana.
  const idsRef = useRef<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const ids = new Set<string>();
    for (const d of dias)
      for (const e of d.entradas) {
        ids.add(e.id);
        ids.add(`tarea:${e.tarea_id}`);
      }
    idsRef.current = ids;
  }, [dias]);
  useEffect(() => {
    // La primera carga va en un temporizador, como las recargas: así no cambia el estado en
    // mitad del efecto.
    const primera = setTimeout(() => void cargar(), 0);
    const baja = repo.suscribir(
      estudianteId,
      lunes,
      () => void cargar(),
      () => idsRef.current,
    );
    return () => {
      clearTimeout(primera);
      baja();
    };
  }, [repo, estudianteId, lunes, cargar]);

  return { dias, cargando: cargadaLunes !== lunes, error };
}
