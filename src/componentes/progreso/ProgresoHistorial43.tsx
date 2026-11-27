// Pantalla 43 «Progreso e historial» (HU-25 · SCRUM-144, frontend SCRUM-146). Es la misma para el
// tutor y para la familia, y los dos ven todas las tareas del alumno, de clase y de casa
// (progreso_alumno, SCRUM-145): así saben qué hace en el colegio y en casa.
// Sigue el boceto de la profesora (letra Andika y colores por estado):
//   - Cabecera: título y, a la derecha, quién ha entrado y «Salir».
//   - Periodo: Día, Semana o Mes y un desplegable con el calendario para elegir el día, la semana o
//     el mes concretos (también de años anteriores). El calendario se abre en el sitio, sin
//     ventana flotante.
//   - Tres indicadores: completadas, pendientes y emoción más frecuente.
//   - A la izquierda, la tabla de tareas (o, con «Ver días», un resumen por día); a la derecha, el
//     resumen del periodo en tarjetas de color.
// Reglas de la profesora: cabe en una pantalla sin scroll (la tabla va por páginas según el alto
// que hay), sin ventanas emergentes y con la barra común de abajo.
import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, LetraFija, Texto, useApariencia, useEstilos } from "../../ui";
import { CalendarioPeriodo } from "./CalendarioPeriodo";
import {
  aISO,
  cambiarTipo,
  periodoQueContiene,
  textoDiaCorto,
  textoPeriodo,
  type Periodo,
  type TipoPeriodo,
} from "./periodos";
import { Boton, Etiqueta } from "./piezas";
import {
  contarEstados,
  detallePendientes,
  emocionMasFrecuente,
  estadoVisible,
  etiquetaAmbito,
  etiquetaEmocion,
  paginar,
  porcentajeHechas,
  tarjetasResumen,
  type TonoTarjeta,
} from "./resumen";
import type { DiaProgreso, ProgresoAlumno, RepositorioProgreso, TareaProgreso } from "./tipos";
import { useProgresoAlumno } from "./useProgresoAlumno";

/** Alto de una fila de la tabla con la letra normal (con letra grande crece en proporción). */
export const ALTO_FILA = 46;
/** Filas por página hasta que se mide el hueco de la tabla (y en las pruebas, que no miden). */
export const FILAS_POR_DEFECTO = 5;

const TIPOS: { tipo: TipoPeriodo; texto: string }[] = [
  { tipo: "dia", texto: "Día" },
  { tipo: "semana", texto: "Semana" },
  { tipo: "mes", texto: "Mes" },
];

/** Anchos de las columnas de la tabla con la letra normal. La de la tarea se queda el resto. */
const COLUMNAS = { cuando: 130, hora: 76, estado: 132, emocion: 96, hechas: 170, porcentaje: 150 };

/**
 * Detalle del resumen de la derecha. Completo: hasta dos ejemplos y el texto entero (sin cortar,
 * para no perder «y N más»). Si no cabe (muchos avisos o letra grande), pasa a compacto: un
 * ejemplo y cuántos más («Huerto (lunes 23) y 3 más») en dos líneas como mucho.
 */
const RESUMEN_COMPLETO: { detalle: number; lineas?: number } = { detalle: 2 };
const RESUMEN_COMPACTO: { detalle: number; lineas?: number } = { detalle: 1, lineas: 2 };

export interface ProgresoHistorial43Props {
  repo: RepositorioProgreso;
  estudianteId: string;
  /** Nombre del alumno mientras llega el de Supabase. */
  nombreAlumno?: string;
  /** Periodo con el que se abre (por defecto, la semana actual). */
  periodoInicial?: Periodo;
  /** Qué hace «Atrás» (volver a la ficha del alumno o al panel). */
  alAtras: (() => void) | null;
  /** Nombre de quien ha entrado, para la cabecera. Sin él (demo sin sesión) no sale. */
  usuario?: string;
  /** Qué hace «Salir». Sin él no sale el botón. */
  alCerrarSesion?: () => void;
  /** Fecha de hoy: solo para las pruebas. */
  hoy?: Date;
}

export function ProgresoHistorial43(props: ProgresoHistorial43Props) {
  // Andika en toda la pantalla, como en el boceto de la profesora.
  return (
    <LetraFija fuente="andika">
      <Pantalla43 {...props} />
    </LetraFija>
  );
}

function Pantalla43({
  repo,
  estudianteId,
  nombreAlumno,
  periodoInicial,
  alAtras,
  usuario,
  alCerrarSesion,
  hoy: hoyFijo,
}: ProgresoHistorial43Props) {
  const e = useEstilos(crearEstilos);
  const { colores, escalaLetra } = useApariencia();
  const hoy = useMemo(() => hoyFijo ?? new Date(), [hoyFijo]);
  // Para separar «Pendiente» (se le pasó la hora) de «Por hacer» (aún no toca).
  const hoyISO = aISO(hoy);

  const [periodo, setPeriodoElegido] = useState<Periodo>(
    () => periodoInicial ?? periodoQueContiene("semana", hoy),
  );
  const [vista, setVistaElegida] = useState<"tareas" | "dias">("tareas");
  const [calendario, setCalendario] = useState(false);
  const [pagina, setPagina] = useState(0);
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

  const verDias = vista === "dias" && periodo.tipo !== "dia";
  const nombre = datos?.alumno?.nombre ?? nombreAlumno;

  const irATipo = (tipo: TipoPeriodo) => {
    setPeriodo(cambiarTipo(periodo, tipo, hoy));
    if (tipo === "dia") setVista("tareas");
  };
  const elegirEnCalendario = (p: Periodo) => {
    setPeriodo(p);
    if (p.tipo === "dia") setVista("tareas");
    setCalendario(false);
  };
  const abrirDia = (fecha: string) => {
    setPeriodo(periodoQueContiene("dia", fecha));
    setVista("tareas");
  };

  return (
    <MarcoPantalla
      titulo={nombre ? `Progreso e historial · ${nombre}` : "Progreso e historial"}
      simbolo={
        <View style={e.simbolo}>
          <Icono nombre="grafica" tam={24} color={colores.primario} />
        </View>
      }
      derecha={<UsuarioYSalir usuario={usuario} alCerrarSesion={alCerrarSesion} />}
      atras={alAtras}
      testID="pantalla-43-progreso"
    >
      <View style={e.contenedor}>
        {/* 1. Periodo: tipo y desplegable con el calendario */}
        <View style={e.filaPeriodo}>
          <View style={e.segmentos} accessibilityRole="tablist">
            {TIPOS.map(({ tipo, texto }, i) => {
              const elegido = periodo.tipo === tipo;
              return (
                <Pressable
                  key={tipo}
                  accessibilityRole="tab"
                  accessibilityLabel={`Ver por ${texto.toLowerCase()}`}
                  accessibilityState={{ selected: elegido }}
                  onPress={() => irATipo(tipo)}
                  style={({ pressed }) => [
                    e.segmento,
                    i > 0 && e.segmentoConBorde,
                    elegido && e.segmentoElegido,
                    pressed && !elegido && e.pulsado,
                  ]}
                  testID={`periodo-${tipo}`}
                >
                  <Texto style={[e.textoSegmento, elegido && e.textoSegmentoElegido]}>
                    {texto}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${textoPeriodo(periodo, hoy)}. ${calendario ? "Cerrar" : "Abrir"} el calendario para elegir ${
              periodo.tipo === "dia"
                ? "otro día"
                : periodo.tipo === "semana"
                  ? "otra semana"
                  : "otro mes"
            }`}
            accessibilityState={{ expanded: calendario }}
            onPress={() => setCalendario(!calendario)}
            style={({ pressed }) => [
              e.desplegable,
              calendario && e.desplegableAbierto,
              pressed && e.pulsado,
            ]}
            testID="abrir-calendario"
          >
            <Icono nombre="calendario" tam={22} color={colores.primario} />
            <Texto
              style={e.textoPeriodo}
              numberOfLines={escalaLetra > 1 ? 2 : 1}
              testID="texto-periodo"
            >
              {textoPeriodo(periodo, hoy)}
            </Texto>
            <Icono nombre={calendario ? "arriba" : "abajo"} tam={22} color={colores.primario} />
          </Pressable>
          <View style={e.hueco} />
          {periodo.tipo !== "dia" ? (
            <Boton
              texto={verDias ? "Ver tareas" : "Ver días"}
              icono={verDias ? "lista" : "calendario"}
              alPulsar={() => {
                setCalendario(false);
                setVista(verDias ? "tareas" : "dias");
              }}
              testID="cambiar-vista"
            />
          ) : null}
        </View>

        {calendario ? (
          // El calendario va en el sitio de lo de abajo: al elegir o cerrar, vuelve todo.
          <CalendarioPeriodo
            key={periodo.tipo}
            tipo={periodo.tipo}
            periodo={periodo}
            hoy={hoy}
            alElegir={elegirEnCalendario}
            alCerrar={() => setCalendario(false)}
          />
        ) : (
          <>
            {/* 2. Indicadores */}
            <Indicadores datos={datos} hoy={hoyISO} />

            <View style={e.zona}>
              {/* 3. Tabla de tareas o de días (izquierda) */}
              <Tabla
                datos={datos}
                cargando={cargando}
                error={error}
                recargar={recargar}
                conDia={periodo.tipo !== "dia"}
                verDias={verDias}
                pagina={pagina}
                alCambiarPagina={setPagina}
                alAbrirDia={abrirDia}
                hoy={hoyISO}
              />
              {/* 4. Resumen del periodo (derecha) */}
              <ResumenPeriodo datos={error ? null : datos} hoy={hoyISO} />
            </View>
          </>
        )}
      </View>
    </MarcoPantalla>
  );
}

/** Quién ha entrado (iniciales y nombre) y el botón «Salir», a la derecha de la cabecera. */
function UsuarioYSalir({
  usuario,
  alCerrarSesion,
}: {
  usuario?: string;
  alCerrarSesion?: () => void;
}) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  if (!usuario && !alCerrarSesion) return null;
  return (
    <View style={e.cabeceraDerecha}>
      {usuario ? (
        <View
          style={e.usuario}
          accessible
          accessibilityLabel={`Has entrado como ${usuario}`}
          testID="usuario-cabecera"
        >
          <View style={e.avatar}>
            <Texto style={e.iniciales}>{iniciales(usuario)}</Texto>
          </View>
          <Texto style={e.nombreUsuario} numberOfLines={1}>
            {usuario}
          </Texto>
        </View>
      ) : null}
      {alCerrarSesion ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={alCerrarSesion}
          style={({ pressed }) => [e.salir, pressed && e.pulsado]}
          testID="cerrar-sesion"
        >
          <Icono nombre="salir" tam={20} color={colores.texto} />
          <Texto style={e.textoSalir}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );
}

/** «Carmen Ruiz» → «CR»; «tutor.docente@…» → «TD». */
export function iniciales(nombre: string): string {
  const palabras = nombre
    .split("@")[0]
    .split(/[\s._-]+/)
    .filter(Boolean);
  return palabras
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

/** Los tres indicadores del periodo, como en el boceto. */
function Indicadores({ datos, hoy }: { datos: ProgresoAlumno | null; hoy: string }) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const r = datos?.resumen;
  const pct = r ? porcentajeHechas(r.hechas, r.total) : 0;
  const emocion = datos ? emocionMasFrecuente(datos) : null;
  // «Pendientes»: las que se pasaron sin hacer. Debajo, lo que está en curso o aún no toca.
  const pendientes = datos ? contarEstados(datos, hoy).pendientes : 0;
  const detalle = datos ? detallePendientes(datos, hoy) : "";
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
        <Texto style={e.rotulo}>COMPLETADAS EN EL PERIODO</Texto>
        <Texto style={[e.valor, { color: colores.exito }]}>
          {r ? `${r.hechas} de ${r.total}` : "—"}
        </Texto>
      </View>
      <View
        style={e.indicador}
        testID="kpi-pendientes"
        accessible
        accessibilityLabel={datos ? `Pendientes: ${pendientes}. ${detalle}` : "Pendientes"}
      >
        <Texto style={e.rotulo}>PENDIENTES</Texto>
        <Texto style={[e.valor, { color: colores.aviso }]}>
          {datos ? String(pendientes) : "—"}
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
        <Texto style={e.rotulo}>EMOCIÓN MÁS FRECUENTE</Texto>
        <Texto style={e.valor} numberOfLines={1}>
          {emocion ? `${emocion.etiqueta} (${emocion.porcentaje} %)` : "Sin datos"}
        </Texto>
      </View>
    </View>
  );
}

/** La tabla de la izquierda: tareas o días, por páginas según el alto que hay. */
function Tabla({
  datos,
  cargando,
  error,
  recargar,
  conDia,
  verDias,
  pagina,
  alCambiarPagina,
  alAbrirDia,
  hoy,
}: {
  datos: ProgresoAlumno | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  conDia: boolean;
  verDias: boolean;
  pagina: number;
  alCambiarPagina: (p: number) => void;
  alAbrirDia: (fecha: string) => void;
  /** AAAA-MM-DD. */
  hoy: string;
}) {
  const e = useEstilos(crearEstilos);
  const { colores, escalaLetra } = useApariencia();
  const [filasPorPagina, setFilasPorPagina] = useState(FILAS_POR_DEFECTO);
  const altoFila = Math.round(ALTO_FILA * escalaLetra);
  const medirCuerpo = (ev: LayoutChangeEvent) => {
    const filas = Math.max(1, Math.floor(ev.nativeEvent.layout.height / altoFila));
    if (filas !== filasPorPagina) setFilasPorPagina(filas);
  };

  const lista: readonly (TareaProgreso | DiaProgreso)[] = !datos
    ? []
    : verDias
      ? datos.dias
      : datos.tareas;
  const pag = paginar(lista, filasPorPagina, pagina);

  return (
    <View style={e.tabla} testID="tabla-progreso">
      {verDias ? <CabeceraDias /> : <CabeceraTareas conDia={conDia} />}
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
          (pag.elementos as DiaProgreso[]).map((d) => (
            <FilaDia key={d.fecha} dia={d} altoFila={altoFila} alAbrirDia={alAbrirDia} />
          ))
        ) : (
          (pag.elementos as TareaProgreso[]).map((t) => (
            <FilaTarea key={t.id} tarea={t} conDia={conDia} altoFila={altoFila} hoy={hoy} />
          ))
        )}
      </View>
      <View style={e.paginas}>
        <Boton
          icono="atras"
          texto="Anteriores"
          alPulsar={pag.pagina > 0 ? () => alCambiarPagina(pag.pagina - 1) : null}
          testID="pagina-anterior"
        />
        <Texto style={e.textoPagina} testID="texto-pagina">
          {`Página ${pag.pagina + 1} de ${pag.paginas}`}
        </Texto>
        <Boton
          icono="siguiente"
          iconoDetras
          texto="Siguientes"
          alPulsar={pag.pagina < pag.paginas - 1 ? () => alCambiarPagina(pag.pagina + 1) : null}
          testID="pagina-siguiente"
        />
      </View>
    </View>
  );
}

function CabeceraTareas({ conDia }: { conDia: boolean }) {
  const e = useEstilos(crearEstilos);
  const { escalaLetra } = useApariencia();
  const ancho = (n: number) => ({ width: Math.round(n * escalaLetra) });
  return (
    <View style={[e.fila, e.filaCabecera]} accessibilityElementsHidden>
      <Texto style={[e.celdaCabecera, e.colTarea]}>Tarea y ámbito</Texto>
      <Texto style={[e.celdaCabecera, ancho(conDia ? COLUMNAS.cuando : COLUMNAS.hora)]}>
        {conDia ? "Cuándo" : "Hora"}
      </Texto>
      <Texto style={[e.celdaCabecera, ancho(COLUMNAS.estado)]}>Estado</Texto>
      <Texto style={[e.celdaCabecera, ancho(COLUMNAS.emocion)]}>Emoción</Texto>
    </View>
  );
}

function CabeceraDias() {
  const e = useEstilos(crearEstilos);
  const { escalaLetra } = useApariencia();
  const ancho = (n: number) => ({ width: Math.round(n * escalaLetra) });
  return (
    <View style={[e.fila, e.filaCabecera]} accessibilityElementsHidden>
      <Texto style={[e.celdaCabecera, e.colTarea]}>Día</Texto>
      <Texto style={[e.celdaCabecera, ancho(COLUMNAS.hechas)]}>Tareas hechas</Texto>
      <Texto style={[e.celdaCabecera, ancho(COLUMNAS.porcentaje)]}>Porcentaje</Texto>
      <View style={e.colAbrir} />
    </View>
  );
}

function FilaTarea({
  tarea: t,
  conDia,
  altoFila,
  hoy,
}: {
  tarea: TareaProgreso;
  conDia: boolean;
  altoFila: number;
  hoy: string;
}) {
  const e = useEstilos(crearEstilos);
  const { escalaLetra } = useApariencia();
  const ancho = (n: number) => ({ width: Math.round(n * escalaLetra) });
  const estado = estadoVisible(t, hoy);
  // Con letra grande la columna de la tarea se estrecha: deja dos líneas para que se lea.
  const lineasTarea = escalaLetra > 1 ? 2 : 1;
  const ambito = etiquetaAmbito(t.ambito);
  const emocion = t.emocion ? etiquetaEmocion(t.emocion) : null;
  const hora = t.hora ?? "sin hora";
  return (
    <View
      style={[e.fila, { height: altoFila }]}
      testID={`fila-tarea-${t.id}`}
      accessible
      accessibilityLabel={[
        `${t.titulo}, ${ambito.toLowerCase()}${t.plan_b ? ", con Plan B" : ""}`,
        conDia ? textoDiaCorto(t.fecha) : null,
        hora,
        estado.texto,
        emocion ? `se sintió ${emocion.toLowerCase()}` : null,
      ]
        .filter(Boolean)
        .join(". ")}
    >
      <Texto style={[e.celda, e.colTarea]} numberOfLines={lineasTarea}>
        <Texto style={e.titulo}>{t.titulo}</Texto>
        {` · ${ambito}`}
        {t.plan_b ? <Texto style={e.planB}>{" · Plan B"}</Texto> : null}
      </Texto>
      <Texto
        style={[e.celda, e.celdaApoyo, ancho(conDia ? COLUMNAS.cuando : COLUMNAS.hora)]}
        numberOfLines={1}
      >
        {conDia ? `${textoDiaCorto(t.fecha)} · ${t.hora ?? "—"}` : (t.hora ?? "—")}
      </Texto>
      <View style={ancho(COLUMNAS.estado)}>
        <Etiqueta texto={estado.texto} tono={estado.tono} />
      </View>
      <Texto style={[e.celda, ancho(COLUMNAS.emocion)]} numberOfLines={1}>
        {emocion ?? "—"}
      </Texto>
    </View>
  );
}

function FilaDia({
  dia: d,
  altoFila,
  alAbrirDia,
}: {
  dia: DiaProgreso;
  altoFila: number;
  alAbrirDia: (fecha: string) => void;
}) {
  const e = useEstilos(crearEstilos);
  const { colores, escalaLetra } = useApariencia();
  const ancho = (n: number) => ({ width: Math.round(n * escalaLetra) });
  const pct = porcentajeHechas(d.hechas, d.total);
  return (
    <Pressable
      style={({ pressed }) => [e.fila, { height: altoFila }, pressed && e.pulsado]}
      onPress={() => alAbrirDia(d.fecha)}
      accessibilityRole="button"
      accessibilityLabel={`${textoDiaCorto(d.fecha)}: ${d.hechas} de ${d.total} hechas. Abrir ese día`}
      testID={`fila-dia-${d.fecha}`}
    >
      <Texto style={[e.celda, e.colTarea, e.titulo]} numberOfLines={1}>
        {textoDiaCorto(d.fecha)}
      </Texto>
      <Texto style={[e.celda, ancho(COLUMNAS.hechas)]} numberOfLines={1}>
        {`${d.hechas} de ${d.total}`}
      </Texto>
      <View style={ancho(COLUMNAS.porcentaje)}>
        <Etiqueta texto={`${pct} %`} tono={pct === 100 ? "exito" : "pendiente"} />
      </View>
      <View style={e.colAbrir}>
        <Icono nombre="siguiente" color={colores.primario} tam={22} />
      </View>
    </Pressable>
  );
}

/** El resumen de la derecha: tarjetas de color que se ajustan al alto que hay (sin scroll). */
function ResumenPeriodo({ datos, hoy }: { datos: ProgresoAlumno | null; hoy: string }) {
  const e = useEstilos(crearEstilos);
  const [compacto, setCompacto] = useState(false);
  // Con datos nuevos se vuelve al detalle completo y se mide otra vez.
  const [datosVistos, setDatosVistos] = useState(datos);
  if (datos !== datosVistos) {
    setDatosVistos(datos);
    setCompacto(false);
  }
  const { detalle, lineas } = compacto ? RESUMEN_COMPACTO : RESUMEN_COMPLETO;
  const tarjetas = datos ? tarjetasResumen(datos, hoy, detalle) : [];
  const alto = useRef({ caja: 0, contenido: 0 });
  const comprobar = () => {
    const { caja, contenido } = alto.current;
    const cabe = contenido <= caja - 2 * FORMA.borde + 0.5;
    if (caja > 0 && !cabe && !compacto) setCompacto(true);
  };
  return (
    <View
      style={e.resumen}
      testID="resumen-periodo"
      onLayout={(ev) => {
        alto.current.caja = ev.nativeEvent.layout.height;
        comprobar();
      }}
    >
      <View
        style={e.contenidoResumen}
        testID="contenido-resumen"
        onLayout={(ev) => {
          alto.current.contenido = ev.nativeEvent.layout.height;
          comprobar();
        }}
      >
        <Texto style={e.tituloResumen} accessibilityRole="header">
          Resumen del periodo seleccionado
        </Texto>
        {tarjetas.map((t) => (
          <TarjetaDeResumen key={t.id} {...t} lineas={lineas} />
        ))}
      </View>
    </View>
  );
}

/** Una tarjeta del resumen: título en negrita y detalle, con el color de su tono. */
function TarjetaDeResumen({
  id,
  tono,
  titulo,
  texto,
  lineas,
}: {
  id: string;
  tono: TonoTarjeta;
  titulo: string;
  texto: string;
  /** Sin valor, el texto se ve entero. */
  lineas?: number;
}) {
  const e = useEstilos(crearEstilos);
  const { colores } = useApariencia();
  const { fondo, borde } = coloresTarjeta(tono, colores);
  return (
    <View
      style={[e.tarjetaResumen, { backgroundColor: fondo, borderColor: borde }]}
      testID={`resumen-${id}`}
    >
      <Texto style={e.textoTarjeta} numberOfLines={lineas}>
        <Texto style={e.titulo}>{titulo}</Texto>
        {` ${texto}`}
      </Texto>
    </View>
  );
}

function coloresTarjeta(tono: TonoTarjeta, c: Paleta): { fondo: string; borde: string } {
  switch (tono) {
    case "exito":
      return { fondo: c.exitoSuave, borde: c.exito };
    case "primario":
      return { fondo: c.superficieDestacada, borde: c.primario };
    case "pendiente":
      return { fondo: c.resalteSuave, borde: c.resalte };
    case "peligro":
      return { fondo: c.peligroSuave, borde: c.peligro };
    default:
      return { fondo: c.superficie, borde: c.borde };
  }
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    simbolo: {
      width: 42,
      height: 42,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    cabeceraDerecha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    usuario: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 46,
      paddingLeft: 5,
      paddingRight: 16,
      maxWidth: 260,
      borderWidth: 1.5,
      borderColor: c.borde,
      borderRadius: 23,
      backgroundColor: c.superficie,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    iniciales: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primario,
    },
    nombreUsuario: {
      flexShrink: 1,
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    salir: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 46,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
    },
    textoSalir: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
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
      gap: 12,
    },
    segmentos: {
      flexDirection: "row",
      borderWidth: FORMA.borde,
      borderColor: c.primario,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      overflow: "hidden",
    },
    segmento: {
      minHeight: 50,
      minWidth: 92,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentoConBorde: {
      borderLeftWidth: FORMA.borde,
      borderLeftColor: c.primario,
    },
    segmentoElegido: {
      backgroundColor: c.primario,
    },
    textoSegmento: {
      fontSize: 17,
      fontWeight: "700",
      color: c.primario,
    },
    textoSegmentoElegido: {
      color: c.textoSobrePrimario,
    },
    desplegable: {
      flexShrink: 1,
      minWidth: 380,
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingLeft: 16,
      paddingRight: 14,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
    },
    desplegableAbierto: {
      borderColor: c.primario,
    },
    textoPeriodo: {
      flexShrink: 1,
      fontSize: 17,
      fontWeight: "700",
      color: c.texto,
    },
    hueco: {
      flex: 1,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
    },
    filaIndicadores: {
      flexDirection: "row",
      gap: 14,
    },
    indicador: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
    },
    rotulo: {
      fontSize: 14,
      lineHeight: 18,
      color: c.textoSecundario,
      textTransform: "uppercase",
    },
    valor: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "700",
      color: c.texto,
    },
    zona: {
      flex: 1,
      flexDirection: "row",
      gap: 16,
    },
    tabla: {
      flex: 7,
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
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    filaCabecera: {
      minHeight: 40,
      paddingVertical: 6,
      backgroundColor: c.fondo,
    },
    celdaCabecera: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textoSecundario,
      textTransform: "uppercase",
    },
    celda: {
      fontSize: 16.5,
      // Interlineado fijo: con letra grande caben dos líneas de la tarea en el alto de la fila.
      lineHeight: 22,
      color: c.texto,
    },
    celdaApoyo: {
      color: c.textoSecundario,
    },
    titulo: {
      fontWeight: "700",
      color: c.texto,
    },
    planB: {
      fontWeight: "700",
      color: c.primario,
    },
    colTarea: { flex: 1 },
    colAbrir: { width: 28, alignItems: "flex-end" },
    paginas: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: c.borde,
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
      flex: 3,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      overflow: "hidden",
    },
    contenidoResumen: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 8,
    },
    tituloResumen: {
      fontSize: 19,
      fontWeight: "700",
      color: c.texto,
    },
    tarjetaResumen: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderWidth: 1.5,
      borderRadius: FORMA.radioPequeno,
    },
    textoTarjeta: {
      fontSize: 15,
      lineHeight: 20,
      color: c.texto,
    },
  });
