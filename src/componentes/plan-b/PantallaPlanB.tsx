// Pantallas 47b (Plan B de un alumno, desde su ficha 37) y 47c (Plan B del día de la clase, desde el
// panel 33) · HU-22 · SCRUM-139. Son la misma pantalla con otros textos y otros alumnos.
//
// - Solo se elige una tarea principal de hoy y se le asigna como Plan B otra tarea YA creada: aquí
//   no se crean tareas.
// - El Plan B se activa en una tarea o en todo el día, y se puede quitar igual.
// - 47c no tiene botones por alumno ni vista de la tableta: afecta a toda la clase.
// - Sin ventanas emergentes ni scroll: para elegir una tarea se usa la pantalla entera y las listas
//   largas pasan de página con «Adelante».
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import type { DatosPlanB, FilaPlanB, RepositorioPlanB, TareaPlanB } from "../../tipos/planB";
import { FORMA, Icono, Texto, useApariencia, useEstilos, type NombreIcono } from "../../ui";
import { PictogramaTarea } from "../agenda/PictogramaTarea";

export const FILAS_POR_PAGINA_PLAN_B = 4;
export const TAREAS_POR_PAGINA_PLAN_B = 9;

export const ERROR_CARGAR_PLAN_B = "No se han podido cargar las tareas. Inténtalo otra vez.";
export const ERROR_GUARDAR_PLAN_B = "No se ha podido guardar. Inténtalo otra vez.";

export interface PantallaPlanBProps {
  repo: RepositorioPlanB;
  /** 47b: el alumno. 47c: todos los de la clase. */
  estudianteIds: string[];
  /** AAAA-MM-DD. */
  fecha: string;
  /** Con nombre es la 47b; sin él, la 47c. */
  nombreAlumno?: string;
  nombreTutor?: string;
  alAtras: () => void;
  alCerrarSesion?: () => void;
}

const conHora = (f: FilaPlanB) => (f.hora ? `${f.titulo} (${f.hora})` : f.titulo);

export function PantallaPlanB({
  repo,
  estudianteIds,
  fecha,
  nombreAlumno,
  nombreTutor,
  alAtras,
  alCerrarSesion,
}: PantallaPlanBProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ancha = useWindowDimensions().width >= 900;
  const [datos, setDatos] = useState<DatosPlanB | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [alternativa, setAlternativa] = useState<string | null>(null);
  const [eligiendo, setEligiendo] = useState<"principal" | "planB" | null>(null);
  const [pagina, setPagina] = useState(0);
  const [paginaElegir, setPaginaElegir] = useState(0);

  // Los ids llegan en un array nuevo en cada pintado: se compara por su contenido.
  const ids = estudianteIds.join(",");
  const cargar = useCallback(
    () => repo.cargar(ids ? ids.split(",") : [], fecha),
    [repo, ids, fecha],
  );

  useEffect(() => {
    let activo = true;
    cargar()
      .then((d) => {
        if (activo) setDatos(d);
      })
      .catch(() => {
        if (activo) setAviso(ERROR_CARGAR_PLAN_B);
      });
    return () => {
      activo = false;
    };
  }, [cargar]);

  /** Guarda un cambio y vuelve a leer, para enseñar lo que de verdad ha quedado. */
  const guardar = async (accion: () => Promise<void>, hecho: string) => {
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      await accion();
      setAviso(hecho);
    } catch {
      setAviso(ERROR_GUARDAR_PLAN_B);
    }
    try {
      setDatos(await cargar());
    } catch {
      setAviso(ERROR_CARGAR_PLAN_B);
    }
    setOcupado(false);
  };

  const filas = datos?.filas ?? [];
  const biblioteca = datos?.biblioteca ?? [];
  const filaElegida = filas.find((f) => f.clave === principal) ?? null;
  const tareaElegida = biblioteca.find((t) => t.id === alternativa) ?? null;
  const conPlanB = filas.filter((f) => f.planB);
  const todoElDia = conPlanB.length > 0 && conPlanB.every((f) => f.activo);

  const titulo = nombreAlumno
    ? `Plan B de ${nombreAlumno} · Vincular y activar`
    : "Plan B del día · Asignación y estado";

  const derecha = (
    <View style={e.derecha}>
      {nombreTutor && ancha ? <Texto style={e.tutor}>{nombreTutor}</Texto> : null}
      {alCerrarSesion ? (
        <Boton
          texto="Salir"
          etiqueta="Cerrar sesión y salir"
          icono="salir"
          alPulsar={alCerrarSesion}
        />
      ) : null}
    </View>
  );

  // ---- Elegir una tarea (principal o Plan B) a pantalla completa ----
  if (eligiendo) {
    const opciones: {
      id: string;
      texto: string;
      tarea: Pick<TareaPlanB, "titulo" | "pictogramaUrl">;
    }[] =
      eligiendo === "principal"
        ? filas.map((f) => ({ id: f.clave, texto: conHora(f), tarea: f }))
        : biblioteca
            // Una tarea no puede ser su propio Plan B.
            .filter((t) => t.id !== filaElegida?.tareaId)
            .map((t) => ({ id: t.id, texto: t.titulo, tarea: t }));
    const paginas = Math.max(1, Math.ceil(opciones.length / TAREAS_POR_PAGINA_PLAN_B));
    const actual = Math.min(paginaElegir, paginas - 1);
    const pregunta =
      eligiendo === "principal" ? "Elige la tarea principal" : "Elige la tarea Plan B";
    return (
      <MarcoPantalla
        titulo={pregunta}
        derecha={derecha}
        atras={actual > 0 ? () => setPaginaElegir(actual - 1) : () => setEligiendo(null)}
        etiquetaAtras={actual > 0 ? "Atrás: tareas anteriores" : "Atrás: volver al Plan B"}
        adelante={actual < paginas - 1 ? () => setPaginaElegir(actual + 1) : null}
        etiquetaAdelante="Adelante: más tareas"
        testID="pantalla-elegir-tarea-plan-b"
      >
        <View style={e.contenido}>
          {opciones.length === 0 ? (
            <Texto style={e.mensaje}>
              {eligiendo === "principal"
                ? "Hoy no quedan tareas de clase."
                : "No hay otras tareas creadas en la biblioteca."}
            </Texto>
          ) : (
            <View style={e.cuadricula}>
              {opciones
                .slice(actual * TAREAS_POR_PAGINA_PLAN_B, (actual + 1) * TAREAS_POR_PAGINA_PLAN_B)
                .map((o) => (
                  <Pressable
                    key={o.id}
                    testID={`opcion-plan-b-${o.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={o.texto}
                    onPress={() => {
                      if (eligiendo === "principal") {
                        setPrincipal(o.id);
                        setAlternativa(filas.find((f) => f.clave === o.id)?.planB?.id ?? null);
                      } else {
                        setAlternativa(o.id);
                      }
                      setEligiendo(null);
                    }}
                    style={({ pressed }) => [e.opcion, pressed && e.pulsado]}
                  >
                    <PictogramaTarea
                      tarea={{ titulo: o.tarea.titulo, pictograma_url: o.tarea.pictogramaUrl }}
                      tam={56}
                    />
                    <Texto style={e.textoOpcion} numberOfLines={2}>
                      {o.texto}
                    </Texto>
                  </Pressable>
                ))}
            </View>
          )}
        </View>
      </MarcoPantalla>
    );
  }

  // ---- La pantalla del Plan B ----
  const paginas = Math.max(1, Math.ceil(filas.length / FILAS_POR_PAGINA_PLAN_B));
  const actual = Math.min(pagina, paginas - 1);
  const abrirElegir = (que: "principal" | "planB") => {
    setAviso(null);
    setPaginaElegir(0);
    setEligiendo(que);
  };

  return (
    <MarcoPantalla
      titulo={titulo}
      simbolo={<Icono nombre="repetir" color={colores.primario} tam={30} />}
      derecha={derecha}
      atras={actual > 0 ? () => setPagina(actual - 1) : alAtras}
      etiquetaAtras={actual > 0 ? "Atrás: tareas anteriores" : "Atrás"}
      adelante={actual < paginas - 1 ? () => setPagina(actual + 1) : null}
      etiquetaAdelante="Adelante: más tareas"
      testID="pantalla-plan-b"
    >
      <View style={e.contenido}>
        <View style={e.cabecera}>
          <View style={e.textos}>
            <Texto style={e.titulo} accessibilityRole="header">
              {nombreAlumno ? `Plan B de ${nombreAlumno}` : "Plan B general de la clase"}
            </Texto>
            <Texto style={e.subtitulo}>
              {nombreAlumno
                ? "Elige una tarea principal ya creada y asígnale como Plan B otra tarea ya existente en la biblioteca."
                : "Asigna una tarea Plan B a una tarea principal ya creada y actívala para una tarea o para todo el día."}
            </Texto>
          </View>
          <Boton
            texto={todoElDia ? "Quitar Plan B de todo el día" : "Activar Plan B en todo el día"}
            icono={todoElDia ? "cerrar" : "check"}
            principal
            desactivado={conPlanB.length === 0 || ocupado}
            alPulsar={() =>
              void guardar(
                () =>
                  repo.activar(
                    conPlanB.flatMap((f) => f.asignacionIds),
                    !todoElDia,
                  ),
                todoElDia ? "Plan B quitado de todo el día." : "Plan B activado en todo el día.",
              )
            }
          />
        </View>

        <View style={e.formulario}>
          <Texto style={e.etiquetaNuevo}>+ Nuevo Plan B</Texto>
          <Selector
            rotulo="1. Tarea principal (ya creada)"
            valor={filaElegida ? conHora(filaElegida) : null}
            alPulsar={() => abrirElegir("principal")}
          />
          {ancha ? <Icono nombre="adelante" color={colores.primario} tam={24} /> : null}
          <Selector
            rotulo="2. Tarea Plan B asignada (ya creada)"
            valor={tareaElegida?.titulo ?? null}
            alPulsar={() => abrirElegir("planB")}
          />
          <Boton
            texto="Vincular Plan B"
            icono="check"
            principal
            desactivado={!filaElegida || !tareaElegida || ocupado}
            alPulsar={() => {
              const f = filaElegida!;
              const t = tareaElegida!;
              void guardar(
                () => repo.vincular(f.asignacionIds, t.id),
                `«${t.titulo}» es el Plan B de «${f.titulo}».`,
              );
              setPrincipal(null);
              setAlternativa(null);
            }}
          />
        </View>

        {aviso ? (
          <Texto style={e.aviso} accessibilityLiveRegion="polite" testID="aviso-plan-b">
            {aviso}
          </Texto>
        ) : null}

        {!datos ? (
          <Texto style={e.mensaje}>{aviso ? "" : "Cargando las tareas de hoy…"}</Texto>
        ) : filas.length === 0 ? (
          <Texto style={e.mensaje}>Hoy no quedan tareas de clase.</Texto>
        ) : (
          <View style={e.tabla}>
            {ancha ? (
              <View style={[e.fila, e.filaCabecera]}>
                <Texto style={[e.rotuloColumna, e.colHora]}>HORA</Texto>
                <Texto style={[e.rotuloColumna, e.colPrincipal]}>TAREA PRINCIPAL</Texto>
                <Texto style={[e.rotuloColumna, e.colPlanB]}>TAREA PLAN B ASIGNADA</Texto>
                <Texto style={[e.rotuloColumna, e.colEstado]}>ESTADO</Texto>
              </View>
            ) : null}
            {filas
              .slice(actual * FILAS_POR_PAGINA_PLAN_B, (actual + 1) * FILAS_POR_PAGINA_PLAN_B)
              .map((f) => (
                <View key={f.clave} style={[e.fila, f.activo && e.filaActiva]}>
                  <View style={e.colHora}>
                    <PictogramaTarea
                      tarea={{ titulo: f.titulo, pictograma_url: f.pictogramaUrl }}
                      tam={38}
                    />
                    <Texto style={e.hora}>{f.hora || "—"}</Texto>
                  </View>
                  <View style={e.colPrincipal}>
                    <Texto style={e.nombreTarea}>{f.titulo}</Texto>
                    <Texto style={e.nota}>
                      {nombreAlumno ? "Tarea principal" : "Tarea principal del aula"}
                    </Texto>
                  </View>
                  <View style={e.colPlanB}>
                    <Texto style={e.etiquetaPlanB}>Plan B:</Texto>
                    <Texto style={f.planB ? e.nombrePlanB : e.sinPlanB}>
                      {f.planB?.titulo ?? "Sin Plan B"}
                    </Texto>
                    {f.planB ? (
                      <Boton
                        texto="Editar vínculo"
                        etiqueta={`Editar el Plan B de ${f.titulo}`}
                        testID={`editar-plan-b-${f.clave}`}
                        alPulsar={() => {
                          setAviso(null);
                          setPrincipal(f.clave);
                          setAlternativa(f.planB!.id);
                        }}
                      />
                    ) : null}
                  </View>
                  <View style={e.colEstado}>
                    <Boton
                      texto={f.activo ? "Plan B activo" : "Activar Plan B"}
                      etiqueta={
                        f.activo
                          ? `Plan B activo en ${f.titulo}. Pulsa para quitarlo`
                          : `Activar Plan B en ${f.titulo}`
                      }
                      icono={f.activo ? "check" : "repetir"}
                      principal={f.activo}
                      desactivado={!f.planB || ocupado}
                      testID={`activar-plan-b-${f.clave}`}
                      alPulsar={() =>
                        void guardar(
                          () => repo.activar(f.asignacionIds, !f.activo),
                          f.activo
                            ? `Plan B quitado de «${f.titulo}».`
                            : `Plan B activado en «${f.titulo}».`,
                        )
                      }
                    />
                  </View>
                </View>
              ))}
          </View>
        )}
      </View>
    </MarcoPantalla>
  );
}

function Selector({
  rotulo,
  valor,
  alPulsar,
}: {
  rotulo: string;
  valor: string | null;
  alPulsar: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.selector}>
      <Texto style={e.rotuloSelector}>{rotulo}</Texto>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor ?? "sin elegir"}`}
        onPress={alPulsar}
        style={({ pressed }) => [e.caja, pressed && e.pulsado]}
      >
        <Texto style={e.textoCaja} numberOfLines={1}>
          {valor ?? "Elegir tarea…"}
        </Texto>
        <Icono nombre="abajo" color={colores.texto} tam={20} />
      </Pressable>
    </View>
  );
}

function Boton({
  texto,
  alPulsar,
  etiqueta,
  icono,
  principal = false,
  desactivado = false,
  testID,
}: {
  texto: string;
  alPulsar: () => void;
  etiqueta?: string;
  icono?: NombreIcono;
  principal?: boolean;
  desactivado?: boolean;
  testID?: string;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const color = principal ? colores.textoSobrePrimario : colores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? texto}
      accessibilityState={{ disabled: desactivado }}
      disabled={desactivado}
      onPress={alPulsar}
      testID={testID}
      style={({ pressed }) => [
        e.boton,
        principal && e.botonPrincipal,
        desactivado && e.desactivado,
        pressed && e.pulsado,
      ]}
    >
      {icono ? <Icono nombre={icono} color={color} tam={18} /> : null}
      <Texto style={[e.textoBoton, { color }]}>{texto}</Texto>
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenido: {
      flex: 1,
      padding: 16,
      gap: 10,
      width: "100%",
      maxWidth: 1100,
      alignSelf: "center",
    },
    derecha: { flexDirection: "row", alignItems: "center", gap: 10 },
    tutor: { fontSize: 15, fontWeight: "700", color: c.texto },
    cabecera: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
    textos: { flex: 1, minWidth: 260 },
    titulo: { fontSize: 20, fontWeight: "700", color: c.texto },
    subtitulo: { fontSize: 14, color: c.textoSecundario },
    formulario: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-end",
      gap: 12,
      padding: 12,
      borderWidth: 2,
      borderColor: c.primario,
      borderRadius: FORMA.radio,
      backgroundColor: c.superficieDestacada,
    },
    etiquetaNuevo: {
      alignSelf: "center",
      fontSize: 13,
      fontWeight: "700",
      color: c.primario,
      borderWidth: 1,
      borderColor: c.primario,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    selector: { flex: 1, minWidth: 200, gap: 2 },
    rotuloSelector: { fontSize: 13, fontWeight: "700", color: c.textoSecundario },
    caja: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingHorizontal: 12,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
    },
    textoCaja: { flex: 1, fontSize: 15, fontWeight: "700", color: c.texto },
    aviso: { fontSize: 15, fontWeight: "700", color: c.texto },
    mensaje: { fontSize: 18, color: c.textoSecundario, textAlign: "center", marginTop: 24 },
    tabla: {
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      backgroundColor: c.superficie,
      overflow: "hidden",
    },
    fila: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: c.borde,
    },
    filaCabecera: { borderTopWidth: 0, backgroundColor: c.fondo },
    filaActiva: { backgroundColor: c.superficieDestacada },
    rotuloColumna: { fontSize: 13, fontWeight: "700", color: c.textoSecundario },
    colHora: { width: 104, flexDirection: "row", alignItems: "center", gap: 8 },
    colPrincipal: { flex: 2, minWidth: 150 },
    colPlanB: {
      flex: 3,
      minWidth: 230,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },
    colEstado: { width: 170, alignItems: "flex-end" },
    hora: { fontSize: 14, fontWeight: "700", color: c.textoSecundario },
    nombreTarea: { fontSize: 15, fontWeight: "700", color: c.texto },
    nota: { fontSize: 12, color: c.textoSecundario },
    etiquetaPlanB: { fontSize: 12, fontWeight: "700", color: c.primario },
    nombrePlanB: { flexShrink: 1, fontSize: 14, fontWeight: "700", color: c.texto },
    sinPlanB: { fontSize: 14, color: c.textoSecundario },
    boton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 12,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
    },
    botonPrincipal: { backgroundColor: c.primario, borderColor: c.primario },
    textoBoton: { fontSize: 14, fontWeight: "700" },
    cuadricula: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    opcion: {
      width: "31%",
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 10,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      backgroundColor: c.superficie,
    },
    textoOpcion: { fontSize: 17, fontWeight: "700", color: c.texto, textAlign: "center" },
    desactivado: { opacity: 0.45 },
    pulsado: { opacity: 0.85 },
  });
