// Vista del día en tres bloques (T-06.1, HU-06).
// RF4.2: «Hecho» a la izquierda, «Ahora» en el centro (60 %) y «Después» a la derecha.
// RNF4.2: en vertical o en móvil los bloques se apilan en el mismo orden y «Ahora» sigue al 60 %.
// RNF4.1: sin ScrollView; a cada lado solo se pintan las tarjetas que caben.
import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { BloquesAgenda, EntradaAgenda } from "./tipos";
import { franjaHoraria, horaCorta } from "./logica";
import { colores, RADIO } from "./colores";
import { PictogramaTarea } from "./PictogramaTarea";
import { BotonMantener } from "./BotonMantener";

/** Proporción de los bloques: 1 + 3 + 1 → «Ahora» = 3/5 = 60 %. */
export const PESO_LADO = 1;
export const PESO_AHORA = 3;

const MARGEN = 16;

export interface Medidas {
  horizontal: boolean;
  escala: number;
  /** Tarjetas que caben a cada lado sin scroll. */
  maxLado: number;
  /** Tamaño exacto de cada bloque: «Ahora» = 60 % del espacio útil. */
  lado: { width: number; height: number };
  ahora: { width: number; height: number };
}

/** Decide la disposición y el tamaño de cada bloque para un área dada. */
export function calcularMedidas(width: number, height: number): Medidas {
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
    const altoMini = 150 * escala + 12; // tarjeta vertical: dibujo arriba, texto debajo
    maxLado = Math.floor((utilAlto - 24 - 40 * escala) / altoMini);
  } else {
    const util = utilAlto - MARGEN * 2;
    lado = { width: utilAncho, height: (util * PESO_LADO) / total };
    ahora = { width: utilAncho, height: (util * PESO_AHORA) / total };
    maxLado = Math.floor((utilAncho - 24) / (220 * escala + 12));
  }
  // Más de 3 a cada lado ya no ayuda a anticipar, solo distrae.
  return { horizontal, escala, maxLado: Math.max(1, Math.min(3, maxLado)), lado, ahora };
}

export function AgendaTresBloques({
  bloques,
  onConfirmarFin,
  onAbrir,
}: {
  bloques: BloquesAgenda;
  onConfirmarFin: (idEntrada: string) => void;
  onAbrir: (entrada: EntradaAgenda) => void;
}) {
  const ventana = useWindowDimensions();
  // Se mide el hueco real (puede no ser toda la ventana: márgenes seguros, etc.).
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const m = calcularMedidas(area?.width ?? ventana.width, area?.height ?? ventana.height);
  const { horizontal, escala, maxLado } = m;

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
        etiqueta="✓ Hecho"
        entradas={bloques.hecho.slice(-maxLado)}
        vacio={{ texto: "Todavía nada", emoji: "⏳" }}
        horizontal={horizontal}
        escala={escala}
        tam={m.lado}
        onAbrir={onAbrir}
      />
      <BloqueAhora
        bloques={bloques}
        escala={escala}
        tam={m.ahora}
        onAbrir={onAbrir}
        onConfirmarFin={onConfirmarFin}
      />
      <Bloque
        tipo="despues"
        etiqueta="→ Después"
        entradas={bloques.despues.slice(0, maxLado)}
        vacio={{ texto: "Nada más hoy", emoji: "🏁" }}
        horizontal={horizontal}
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
  vacio,
  horizontal,
  escala,
  tam,
  onAbrir,
}: {
  tipo: "hecho" | "despues";
  etiqueta: string;
  entradas: EntradaAgenda[];
  vacio: { texto: string; emoji: string };
  horizontal: boolean;
  escala: number;
  tam: { width: number; height: number };
  onAbrir: (e: EntradaAgenda) => void;
}) {
  const nombre = tipo === "hecho" ? "Hecho" : "Después";
  return (
    <View
      testID={`bloque-${tipo}`}
      accessibilityRole="summary"
      accessibilityLabel={`${nombre}: ${entradas.length ? entradas.map((e) => e.tarea.titulo).join(", ") : vacio.texto}`}
      style={[estilos.bloque, tam, tipo === "hecho" && { opacity: 0.85 }]}
    >
      <Text style={[estilos.etiqueta, { fontSize: 22 * escala }]}>{etiqueta}</Text>
      <View style={[estilos.lista, { flexDirection: horizontal ? "column" : "row" }]}>
        {entradas.length === 0 ? (
          <View style={estilos.vacio}>
            <PictogramaTarea
              tarea={{ titulo: vacio.texto, emoji: vacio.emoji }}
              tam={44 * escala}
            />
            <Text style={[estilos.subTexto, { fontSize: 18 * escala }]}>{vacio.texto}</Text>
          </View>
        ) : (
          entradas.map((e) => (
            <Mini
              key={e.id}
              entrada={e}
              escala={escala}
              horizontal={horizontal}
              onAbrir={onAbrir}
            />
          ))
        )}
      </View>
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
  onAbrir,
}: {
  entrada: EntradaAgenda;
  escala: number;
  horizontal: boolean;
  onAbrir: (e: EntradaAgenda) => void;
}) {
  const hecha = entrada.estado === "hecha";
  const bloqueada = entrada.estado === "bloqueada";
  return (
    <Pressable
      testID={`mini-${entrada.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${entrada.tarea.titulo}, a las ${horaCorta(entrada)}${hecha ? ", hecha" : ""}${bloqueada ? ", hoy no toca" : ""}`}
      accessibilityHint="Abre la tarea"
      onPress={() => onAbrir(entrada)}
      style={({ pressed }) => [
        estilos.mini,
        { padding: 10 * escala },
        horizontal
          ? { flexDirection: "column", minHeight: 150 * escala }
          : { flexDirection: "row", flex: 1, maxWidth: 360 },
        hecha && { opacity: 0.8 },
        bloqueada && { borderStyle: "dashed", borderColor: colores.aviso },
        pressed && estilos.pulsado,
      ]}
    >
      <View>
        <PictogramaTarea tarea={entrada.tarea} tam={64 * escala} />
        {(hecha || bloqueada) && (
          <Text style={[estilos.sello, { backgroundColor: hecha ? colores.exito : colores.aviso }]}>
            {hecha ? "✓" : "🔒"}
          </Text>
        )}
      </View>
      <View
        style={[
          { minWidth: 0 },
          horizontal ? { alignSelf: "stretch", alignItems: "center" } : { flex: 1 },
        ]}
      >
        <Text
          style={[
            estilos.miniTitulo,
            { fontSize: 19 * escala },
            horizontal && { textAlign: "center" },
          ]}
          numberOfLines={2}
        >
          {entrada.tarea.titulo}
        </Text>
        <Text style={[estilos.subTexto, { fontSize: 16 * escala }]} numberOfLines={1}>
          {bloqueada ? "Hoy no toca" : horaCorta(entrada)}
        </Text>
      </View>
    </Pressable>
  );
}

function BloqueAhora({
  bloques,
  escala,
  tam,
  onAbrir,
  onConfirmarFin,
}: {
  bloques: BloquesAgenda;
  escala: number;
  tam: { width: number; height: number };
  onAbrir: (e: EntradaAgenda) => void;
  onConfirmarFin: (id: string) => void;
}) {
  const ahora = bloques.ahora;

  // Entrada suave de la nueva tarea al avanzar (sin saltos bruscos).
  const [aparicion] = useState(() => new Animated.Value(1));
  useEffect(() => {
    aparicion.setValue(0);
    Animated.timing(aparicion, { toValue: 1, duration: 350, useNativeDriver: false }).start();
  }, [ahora?.id, aparicion]);

  // El dibujo se queda con el alto que sobra tras etiqueta, título, hora y
  // botón, para que el botón no quede nunca cortado (sin scroll).
  const bajo = tam.height < 400;
  const fijo =
    12 * 2 +
    12 +
    36 * escala +
    44 * escala * 1.25 * (bajo ? 1 : 2) +
    24 * escala * 1.3 +
    72 +
    20 * 3 +
    16;
  const tamPicto = Math.max(48, Math.min(tam.width * 0.55, tam.height - fijo, 340));

  return (
    <View
      testID="bloque-ahora"
      accessibilityRole="summary"
      accessibilityLabel={ahora ? `Ahora: ${ahora.tarea.titulo}` : "Has terminado todo por hoy"}
      style={[estilos.bloque, estilos.bloqueAhora, tam]}
    >
      <Text style={[estilos.etiqueta, estilos.etiquetaAhora, { fontSize: 26 * escala }]}>
        ▶ Ahora
      </Text>
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
              <PictogramaTarea tarea={ahora.tarea} tam={tamPicto} />
              <Text
                style={[estilos.ahoraTitulo, { fontSize: 44 * escala }]}
                numberOfLines={bajo ? 1 : 2}
              >
                {ahora.tarea.titulo}
              </Text>
              <Text style={[estilos.ahoraHora, { fontSize: 24 * escala }]}>
                {franjaHoraria(ahora)}
              </Text>
            </Pressable>
            <BotonMantener texto="✓ He terminado" onConfirmar={() => onConfirmarFin(ahora.id)} />
          </>
        ) : (
          <View style={estilos.ahoraTarjeta}>
            <PictogramaTarea tarea={{ titulo: "Fin del día", emoji: "🎉" }} tam={tamPicto * 0.8} />
            <Text style={[estilos.ahoraTitulo, { fontSize: 40 * escala }]}>
              ¡Has terminado todo por hoy!
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, padding: 16, gap: 16, backgroundColor: colores.fondo, overflow: "hidden" },
  bloque: {
    backgroundColor: colores.superficie,
    borderWidth: 3,
    borderColor: colores.borde,
    borderRadius: RADIO,
    padding: 12,
    gap: 10,
    overflow: "hidden",
    minWidth: 0,
    minHeight: 0,
  },
  bloqueAhora: {
    backgroundColor: colores.superficieDestacada,
    borderColor: colores.primario,
    borderWidth: 6,
  },
  etiqueta: { alignSelf: "center", fontWeight: "800", color: colores.textoSecundario },
  etiquetaAhora: { color: colores.primario },
  lista: { flex: 1, gap: 12, minHeight: 0 },
  vacio: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  mini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.superficieSuave,
    borderWidth: 2,
    borderColor: colores.borde,
    borderRadius: RADIO * 0.7,
  },
  miniTitulo: { fontWeight: "700", color: colores.texto },
  subTexto: { color: colores.textoSecundario, fontWeight: "600" },
  sello: {
    position: "absolute",
    right: -6,
    bottom: -6,
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    width: 28,
    height: 28,
    lineHeight: 28,
    textAlign: "center",
    borderRadius: 14,
    overflow: "hidden",
  },
  ahoraCuerpo: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, minHeight: 0 },
  ahoraTarjeta: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: RADIO,
    padding: 8,
    maxWidth: "100%",
  },
  ahoraTitulo: {
    fontWeight: "800",
    color: colores.texto,
    textAlign: "center",
  },
  ahoraHora: { fontWeight: "700", color: colores.textoSecundario },
  pulsado: { transform: [{ scale: 0.98 }], opacity: 0.9 },
});
