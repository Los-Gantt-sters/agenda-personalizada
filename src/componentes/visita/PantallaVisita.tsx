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
// SCRUM-114: al leer un código se comprueba (enlaceQR: solo https y sitios permitidos). Si vale, sale
// un botón grande «Abrir información de <sitio>»: la ventana se abre al TOCARLO (los navegadores
// bloquean las que no salen de un toque, y así se ve a dónde va). El lector se para hasta «Escanear
// de nuevo», para no abrir ventanas seguidas.
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { urlImagenPictograma } from "../../arasaac/urls";
import { PantallaTareaHecha } from "../agenda/PantallaTareaHecha";
import { PantallaConfirmarFin } from "../ejecucion-tarea/PantallaConfirmarFin";
import { useTranscurrido } from "../ejecucion-tarea/useTranscurrido";
import { RelojVisual } from "../reloj-visual/RelojVisual";
import { textoTiempoRestante } from "../reloj-visual/textoTiempo";
import { Pantalla } from "../../pantalla/Pantalla";
import { abrirEnlaceExterno, validarEnlaceQR } from "./enlaceQR";
import { reproducirSonido } from "../../servicios/sonidos";
import type { Paleta } from "../../temas";
import { Icono, PictogramaInterfaz, Texto, useApariencia, useEstilos } from "../../ui";

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
  /** Abre un enlace fuera de la aplicación (por defecto, abrirEnlaceExterno). */
  abrirEnlace?: (url: string) => Promise<boolean>;
  /** Salir de la visita (volver a la agenda). */
  alSalir: () => void;
}

type Paso = "escanear" | "confirmar" | "hecha";

/** Qué ha pasado con el último código leído. */
type Resultado =
  | { tipo: "listo"; url: string; sitio: string } // código bueno: falta tocar «Abrir información»
  | { tipo: "abriendo"; url: string; sitio: string }
  | { tipo: "abierto"; url: string; sitio: string }
  | { tipo: "no-abierto"; url: string; sitio: string }
  | { tipo: "no-valido" };

export function PantallaVisita({
  inicio,
  duracionMin = 30,
  Lector = LectorQRNoDisponible,
  abrirEnlace = abrirEnlaceExterno,
  alSalir,
}: PantallaVisitaProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [paso, setPaso] = useState<Paso>("escanear");
  // Cambiar la clave vuelve a montar el lector: así «Escanear de nuevo» lo deja listo otra vez
  const [lectura, setLectura] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  // Cada lectura tiene su número: si el alumno pulsa «Escanear de nuevo» o sale mientras se abre una
  // ventana, la respuesta de esa apertura ya no cambia nada.
  const lecturaActual = useRef(0);
  const montado = useRef(true);
  useEffect(
    () => () => {
      montado.current = false;
    },
    [],
  );
  const [empezo] = useState(() => inicio ?? new Date().toISOString());
  const transcurridoMs = useTranscurrido(empezo);
  const duracionMs = duracionMin * 60_000;
  const horaInicio = new Date(empezo).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // El lector ha leído un código: solo se comprueba; abrirlo lo decide el alumno con un toque
  const leerCodigo = (texto: string) => {
    if (resultado) return; // el lector ya se ha parado
    const enlace = validarEnlaceQR(texto);
    setResultado(
      enlace.valido
        ? { tipo: "listo", url: enlace.url, sitio: enlace.sitio }
        : { tipo: "no-valido" },
    );
  };

  // «Abrir información»: es un toque del alumno, así que el navegador deja abrir la ventana
  const abrir = async (url: string, sitio: string) => {
    const numero = lecturaActual.current;
    reproducirSonido("toque");
    setResultado({ tipo: "abriendo", url, sitio });
    let abierto = false;
    try {
      abierto = await abrirEnlace(url);
    } catch {
      abierto = false;
    }
    if (!montado.current || numero !== lecturaActual.current) return;
    setResultado({ tipo: abierto ? "abierto" : "no-abierto", url, sitio });
    if (abierto) reproducirSonido("acierto");
  };

  const escanearDeNuevo = () => {
    lecturaActual.current += 1;
    setResultado(null);
    setLectura((n) => n + 1);
  };

  /** Lo que se anuncia al lector de pantalla (región siempre montada; solo cambia el texto). */
  const anuncio =
    resultado?.tipo === "listo"
      ? `Código leído: ${resultado.sitio}. Toca «Abrir información».`
      : resultado?.tipo === "abierto"
        ? `Se ha abierto la información de ${resultado.sitio} en otra ventana.`
        : "";

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
        onNo={() => {
          // Vuelve a la visita con el lector listo, sin el resultado del último código
          escanearDeNuevo();
          setPaso("escanear");
        }}
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
          {resultado === null ? (
            <Lector key={lectura} alLeer={leerCodigo} />
          ) : resultado.tipo === "no-valido" ? (
            <View style={e.resultado} accessibilityRole="alert" testID="codigo-no-valido">
              <Icono nombre="alerta" color={colores.peligro} tam={56} grosor={3} />
              <Texto style={[e.textoResultado, { color: colores.peligro }]}>
                Este código no es de la visita. Prueba con otro.
              </Texto>
            </View>
          ) : (
            <View style={e.resultado} testID={`codigo-${resultado.tipo}`}>
              {resultado.tipo === "abierto" ? (
                <View style={e.fila}>
                  <Icono nombre="check" color={colores.exito} tam={40} grosor={3.4} />
                  <Texto style={[e.textoResultado, { color: colores.exito }]}>
                    {`Se ha abierto la información de ${resultado.sitio} en otra ventana.`}
                  </Texto>
                </View>
              ) : resultado.tipo === "no-abierto" ? (
                <View style={e.fila} accessibilityRole="alert">
                  <Icono nombre="alerta" color={colores.peligro} tam={40} grosor={3} />
                  <Texto style={[e.textoResultado, { color: colores.peligro }]}>
                    No se ha podido abrir. Toca otra vez el botón.
                  </Texto>
                </View>
              ) : null}
              {/* Botón grande: abre la ventana con un toque (también para volver a abrirla) */}
              <Pressable
                style={({ pressed }) => [
                  e.botonAbrir,
                  resultado.tipo === "abriendo" && e.apagado,
                  pressed && e.pulsado,
                ]}
                disabled={resultado.tipo === "abriendo"}
                accessibilityRole="button"
                accessibilityLabel={`Abrir información de ${resultado.sitio}`}
                accessibilityState={{ disabled: resultado.tipo === "abriendo" }}
                testID="btn-abrir-informacion"
                onPress={() => void abrir(resultado.url, resultado.sitio)}
              >
                <Icono nombre="enlace" color={colores.textoSobrePrimario} tam={34} grosor={2.8} />
                <Texto style={[e.textoBotonAbrir, { color: colores.textoSobrePrimario }]}>
                  {`Abrir información de ${resultado.sitio}`}
                </Texto>
              </Pressable>
            </View>
          )}
          {/* Anuncio para el lector de pantalla: siempre montado, solo cambia su texto */}
          <Texto
            style={e.soloLectorPantalla}
            accessibilityLiveRegion="polite"
            testID="anuncio-visita"
          >
            {anuncio}
          </Texto>
          <Texto style={e.instruccion} accessibilityRole="header">
            Apunta al código QR de la puerta
          </Texto>
          <Texto style={e.detalle}>
            Al escanear el QR podrás abrir su información en una ventana fuera de la aplicación
          </Texto>
        </View>

        <Pressable
          style={({ pressed }) => [e.botonEscanear, pressed && e.pulsado]}
          accessibilityRole="button"
          accessibilityLabel="Escanear de nuevo"
          testID="btn-escanear-de-nuevo"
          onPress={() => {
            reproducirSonido("toque");
            escanearDeNuevo();
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
    empezaste: { fontSize: 18, color: c.textoSecundario },
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
    resultado: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 12 },
    fila: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
    textoResultado: { flexShrink: 1, fontSize: 22, fontWeight: "700", textAlign: "center" },
    // Botón grande (RNF1.1): al menos 120 px de alto
    botonAbrir: {
      minWidth: 360,
      minHeight: 120,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: c.exito,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    textoBotonAbrir: { flexShrink: 1, fontSize: 24, fontWeight: "700", textAlign: "center" },
    apagado: { opacity: 0.5 },
    // Invisible en pantalla, pero el lector de pantalla lo lee
    soloLectorPantalla: {
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      opacity: 0,
    },
    notaLector: { fontSize: 18, color: c.textoSecundario, textAlign: "center" },
    instruccion: { fontSize: 28, fontWeight: "700", color: c.texto, textAlign: "center" },
    detalle: { fontSize: 18, color: c.textoSecundario, textAlign: "center" },
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
