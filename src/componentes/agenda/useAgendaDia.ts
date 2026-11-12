// Estado reactivo de la agenda del día (T-06.2, HU-06).
// RF4.1: carga la secuencia del día. RF4.3: al confirmar el fin, la tarea pasa a «Hecho» al momento
// (actualización optimista) y se guarda; si falla, se vuelve a lo que diga el servidor.
// RF4.7: con la suscripción del repositorio (Supabase Realtime) recarga sola cuando el tutor cambia algo.
// T-08.1 (HU-08): RF6.1 «Empezar» pone la tarea en curso al momento y guarda la hora de inicio.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import type { EntradaAgenda, RepositorioAgenda } from "./tipos";
import {
  confirmarFin as aplicarFin,
  dividirEnBloques,
  empezarTarea,
  type OpcionesBloques,
} from "./logica";

export function hoyISO(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function useAgendaDia(
  repo: RepositorioAgenda,
  estudianteId: string,
  fecha: string = hoyISO(),
  opciones?: OpcionesBloques,
) {
  const [entradas, setEntradas] = useState<EntradaAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // Copia de las entradas para leerlas dentro de callbacks sin volver a crearlos.
  const entradasRef = useRef(entradas);
  useEffect(() => {
    entradasRef.current = entradas;
  }, [entradas]);
  // Entradas que se están guardando, con el cambio que se espera: el servidor aún no lo tiene y
  // una recarga no debe "devolverlas" a como estaban (p. ej. de «Hecho» otra vez a «Ahora»).
  const guardando = useRef(new Map<string, Partial<EntradaAgenda>>());
  const peticion = useRef(0);

  const recargar = useCallback(async () => {
    const n = ++peticion.current;
    try {
      const datos = await repo.obtenerSecuenciaDia(estudianteId, fecha);
      if (n !== peticion.current) return; // llegó otra respuesta más nueva
      setEntradas(
        datos.map((e) => {
          const cambio = guardando.current.get(e.id);
          return cambio && e.estado !== "cancelada" && e.estado !== "bloqueada"
            ? { ...e, ...cambio }
            : e;
        }),
      );
      setError(null);
    } catch (e: any) {
      if (n === peticion.current) setError(e?.message ?? "No se ha podido cargar la agenda");
    } finally {
      if (n === peticion.current) setCargando(false);
    }
  }, [repo, estudianteId, fecha]);

  // Varias notificaciones seguidas (p. ej. el tutor reordena 5 tareas) = una recarga.
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recargarPronto = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(recargar, 120);
  }, [recargar]);

  useEffect(() => {
    recargar();
    const baja = repo.suscribir(estudianteId, fecha, recargarPronto, () => {
      const ids = new Set<string>();
      for (const e of entradasRef.current) {
        ids.add(e.id);
        ids.add(`tarea:${e.tarea_id}`);
      }
      return ids;
    });
    // Al volver a la app (tableta que se apagó, pestaña en segundo plano).
    const sub = AppState.addEventListener("change", (s) => s === "active" && recargarPronto());
    return () => {
      baja();
      sub.remove();
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [repo, estudianteId, fecha, recargar, recargarPronto]);

  /** Aplica un cambio al momento, lo guarda y, si falla, vuelve a lo que diga el servidor. */
  const guardar = useCallback(
    async (
      idEntrada: string,
      aplicar: (entradas: readonly EntradaAgenda[]) => EntradaAgenda[],
      enviar: (cambio: EntradaAgenda) => Promise<void>,
    ) => {
      const antes = entradasRef.current;
      const despues = aplicar(antes);
      if (despues.every((e, i) => e.estado === antes[i]?.estado)) return false; // no era la de «Ahora»
      const cambiada = despues.find((e) => e.id === idEntrada)!;
      guardando.current.set(idEntrada, {
        estado: cambiada.estado,
        inicio_real: cambiada.inicio_real,
        fin_real: cambiada.fin_real,
      });
      entradasRef.current = despues;
      setEntradas(despues);
      setErrorGuardado(null);
      try {
        await enviar(cambiada);
      } catch (e: any) {
        // La recarga de abajo devuelve la tarea a como estaba para que se pueda repetir.
        setErrorGuardado(e?.message ?? "No se ha podido guardar");
      } finally {
        guardando.current.delete(idEntrada);
        recargarPronto();
      }
      return true;
    },
    [recargarPronto],
  );

  /** RF6.1: «Empezar». Devuelve false si la tarea no era la de «Ahora» o ya estaba empezada. */
  const empezar = useCallback(
    (idEntrada: string) =>
      guardar(
        idEntrada,
        (antes) => empezarTarea(antes, idEntrada),
        (e) => repo.marcarEnCurso(idEntrada, e.inicio_real!),
      ),
    [guardar, repo],
  );

  /** RF4.3 y RF6.4: «Terminar». Devuelve false si la tarea no era la de «Ahora». */
  const confirmarFin = useCallback(
    (idEntrada: string) =>
      guardar(
        idEntrada,
        (antes) => aplicarFin(antes, idEntrada),
        (e) => repo.marcarHecha(idEntrada, e.fin_real ?? undefined),
      ),
    [guardar, repo],
  );

  const maxHecho = opciones?.maxHecho;
  const maxDespues = opciones?.maxDespues;
  const bloques = useMemo(
    () => dividirEnBloques(entradas, { maxHecho, maxDespues }),
    [entradas, maxHecho, maxDespues],
  );

  return { bloques, entradas, cargando, error, errorGuardado, empezar, confirmarFin, recargar };
}
