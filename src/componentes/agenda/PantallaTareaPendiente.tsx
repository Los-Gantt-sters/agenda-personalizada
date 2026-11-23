// Pantalla 10b del prototipo definitivo: detalle de una tarea que se quedó a medias (T-08.6,
// SCRUM-264). A un lado, el círculo ámbar, el dibujo y el nombre; al otro, por qué está pendiente y
// «Retomar tarea». «Atrás» vuelve a la agenda.
// Sin scroll: con poco alto se quitan primero la explicación y la etiqueta, nunca el botón.
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import type { EntradaAgenda, MotivoPendiente } from "./tipos";
import { PictogramaTarea } from "./PictogramaTarea";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import { Icono, Texto, colorSobre, useApariencia, useEstilos } from "../../ui";

const HUECO = 16;
const ANCHO_INFO = 470;
const ALTO_BOTON = 72;
const ANCHO_BOTON = 280;
const TAM_CIRCULO = 110;
const TAM_PICTO = 200;
const TITULO = "Te quedó por terminar esta tarea";

const ETIQUETA_MOTIVO: Record<MotivoPendiente, string> = {
  tiempo_agotado: "Se acabó el tiempo",
  profesor: "Marcada como pendiente por tu profesor",
};

export function PantallaTareaPendiente({
  entrada,
  conPasoGuardado,
  onRetomar,
  nota,
  alAtras,
  conSonido = false,
}: {
  entrada: EntradaAgenda;
  /** Se recuerda por dónde iba: solo entonces se promete volver a ese paso. */
  conPasoGuardado: boolean;
  /** «Retomar tarea». Sin él no sale el botón (familias o si hay otra tarea en curso). */
  onRetomar?: () => void;
  /** Por qué no se puede retomar ahora. */
  nota?: string;
  alAtras: () => void;
  conSonido?: boolean;
}) {
  const { colores, canal, escalaLetra: L } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const verDibujo = canal !== "soloTexto";
  const verTexto = canal !== "soloPictograma";
  const t = entrada.tarea;
  const etiqueta = entrada.pendiente_motivo
    ? ETIQUETA_MOTIVO[entrada.pendiente_motivo]
    : "Pendiente";
  const explicacion = conPasoGuardado
    ? "Puedes retomarla ahora desde el paso en el que la dejaste."
    : "Puedes retomarla ahora.";

  const anchoUtil = (area?.width ?? ventana.width) - HUECO * 2;
  const altoUtil = (area?.height ?? ventana.height - 170) - HUECO * 2;
  const enColumnas = anchoUtil >= altoUtil;
  const anchoInfo = enColumnas ? Math.min(ANCHO_INFO, anchoUtil * 0.58) : anchoUtil;
  const altoTexto = (texto: string, tam: number) =>
    Math.ceil((texto.length * tam * L * 0.56) / anchoInfo) * tam * 1.3 * L;

  // Primero el botón y el título; la etiqueta y la explicación, si caben.
  const altoAccion = onRetomar ? ALTO_BOTON : nota && verTexto ? altoTexto(nota, 20) : 0;
  const altoTitulo = verTexto ? altoTexto(TITULO, 28) : 0;
  const altoEtiqueta = altoTexto(etiqueta, 18) + 12;
  const altoExplicacion = altoTexto(explicacion, 20);
  const maxInfo = enColumnas ? altoUtil : altoUtil * 0.6;
  let altoInfo = altoAccion + (altoTitulo ? altoTitulo + HUECO : 0);
  const verEtiqueta = verTexto && altoInfo + altoEtiqueta + HUECO <= maxInfo;
  if (verEtiqueta) altoInfo += altoEtiqueta + HUECO;
  const verExplicacion =
    verTexto && Boolean(onRetomar) && altoInfo + altoExplicacion + HUECO <= maxInfo;
  if (verExplicacion) altoInfo += altoExplicacion + HUECO;

  // El círculo y el dibujo se quedan con lo que sobra: uno encima del otro o, si no caben, en fila.
  const altoVisual = enColumnas ? altoUtil : altoUtil - altoInfo - HUECO;
  const anchoVisual = enColumnas ? anchoUtil - anchoInfo - HUECO : anchoUtil;
  const verNombre = verTexto && altoVisual >= 220;
  const sitioDibujo = altoVisual - (verNombre ? 30 * 1.3 * L + 12 : 0);
  const apilado = verDibujo && sitioDibujo >= 260;
  const tamCirculo = apilado
    ? Math.min(TAM_CIRCULO, sitioDibujo * 0.35)
    : Math.max(48, Math.min(72, sitioDibujo));
  const tamPicto = apilado
    ? Math.min(TAM_PICTO, sitioDibujo - tamCirculo - 12)
    : Math.max(56, Math.min(TAM_PICTO, sitioDibujo, anchoVisual - tamCirculo - 12));
  const colorCirculo = colorSobre(colores.aviso);

  return (
    <Pantalla
      titulo={`${t.titulo} · Pendiente`}
      alAtras={alAtras}
      etiquetaAtras="Atrás: volver a la agenda"
      conSonido={conSonido}
      testID="pantalla-tarea-pendiente"
    >
      <View
        style={[e.cuerpo, { flexDirection: enColumnas ? "row" : "column" }]}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
            setArea({ width, height });
        }}
      >
        <View
          style={[e.visual, { maxWidth: anchoVisual }]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${t.titulo}, pendiente. ${etiqueta}.`}
        >
          <View style={[e.dibujos, { flexDirection: apilado ? "column" : "row" }]}>
            <View
              testID="circulo-pendiente"
              style={[
                e.circulo,
                { width: tamCirculo, height: tamCirculo, borderRadius: tamCirculo / 2 },
              ]}
            >
              <Icono nombre="alerta" color={colorCirculo} tam={tamCirculo * 0.6} grosor={3} />
            </View>
            {verDibujo ? <PictogramaTarea tarea={t} tam={tamPicto} /> : null}
          </View>
          {verNombre ? (
            <Texto style={e.nombre} numberOfLines={1}>
              {t.titulo}
            </Texto>
          ) : null}
        </View>

        <View style={[e.info, { width: anchoInfo }]}>
          {verEtiqueta ? (
            <View style={e.etiqueta} testID="motivo-pendiente">
              <Texto style={[e.textoEtiqueta, { color: colorCirculo }]}>{etiqueta}</Texto>
            </View>
          ) : null}
          {verTexto ? <Texto style={e.titulo}>{TITULO}</Texto> : null}
          {verExplicacion ? <Texto style={e.explicacion}>{explicacion}</Texto> : null}
          {onRetomar ? (
            <Pressable
              testID="retomar-tarea"
              accessibilityRole="button"
              accessibilityLabel="Retomar tarea"
              onPress={onRetomar}
              style={({ pressed }) => [e.boton, pressed && e.pulsado]}
            >
              <Icono nombre="reproducir" color={colores.textoSobrePrimario} tam={28} />
              {verTexto ? <Texto style={e.textoBoton}>Retomar tarea</Texto> : null}
            </Pressable>
          ) : nota && verTexto ? (
            <Texto style={e.explicacion} testID="nota-pendiente">
              {nota}
            </Texto>
          ) : null}
        </View>
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cuerpo: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: HUECO,
      padding: HUECO,
      minHeight: 0,
    },
    visual: {
      flex: 1,
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      minWidth: 0,
      minHeight: 0,
    },
    dibujos: { alignItems: "center", justifyContent: "center", gap: 12 },
    circulo: { backgroundColor: c.aviso, alignItems: "center", justifyContent: "center" },
    nombre: { fontSize: 30, fontWeight: "700", color: c.texto, textAlign: "center" },
    info: { maxWidth: "100%", justifyContent: "center", gap: HUECO },
    etiqueta: {
      alignSelf: "flex-start",
      maxWidth: "100%",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.aviso,
    },
    textoEtiqueta: { fontSize: 18, fontWeight: "700" },
    titulo: { fontSize: 28, fontWeight: "700", color: c.texto },
    explicacion: { fontSize: 20, color: c.textoSecundario },
    boton: {
      minHeight: ALTO_BOTON,
      minWidth: ANCHO_BOTON,
      maxWidth: "100%",
      alignSelf: "flex-start",
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 14,
      backgroundColor: c.primario,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    textoBoton: { fontSize: 24, fontWeight: "700", color: c.textoSobrePrimario },
    pulsado: { opacity: 0.85 },
  });
