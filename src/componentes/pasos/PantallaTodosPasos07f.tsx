// Pantalla 07f: todos los pasos de la tarea a la vez (SCRUM-95 · T-10.2, HU-10).
// Se abre con «Mostrar pasos» en la tarjeta de «Ahora» de la agenda (06). Según el boceto:
// - Cabecera «<Tarea> · Todos los pasos».
// - Una tarjeta por paso, en fila: «Paso N», dibujo, título y texto en Lectura Fácil.
// - Debajo, los mismos 5 botones de formato que en 07 (afectan a todas las tarjetas) y, a la
//   derecha, «Empezar tarea» (→ 07).
// - «Atrás» vuelve a la agenda. «Adelante» está apagado salvo que haya más pasos de los que caben:
//   entonces pasa a los siguientes (RNF4.1: nunca scroll).
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import type { FormatoPaso, PasoTarea, Tarea } from "../agenda/tipos";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import { Pantalla } from "../../pantalla/Pantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, colorSobre, useApariencia, useEstilos } from "../../ui";
import {
  formatoInicial,
  formatosPermitidos,
  pasosOrdenados,
  textoVozPaso,
  tituloDe,
} from "./formatosPaso";
import { BotonesFormato, FotoPaso, SinMedio, VideoPaso, useAudioPaso } from "./MultimediaPaso";

/** Cuántas tarjetas caben en una fila según el ancho (como mucho 5, como en el boceto). */
export function pasosPorPagina(ancho: number): number {
  return Math.max(1, Math.min(5, Math.floor((ancho + 12) / (176 + 12))));
}

export function PantallaTodosPasos07f({
  tarea,
  alAtras,
  onEmpezar,
  conSonido = false,
}: {
  tarea: Tarea;
  /** «Atrás» (→ 06). */
  alAtras: () => void;
  /** «Empezar tarea» (→ 07). Sin él (familias, tarea ya hecha) no sale el botón. */
  onEmpezar?: () => void;
  conSonido?: boolean;
}) {
  const { canal, colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const ventana = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const pasos = pasosOrdenados(tarea);
  const permitidos = formatosPermitidos(tarea);
  const [formato, setFormato] = useState<FormatoPaso>(() => formatoInicial(canal, permitidos));
  const [pagina, setPagina] = useState(0);
  const audio = useAudioPaso();

  const ancho = (area?.width ?? ventana.width) - 48;
  const alto = (area?.height ?? ventana.height - 170) - 90 - 72 - 48;
  const porPagina = pasosPorPagina(ancho);
  const paginas = Math.max(1, Math.ceil(pasos.length / porPagina));
  const pag = Math.min(pagina, paginas - 1);
  const visibles = pasos.slice(pag * porPagina, (pag + 1) * porPagina);
  const anchoTarjeta = Math.min(
    220,
    (ancho - 12 * (visibles.length - 1)) / Math.max(1, visibles.length),
  );
  const altoTarjeta = Math.max(200, Math.min(alto, 360));
  const ladoMedio = Math.max(64, Math.min(anchoTarjeta - 24, altoTarjeta * 0.42));

  const elegir = (f: FormatoPaso) => {
    if (f !== "audio") {
      setFormato(f);
      return;
    }
    if (audio.sonando) {
      audio.parar();
      return;
    }
    // Se leen todos los pasos seguidos, en orden.
    audio.reproducir({ audio: null }, pasos.map((p, i) => textoVozPaso(p, i + 1)).join(". "));
  };

  const medio = (p: PasoTarea) => {
    if (formato === "foto")
      return p.foto?.url ? (
        <FotoPaso recurso={p.foto} ancho={anchoTarjeta - 24} alto={ladoMedio} />
      ) : (
        <SinMedio texto="Sin foto" />
      );
    if (formato === "video")
      return p.video?.url ? (
        <VideoPaso recurso={p.video} ancho={anchoTarjeta - 24} alto={ladoMedio} />
      ) : (
        <SinMedio texto="Sin vídeo" />
      );
    if (formato === "texto") return null;
    return (
      <PictogramaTarea
        tarea={{
          titulo: tituloDe(p),
          pictograma_url: p.pictograma_url ?? tarea.pictograma_url,
          emoji: tarea.emoji,
        }}
        tam={ladoMedio}
      />
    );
  };

  return (
    <Pantalla
      titulo={`${tarea.titulo} · Todos los pasos`}
      alAtras={pag > 0 ? () => setPagina(pag - 1) : alAtras}
      etiquetaAtras={pag > 0 ? "Atrás: pasos anteriores" : "Atrás: volver a la agenda"}
      alAdelante={pag < paginas - 1 ? () => setPagina(pag + 1) : null}
      etiquetaAdelante="Adelante: más pasos"
      conSonido={conSonido}
      testID="pantalla-07f-todos-pasos"
    >
      <View
        style={e.cuerpo}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          if (!area || Math.abs(area.width - width) > 1 || Math.abs(area.height - height) > 1)
            setArea({ width, height });
        }}
      >
        <View style={e.filaPasos} testID="lista-todos-pasos">
          {visibles.map((p) => {
            const n = pasos.indexOf(p) + 1;
            return (
              <View
                key={p.id ?? `${p.orden}`}
                style={[e.tarjeta, { width: anchoTarjeta, height: altoTarjeta }]}
                accessible
                accessibilityLabel={`Paso ${n}: ${tituloDe(p)}. ${p.texto}`}
                testID={`tarjeta-paso-${n}`}
              >
                <View style={e.insignia}>
                  <Texto style={e.textoInsignia}>{`Paso ${n}`}</Texto>
                </View>
                {medio(p)}
                <Texto style={e.tituloPaso} numberOfLines={2}>
                  {tituloDe(p)}
                </Texto>
                <Texto
                  style={[e.textoPaso, formato === "texto" && e.textoPasoGrande]}
                  numberOfLines={formato === "texto" ? 8 : 4}
                >
                  {p.texto}
                </Texto>
              </View>
            );
          })}
        </View>

        <BotonesFormato
          permitidos={permitidos}
          activo={formato}
          sonando={audio.sonando}
          onElegir={elegir}
        />

        {onEmpezar ? (
          <View style={[e.filaEmpezar, { width: ancho }]}>
            <Pressable
              testID="btn-07f-empezar-tarea"
              accessibilityRole="button"
              accessibilityLabel="Empezar tarea"
              onPress={() => {
                audio.parar();
                onEmpezar();
              }}
              style={({ pressed }) => [e.botonEmpezar, pressed && e.pulsado]}
            >
              <Icono nombre="adelante" color={colorSobre(colores.primario)} tam={26} grosor={3} />
              <Texto style={e.textoEmpezar}>Empezar tarea</Texto>
            </Pressable>
          </View>
        ) : null}
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
      gap: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: c.fondo,
    },
    filaPasos: { flexDirection: "row", gap: 12, justifyContent: "center" },
    tarjeta: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      overflow: "hidden",
    },
    insignia: {
      paddingVertical: 3,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
    },
    textoInsignia: { fontSize: 15, fontWeight: "700", color: c.primario },
    tituloPaso: { fontSize: 18, fontWeight: "700", color: c.texto, textAlign: "center" },
    textoPaso: { fontSize: 14, lineHeight: 19, color: c.textoSecundario, textAlign: "center" },
    textoPasoGrande: { fontSize: 18, lineHeight: 25, color: c.texto },
    filaEmpezar: { flexDirection: "row", justifyContent: "flex-end" },
    botonEmpezar: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 24,
      borderRadius: 14,
      backgroundColor: c.primario,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    textoEmpezar: { fontSize: 22, fontWeight: "700", color: colorSobre(c.primario) },
    pulsado: { opacity: 0.85 },
  });
