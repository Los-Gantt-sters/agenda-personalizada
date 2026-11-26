// Piezas comunes de los pasos multimedia (SCRUM-95 · T-10.2, HU-10): los 5 botones de formato, el
// reproductor de vídeo corto, la foto y el audio del paso. Las usan 07 (un paso), 07f (todos los
// pasos) y la vista previa del editor 28s.
import { useEffect, useRef, useState, createElement } from "react";
import { Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import type { FormatoPaso, PasoTarea, RecursoPaso } from "../agenda/tipos";
import { FORMATOS_PASO } from "./formatosPaso";
import { urlImagenPictograma } from "../../arasaac/urls";
import { firmarRuta } from "../../servicios/pasosService";
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

/**
 * URL con la que se enseña una foto o un vídeo del bucket. Las URLs firmadas caducan a la hora
 * (revisión de Jaime: la tableta se queda abierta toda la mañana): si la URL falla o no se pudo
 * firmar al cargar, se pide otra una vez a partir de la ruta. Si tampoco sirve, `fallo`.
 */
function useUrlRecurso(recurso: RecursoPaso) {
  type Estado = { de: string | null; url: string | null; pedida: boolean; fallo: boolean };
  const nuevo = (): Estado => ({
    de: recurso.url ?? null,
    url: recurso.url ?? null,
    pedida: false,
    fallo: false,
  });
  const [estado, setEstado] = useState<Estado>(nuevo);
  // Otro paso u otra URL: se empieza de cero sin esperar a un efecto.
  const actual = estado.de === (recurso.url ?? null) ? estado : nuevo();
  const ruta = recurso.ruta ?? null;

  const pedirOtra = () => {
    if (actual.pedida || !ruta) {
      setEstado({ ...actual, fallo: true });
      return;
    }
    setEstado({ ...actual, pedida: true });
    void firmarRuta(ruta).then((url) =>
      setEstado((e) => (e.de === actual.de ? { ...e, url, fallo: !url } : e)),
    );
  };

  // Sin URL al cargar (no se pudo firmar), se intenta una vez más.
  const sinUrl = !actual.url && !!ruta && !actual.pedida;
  useEffect(() => {
    if (!sinUrl || !ruta) return;
    let vivo = true;
    void firmarRuta(ruta).then((url) => {
      if (vivo) setEstado({ de: recurso.url ?? null, url, pedida: true, fallo: !url });
    });
    return () => {
      vivo = false;
    };
  }, [sinUrl, ruta, recurso.url]);

  return { url: actual.url, fallo: actual.fallo || (!actual.url && !ruta), alFallar: pedirOtra };
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
  const { url, fallo, alFallar } = useUrlRecurso(recurso);
  const e = useEstilos(crearEstilos);
  if (fallo) return <SinMedio texto="No se puede ver la foto" />;
  if (!url) return <SinMedio texto="Cargando la foto…" />;
  return (
    <Image
      testID="foto-paso"
      source={{ uri: url }}
      onError={alFallar}
      resizeMode="contain"
      accessibilityLabel={recurso.descripcion ?? "Foto del paso"}
      style={[e.marcoMedio, { width: ancho, height: alto }]}
    />
  );
}

/**
 * Vídeo corto del paso (07d). En el navegador es el reproductor del propio navegador (con sus
 * controles, sin sonido al empezar y en bucle, para que el alumno lo vea las veces que quiera). En la
 * app nativa haría falta expo-video: de momento se avisa. Si el vídeo no carga, sale un aviso como
 * el de la foto en vez de un recuadro negro.
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
  const { url, fallo, alFallar } = useUrlRecurso(recurso);
  if (fallo) return <SinMedio texto="No se puede ver el vídeo" />;
  if (!url) return <SinMedio texto="Cargando el vídeo…" />;
  if (Platform.OS !== "web") return <SinMedio texto="El vídeo se ve en el navegador" />;
  return (
    <View style={[e.marcoMedio, { width: ancho, height: alto }]} testID="video-paso">
      {createElement("video", {
        src: url,
        controls: true,
        loop: true,
        // Sin sonido: así no se mezcla con el audio del paso (revisión de Jaime).
        muted: true,
        playsInline: true,
        preload: "metadata",
        onError: alFallar,
        "data-video-paso": true,
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

/** Si la grabación no ha empezado a sonar en este tiempo, se da por perdida. */
export const ESPERA_AUDIO_MS = 4000;

/** Para los vídeos de los pasos que estén sonando, para que no se mezclen con el audio. */
function pausarVideosPasos() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  document.querySelectorAll<HTMLVideoElement>("video[data-video-paso]").forEach((v) => v.pause());
}

/**
 * Audio del paso: suena la voz grabada por el tutor si la hay y, si no, la voz de la tableta lee el
 * paso. No cambia lo que se ve (cambios 17-11: «reproducir sin sustituir imagen»). Se calla al
 * cambiar de paso o al salir.
 * Revisión de Jaime: si la grabación no carga (URL caducada, sin red, archivo roto), el alumno no se
 * queda en «Escuchando…» en silencio: la lee la voz de la tableta.
 */
export function useAudioPaso() {
  const [sonando, setSonando] = useState(false);
  const reproductor = useRef<AudioPlayer | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cada reproducción tiene su número: lo que llegue tarde de una anterior se ignora.
  const turno = useRef(0);

  const soltarReproductor = () => {
    if (espera.current) clearTimeout(espera.current);
    espera.current = null;
    try {
      reproductor.current?.remove();
    } catch {
      // Ya estaba parado
    }
    reproductor.current = null;
  };

  const parar = () => {
    turno.current += 1;
    detenerVoz();
    soltarReproductor();
    setSonando(false);
  };

  useEffect(() => parar, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reproducir = (paso: Pick<PasoTarea, "audio">, textoVoz: string) => {
    parar();
    const mio = turno.current;
    setSonando(true);
    pausarVideosPasos();
    const conVoz = () => {
      if (turno.current !== mio) return;
      soltarReproductor();
      leer(textoVoz, { alTerminar: () => turno.current === mio && setSonando(false) });
    };
    const grabacion = paso.audio;
    if (!grabacion?.url && !grabacion?.ruta) {
      conVoz();
      return;
    }
    // La URL firmada puede haber caducado: si hay ruta, se pide una nueva antes de sonar.
    const urlLista = grabacion.ruta
      ? firmarRuta(grabacion.ruta).then((u) => u ?? grabacion.url ?? null)
      : Promise.resolve(grabacion.url ?? null);
    void urlLista.then((url) => {
      if (turno.current !== mio) return;
      if (!url) return conVoz();
      try {
        const p = createAudioPlayer({ uri: url });
        reproductor.current = p;
        espera.current = setTimeout(conVoz, ESPERA_AUDIO_MS);
        p.addListener("playbackStatusUpdate", (estado) => {
          if (turno.current !== mio) return;
          if (estado.playing && espera.current) {
            clearTimeout(espera.current);
            espera.current = null;
          }
          if (estado.playbackState === "failed" || estado.playbackState === "error") conVoz();
          else if (estado.didJustFinish) setSonando(false);
        });
        p.play();
      } catch {
        conVoz();
      }
    });
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
