// Piezas comunes de los pasos multimedia (SCRUM-95 · T-10.2, HU-10): los 5 botones de formato, el
// reproductor de vídeo corto, la foto y el audio del paso. Las usan 07 (un paso), 07f (todos los
// pasos) y la vista previa del editor 28s.
import { useEffect, useRef, useState, createElement } from "react";
import { Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import type { FormatoPaso, PasoTarea, RecursoPaso } from "../agenda/tipos";
import { FORMATOS_PASO } from "./formatosPaso";
import { urlImagenPictograma } from "../../arasaac/urls";
import { detenerVoz, leer } from "../../servicios/voz";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";

/** Área táctil mínima de los botones de formato (RNF6.3, 48 × 48). */
export const LADO_BOTON_FORMATO = 72;

/**
 * Los 5 botones de debajo del paso (07). Cada uno lleva su pictograma y su etiqueta (cambios 17-11:
 * todos los pictogramas con etiqueta visible). Solo salen los permitidos; los que el paso no tiene
 * (p. ej. sin vídeo) se ven apagados y no se pueden pulsar.
 */
export function BotonesFormato({
  permitidos,
  activo,
  disponibles,
  sonando = false,
  onElegir,
}: {
  permitidos: FormatoPaso[];
  activo: FormatoPaso;
  /** Formatos que el paso tiene; los demás se ven apagados. */
  disponibles?: (f: FormatoPaso) => boolean;
  /** El audio está sonando: su botón se marca mientras tanto. */
  sonando?: boolean;
  onElegir: (f: FormatoPaso) => void;
}) {
  const e = useEstilos(crearEstilos);
  return (
    <View
      style={e.filaFormatos}
      accessibilityRole="radiogroup"
      accessibilityLabel="Cómo ver el paso"
      testID="botones-formato"
    >
      {FORMATOS_PASO.filter((f) => permitidos.includes(f.clave)).map((f) => {
        const elegido = f.clave === "audio" ? sonando : activo === f.clave;
        const hay = disponibles ? disponibles(f.clave) : true;
        return (
          <Pressable
            key={f.clave}
            testID={`btn-formato-${f.clave}`}
            accessibilityRole={f.clave === "audio" ? "button" : "radio"}
            accessibilityLabel={hay ? f.etiqueta : `${f.etiqueta}: este paso no tiene`}
            accessibilityState={{ selected: elegido, checked: elegido, disabled: !hay }}
            disabled={!hay}
            onPress={() => onElegir(f.clave)}
            style={({ pressed }) => [
              e.botonFormato,
              elegido && e.botonFormatoElegido,
              !hay && e.botonFormatoApagado,
              pressed && e.pulsado,
            ]}
          >
            <View style={e.placaIcono}>
              <Image
                source={{ uri: urlImagenPictograma(f.pictogramaId, 300) }}
                style={e.iconoFormato}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <Texto style={[e.textoFormato, elegido && e.textoFormatoElegido]} numberOfLines={1}>
              {f.etiqueta}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Foto real del paso (07c), sobre placa blanca como los pictogramas. */
export function FotoPaso({
  recurso,
  ancho,
  alto,
}: {
  recurso: RecursoPaso;
  ancho: number;
  alto: number;
}) {
  const [fallo, setFallo] = useState(false);
  const e = useEstilos(crearEstilos);
  if (!recurso.url || fallo) return <SinMedio texto="No se puede ver la foto" />;
  return (
    <Image
      testID="foto-paso"
      source={{ uri: recurso.url }}
      onError={() => setFallo(true)}
      resizeMode="contain"
      accessibilityLabel={recurso.descripcion ?? "Foto del paso"}
      style={[e.marcoMedio, { width: ancho, height: alto }]}
    />
  );
}

/**
 * Vídeo corto del paso (07d). En el navegador es el reproductor del propio navegador (con sus
 * controles, sin sonido al empezar y en bucle, para que el alumno lo vea las veces que quiera). En la
 * app nativa haría falta expo-video: de momento se avisa.
 */
export function VideoPaso({
  recurso,
  ancho,
  alto,
}: {
  recurso: RecursoPaso;
  ancho: number;
  alto: number;
}) {
  const e = useEstilos(crearEstilos);
  if (!recurso.url) return <SinMedio texto="No se puede ver el vídeo" />;
  if (Platform.OS !== "web") return <SinMedio texto="El vídeo se ve en el navegador" />;
  return (
    <View style={[e.marcoMedio, { width: ancho, height: alto }]} testID="video-paso">
      {createElement("video", {
        src: recurso.url,
        controls: true,
        loop: true,
        playsInline: true,
        preload: "metadata",
        "aria-label": recurso.descripcion ?? "Vídeo del paso",
        style: { width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" },
      })}
    </View>
  );
}

/** Hueco con aviso cuando falta una foto o un vídeo (nunca un hueco vacío, RNF4.4). */
export function SinMedio({ texto }: { texto: string }) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.sinMedio} testID="sin-medio">
      <Icono nombre="imagen" color={colores.textoSecundario} tam={40} />
      <Texto style={e.textoSinMedio}>{texto}</Texto>
    </View>
  );
}

/**
 * Audio del paso: suena la voz grabada por el tutor si la hay y, si no, la voz de la tableta lee el
 * paso. No cambia lo que se ve (cambios 17-11: «reproducir sin sustituir imagen»). Se calla al
 * cambiar de paso o al salir.
 */
export function useAudioPaso() {
  const [sonando, setSonando] = useState(false);
  const reproductor = useRef<AudioPlayer | null>(null);

  const parar = () => {
    detenerVoz();
    try {
      reproductor.current?.remove();
    } catch {
      // Ya estaba parado
    }
    reproductor.current = null;
    setSonando(false);
  };

  useEffect(() => parar, []);

  const reproducir = (paso: Pick<PasoTarea, "audio">, textoVoz: string) => {
    parar();
    setSonando(true);
    if (paso.audio?.url) {
      try {
        const p = createAudioPlayer({ uri: paso.audio.url });
        reproductor.current = p;
        p.addListener("playbackStatusUpdate", (estado) => {
          if (estado.didJustFinish) setSonando(false);
        });
        p.play();
        return;
      } catch {
        // Si no se puede reproducir la grabación, lo lee la voz de la tableta
      }
    }
    leer(textoVoz, { alTerminar: () => setSonando(false) });
  };

  return { sonando, reproducir, parar };
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    filaFormatos: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
    },
    botonFormato: {
      minWidth: 104,
      minHeight: LADO_BOTON_FORMATO,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    botonFormatoElegido: { backgroundColor: c.primario, borderColor: c.primario, borderWidth: 3 },
    botonFormatoApagado: { borderStyle: "dashed", opacity: 0.45 },
    placaIcono: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    iconoFormato: { width: 32, height: 32 },
    textoFormato: { fontSize: 16, fontWeight: "700", color: c.texto },
    textoFormatoElegido: { color: c.textoSobrePrimario },
    pulsado: { opacity: 0.8 },
    marcoMedio: { borderRadius: 12, overflow: "hidden", backgroundColor: "#FFFFFF" },
    sinMedio: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: c.borde,
    },
    textoSinMedio: { fontSize: 18, color: c.textoSecundario, textAlign: "center" },
  });
