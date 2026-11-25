// Pantalla 43 «Progreso e historial» (HU-25 · SCRUM-144, frontend SCRUM-146). Es la misma para el
// tutor y para la familia, y los dos ven todas las tareas del alumno, de clase y de casa
// (progreso_alumno, SCRUM-145): así saben qué hace en el colegio y en casa.
// Arriba se elige el periodo (día, semana o mes, y con las flechas el anterior o el siguiente).
// Debajo, tres indicadores (completadas, pendientes y emoción más frecuente), la tabla de tareas
// (o, con «Ver días», un resumen por día) y el resumen del periodo (Plan B y peticiones de ayuda).
// Reglas de la profesora: cabe en una pantalla sin scroll (la tabla va por páginas según el alto
// que hay), sin ventanas emergentes y con la barra común de abajo.
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos, type NombreIcono } from "../../ui";
import {
  cambiarTipo,
  esPeriodoActual,
  moverPeriodo,
  periodoQueContiene,
  textoDiaCorto,
  textoPeriodo,
  type Periodo,
  type TipoPeriodo,
} from "./periodos";
import {
  detalleSinHacer,
  emocionMasFrecuente,
  estadoVisible,
  etiquetaAmbito,
  etiquetaEmocion,
  frasesResumen,
  paginar,
  porcentajeHechas,
  tareasSinHacer,
  type TonoEstado,
} from "./resumen";
import type { DiaProgreso, ProgresoAlumno, RepositorioProgreso, TareaProgreso } from "./tipos";
import { useProgresoAlumno } from "./useProgresoAlumno";

/** Alto de una fila de la tabla con la letra normal (con letra grande crece en proporción). */
export const ALTO_FILA = 48;
/** Filas por página hasta que se mide el hueco de la tabla (y en las pruebas, que no miden). */
export const FILAS_POR_DEFECTO = 5;

const TIPOS: { tipo: TipoPeriodo; texto: string }[] = [
  { tipo: "dia", texto: "Día" },
  { tipo: "semana", texto: "Semana" },
  { tipo: "mes", texto: "Mes" },
];

export interface ProgresoHistorial43Props {
  repo: RepositorioProgreso;
  estudianteId: string;
  /** Nombre del alumno mientras llega el de Supabase. */
  nombreAlumno?: string;
  /** Periodo con el que se abre (por defecto, la semana actual). */
  periodoInicial?: Periodo;
  /** Qué hace «Atrás» (volver a la ficha del alumno o al panel). */
  alAtras: (() => void) | null;
  /** Fecha de hoy: solo para las pruebas. */
  hoy?: Date;
}

export function ProgresoHistorial43({
  repo,
  estudianteId,
  nombreAlumno,
  periodoInicial,
  alAtras,
  hoy: hoyFijo,
}: ProgresoHistorial43Props) {
  const e = useEstilos(crearEstilos);
  const { colores, escalaLetra } = useApariencia();
  const hoy = useMemo(() => hoyFijo ?? new Date(), [hoyFijo]);

  const [periodo, setPeriodoElegido] = useState<Periodo>(
    () => periodoInicial ?? periodoQueContiene("semana", hoy),
  );
  const [vista, setVistaElegida] = useState<"tareas" | "dias">("tareas");
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(FILAS_POR_DEFECTO);
  const { datos, cargando, error, recargar } = useProgresoAlumno(repo, estudianteId, periodo);

  // Al cambiar de periodo o de vista se vuelve a la primera página.
  const setPeriodo = (p: Periodo) => {
    setPeriodoElegido(p);
    setPagina(0);
  };
  const setVista = (v: "tareas" | "dias") => {
    setVistaElegida(v);
    setPagina(0);
  };

  const altoFila = Math.round(ALTO_FILA * escalaLetra);
  const medirCuerpo = (ev: LayoutChangeEvent) => {
    const filas = Math.max(1, Math.floor(ev.nativeEvent.layout.height / altoFila));
    if (filas !== filasPorPagina) setFilasPorPagina(filas);
  };

  const actual = esPeriodoActual(periodo, hoy);
  const verDias = vista === "dias" && periodo.tipo !== "dia";
  const nombre = datos?.alumno?.nombre ?? nombreAlumno;

  const irATipo = (tipo: TipoPeriodo) => {
    setPeriodo(cambiarTipo(periodo, tipo, hoy));
    if (tipo === "dia") setVista("tareas");
  };
  const abrirDia = (fecha: string) => {
    setPeriodo(periodoQueContiene("dia", fecha));
    setVista("tareas");
  };

  return (
    <MarcoPantalla
      titulo={nombre ? `Progreso e historial · ${nombre}` : "Progreso e historial"}
      simbolo={<Icono nombre="lista" tam={36} color={colores.primario} />}
      atras={alAtras}
      testID="pantalla-43-progreso"
    >
      <View style={e.contenedor}>
        {/* 1. Periodo */}
        <View style={e.filaPeriodo}>
          <View style={e.segmentos} accessibilityRole="tablist">
            {TIPOS.map(({ tipo, texto }) => (
              <Boton
                key={tipo}
                texto={texto}
                elegido={periodo.tipo === tipo}
                rol="tab"
                etiqueta={`Ver por ${texto.toLowerCase()}`}
                alPulsar={() => irATipo(tipo)}
                testID={`periodo-${tipo}`}
              />
            ))}
          </View>
          <Boton
            icono="atras"
            etiqueta="Periodo anterior"
            alPulsar={() => setPeriodo(moverPeriodo(periodo, -1))}
            testID="periodo-anterior"
          />
          <Texto style={e.textoPeriodo} numberOfLines={1} testID="texto-periodo">
            {textoPeriodo(periodo, hoy)}
          </Texto>
          <Boton
            icono="adelante"
            etiqueta="Periodo siguiente"
            // Más allá de hoy no hay historial.
            alPulsar={actual ? null : () => setPeriodo(moverPeriodo(periodo, 1))}
            testID="periodo-siguiente"
          />
          {!actual ? (
            <Boton
              texto="Volver a hoy"
              icono="calendario"
              alPulsar={() => setPeriodo(periodoQueContiene(periodo.tipo, hoy))}
              testID="periodo-hoy"
            />
          ) : null}
          {periodo.tipo !== "dia" ? (
            <Boton
              texto={verDias ? "Ver tareas" : "Ver días"}
              icono={verDias ? "lista" : "calendario"}
              alPulsar={() => setVista(verDias ? "tareas" : "dias")}
              testID="cambiar-vista"
            />
          ) : null}
        </View>

        {/* 2. Indicadores */}
        <Indicadores datos={datos} />

        {/* 3. Tabla de tareas o de días */}
        <View style={e.tabla} testID="tabla-progreso">
          {verDias ? <CabeceraDias /> : <CabeceraTareas conDia={periodo.tipo !== "dia"} />}
          {/* Mientras llegan los datos del periodo nuevo se ven los anteriores, más apagados. */}
          <View style={[e.cuerpo, cargando && datos && e.cargando]} onLayout={medirCuerpo}>
            {!datos && cargando ? (
              <Texto style={e.mensaje}>Cargando el progreso…</Texto>
            ) : error ? (
              <View style={e.mensajeError} testID="error-progreso">
                <Icono nombre="alerta" color={colores.peligro} tam={28} />
                <Texto style={e.mensaje}>{error}</Texto>
                <Boton texto="Reintentar" alPulsar={recargar} testID="reintentar" />
              </View>
            ) : !datos || datos.tareas.length === 0 ? (
              <Texto style={e.mensaje} testID="sin-tareas">
                No hay tareas en este periodo.
              </Texto>
            ) : verDias ? (
              <FilasDias
                dias={datos.dias}
                pagina={pagina}
                porPagina={filasPorPagina}
                altoFila={altoFila}
                alAbrirDia={abrirDia}
                alCambiarPagina={setPagina}
              />
            ) : (
              <FilasTareas
                tareas={datos.tareas}
                conDia={periodo.tipo !== "dia"}
                pagina={pagina}
                porPagina={filasPorPagina}
                altoFila={altoFila}
                alCambiarPagina={setPagina}
              />
            )}
          </View>
        </View>

        {/* 4. Resumen del periodo */}
        <View style={e.resumen} testID="resumen-periodo">
          <Texto style={e.rotulo}>Resumen del periodo</Texto>
          {datos && !error
            ? frasesResumen(datos).map((frase) => (
                <Texto key={frase} style={e.frase} numberOfLines={1}>
                  {frase}
                </Texto>
              ))
            : null}
        </View>
      </View>
    </MarcoPantalla>
  );
}

/** Los tres indicadores del periodo, como en el prototipo. */
function Indicadores({ datos }: { datos: ProgresoAlumno | null }) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const r = datos?.resumen;
  const pct = r ? porcentajeHechas(r.hechas, r.total) : 0;
  const emocion = datos ? emocionMasFrecuente(datos) : null;
  const sinHacer = datos ? tareasSinHacer(datos) : 0;
  return (
    <View style={e.filaIndicadores}>
      <View
        style={e.indicador}
        testID="kpi-completadas"
        accessible
        accessibilityLabel={
          r ? `Completadas: ${r.hechas} de ${r.total}, el ${pct} %` : "Completadas"
        }
      >
        <Texto style={e.rotulo}>Completadas en el periodo</Texto>
        <Texto style={e.valor}>{r ? `${r.hechas} de ${r.total}` : "—"}</Texto>
        <View style={e.barraFondo}>
          <View style={[e.barraRelleno, { width: `${pct}%`, backgroundColor: colores.exito }]} />
        </View>
      </View>
      <View
        style={e.indicador}
        testID="kpi-pendientes"
        accessible
        accessibilityLabel={
          datos ? `Pendientes: ${sinHacer}. ${detalleSinHacer(datos)}` : "Pendientes"
        }
      >
        <Texto style={e.rotulo}>Pendientes</Texto>
        <Texto style={e.valor}>{datos ? String(sinHacer) : "—"}</Texto>
        <Texto style={e.detalle} numberOfLines={1}>
          {datos ? detalleSinHacer(datos) || "Ninguna sin terminar" : ""}
        </Texto>
      </View>
      <View
        style={e.indicador}
        testID="kpi-emocion"
        accessible
        accessibilityLabel={
          emocion
            ? `Emoción más frecuente: ${emocion.etiqueta}, el ${emocion.porcentaje} % de las veces`
            : "Emoción más frecuente: sin datos"
        }
      >
        <Texto style={e.rotulo}>Emoción más frecuente</Texto>
        <Texto style={e.valor} numberOfLines={1}>
          {emocion ? `${emocion.etiqueta} (${emocion.porcentaje} %)` : "Sin datos"}
        </Texto>
        <Texto style={e.detalle} numberOfLines={1}>
          {emocion ? "De las veces que ha dicho cómo se siente" : "Aún no ha dicho cómo se siente"}
        </Texto>
      </View>
    </View>
  );
}

function CabeceraTareas({ conDia }: { conDia: boolean }) {
  const e = useEstilos(crearEstilos);
  return (
    <View style={[e.fila, e.filaCabecera]} accessibilityElementsHidden>
      {conDia ? <Texto style={[e.celdaCabecera, e.colDia]}>Día</Texto> : null}
      <Texto style={[e.celdaCabecera, e.colTarea]}>Tarea y ámbito</Texto>
      <Texto style={[e.celdaCabecera, e.colHora]}>Hora</Texto>
      <Texto style={[e.celdaCabecera, e.colEstado]}>Estado</Texto>
      <Texto style={[e.celdaCabecera, e.colEmocion]}>Emoción</Texto>
    </View>
  );
}

function CabeceraDias() {
  const e = useEstilos(crearEstilos);
  return (
    <View style={[e.fila, e.filaCabecera]} accessibilityElementsHidden>
      <Texto style={[e.celdaCabecera, e.colDia]}>Día</Texto>
      <Texto style={[e.celdaCabecera, e.colHora]}>Hechas</Texto>
      <Texto style={[e.celdaCabecera, e.colBarra]}>Cumplimiento</Texto>
      <View style={e.colAbrir} />
    </View>
  );
}

function FilasTareas({
  tareas,
  conDia,
  pagina,
  porPagina,
  altoFila,
  alCambiarPagina,
}: {
  tareas: TareaProgreso[];
  conDia: boolean;
  pagina: number;
  porPagina: number;
  altoFila: number;
  alCambiarPagina: (p: number) => void;
}) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  // Si no caben todas, se deja sitio para los botones de página.
  const caben = tareas.length <= porPagina;
  const pag = paginar(tareas, caben ? porPagina : porPagina - 1, pagina);
  return (
    <>
      {pag.elementos.map((t) => {
        const estado = estadoVisible(t);
        const color = colorDeTono(estado.tono, colores);
        const ambito = etiquetaAmbito(t.ambito);
        const emocion = t.emocion ? etiquetaEmocion(t.emocion) : null;
        return (
          <View
            key={t.id}
            style={[e.fila, { height: altoFila }]}
            testID={`fila-tarea-${t.id}`}
            accessible
            accessibilityLabel={[
              conDia ? textoDiaCorto(t.fecha) : null,
              t.hora ?? "sin hora",
              `${t.titulo}, ${ambito.toLowerCase()}${t.plan_b ? ", con Plan B" : ""}`,
              estado.texto,
              emocion ? `se sintió ${emocion.toLowerCase()}` : null,
            ]
              .filter(Boolean)
              .join(". ")}
          >
            {conDia ? (
              <Texto style={[e.celda, e.colDia]} numberOfLines={1}>
                {textoDiaCorto(t.fecha)}
              </Texto>
            ) : null}
            <Texto style={[e.celda, e.colTarea]} numberOfLines={1}>
              <Texto style={e.titulo}>{t.titulo}</Texto>
              {` · ${ambito}`}
              {t.plan_b ? <Texto style={e.planB}>{"  · Plan B"}</Texto> : null}
            </Texto>
            <Texto style={[e.celda, e.colHora]} numberOfLines={1}>
              {t.hora ?? "—"}
            </Texto>
            <View style={[e.colEstado, e.estado]}>
              <Icono nombre={estado.icono} color={color} tam={20} />
              <Texto style={[e.celda, e.textoEstado, { color }]} numberOfLines={1}>
                {estado.texto}
              </Texto>
            </View>
            <Texto style={[e.celda, e.colEmocion]} numberOfLines={1}>
              {emocion ?? "—"}
            </Texto>
          </View>
        );
      })}
      {pag.paginas > 1 ? (
        <Paginas pagina={pag.pagina} paginas={pag.paginas} alCambiar={alCambiarPagina} />
      ) : null}
    </>
  );
}

function FilasDias({
  dias,
  pagina,
  porPagina,
  altoFila,
  alAbrirDia,
  alCambiarPagina,
}: {
  dias: DiaProgreso[];
  pagina: number;
  porPagina: number;
  altoFila: number;
  alAbrirDia: (fecha: string) => void;
  alCambiarPagina: (p: number) => void;
}) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const caben = dias.length <= porPagina;
  const pag = paginar(dias, caben ? porPagina : porPagina - 1, pagina);
  return (
    <>
      {pag.elementos.map((d) => {
        const pct = porcentajeHechas(d.hechas, d.total);
        return (
          <Pressable
            key={d.fecha}
            style={({ pressed }) => [e.fila, { height: altoFila }, pressed && e.pulsado]}
            onPress={() => alAbrirDia(d.fecha)}
            accessibilityRole="button"
            accessibilityLabel={`${textoDiaCorto(d.fecha)}: ${d.hechas} de ${d.total} hechas. Abrir ese día`}
            testID={`fila-dia-${d.fecha}`}
          >
            <Texto style={[e.celda, e.colDia, e.titulo]} numberOfLines={1}>
              {textoDiaCorto(d.fecha)}
            </Texto>
            <Texto style={[e.celda, e.colHora]} numberOfLines={1}>
              {`${d.hechas} de ${d.total}`}
            </Texto>
            <View style={[e.colBarra, e.barraDia]}>
              <View style={[e.barraFondo, e.barraFlexible]}>
                <View
                  style={[e.barraRelleno, { width: `${pct}%`, backgroundColor: colores.primario }]}
                />
              </View>
              <Texto style={e.celda}>{`${pct} %`}</Texto>
            </View>
            <View style={e.colAbrir}>
              <Icono nombre="adelante" color={colores.primario} tam={22} />
            </View>
          </Pressable>
        );
      })}
      {pag.paginas > 1 ? (
        <Paginas pagina={pag.pagina} paginas={pag.paginas} alCambiar={alCambiarPagina} />
      ) : null}
    </>
  );
}

function Paginas({
  pagina,
  paginas,
  alCambiar,
}: {
  pagina: number;
  paginas: number;
  alCambiar: (p: number) => void;
}) {
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.paginas}>
      <Boton
        icono="atras"
        texto="Anteriores"
        alPulsar={pagina > 0 ? () => alCambiar(pagina - 1) : null}
        testID="pagina-anterior"
      />
      <Texto style={e.textoPagina} testID="texto-pagina">
        {`Página ${pagina + 1} de ${paginas}`}
      </Texto>
      <Boton
        icono="adelante"
        iconoDetras
        texto="Siguientes"
        alPulsar={pagina < paginas - 1 ? () => alCambiar(pagina + 1) : null}
        testID="pagina-siguiente"
      />
    </View>
  );
}

/** Botón pequeño de la pantalla (los grandes son los de la barra de abajo). */
function Boton({
  texto,
  icono,
  iconoDetras = false,
  etiqueta,
  elegido,
  rol = "button",
  alPulsar,
  testID,
}: {
  texto?: string;
  icono?: NombreIcono;
  iconoDetras?: boolean;
  etiqueta?: string;
  /** Para los botones que se eligen (Día, Semana, Mes). */
  elegido?: boolean;
  rol?: "button" | "tab";
  /** null: desactivado. */
  alPulsar: (() => void) | null;
  testID?: string;
}) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const activo = alPulsar !== null;
  const tinta = !activo
    ? colores.textoSecundario
    : elegido
      ? colores.textoSobrePrimario
      : colores.primario;
  const dibujo = icono ? <Icono nombre={icono} color={tinta} tam={22} /> : null;
  return (
    <Pressable
      accessibilityRole={rol}
      accessibilityLabel={etiqueta ?? texto}
      accessibilityState={{ disabled: !activo, selected: elegido }}
      disabled={!activo}
      onPress={alPulsar ?? undefined}
      testID={testID}
      style={({ pressed }) => [
        e.boton,
        elegido && e.botonElegido,
        !activo && e.botonApagado,
        pressed && activo && !elegido && e.pulsado,
      ]}
    >
      {!iconoDetras ? dibujo : null}
      {texto ? (
        <Texto
          style={[e.textoBoton, { color: elegido ? colores.textoSobrePrimario : colores.texto }]}
        >
          {texto}
        </Texto>
      ) : null}
      {iconoDetras ? dibujo : null}
    </Pressable>
  );
}

function colorDeTono(tono: TonoEstado, c: Paleta): string {
  switch (tono) {
    case "exito":
      return c.exito;
    case "aviso":
      return c.aviso;
    case "peligro":
      return c.peligro;
    case "primario":
      return c.primario;
    default:
      return c.textoSecundario;
  }
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 14,
      gap: 12,
      backgroundColor: c.fondo,
    },
    filaPeriodo: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
    },
    segmentos: {
      flexDirection: "row",
      gap: 6,
    },
    textoPeriodo: {
      flexShrink: 1,
      minWidth: 180,
      fontSize: 18,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    boton: {
      minHeight: 48,
      minWidth: 48,
      paddingHorizontal: 14,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    botonElegido: {
      backgroundColor: c.primario,
      borderColor: c.primario,
    },
    botonApagado: {
      borderStyle: "dashed",
      backgroundColor: c.fondo,
    },
    textoBoton: {
      fontSize: 16,
      fontWeight: "700",
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    filaIndicadores: {
      flexDirection: "row",
      gap: 12,
    },
    indicador: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 4,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
    },
    rotulo: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textoSecundario,
      textTransform: "uppercase",
    },
    valor: {
      fontSize: 26,
      fontWeight: "700",
      color: c.texto,
    },
    detalle: {
      fontSize: 14,
      color: c.textoSecundario,
    },
    barraFondo: {
      height: 12,
      borderRadius: 6,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      overflow: "hidden",
    },
    barraRelleno: {
      height: "100%",
    },
    barraFlexible: {
      flex: 1,
    },
    tabla: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      overflow: "hidden",
    },
    cuerpo: {
      flex: 1,
    },
    cargando: {
      opacity: 0.5,
    },
    fila: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    filaCabecera: {
      height: 40,
      backgroundColor: c.fondo,
    },
    celdaCabecera: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textoSecundario,
      textTransform: "uppercase",
    },
    celda: {
      fontSize: 16,
      color: c.texto,
    },
    titulo: {
      fontWeight: "700",
      color: c.texto,
    },
    planB: {
      fontWeight: "700",
      color: c.primario,
    },
    colDia: { width: 84 },
    colTarea: { flex: 3 },
    colHora: { width: 80 },
    colEstado: { width: 150 },
    colEmocion: { width: 120 },
    colBarra: { flex: 3 },
    colAbrir: { width: 32, alignItems: "flex-end" },
    estado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    textoEstado: {
      fontWeight: "700",
    },
    barraDia: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    paginas: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingVertical: 4,
    },
    textoPagina: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    mensaje: {
      fontSize: 18,
      color: c.textoSecundario,
      textAlign: "center",
      padding: 24,
    },
    mensajeError: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 16,
    },
    resumen: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 4,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
    },
    frase: {
      fontSize: 16,
      color: c.texto,
    },
  });
