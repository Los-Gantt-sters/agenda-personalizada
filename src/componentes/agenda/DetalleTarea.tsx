// Detalle de una tarea de la agenda (T-06.1, HU-06). RF4.4: se abre al pulsar una tarjeta.
import { useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import type { ReactNode } from "react";
import type { EntradaAgenda } from "./tipos";
import { franjaHoraria } from "./logica";
import { RADIO } from "./colores";
import { PictogramaTarea } from "./PictogramaTarea";
import type { Paleta } from "../../temas";
import {
  Icono,
  PictogramaInterfaz,
  Texto,
  useApariencia,
  useEstilos,
  type NombreIcono,
} from "../../ui";

/** Lee en voz alta (web). En nativo se puede cambiar por expo-speech. */
function leer(texto: string) {
  if (Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
}
const puedeLeer =
  Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * RF4.4: detalle de la tarea con su contenido accesible. Ocupa toda la
 * pantalla y no tiene scroll (RNF4.1): si la tarea tiene pasos, se ven de
 * uno en uno con «Anterior» y «Siguiente».
 */
export function DetalleTarea({
  entrada,
  onCerrar,
}: {
  entrada: EntradaAgenda | null;
  onCerrar: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  // El paso se guarda junto al id de la tarea: al abrir otra, vuelve al primero.
  const [estadoPaso, setEstadoPaso] = useState({ id: "", n: 0 });
  const paso = estadoPaso.id === entrada?.id ? estadoPaso.n : 0;
  const setPaso = (f: (n: number) => number) =>
    setEstadoPaso({ id: entrada?.id ?? "", n: f(paso) });
  if (!entrada) return null;

  const t = entrada.tarea;
  const pasos = (t.pasos ?? []).slice().sort((a, b) => a.orden - b.orden);
  const p = pasos[paso];
  const tamPicto = Math.min(width * 0.32, height * 0.32, 260);
  const textoVoz = [
    t.titulo,
    franjaHoraria(entrada),
    t.descripcion,
    p ? `Paso ${paso + 1}. ${p.texto}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      supportedOrientations={["portrait", "landscape"]}
    >
      <View style={estilos.fondo} accessibilityViewIsModal>
        <View style={estilos.hoja}>
          <View style={estilos.cabecera}>
            <PictogramaTarea tarea={t} tam={tamPicto} />
            <View style={{ flexShrink: 1, gap: 8 }}>
              <Texto style={estilos.titulo} accessibilityRole="header" numberOfLines={2}>
                {t.titulo}
              </Texto>
              <Linea icono="reloj" color={colores.textoSecundario}>
                {franjaHoraria(entrada)}
              </Linea>
              {entrada.estado === "hecha" && (
                <Linea icono="check" color={colores.exito}>
                  Ya la has hecho
                </Linea>
              )}
              {entrada.estado === "bloqueada" && (
                <Linea icono="candado" color={colores.aviso}>
                  Hoy no toca
                </Linea>
              )}
            </View>
          </View>

          {!!t.descripcion && (
            <Texto style={estilos.texto} numberOfLines={3}>
              {t.descripcion}
            </Texto>
          )}

          {p && (
            <View style={estilos.paso}>
              {p.pictograma_url ? (
                <PictogramaTarea
                  tarea={{ titulo: p.texto, pictograma_url: p.pictograma_url, emoji: "" }}
                  tam={Math.min(tamPicto * 0.6, 120)}
                />
              ) : (
                // Sin dibujo del paso: el número grande ayuda a seguir el orden.
                <View style={estilos.numeroPaso} accessibilityElementsHidden>
                  <Texto style={estilos.numeroPasoTexto}>{paso + 1}</Texto>
                </View>
              )}
              <Texto style={[estilos.texto, { flex: 1 }]} numberOfLines={3}>
                Paso {paso + 1} de {pasos.length}: {p.texto}
              </Texto>
            </View>
          )}

          <View style={estilos.botones}>
            {pasos.length > 1 && (
              <Boton
                texto="Anterior"
                antes={<Icono nombre="atras" color={colores.primario} tam={26} grosor={3} />}
                fantasma
                desactivado={paso === 0}
                onPress={() => setPaso((n) => n - 1)}
              />
            )}
            {pasos.length > 1 && (
              <Boton
                texto="Siguiente"
                despues={<Icono nombre="adelante" color={colores.primario} tam={26} grosor={3} />}
                fantasma
                desactivado={paso >= pasos.length - 1}
                onPress={() => setPaso((n) => n + 1)}
              />
            )}
            {puedeLeer && (
              <Boton
                texto="Escuchar"
                antes={<PictogramaInterfaz nombre="escuchar" etiqueta="Escuchar" tam={40} />}
                fantasma
                onPress={() => leer(textoVoz)}
              />
            )}
            {!!t.video_url && (
              <Boton
                texto="Ver vídeo"
                antes={<Icono nombre="reproducir" color={colores.primario} tam={26} />}
                fantasma
                onPress={() => Linking.openURL(t.video_url!)}
              />
            )}
            <Boton
              texto="Cerrar"
              antes={
                <Icono nombre="cerrar" color={colores.textoSobrePrimario} tam={26} grosor={3} />
              }
              onPress={onCerrar}
            />
          </View>
        </View>
      </View>
    </Modal>
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
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.linea}>
      <Icono nombre={icono} color={color} tam={26} />
      <Texto style={[estilos.hora, { color }]}>{children}</Texto>
    </View>
  );
}

function Boton({
  texto,
  onPress,
  fantasma,
  desactivado,
  antes,
  despues,
}: {
  texto: string;
  onPress: () => void;
  fantasma?: boolean;
  desactivado?: boolean;
  /** Icono o pictograma decorativo antes del texto. */
  antes?: ReactNode;
  /** Icono decorativo después del texto. */
  despues?: ReactNode;
}) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: !!desactivado }}
      disabled={desactivado}
      onPress={onPress}
      style={[estilos.boton, fantasma && estilos.botonFantasma, desactivado && { opacity: 0.4 }]}
    >
      {antes}
      <Texto style={[estilos.botonTexto, fantasma && { color: colores.primario }]}>{texto}</Texto>
      {despues}
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: "rgba(34,33,31,0.6)",
      padding: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    hoja: {
      width: "100%",
      maxWidth: 900,
      maxHeight: "100%",
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: RADIO,
      padding: 24,
      gap: 18,
      overflow: "hidden",
    },
    cabecera: { flexDirection: "row", alignItems: "center", gap: 20 },
    titulo: { fontSize: 38, fontWeight: "700", color: c.texto },
    linea: { flexDirection: "row", alignItems: "center", gap: 10 },
    hora: { fontSize: 22, color: c.textoSecundario },
    texto: { fontSize: 24, lineHeight: 34, color: c.texto },
    paso: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      backgroundColor: c.fondo,
      borderRadius: 10,
      padding: 12,
    },
    numeroPaso: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    numeroPasoTexto: { fontSize: 34, fontWeight: "700", color: c.primario },
    botones: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-end" },
    boton: {
      minHeight: 60,
      paddingHorizontal: 22,
      borderRadius: 12,
      backgroundColor: c.primario,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    botonFantasma: {
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.primario,
    },
    botonTexto: { fontSize: 22, fontWeight: "700", color: c.textoSobrePrimario },
  });
