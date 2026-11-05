// Estado reactivo de la agenda del día (T-06.2, HU-06).
// RF4.1: carga la secuencia del día. RF4.3: al confirmar el fin, la tarea pasa a «Hecho» al momento
// (actualización optimista) y se guarda; si falla, se vuelve a lo que diga el servidor.
// RF4.7: con la suscripción del repositorio (Supabase Realtime) recarga sola cuando el tutor cambia algo.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import type { EntradaAgenda, RepositorioAgenda } from "./tipos";
import { confirmarFin as aplicarFin, dividirEnBloques, type OpcionesBloques } from "./logica";

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
  // Ids de entradas que se están guardando: el servidor aún no las tiene como
  // hechas y una recarga no debe "devolverlas" a «Ahora».
  const guardando = useRef(new Set<string>());
  const peticion = useRef(0);

  const recargar = useCallback(async () => {
    const n = ++peticion.current;
    try {
      const datos = await repo.obtenerSecuenciaDia(estudianteId, fecha);
      if (n !== peticion.current) return; // llegó otra respuesta más nueva
      setEntradas(
        datos.map((e) =>
          guardando.current.has(e.id) && e.estado !== "cancelada" && e.estado !== "bloqueada"
            ? { ...e, estado: "hecha" }
            : e,
        ),
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

  const confirmarFin = useCallback(
    async (idEntrada: string) => {
      const antes = entradasRef.current;
      const despues = aplicarFin(antes, idEntrada);
      if (despues.every((e, i) => e.estado === antes[i]?.estado)) return; // no era la de «Ahora»
      guardando.current.add(idEntrada);
      entradasRef.current = despues;
      setEntradas(despues);
      setErrorGuardado(null);
      try {
        await repo.marcarHecha(idEntrada);
      } catch (e: any) {
        // La recarga de abajo devuelve la tarea a «Ahora» para que se pueda repetir.
        setErrorGuardado(e?.message ?? "No se ha podido guardar");
      } finally {
        guardando.current.delete(idEntrada);
        recargarPronto();
      }
    },
    [repo, recargarPronto],
  );

  const maxHecho = opciones?.maxHecho;
  const maxDespues = opciones?.maxDespues;
  const bloques = useMemo(
    () => dividirEnBloques(entradas, { maxHecho, maxDespues }),
    [entradas, maxHecho, maxDespues],
  );

  return { bloques, entradas, cargando, error, errorGuardado, confirmarFin, recargar };
}
