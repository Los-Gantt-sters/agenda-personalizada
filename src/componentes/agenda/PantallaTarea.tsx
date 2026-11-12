// Pantalla de una tarea (HU-06 RF4.4 y HU-08), según lo que pidió la profesora en noviembre de 2026:
// - Arriba, en la cabecera, el nombre de la tarea. En medio, en grande, cómo se ve la tarea; el
//   dibujo manda y es lo más grande.
// - Cómo se ve sale de las preferencias («Qué se ve»), pero dentro de la tarea se puede cambiar con
//   los tres botones de la cabecera (dibujo y texto, solo dibujo, solo texto). El cambio vale solo
//   para esta tarea: no toca las preferencias.
// - El reloj es pequeño y se puede quitar en las preferencias.
// - Al pulsar «Empezar» solo se ve esta tarea, sin «Hecho» ni «Después», con lo mismo que el detalle
//   (descripción y pasos) y el botón «Terminar». «Atrás» deshace «Empezar» por si se ha equivocado.
// - Al tocar una tarjeta de la agenda se abre esta misma pantalla, sin reloj ni «Terminar»: es el
//   detalle (antes era una ventana emergente). «Atrás» vuelve a la agenda.
// RNF4.1: sin scroll; los pasos se ven de uno en uno con las flechas.
import { useState, type ReactNode } from "react";
import { Linking, Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import type { EntradaAgenda } from "./tipos";
import { franjaHoraria } from "./logica";
import { RADIO } from "./colores";
import { PictogramaTarea } from "./PictogramaTarea";
import { BotonAccionTarea } from "../ejecucion-tarea/BotonAccionTarea";
import { useTranscurrido } from "../ejecucion-tarea/useTranscurrido";
import { RelojVisual } from "../reloj-visual/RelojVisual";
import { textoTiempoRestante } from "../reloj-visual/textoTiempo";
import { Pantalla } from "../../pantalla/Pantalla";
import type { ModoCanal } from "../../preferencias/opciones";
import { leer, puedeLeer } from "../../servicios/voz";
import type { Paleta } from "../../temas";
import {
  Icono,
  PictogramaInterfaz,
  Texto,
  useApariencia,
  useEstilos,
  type NombreIcono,
} from "../../ui";

/** Lado del reloj dentro de la tarea: pequeño siempre (petición de la profesora). */
export const TAM_RELOJ_TAREA = 100;

/** Hora local «9:32» de una fecha ISO. */
function horaDe(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const FORMATOS: { modo: ModoCanal; etiqueta: string; iconos: NombreIcono[] }[] = [
  { modo: "ambos", etiqueta: "Ver dibujo y texto", iconos: ["imagen", "lista"] },
  { modo: "soloPictograma", etiqueta: "Ver solo el dibujo", iconos: ["imagen"] },
  { modo: "soloTexto", etiqueta: "Ver solo el texto", iconos: ["lista"] },
];

export function PantallaTarea({
  entrada,
  enCurso,
  alAtras,
  etiquetaAtras,
  onTerminar,
  verReloj = true,
  conSonido = false,
  aviso,
  pie,
}: {
  entrada: EntradaAgenda;
  /** La tarea se está haciendo: reloj (si se quiere) y «Terminar». Si no, es el detalle. */
  enCurso: boolean;
  alAtras: () => void;
  etiquetaAtras: string;
  /** «Terminar». Sin él (familias, detalle) no sale el botón. */
  onTerminar?: () => void;
  /** Preferencia «Reloj»: si se ve el reloj mientras se hace la tarea. */
  verReloj?: boolean;
  conSonido?: boolean;
  /** Aviso de la tarea siguiente (franja de arriba), si lo hay. */
  aviso?: ReactNode;
  /** Aviso discreto de abajo (sin conexión, no se ha guardado). */
  pie?: ReactNode;
}) {
  const { colores, canal, escalaLetra: L } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  // Formato elegido dentro de la tarea; mientras no se toque, el de las preferencias.
  const [formatoElegido, setFormatoElegido] = useState<ModoCanal | null>(null);
  const formato = formatoElegido ?? canal;
  const verDibujo = formato !== "soloTexto";
  const verTexto = formato !== "soloPictograma";

  const t = entrada.tarea;
  const pasos = (t.pasos ?? []).slice().sort((a, b) => a.orden - b.orden);
  const [paso, setPaso] = useState(0);
  const p = pasos[Math.min(paso, Math.max(0, pasos.length - 1))];

  const empezada = enCurso && Boolean(entrada.inicio_real);
  const conReloj = empezada && verReloj;
  const transcurridoMs = useTranscurrido(empezada ? entrada.inicio_real : null);

  const hora =
    empezada && entrada.inicio_real
      ? `Empezaste a las ${horaDe(entrada.inicio_real)}`
      : franjaHoraria(entrada);
  const estado =
    entrada.estado === "hecha"
      ? { icono: "check" as const, color: colores.exito, texto: "Ya la has hecho" }
      : entrada.estado === "bloqueada"
        ? { icono: "candado" as const, color: colores.aviso, texto: "Hoy no toca" }
        : null;
  const textoVoz = [
    t.titulo,
    hora,
    t.descripcion,
    p ? `Paso ${pasos.indexOf(p) + 1}. ${p.texto}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  // Medidas: el dibujo se queda con todo el alto que pueda (es lo más importante de la pantalla).
  const ancho = area?.width ?? ventana.width;
  const alto = area?.height ?? ventana.height - 170;
  const horizontal = ancho >= alto;
  const altoTitulo = verDibujo && verTexto ? 2 * 34 * 1.3 * L + 12 : 0;
  const tamPicto = Math.max(
    96,
    horizontal
      ? Math.min(ancho * 0.48 - 40, alto - 40 - altoTitulo, 460)
      : Math.min(ancho - 40, alto * 0.45 - altoTitulo, 420),
  );
  const nPaso = p ? pasos.indexOf(p) : 0;
  // Con letra grande, lo primero es que el paso se lea entero. Para que quepa sin scroll se quitan
  // la descripción (si hay pasos) y la hora de inicio (si ya se ve el reloj con «Quedan...»); las
  // dos se oyen enteras con «Escuchar».
  const letraGrande = L > 1.1;
  const verDescripcion = verTexto && Boolean(t.descripcion) && !(letraGrande && p);
  const verHora = !(letraGrande && conReloj);
  const quedan = textoTiempoRestante(entrada.duracion_prevista_min * 60_000 - transcurridoMs);

  return (
    <Pantalla
      titulo={t.titulo}
      derecha={
        <View
          style={e.formatos}
          accessibilityRole="radiogroup"
          accessibilityLabel="Cómo se ve la tarea"
          testID="selector-formato"
        >
          {FORMATOS.map((f) => {
            const elegido = formato === f.modo;
            return (
              <Pressable
                key={f.modo}
                accessibilityRole="radio"
                accessibilityLabel={f.etiqueta}
                accessibilityState={{ checked: elegido, selected: elegido }}
                testID={`formato-${f.modo}`}
                onPress={() => setFormatoElegido(f.modo)}
                style={({ pressed }) => [
                  e.formato,
                  elegido && e.formatoElegido,
                  pressed && e.pulsado,
                ]}
              >
                {f.iconos.map((n) => (
                  <Icono
                    key={n}
                    nombre={n}
                    color={elegido ? colores.textoSobrePrimario : colores.primario}
                    tam={24}
                  />
                ))}
              </Pressable>
            );
          })}
        </View>
      }
      alAtras={alAtras}
      etiquetaAtras={etiquetaAtras}
      conSonido={conSonido}
      testID={enCurso ? "pantalla-tarea-en-curso" : "pantalla-tarea"}
    >
      {aviso}
      <View
        style={[e.cuerpo, { flexDirection: horizontal ? "row" : "column" }]}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
            setArea({ width, height });
        }}
      >
        {/* En medio y en grande: el dibujo de la tarea (y su nombre, si se quiere ver). */}
        <View
          style={[e.visual, horizontal ? { width: ancho * 0.5 } : null]}
          testID="tarea-visual"
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${t.titulo}${enCurso ? ", en curso" : ""}`}
        >
          {verDibujo ? <PictogramaTarea tarea={t} tam={tamPicto} /> : null}
          {verTexto ? (
            <Texto
              style={[e.tituloGrande, { fontSize: verDibujo ? 34 : 60 }]}
              numberOfLines={verDibujo ? 2 : 4}
              testID="tarea-titulo-grande"
            >
              {t.titulo}
            </Texto>
          ) : null}
        </View>

        {/* Al lado: el reloj pequeño y cuánto queda, la descripción, los pasos y «Terminar». */}
        <View style={e.panel}>
          <View style={e.filaHora}>
            {conReloj ? (
              <View testID="reloj-tarea">
                {/* El rótulo va al lado, no debajo: así el reloj ocupa poco. */}
                <RelojVisual
                  duracionMs={entrada.duracion_prevista_min * 60_000}
                  transcurridoMs={transcurridoMs}
                  tamano={TAM_RELOJ_TAREA}
                  mostrarRotulo={false}
                />
              </View>
            ) : null}
            {verTexto ? (
              <View style={e.columnaHora}>
                {conReloj ? <Texto style={e.quedan}>{quedan}</Texto> : null}
                {verHora ? (
                  <Linea icono="reloj" color={colores.textoSecundario}>
                    {hora}
                  </Linea>
                ) : null}
                {estado ? (
                  <Linea icono={estado.icono} color={estado.color}>
                    {estado.texto}
                  </Linea>
                ) : null}
              </View>
            ) : estado ? (
              <Icono nombre={estado.icono} color={estado.color} tam={40} />
            ) : null}
          </View>

          {verDescripcion ? (
            <Texto style={e.descripcion} numberOfLines={2} testID="tarea-descripcion">
              {t.descripcion}
            </Texto>
          ) : null}

          {p ? (
            <View style={e.paso} testID="paso-tarea">
              {pasos.length > 1 ? (
                <Flecha
                  icono="atras"
                  etiqueta="Paso anterior"
                  desactivado={nPaso === 0}
                  onPress={() => setPaso(nPaso - 1)}
                />
              ) : null}
              {p.pictograma_url && verDibujo ? (
                <PictogramaTarea
                  tarea={{ titulo: p.texto, pictograma_url: p.pictograma_url, emoji: "" }}
                  tam={72}
                />
              ) : (
                // Sin dibujo del paso: el número grande ayuda a seguir el orden.
                <View style={e.numeroPaso} accessibilityElementsHidden>
                  <Texto style={e.numeroPasoTexto}>{nPaso + 1}</Texto>
                </View>
              )}
              <Texto
                style={e.textoPaso}
                numberOfLines={letraGrande ? 4 : 3}
                accessibilityLabel={`Paso ${nPaso + 1} de ${pasos.length}: ${p.texto}`}
              >
                {verTexto ? `Paso ${nPaso + 1} de ${pasos.length}: ${p.texto}` : ""}
              </Texto>
              {pasos.length > 1 ? (
                <Flecha
                  icono="adelante"
                  etiqueta="Paso siguiente"
                  desactivado={nPaso >= pasos.length - 1}
                  onPress={() => setPaso(nPaso + 1)}
                />
              ) : null}
            </View>
          ) : null}

          <View style={e.filaBotones}>
            {onTerminar ? (
              <BotonAccionTarea accion="terminar" onConfirmar={onTerminar} anchoMinimo={260} />
            ) : null}
            {puedeLeer ? (
              <BotonPequeno
                texto="Escuchar"
                // Con letra grande, solo el dibujo: así cabe al lado de «Terminar».
                verTexto={verTexto && !letraGrande}
                dibujo={<PictogramaInterfaz nombre="escuchar" etiqueta="Escuchar" tam={36} />}
                onPress={() => leer(textoVoz)}
              />
            ) : null}
            {t.video_url ? (
              <BotonPequeno
                texto="Ver vídeo"
                verTexto={verTexto && !letraGrande}
                dibujo={<Icono nombre="reproducir" color={colores.primario} tam={26} />}
                onPress={() => Linking.openURL(t.video_url!)}
              />
            ) : null}
          </View>
        </View>
      </View>
      {pie}
    </Pantalla>
  );
}

/** Línea con un icono delante (hora, «Ya la has hecho», «Hoy no toca»). */
function Linea({
  icono,
  color,
  children,
}: {
  icono: NombreIcono;
  color: string;
  children: ReactNode;
}) {
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.linea}>
      <Icono nombre={icono} color={color} tam={26} />
      <Texto style={[e.hora, { color }]}>{children}</Texto>
    </View>
  );
}

function BotonPequeno({
  texto,
  verTexto,
  dibujo,
  onPress,
}: {
  texto: string;
  verTexto: boolean;
  dibujo: ReactNode;
  onPress: () => void;
}) {
  const e = useEstilos(crearEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => [e.botonPequeno, pressed && e.pulsado]}
    >
      {dibujo}
      {verTexto ? <Texto style={e.textoBotonPequeno}>{texto}</Texto> : null}
    </Pressable>
  );
}

function Flecha({
  icono,
  etiqueta,
  desactivado,
  onPress,
}: {
  icono: NombreIcono;
  etiqueta: string;
  desactivado: boolean;
  onPress: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: desactivado }}
      disabled={desactivado}
      onPress={onPress}
      style={({ pressed }) => [e.flecha, desactivado && e.apagado, pressed && e.pulsado]}
    >
      <Icono nombre={icono} color={colores.primario} tam={30} grosor={3} />
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    formatos: { flexDirection: "row", gap: 8 },
    formato: {
      minWidth: 56,
      minHeight: 52,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    formatoElegido: { backgroundColor: c.primario },
    cuerpo: { flex: 1, gap: 24, padding: 20, minHeight: 0 },
    visual: {
      flexShrink: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      minHeight: 0,
    },
    tituloGrande: { fontWeight: "700", color: c.texto, textAlign: "center" },
    panel: { flex: 1, justifyContent: "center", gap: 14, minHeight: 0, minWidth: 0 },
    filaHora: { flexDirection: "row", alignItems: "center", gap: 18 },
    columnaHora: { flex: 1, gap: 6, minWidth: 0 },
    quedan: { fontSize: 24, fontWeight: "700", color: c.texto },
    linea: { flexDirection: "row", alignItems: "center", gap: 10 },
    hora: { flexShrink: 1, fontSize: 22, color: c.textoSecundario },
    filaBotones: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
    botonPequeno: {
      minHeight: 56,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    textoBotonPequeno: { fontSize: 20, fontWeight: "700", color: c.primario },
    descripcion: { fontSize: 24, lineHeight: 32, color: c.texto },
    paso: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: RADIO,
      padding: 10,
    },
    numeroPaso: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    numeroPasoTexto: { fontSize: 30, fontWeight: "700", color: c.primario },
    textoPaso: { flex: 1, fontSize: 22, lineHeight: 30, color: c.texto },
    flecha: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    apagado: { opacity: 0.35 },
    pulsado: { opacity: 0.85 },
  });
