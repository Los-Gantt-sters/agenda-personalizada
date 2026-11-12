// Vista del día en tres bloques (T-06.1, HU-06).
// RF4.2: «Hecho» a la izquierda, «Ahora» en el centro (60 %) y «Después» a la derecha.
// RNF4.2: en vertical o en móvil los bloques se apilan en el mismo orden y «Ahora» sigue al 60 %.
// RNF4.1: sin ScrollView; a cada lado solo se pintan las tarjetas que caben.
// T-08.1 (HU-08): en «Ahora», botón «Empezar» (RF6.1, si el tutor lo pide: RF6.8) y botón
// «Terminar» (RF6.4). Al empezar, AgendaDelDia cambia a la pantalla de la tarea; aquí la tarea en
// curso solo se ve así cuando la mira una familia (soloMirar), con el reloj si se quiere.
// Mejora de la profesora (noviembre de 2026): cuántas tareas se ven en «Hecho» y «Después» sale del
// perfil (1, hasta 3 o todas). Con «todas» las tarjetas son más bajas para que quepan más y, si aun
// así no caben, se dice «y 4 más» en lugar de hacer scroll.
// Con «soloMirar» (familias) no salen «Empezar» ni «Terminar»: la agenda se ve igual, sin tocarla.
// RF3.1: «Qué se ve» (botón Accesibilidad o preferencias): solo dibujos, solo texto o los dos. La
// ayuda de voz sigue leyendo el nombre de cada tarea aunque no se vea escrito.
import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import type { BloquesAgenda, EntradaAgenda } from "./tipos";
import { franjaHoraria, horaCorta, necesitaEmpezar } from "./logica";
import { RADIO } from "./colores";
import { PictogramaTarea } from "./PictogramaTarea";
import { BotonAccionTarea } from "../ejecucion-tarea/BotonAccionTarea";
import { useTranscurrido } from "../ejecucion-tarea/useTranscurrido";
import { RelojVisual } from "../reloj-visual/RelojVisual";
import type { Paleta } from "../../temas";
import { Icono, PictogramaInterfaz, Texto, colorSobre, useApariencia, useEstilos } from "../../ui";
import type { NombrePictogramaInterfaz } from "../../ui";

/** Hora local «9:32» de una fecha ISO. */
function horaDe(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Proporción de los bloques: 1 + 3 + 1 → «Ahora» = 3/5 = 60 %. */
export const PESO_LADO = 1;
export const PESO_AHORA = 3;

const MARGEN = 16;

export interface Medidas {
  horizontal: boolean;
  escala: number;
  /** Tarjetas que caben a cada lado sin scroll. */
  maxLado: number;
  /** Tarjetas bajas (dibujo y nombre en una fila) para que quepan más. */
  compacta: boolean;
  /** Tamaño exacto de cada bloque: «Ahora» = 60 % del espacio útil. */
  lado: { width: number; height: number };
  ahora: { width: number; height: number };
}

/**
 * Decide la disposición y el tamaño de cada bloque para un área dada.
 * maxTareas: cuántas quiere ver el alumno a cada lado (perfil); con más de 3, tarjetas compactas.
 */
export function calcularMedidas(width: number, height: number, maxTareas = 3): Medidas {
  const compacta = maxTareas > 3;
  const horizontal = width >= height;
  // Nunca por debajo de 0,8: en móvil la letra tiene que seguir leyéndose bien.
  const escala = Math.max(0.8, Math.min(1.35, Math.min(width / 1024, height / 768)));
  const total = PESO_LADO * 2 + PESO_AHORA;
  const utilAncho = width - MARGEN * 2;
  const utilAlto = height - MARGEN * 2;
  let lado: Medidas["lado"];
  let ahora: Medidas["ahora"];
  let maxLado: number;
  if (horizontal) {
    const util = utilAncho - MARGEN * 2; // dos huecos entre bloques
    lado = { width: (util * PESO_LADO) / total, height: utilAlto };
    ahora = { width: (util * PESO_AHORA) / total, height: utilAlto };
    // Normal: dibujo arriba y texto debajo. Compacta: dibujo y nombre en una fila.
    const altoMini = compacta ? ALTO_COMPACTA * escala + 10 : 150 * escala + 12;
    const hueco = utilAlto - 24 - 40 * escala - (compacta ? 30 * escala : 0); // «y 4 más»
    maxLado = Math.floor(hueco / altoMini);
  } else {
    const util = utilAlto - MARGEN * 2;
    lado = { width: utilAncho, height: (util * PESO_LADO) / total };
    ahora = { width: utilAncho, height: (util * PESO_AHORA) / total };
    maxLado = Math.floor((utilAncho - 24) / ((compacta ? 150 : 220) * escala + 12));
  }
  // Nunca más de las que pide el perfil, ni más de las que caben.
  return {
    horizontal,
    escala,
    maxLado: Math.max(1, Math.min(maxTareas, maxLado)),
    compacta,
    lado,
    ahora,
  };
}

/** Alto de la tarjeta compacta (a escala 1). */
const ALTO_COMPACTA = 78;

export function AgendaTresBloques({
  bloques,
  onEmpezar = () => {},
  onConfirmarFin,
  onAbrir,
  maxTareas = 3,
  soloMirar = false,
  verReloj = true,
}: {
  bloques: BloquesAgenda;
  /** Cuántas tareas enseñar en «Hecho» y en «Después» (preferencia «Tareas que se ven»). */
  maxTareas?: number;
  /** Familias: ven la agenda pero no pueden empezar ni terminar tareas. */
  soloMirar?: boolean;
  /** RF6.1: «Empezar». Solo se usa si la tarea lo pide (RF6.8). */
  onEmpezar?: (idEntrada: string) => void;
  onConfirmarFin: (idEntrada: string) => void;
  onAbrir: (entrada: EntradaAgenda) => void;
  /** Preferencia «Reloj»: si se ve el reloj de la tarea en curso. */
  verReloj?: boolean;
}) {
  const ventana = useWindowDimensions();
  // Se mide el hueco real (puede no ser toda la ventana: márgenes seguros, etc.).
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const m = calcularMedidas(
    area?.width ?? ventana.width,
    area?.height ?? ventana.height,
    maxTareas,
  );
  const { horizontal, escala, maxLado, compacta } = m;
  const estilos = useEstilos(crearEstilos);

  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
          setArea({ width, height });
      }}
      style={[estilos.raiz, { flexDirection: horizontal ? "row" : "column" }]}
    >
      <Bloque
        tipo="hecho"
        etiqueta="Hecho"
        entradas={bloques.hecho.slice(-maxLado)}
        ocultas={Math.max(0, bloques.hecho.length - maxLado)}
        vacio={{ texto: "Todavía nada", pictograma: "esperar" }}
        horizontal={horizontal}
        compacta={compacta}
        escala={escala}
        tam={m.lado}
        onAbrir={onAbrir}
      />
      <BloqueAhora
        bloques={bloques}
        escala={escala}
        tam={m.ahora}
        onAbrir={onAbrir}
        onEmpezar={onEmpezar}
        onConfirmarFin={onConfirmarFin}
        soloMirar={soloMirar}
        verReloj={verReloj}
      />
      <Bloque
        tipo="despues"
        etiqueta="Después"
        entradas={bloques.despues.slice(0, maxLado)}
        ocultas={Math.max(0, bloques.despues.length - maxLado)}
        vacio={{ texto: "Nada más hoy", pictograma: "terminar" }}
        horizontal={horizontal}
        compacta={compacta}
        escala={escala}
        tam={m.lado}
        onAbrir={onAbrir}
      />
    </View>
  );
}

function Bloque({
  tipo,
  etiqueta,
  entradas,
  ocultas,
  vacio,
  horizontal,
  compacta,
  escala,
  tam,
  onAbrir,
}: {
  tipo: "hecho" | "despues";
  etiqueta: string;
  entradas: EntradaAgenda[];
  /** Tareas que no caben (se dice «y 2 más», sin scroll). */
  ocultas: number;
  vacio: { texto: string; pictograma: NombrePictogramaInterfaz };
  horizontal: boolean;
  compacta: boolean;
  escala: number;
  tam: { width: number; height: number };
  onAbrir: (e: EntradaAgenda) => void;
}) {
  const nombre = tipo === "hecho" ? "Hecho" : "Después";
  const estilos = useEstilos(crearEstilos);
  return (
    <View
      testID={`bloque-${tipo}`}
      accessibilityRole="summary"
      accessibilityLabel={`${nombre}: ${entradas.length ? entradas.map((e) => e.tarea.titulo).join(", ") : vacio.texto}${ocultas ? ` y ${ocultas} más` : ""}`}
      style={[estilos.bloque, tam]}
    >
      <Texto style={[estilos.etiqueta, { fontSize: 22 * escala }]}>{etiqueta}</Texto>
      <View style={[estilos.lista, { flexDirection: horizontal ? "column" : "row" }]}>
        {entradas.length === 0 ? (
          <View style={estilos.vacio}>
            <PictogramaInterfaz
              nombre={vacio.pictograma}
              etiqueta={vacio.texto}
              tam={72 * escala}
            />
            <Texto style={[estilos.subTexto, estilos.centrado, { fontSize: 18 * escala }]}>
              {vacio.texto}
            </Texto>
          </View>
        ) : (
          entradas.map((e) => (
            <Mini
              key={e.id}
              entrada={e}
              escala={escala}
              horizontal={horizontal}
              compacta={compacta}
              onAbrir={onAbrir}
            />
          ))
        )}
      </View>
      {ocultas > 0 ? (
        <Texto
          style={[estilos.subTexto, estilos.centrado, estilos.mas, { fontSize: 17 * escala }]}
          testID={`mas-${tipo}`}
        >
          {tipo === "hecho" ? `y ${ocultas} antes` : `y ${ocultas} más`}
        </Texto>
      ) : null}
    </View>
  );
}

/**
 * Tarjeta pequeña de «Hecho» o «Después». En horizontal la columna es
 * estrecha, así que el dibujo va arriba y el texto debajo (sin cortar palabras).
 */
function Mini({
  entrada,
  escala,
  horizontal,
  compacta,
  onAbrir,
}: {
  entrada: EntradaAgenda;
  escala: number;
  horizontal: boolean;
  compacta: boolean;
  onAbrir: (e: EntradaAgenda) => void;
}) {
  // Compacta: dibujo y nombre en una sola fila, para ver muchas tareas a la vez.
  const enFila = !horizontal || compacta;
  const hecha = entrada.estado === "hecha";
  const bloqueada = entrada.estado === "bloqueada";
  const estilos = useEstilos(crearEstilos);
  const { colores, canal } = useApariencia();
  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";
  const rellenoSello = hecha ? colores.exito : colores.aviso;
  const sello = (hecha || bloqueada) && (
    <View
      style={[estilos.sello, !verDibujo && estilos.selloEnLinea, { backgroundColor: rellenoSello }]}
    >
      <Icono
        nombre={hecha ? "check" : "candado"}
        color={colorSobre(rellenoSello)}
        tam={18}
        grosor={3}
      />
    </View>
  );
  return (
    <Pressable
      testID={`mini-${entrada.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${entrada.tarea.titulo}, ${entrada.hora_inicio ? `a las ${horaCorta(entrada)}` : "sin hora fija"}${hecha ? ", hecha" : ""}${bloqueada ? ", hoy no toca" : ""}`}
      accessibilityHint="Abre la tarea"
      onPress={() => onAbrir(entrada)}
      style={({ pressed }) => [
        estilos.mini,
        { padding: (compacta ? 6 : 10) * escala },
        horizontal && !compacta
          ? { flexDirection: "column", minHeight: 150 * escala }
          : horizontal
            ? { flexDirection: "row", minHeight: ALTO_COMPACTA * escala }
            : { flexDirection: "row", flex: 1, maxWidth: 360 },
        bloqueada && { borderStyle: "dashed", borderColor: colores.aviso },
        pressed && estilos.pulsado,
      ]}
    >
      {verDibujo ? (
        <View>
          <PictogramaTarea
            tarea={entrada.tarea}
            tam={(compacta ? 48 : verTexto ? 64 : 96) * escala}
          />
          {sello}
        </View>
      ) : (
        sello
      )}
      {verTexto ? (
        <View
          style={[
            { minWidth: 0 },
            enFila ? { flex: 1 } : { alignSelf: "stretch", alignItems: "center" },
          ]}
        >
          <Texto
            style={[
              estilos.miniTitulo,
              { fontSize: (compacta ? 16 : 19) * escala },
              !enFila && { textAlign: "center" },
            ]}
            numberOfLines={2}
          >
            {entrada.tarea.titulo}
          </Texto>
          <Texto
            style={[
              estilos.subTexto,
              { fontSize: (compacta ? 14 : 16) * escala },
              !enFila && estilos.centrado,
            ]}
            numberOfLines={1}
          >
            {bloqueada ? "Hoy no toca" : horaCorta(entrada)}
          </Texto>
        </View>
      ) : null}
    </Pressable>
  );
}

function BloqueAhora({
  bloques,
  escala,
  tam,
  onAbrir,
  onEmpezar,
  onConfirmarFin,
  soloMirar,
  verReloj,
}: {
  bloques: BloquesAgenda;
  escala: number;
  tam: { width: number; height: number };
  onAbrir: (e: EntradaAgenda) => void;
  onEmpezar: (id: string) => void;
  onConfirmarFin: (id: string) => void;
  soloMirar: boolean;
  verReloj: boolean;
}) {
  const ahora = bloques.ahora;
  const estilos = useEstilos(crearEstilos);
  const { colores, canal, escalaLetra: L } = useApariencia();
  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";
  // RF6.1: el reloj visual arranca al pulsar «Empezar» y cuenta desde la hora guardada.
  const enCurso = ahora?.estado === "en_curso" && Boolean(ahora.inicio_real);
  const conReloj = enCurso && verReloj;
  const transcurridoMs = useTranscurrido(enCurso ? ahora?.inicio_real : null);

  // Entrada suave de la nueva tarea al avanzar: un fundido corto, sin saltos bruscos.
  const [aparicion] = useState(() => new Animated.Value(1));
  useEffect(() => {
    aparicion.setValue(0);
    Animated.timing(aparicion, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }, [ahora?.id, aparicion]);

  // El dibujo se queda con el alto que sobra tras etiqueta, título, hora y
  // botón, para que el botón no quede nunca cortado (sin scroll). Los textos crecen con el tamaño
  // de letra del perfil (L); con «Solo pictograma» no hay título ni hora y el dibujo es mayor.
  const bajo = tam.height < 400;
  const fijo =
    12 * 2 +
    12 +
    36 * escala * L +
    (verTexto ? 44 * escala * 1.25 * (bajo ? 1 : 2) * L + 24 * escala * 1.3 * L : 0) +
    72 * L +
    20 * 3 +
    16;
  const tamPicto = Math.max(48, Math.min(tam.width * 0.55, tam.height - fijo, 340));
  // En curso, el dibujo y el reloj van uno al lado del otro (el reloj lleva su rótulo debajo).
  const tamFila = conReloj
    ? Math.max(48, Math.min(tamPicto - 36, (tam.width - 24 * 2 - 24) / 2))
    : tamPicto;
  const accion = ahora && necesitaEmpezar(ahora) ? "empezar" : "terminar";

  return (
    <View
      testID="bloque-ahora"
      accessibilityRole="summary"
      accessibilityLabel={
        ahora
          ? `Ahora: ${ahora.tarea.titulo}${ahora.estado === "en_curso" ? ", en curso" : ""}`
          : "Has terminado todo por hoy"
      }
      style={[estilos.bloque, estilos.bloqueAhora, tam]}
    >
      <Texto style={[estilos.etiqueta, estilos.etiquetaAhora, { fontSize: 26 * escala }]}>
        Ahora
      </Texto>
      <Animated.View style={[estilos.ahoraCuerpo, { opacity: aparicion }]}>
        {ahora ? (
          <>
            <Pressable
              testID={`ahora-${ahora.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${ahora.tarea.titulo}, de ${franjaHoraria(ahora)}`}
              accessibilityHint="Abre la tarea"
              onPress={() => onAbrir(ahora)}
              style={({ pressed }) => [estilos.ahoraTarjeta, pressed && estilos.pulsado]}
            >
              <View style={estilos.filaPicto}>
                {verDibujo ? <PictogramaTarea tarea={ahora.tarea} tam={tamFila} /> : null}
                {conReloj && (
                  <RelojVisual
                    duracionMs={ahora.duracion_prevista_min * 60_000}
                    transcurridoMs={transcurridoMs}
                    tamano={tamFila}
                  />
                )}
              </View>
              {verTexto ? (
                <>
                  <Texto
                    style={[
                      estilos.ahoraTitulo,
                      // Sin dibujo, el nombre de la tarea se ve más grande.
                      { fontSize: (verDibujo ? 44 : 60) * escala },
                    ]}
                    numberOfLines={bajo ? 1 : 2}
                  >
                    {ahora.tarea.titulo}
                  </Texto>
                  <Texto style={[estilos.ahoraHora, { fontSize: 24 * escala }]}>
                    {enCurso && ahora.inicio_real
                      ? `Empezaste a las ${horaDe(ahora.inicio_real)}`
                      : franjaHoraria(ahora)}
                  </Texto>
                </>
              ) : null}
            </Pressable>
            {soloMirar ? (
              <View style={estilos.soloMirar} testID="aviso-solo-mirar">
                <Icono nombre="ojo" color={colores.textoSecundario} tam={26} />
                <Texto style={[estilos.subTexto, { fontSize: 18 * escala }]}>
                  Solo para mirar: la tarea la marca el alumno o su tutor
                </Texto>
              </View>
            ) : (
              /* key: al cambiar de tarea o de acción, el botón vuelve a esperar un momento. */
              <BotonAccionTarea
                key={`${ahora.id}-${accion}`}
                accion={accion}
                onConfirmar={() =>
                  accion === "empezar" ? onEmpezar(ahora.id) : onConfirmarFin(ahora.id)
                }
              />
            )}
          </>
        ) : (
          <View style={estilos.ahoraTarjeta}>
            <PictogramaInterfaz nombre="celebrar" etiqueta="Fin del día" tam={tamPicto * 0.8} />
            <Texto style={[estilos.ahoraTitulo, { fontSize: 40 * escala }]}>
              ¡Has terminado todo por hoy!
            </Texto>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// Estilo «Piedra»: bloques planos con borde visible, sin sombras. «Ahora» se distingue por el borde
// granate más grueso y el fondo suave, además de por su tamaño (no solo por el color, RNF14.4).
const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    raiz: { flex: 1, padding: 16, gap: 16, backgroundColor: c.fondo, overflow: "hidden" },
    bloque: {
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: RADIO,
      padding: 14,
      gap: 12,
      overflow: "hidden",
      minWidth: 0,
      minHeight: 0,
    },
    bloqueAhora: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
      borderWidth: 4,
      paddingHorizontal: 22,
    },
    etiqueta: { fontWeight: "700", color: c.texto },
    etiquetaAhora: { color: c.primario },
    lista: { flex: 1, gap: 12, minHeight: 0 },
    vacio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    centrado: { textAlign: "center" },
    mini: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.fondo,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 10,
    },
    miniTitulo: { fontWeight: "700", color: c.texto },
    subTexto: { color: c.textoSecundario },
    sello: {
      position: "absolute",
      right: -8,
      bottom: -6,
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      // Mismo color que la tarjeta: el sello se separa del pictograma blanco en todos los temas.
      borderColor: c.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
    // «Solo texto»: sin dibujo, el sello va delante del nombre.
    selloEnLinea: { position: "relative", right: 0, bottom: 0 },
    ahoraCuerpo: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, minHeight: 0 },
    ahoraTarjeta: {
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      borderRadius: RADIO,
      padding: 8,
      maxWidth: "100%",
    },
    filaPicto: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
    ahoraTitulo: {
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    ahoraHora: { color: c.textoSecundario },
    mas: { fontWeight: "700" },
    soloMirar: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: c.borde,
    },
    pulsado: { opacity: 0.85 },
  });
