// Visita · Escanear código QR (pantalla 13b, HU-15 · SCRUM-113 · T-15.1). La pantalla 13 ya no existe.
// El alumno PTVAL va de visita por el centro y en cada puerta escanea su código QR, que abre una
// ventana con la información fuera de la aplicación. Como en el prototipo:
//   - Arriba, solo el reloj de la visita («Quedan 30 minutos», «Empezaste a las 11:30»).
//   - En el centro, la tarjeta «Apunta al código QR de la puerta» con el lector y, debajo, el botón
//     «Escanear de nuevo».
//   - En la barra de abajo, «Terminar visita» (donde va «Adelante»): «¿Has terminado?» (08) y, si
//     dice que sí, «Tarea hecha» (10). Así la visita no es un bucle sin salida (notas del 17/11).
// El lector se pasa como pieza aparte (LectorQR): mientras no se instale la cámara (expo-camera), el
// que hay explica que todavía no está disponible.
import { useState, type ComponentType } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { urlImagenPictograma } from "../../arasaac/urls";
import { PantallaTareaHecha } from "../agenda/PantallaTareaHecha";
import { PantallaConfirmarFin } from "../ejecucion-tarea/PantallaConfirmarFin";
import { useTranscurrido } from "../ejecucion-tarea/useTranscurrido";
import { RelojVisual } from "../reloj-visual/RelojVisual";
import { textoTiempoRestante } from "../reloj-visual/textoTiempo";
import { Pantalla } from "../../pantalla/Pantalla";
import { reproducirSonido } from "../../servicios/sonidos";
import type { Paleta } from "../../temas";
import { PictogramaInterfaz, Texto, useApariencia, useEstilos } from "../../ui";

/** Pictograma «código QR» de ARASAAC. */
const PICTOGRAMA_QR = 38514;

export const TAREA_VISITA = {
  titulo: "Visita",
  emoji: "🚪",
  pictograma_url: urlImagenPictograma(PICTOGRAMA_QR, 500),
};

/** Lo que recibe la pieza que lee el código. */
export interface LectorQRProps {
  /** Se llama con el texto del código leído. */
  alLeer: (texto: string) => void;
}

/**
 * Lector de reserva mientras no esté la cámara: enseña el dibujo del código y lo explica.
 * Se cambiará por uno con expo-camera (CameraView con barcodeTypes ["qr"]).
 */
export function LectorQRNoDisponible(_props: LectorQRProps) {
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.lector} testID="lector-qr-no-disponible">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <PictogramaInterfaz nombre="qr" etiqueta="código QR" tam={120} />
      </View>
      <Texto style={e.notaLector}>La cámara todavía no está disponible en esta tableta.</Texto>
    </View>
  );
}

export interface PantallaVisitaProps {
  /** Cuándo empezó la visita (ISO). Por defecto, al abrir la pantalla. */
  inicio?: string;
  /** Cuánto dura la visita, en minutos. */
  duracionMin?: number;
  /** Pieza que lee el código. Por defecto, la de reserva (sin cámara). */
  Lector?: ComponentType<LectorQRProps>;
  /** Qué hacer con el texto de un código leído (SCRUM-114: abrir la ventana externa). */
  alLeerCodigo?: (texto: string) => void;
  /** Salir de la visita (volver a la agenda). */
  alSalir: () => void;
}

type Paso = "escanear" | "confirmar" | "hecha";

export function PantallaVisita({
  inicio,
  duracionMin = 30,
  Lector = LectorQRNoDisponible,
  alLeerCodigo = () => {},
  alSalir,
}: PantallaVisitaProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [paso, setPaso] = useState<Paso>("escanear");
  // Cambiar la clave vuelve a montar el lector: así «Escanear de nuevo» lo deja listo otra vez
  const [lectura, setLectura] = useState(0);
  const [empezo] = useState(() => inicio ?? new Date().toISOString());
  const transcurridoMs = useTranscurrido(empezo);
  const duracionMs = duracionMin * 60_000;
  const horaInicio = new Date(empezo).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (paso === "hecha") {
    return <PantallaTareaHecha tarea={TAREA_VISITA} alAtras={alSalir} conSonido />;
  }
  if (paso === "confirmar") {
    return (
      <PantallaConfirmarFin
        tarea={TAREA_VISITA}
        onSi={() => {
          reproducirSonido("acierto");
          setPaso("hecha");
        }}
        onNo={() => setPaso("escanear")}
        conSonido
      />
    );
  }

  return (
    <Pantalla
      titulo="Visita · Escanear código QR"
      alAtras={alSalir}
      etiquetaAtras="Atrás: volver a mi agenda"
      alAdelante={() => setPaso("confirmar")}
      textoAdelante="Terminar visita"
      etiquetaAdelante="Terminar visita"
      conSonido
    >
      <View style={e.contenido} testID="pantalla-visita">
        {/* Arriba, solo el reloj de la visita */}
        <View style={e.reloj} testID="reloj-visita">
          <RelojVisual
            duracionMs={duracionMs}
            transcurridoMs={transcurridoMs}
            tamano={56}
            mostrarRotulo={false}
          />
          <View>
            <Texto style={e.quedan}>{textoTiempoRestante(duracionMs - transcurridoMs)}</Texto>
            <Texto style={e.empezaste}>{`Empezaste a las ${horaInicio}`}</Texto>
          </View>
        </View>

        {/* La tarjeta del código: el lector y qué hacer */}
        <View style={e.tarjeta}>
          <Lector key={lectura} alLeer={alLeerCodigo} />
          <Texto style={e.instruccion} accessibilityRole="header">
            Apunta al código QR de la puerta
          </Texto>
          <Texto style={e.detalle}>
            Al escanear el QR se abrirá una ventana externa fuera de la aplicación
          </Texto>
        </View>

        <Pressable
          style={({ pressed }) => [e.botonEscanear, pressed && e.pulsado]}
          accessibilityRole="button"
          accessibilityLabel="Escanear de nuevo"
          testID="btn-escanear-de-nuevo"
          onPress={() => {
            reproducirSonido("toque");
            setLectura((n) => n + 1);
          }}
        >
          <View
            style={e.fondoPicto}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <PictogramaInterfaz nombre="leerQr" etiqueta="leer QR" tam={48} />
          </View>
          <Texto style={[e.textoEscanear, { color: colores.textoSobrePrimario }]}>
            Escanear de nuevo
          </Texto>
        </Pressable>
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenido: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 20 },
    reloj: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    quedan: { fontSize: 20, fontWeight: "700", color: c.texto },
    empezaste: { fontSize: 15, color: c.textoSecundario },
    tarjeta: {
      width: "100%",
      maxWidth: 680,
      alignItems: "center",
      gap: 12,
      padding: 24,
      borderRadius: 18,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    lector: { alignItems: "center", gap: 8 },
    notaLector: { fontSize: 16, color: c.textoSecundario, textAlign: "center" },
    instruccion: { fontSize: 28, fontWeight: "700", color: c.texto, textAlign: "center" },
    detalle: { fontSize: 16, color: c.textoSecundario, textAlign: "center" },
    // Botón grande (RNF1.1): al menos 120 px de alto
    botonEscanear: {
      minWidth: 360,
      minHeight: 120,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: c.primario,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    pulsado: { opacity: 0.8 },
    fondoPicto: { padding: 4, borderRadius: 10, backgroundColor: "#FFFFFF" },
    textoEscanear: { fontSize: 26, fontWeight: "700" },
  });
