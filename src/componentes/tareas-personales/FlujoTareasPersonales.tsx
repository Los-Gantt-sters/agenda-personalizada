/**
 * Orquestador del flujo completo de HU-07 (`SCRUM-89` / `SCRUM-92`):
 * - Pantalla 31: Biblioteca de tareas unificada (Tutor / Familia aislados por rol).
 * - Pantalla 28: Crear o editar tarea (Datos generales + número de pasos, sin pestañas superiores ni Plan B).
 * - Pantalla 28p: Buscador general de pictogramas (ARASAAC + Mi biblioteca).
 * - Pantalla 28ok: Confirmación «¡Tarea editada correctamente!» (vuelve a 31 o a 39/40 si se editó solo para un alumno).
 * - Pantalla 28b: Asignar tarea a clase y alumnos (todos marcados por defecto).
 * - Pantalla 28c: Programar horario único (08:00–15:00 Tutor vs 15:00–08:00 Familia).
 */

import React, { useMemo, useState } from "react";
import { urlImagenPictograma } from "../../arasaac/urls";
import {
  aplicarGuardadoTarea28,
  type DestinoRetorno28ok,
} from "../../servicios/tareasPersonalesService";
import { AsignarClaseAlumnos28b, type SeleccionAsignacion28b } from "./AsignarClaseAlumnos28b";
import { BibliotecaTareas31 } from "./BibliotecaTareas31";
import { BuscadorPictogramas28p } from "./BuscadorPictogramas28p";
import { ConfirmacionTarea28ok } from "./ConfirmacionTarea28ok";
import {
  CATALOGO_BIBLIOTECA_31,
  type PictogramaBuscador28p,
  type RolBibliotecaAdulto,
  type TareaBiblioteca31,
} from "./datosTareasPersonales";
import { EditorTarea28, type DatosGeneralesTarea28 } from "./EditorTarea28";
import { ProgramarHorario28c, type DatosGuardadoHorario28c } from "./ProgramarHorario28c";

export type PantallaFlujoTareas = "31" | "28" | "28p" | "28ok" | "28b" | "28c";

export interface FlujoTareasPersonalesProps {
  /** Rol activo: `"tutor"` (08:00–15:00) o `"familia"` (15:00–08:00). */
  rol?: RolBibliotecaAdulto;
  /** Nombre del usuario mostrado en cabecera. */
  nombreUsuario?: string;
  /** Pantalla inicial del flujo (`"31"` por defecto, o `"28"` / `"28c"` al entrar desde 41/42b). */
  pantallaInicial?: PantallaFlujoTareas;
  /**
   * Si se entra a editar o reprogramar desde la tarea de un alumno concreto (Pantallas 41 o 42b),
   * nombre del alumno (p. ej. `"Alejandro Pérez"` o `"Lucas"`).
   */
  alumnoEditadoInicial?: string | null;
  /** ID de la tarea inicial sobre la que operar. */
  tareaInicialId?: string;
  /** Catálogo inicial de tareas. */
  catalogoInicial?: TareaBiblioteca31[];
  /** Se invoca al volver al panel principal (33 en Tutor o 34 en Familia) desde 31. */
  alVolverPanel?: () => void;
  /**
   * Se invoca cuando termina una edición o reprogramación individual de alumno
   * y el flujo regresa a la agenda del alumno (`"39"` en Tutor o `"40"` en Familia).
   */
  alVolverAgendaAlumno?: (
    destino: "39" | "40",
    overrideAlumno: { alumno: string; tarea: TareaBiblioteca31 } | null,
  ) => void;
  /** Se invoca al guardar un horario en 28c. */
  alHorarioGuardado?: (horario: DatosGuardadoHorario28c) => void;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

/**
 * Componente integrador del flujo `31 <-> 28 <-> 28p -> 28ok` y `31 -> 28b -> 28c`
 * con aislamiento por rol activo y soporte de edición individual por alumno.
 * @param props Propiedades de configuración del flujo
 * @returns Pantalla activa del flujo de tareas personales
 */
export function FlujoTareasPersonales({
  rol = "tutor",
  nombreUsuario,
  pantallaInicial = "31",
  alumnoEditadoInicial = null,
  tareaInicialId,
  catalogoInicial = CATALOGO_BIBLIOTECA_31,
  alVolverPanel,
  alVolverAgendaAlumno,
  alHorarioGuardado,
  alCerrarSesion,
}: FlujoTareasPersonalesProps) {
  const [pantalla, setPantalla] = useState<PantallaFlujoTareas>(pantallaInicial);
  const [catalogo, setCatalogo] = useState<TareaBiblioteca31[]>(catalogoInicial);
  const [alumnoEditado, setAlumnoEditado] = useState<string | null>(alumnoEditadoInicial);

  const tareaPorDefecto = useMemo(
    () =>
      catalogo.find((t) => t.id === tareaInicialId) ??
      catalogo.find((t) => t.owner === rol) ??
      catalogo[0],
    [catalogo, tareaInicialId, rol],
  );

  const [tareaActivaId, setTareaActivaId] = useState<string | null>(tareaPorDefecto?.id ?? null);

  const [borrador28, setBorrador28] = useState<DatosGeneralesTarea28>(() => ({
    titulo: tareaPorDefecto?.titulo ?? "Lavarse las manos",
    descripcion:
      tareaPorDefecto?.descripcion ??
      "Tarea de higiene antes del recreo y del comedor con pictogramas y audio.",
    pictogramaId: tareaPorDefecto?.pictogramaId ?? 2443,
    pictogramaNombre: tareaPorDefecto?.titulo ?? "Lavarse las manos",
    pasosCount: tareaPorDefecto?.pasosCount ?? 5,
  }));

  const [seleccion28b, setSeleccion28b] = useState<SeleccionAsignacion28b | null>(null);
  const [ultimoOverrideAlumno, setUltimoOverrideAlumno] = useState<{
    alumno: string;
    tarea: TareaBiblioteca31;
  } | null>(null);

  const abrirCrearNuevaTarea = () => {
    setTareaActivaId(null);
    setAlumnoEditado(null);
    setBorrador28({
      titulo: rol === "familia" ? "Preparar la mochila" : "Lavarse las manos",
      descripcion: "Tarea paso a paso en Lectura Fácil con pictogramas y audio.",
      pictogramaId: rol === "familia" ? 2475 : 2443,
      pictogramaNombre: rol === "familia" ? "Preparar la mochila" : "Lavarse las manos",
      pasosCount: 4,
    });
    setPantalla("28");
  };

  const abrirEditarTareaBiblioteca = (tarea: TareaBiblioteca31) => {
    setTareaActivaId(tarea.id);
    setAlumnoEditado(null);
    setBorrador28({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      pictogramaId: tarea.pictogramaId,
      pictogramaNombre: tarea.titulo,
      pasosCount: tarea.pasosCount,
    });
    setPantalla("28");
  };

  const abrirAsignarTarea = (tarea: TareaBiblioteca31 | null) => {
    if (tarea) {
      setTareaActivaId(tarea.id);
      setBorrador28({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        pictogramaId: tarea.pictogramaId,
        pictogramaNombre: tarea.titulo,
        pasosCount: tarea.pasosCount,
      });
    }
    setPantalla("28b");
  };

  const manejarSeleccionPictograma28p = (picto: PictogramaBuscador28p | null) => {
    if (picto) {
      setBorrador28((prev) => ({
        ...prev,
        pictogramaId: picto.pictogramaId,
        pictogramaNombre: picto.titulo,
      }));
    }
    setPantalla("28");
  };

  const manejarContinuarPasos28 = (datos: DatosGeneralesTarea28) => {
    setBorrador28(datos);
    const resultado = aplicarGuardadoTarea28(
      catalogo,
      rol,
      {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        pictogramaId: datos.pictogramaId,
        pictogramaUrl: urlImagenPictograma(datos.pictogramaId),
        pasosCount: datos.pasosCount,
      },
      tareaActivaId,
      alumnoEditado,
    );
    setCatalogo(resultado.catalogoActualizado);
    setUltimoOverrideAlumno(resultado.overrideAlumno);
    setPantalla("28ok");
  };

  const manejarAceptar28ok = (destino: DestinoRetorno28ok) => {
    if (destino === "39" || destino === "40") {
      alVolverAgendaAlumno?.(destino, ultimoOverrideAlumno);
      setAlumnoEditado(null);
    }
    setPantalla("31");
  };

  if (pantalla === "28") {
    return (
      <EditorTarea28
        rol={rol}
        nombreUsuario={nombreUsuario}
        alumnoEditado={alumnoEditado}
        tituloInicial={borrador28.titulo}
        descripcionInicial={borrador28.descripcion}
        pictogramaIdInicial={borrador28.pictogramaId}
        pictogramaNombreInicial={borrador28.pictogramaNombre}
        pasosCountInicial={borrador28.pasosCount}
        alAbrirBuscadorPictograma={(datosActuales) => {
          setBorrador28(datosActuales);
          setPantalla("28p");
        }}
        alContinuarPasos={manejarContinuarPasos28}
        alAtras={() => {
          if (alumnoEditado) {
            alVolverAgendaAlumno?.(rol === "familia" ? "40" : "39", null);
          }
          setPantalla("31");
        }}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (pantalla === "28p") {
    return (
      <BuscadorPictogramas28p
        rol={rol}
        nombreUsuario={nombreUsuario}
        alSeleccionarPictograma={manejarSeleccionPictograma28p}
        alAtras={() => setPantalla("28")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (pantalla === "28ok") {
    return (
      <ConfirmacionTarea28ok
        rol={rol}
        nombreUsuario={nombreUsuario}
        tituloTarea={borrador28.titulo}
        pasosCount={borrador28.pasosCount}
        pictogramaTareaId={borrador28.pictogramaId}
        alumnoEditado={alumnoEditado}
        alAceptar={manejarAceptar28ok}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (pantalla === "28b") {
    return (
      <AsignarClaseAlumnos28b
        rol={rol}
        nombreUsuario={nombreUsuario}
        tituloTarea={borrador28.titulo}
        pictogramaTareaId={borrador28.pictogramaId}
        alContinuarHorario={(seleccion) => {
          setSeleccion28b(seleccion);
          setPantalla("28c");
        }}
        alAtras={() => setPantalla("31")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  if (pantalla === "28c") {
    const destinatarios = seleccion28b
      ? `${seleccion28b.claseNombre} (${seleccion28b.alumnosSeleccionadosIds.length} alumnos)`
      : alumnoEditado
        ? `${alumnoEditado}`
        : undefined;

    return (
      <ProgramarHorario28c
        rol={rol}
        nombreUsuario={nombreUsuario}
        tituloTarea={borrador28.titulo}
        destinatariosTexto={destinatarios}
        pictogramaTareaId={borrador28.pictogramaId}
        alGuardarHorario={(horario) => {
          alHorarioGuardado?.(horario);
          if (alumnoEditado) {
            alVolverAgendaAlumno?.(rol === "familia" ? "40" : "39", ultimoOverrideAlumno);
            setAlumnoEditado(null);
          }
          setPantalla("31");
        }}
        alAtras={() => setPantalla(alumnoEditado ? "31" : "28b")}
        alCerrarSesion={alCerrarSesion}
      />
    );
  }

  return (
    <BibliotecaTareas31
      rol={rol}
      nombreUsuario={nombreUsuario}
      tareas={catalogo}
      tareaSeleccionadaInicialId={tareaActivaId ?? undefined}
      alCrearNuevaTarea={abrirCrearNuevaTarea}
      alEditarTarea={abrirEditarTareaBiblioteca}
      alAsignar={abrirAsignarTarea}
      alAtras={alVolverPanel ?? null}
      alCerrarSesion={alCerrarSesion}
    />
  );
}
