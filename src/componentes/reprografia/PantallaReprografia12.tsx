/**
 * Pantalla 12 — Reprografía · Fotocopias para Alumno PTVAL (HU-14 / SCRUM-108 / SCRUM-110 · T-14.2).
 * Adaptada exactamente a la estructura paso a paso de la Pantalla 07 (12.html):
 *   - Barra superior con insignia «Paso X de 5», fase de la máquina de estados (Recogida / Taller / Reparto)
 *     y reloj visual regresivo («Quedan 45 minutos / Empezaste a las 10:45»).
 *   - Tarjeta central de gran tamaño con el paso activo en Lectura Fácil.
 *   - Barra de 5 formatos multimedia debajo del paso (Pictograma, Texto, Foto, Vídeo, Audio con síntesis de voz).
 *   - Barra inferior de alumno con «Ayuda», «Atrás», «Siguiente» (que en el Paso 5 se transforma en el
 *     botón verde «Terminar tarea» -> Pantalla 08) y «Preferencias».
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { urlImagenPictograma } from "../../arasaac/urls";
import { RelojVisual } from "../reloj-visual/RelojVisual";
import { generarPasosReprografia, obtenerFaseDePaso } from "../../servicios/reprografiaService";
import { leer } from "../../servicios/voz";
import type { Paleta } from "../../temas";
import type { PasoReprografia } from "../../tipos/reprografia";
import {
  FORMA,
  Icono,
  PictogramaInterfaz,
  Texto,
  fechaDeHoy,
  useApariencia,
  useEstilos,
} from "../../ui";

export type FormatoMultimediaPaso = "pictograma" | "texto" | "foto" | "video" | "audio";

export const FORMATOS_MULTIMEDIA: {
  clave: FormatoMultimediaPaso;
  etiqueta: string;
  pictogramaId: number;
}[] = [
  { clave: "pictograma", etiqueta: "Pictograma", pictogramaId: 31907 },
  { clave: "texto", etiqueta: "Texto", pictogramaId: 24508 },
  { clave: "foto", etiqueta: "Foto", pictogramaId: 6961 },
  { clave: "video", etiqueta: "Vídeo", pictogramaId: 6247 },
  { clave: "audio", etiqueta: "Audio", pictogramaId: 5993 },
];

export interface PantallaReprografia12Props {
  /** Lista de los 5 pasos del encargo (por defecto el encargo de 20 copias de Clase Triángulo de 12.html). */
  pasos?: PasoReprografia[];
  /** Paso inicial (1 a 5; por defecto `3` como en la captura del prototipo 12.html). */
  pasoInicial?: 1 | 2 | 3 | 4 | 5;
  /** Duración estimada en minutos para el reloj visual (`45` por defecto). */
  duracionMinutos?: number;
  /** Minutos transcurridos (`0` por defecto). */
  minutosTranscurridos?: number;
  /** Hora de inicio mostrada bajo el reloj (`"10:45"` por defecto). */
  horaInicio?: string;
  /** Texto de fecha en la cabecera. */
  fechaTexto?: string;
  /** Se invoca cada vez que el alumno cambia de paso (`1..5`), informando la fase activa. */
  alCambiarPaso?: (paso: 1 | 2 | 3 | 4 | 5, fase: "recogida" | "taller" | "reparto") => void;
  /** Se invoca al pulsar el botón verde «Terminar tarea» en el último paso (Paso 5 -> Pantalla 08). */
  alTerminarTarea?: () => void;
  /** Se invoca al pulsar «Atrás» estando en el Paso 1 (vuelve a la agenda 06). */
  alVolverAgenda?: () => void;
  /** Se invoca al pulsar «Ayuda» en la barra inferior del alumno. */
  alPedirAyuda?: () => void;
  /** Se invoca al pulsar «Preferencias» en la barra inferior del alumno. */
  alAbrirPreferencias?: () => void;
}

const ETIQUETA_FASE: Record<"recogida" | "taller" | "reparto", string> = {
  recogida: "Fase 1: Recogida",
  taller: "Fase 2: Taller",
  reparto: "Fase 3: Reparto",
};

const PASOS_POR_DEFECTO_12: PasoReprografia[] = generarPasosReprografia({
  copias: 20,
  modoCaras: "dos_caras",
  modoColor: "blanco_y_negro",
  aulaDestino: "Clase Triángulo",
  profesorSolicitante: "María Carmen",
});

/**
 * Renderiza la Pantalla 12 de ejecución paso a paso de Reprografía para alumnos PTVAL.
 * @param props Propiedades del encargo y callbacks de navegación
 * @returns Componente visual de Reprografía adaptado a la estructura de Pantalla 07
 */
export function PantallaReprografia12({
  pasos = PASOS_POR_DEFECTO_12,
  pasoInicial = 3,
  duracionMinutos = 45,
  minutosTranscurridos = 0,
  horaInicio = "10:45",
  fechaTexto,
  alCambiarPaso,
  alTerminarTarea,
  alVolverAgenda,
  alPedirAyuda,
  alAbrirPreferencias,
}: PantallaReprografia12Props) {
  const [numeroPaso, setNumeroPaso] = useState<1 | 2 | 3 | 4 | 5>(pasoInicial);
  const [formatoActivo, setFormatoActivo] = useState<FormatoMultimediaPaso>("pictograma");

  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const pasoActual = useMemo(
    () => pasos.find((p) => p.orden === numeroPaso) ?? pasos[0],
    [pasos, numeroPaso],
  );
  const faseActual = obtenerFaseDePaso(numeroPaso);
  const esUltimoPaso = numeroPaso === 5;

  const seleccionarFormato = (formato: FormatoMultimediaPaso) => {
    setFormatoActivo(formato);
    if (formato === "audio") {
      leer(`${pasoActual.orden}. ${pasoActual.texto}`);
    }
  };

  const irAPaso = (nuevo: 1 | 2 | 3 | 4 | 5) => {
    setNumeroPaso(nuevo);
    alCambiarPaso?.(nuevo, obtenerFaseDePaso(nuevo));
  };

  const manejarAtras = () => {
    if (numeroPaso > 1) {
      irAPaso((numeroPaso - 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      alVolverAgenda?.();
    }
  };

  const manejarSiguienteOTerminar = () => {
    if (esUltimoPaso) {
      alTerminarTarea?.();
    } else {
      irAPaso((numeroPaso + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  return (
    <View style={estilos.marco} testID="pantalla-12-reprografia">
      {/* Cabecera superior de la pantalla 12 */}
      <SafeAreaView edges={["top", "left", "right"]} style={estilos.franjaCabecera}>
        <View style={estilos.cabecera}>
          <View style={estilos.izquierdaCabecera}>
            <PictogramaInterfaz nombre="agenda" etiqueta="Reprografía" tam={40} />
            <Texto accessibilityRole="header" style={estilos.tituloPantalla}>
              Reprografía · Fotocopias
            </Texto>
          </View>
          <Texto style={estilos.fechaCabecera}>{fechaTexto ?? fechaDeHoy()}</Texto>
        </View>
      </SafeAreaView>

      {/* Cuerpo central con la misma estructura que 07 */}
      <View style={estilos.cuerpo}>
        <View style={estilos.barraSuperior} testID="barra-superior-12">
          <View style={estilos.grupoInsignias}>
            <View style={estilos.insigniaPaso} testID="insignia-paso-12">
              <Texto style={estilos.textoInsigniaPaso}>{`Paso ${numeroPaso} de 5`}</Texto>
            </View>
            <View style={estilos.insigniaFase} testID="insignia-fase-12">
              <Texto style={estilos.textoInsigniaFase}>{ETIQUETA_FASE[faseActual]}</Texto>
            </View>
          </View>

          <View style={estilos.cajaReloj} testID="reloj-reprografia-12">
            <RelojVisual
              duracionMs={duracionMinutos * 60_000}
              transcurridoMs={minutosTranscurridos * 60_000}
              tamano={50}
            />
            <Texto style={estilos.textoEmpezaste}>{`Empezaste a las ${horaInicio}`}</Texto>
          </View>
        </View>

        {/* Tarjeta central del paso activo */}
        <View style={estilos.tarjetaPaso} testID="tarjeta-paso-12">
          {formatoActivo === "pictograma" ? (
            <Image
              source={{ uri: pasoActual.pictogramaUrl }}
              style={estilos.imagenPaso}
              accessibilityIgnoresInvertColors
            />
          ) : null}

          {formatoActivo === "foto" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-foto-12">
              <Icono nombre="imagen" tam={44} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionFoto}</Texto>
            </View>
          ) : null}

          {formatoActivo === "video" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-video-12">
              <Icono nombre="reproducir" tam={44} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>{pasoActual.descripcionVideo}</Texto>
            </View>
          ) : null}

          {formatoActivo === "audio" ? (
            <View style={estilos.bloqueMediaEspecial} testID="vista-formato-audio-12">
              <Icono nombre="altavoz" tam={44} color={colores.primario} />
              <Texto style={estilos.textoMediaEspecial}>
                Escuchando el paso en voz alta (Lectura Fácil)
              </Texto>
            </View>
          ) : null}

          <Texto
            style={[estilos.textoPaso, formatoActivo === "texto" && estilos.textoPasoAmpliado]}
            testID="texto-paso-actual-12"
          >
            {`${pasoActual.orden}. ${pasoActual.texto}`}
          </Texto>
        </View>

        {/* Barra de 5 botones multimedia debajo del paso */}
        <View style={estilos.barraMultimedia} testID="barra-multimedia-12">
          {FORMATOS_MULTIMEDIA.map((fmt) => {
            const activo = formatoActivo === fmt.clave;
            return (
              <Pressable
                key={fmt.clave}
                testID={`btn-formato-12-${fmt.clave}`}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={fmt.etiqueta}
                onPress={() => seleccionarFormato(fmt.clave)}
                style={[estilos.botonFormato, activo && estilos.botonFormatoActivo]}
              >
                <Image
                  source={{ uri: urlImagenPictograma(fmt.pictogramaId, 500) }}
                  style={estilos.iconoFormato}
                  accessibilityIgnoresInvertColors
                />
                <Texto
                  style={[estilos.textoBotonFormato, activo && estilos.textoBotonFormatoActivo]}
                >
                  {fmt.etiqueta}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Barra inferior de alumno: Ayuda | Atrás · Siguiente / «Terminar tarea» | Preferencias */}
      <SafeAreaView edges={["bottom", "left", "right"]} style={estilos.franjaBarraInferior}>
        <View style={estilos.barraInferior} testID="barra-inferior-12">
          <Pressable
            testID="btn-12-ayuda"
            accessibilityRole="button"
            accessibilityLabel="Ayuda"
            onPress={alPedirAyuda}
            style={({ pressed }) => [
              estilos.botonBarra,
              estilos.botonAyuda,
              pressed && estilos.pulsado,
            ]}
          >
            <PictogramaInterfaz nombre="ayuda" etiqueta="Ayuda" tam={34} />
            <Texto style={estilos.textoBotonBarra}>Ayuda</Texto>
          </Pressable>

          <View style={estilos.centroBarra}>
            <Pressable
              testID="btn-12-atras"
              accessibilityRole="button"
              accessibilityLabel="Atrás"
              onPress={manejarAtras}
              style={({ pressed }) => [estilos.botonBarra, pressed && estilos.pulsado]}
            >
              <Icono nombre="flechaAtras" tam={26} color={colores.texto} grosor={3} />
              <Texto style={estilos.textoBotonBarra}>Atrás</Texto>
            </Pressable>

            {esUltimoPaso ? (
              <Pressable
                testID="btn-12-terminar-tarea"
                accessibilityRole="button"
                accessibilityLabel="Terminar tarea"
                onPress={manejarSiguienteOTerminar}
                style={({ pressed }) => [
                  estilos.botonBarra,
                  estilos.botonTerminarTarea,
                  pressed && estilos.pulsadoPrimario,
                ]}
              >
                <PictogramaInterfaz nombre="terminar" etiqueta="Terminar tarea" tam={34} />
                <Texto style={estilos.textoBotonTerminar}>Terminar tarea</Texto>
              </Pressable>
            ) : (
              <Pressable
                testID="btn-12-siguiente"
                accessibilityRole="button"
                accessibilityLabel="Siguiente"
                onPress={manejarSiguienteOTerminar}
                style={({ pressed }) => [
                  estilos.botonBarra,
                  estilos.botonSiguiente,
                  pressed && estilos.pulsado,
                ]}
              >
                <Texto style={estilos.textoBotonBarra}>Siguiente</Texto>
                <Icono nombre="adelante" tam={26} color={colores.texto} grosor={3} />
              </Pressable>
            )}
          </View>

          <Pressable
            testID="btn-12-preferencias"
            accessibilityRole="button"
            accessibilityLabel="Preferencias"
            onPress={alAbrirPreferencias}
            style={({ pressed }) => [estilos.botonBarra, pressed && estilos.pulsado]}
          >
            <Icono nombre="accesibilidad" tam={28} color={colores.primario} />
            <Texto style={estilos.textoBotonBarra}>Preferencias</Texto>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    marco: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    franjaCabecera: {
      backgroundColor: c.superficie,
      borderBottomWidth: FORMA.borde,
      borderBottomColor: c.borde,
    },
    cabecera: {
      minHeight: 62,
      paddingHorizontal: 22,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    izquierdaCabecera: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    tituloPantalla: {
      fontSize: 24,
      fontWeight: "700",
      color: c.texto,
    },
    fechaCabecera: {
      fontSize: 18,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    cuerpo: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 12,
      gap: 12,
    },
    barraSuperior: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    grupoInsignias: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    insigniaPaso: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
    },
    textoInsigniaPaso: {
      fontSize: 20,
      fontWeight: "700",
      color: c.primario,
    },
    insigniaFase: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoInsigniaFase: {
      fontSize: 15,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    cajaReloj: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
    },
    textoEmpezaste: {
      fontSize: 14,
      color: c.textoSecundario,
    },
    tarjetaPaso: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
      borderRadius: FORMA.radio,
      padding: 18,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    imagenPaso: {
      width: 165,
      height: 165,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
    },
    bloqueMediaEspecial: {
      padding: 16,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: "center",
      gap: 8,
    },
    textoMediaEspecial: {
      fontSize: 17,
      fontWeight: "700",
      color: c.primario,
      textAlign: "center",
    },
    textoPaso: {
      fontSize: 28,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    textoPasoAmpliado: {
      fontSize: 34,
    },
    barraMultimedia: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 10,
    },
    botonFormato: {
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    botonFormatoActivo: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
      borderWidth: FORMA.bordeDestacado,
    },
    iconoFormato: {
      width: 34,
      height: 34,
      borderRadius: 6,
      backgroundColor: "#FFFFFF",
    },
    textoBotonFormato: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    textoBotonFormatoActivo: {
      color: c.primario,
    },
    franjaBarraInferior: {
      backgroundColor: c.superficie,
      borderTopWidth: FORMA.borde,
      borderTopColor: c.borde,
    },
    barraInferior: {
      minHeight: 74,
      paddingHorizontal: 20,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    centroBarra: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    botonBarra: {
      minHeight: 58,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: FORMA.radio,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    botonAyuda: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    botonSiguiente: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
      borderWidth: FORMA.bordeDestacado,
    },
    botonTerminarTarea: {
      backgroundColor: "#2E7D32",
      borderColor: "#1B5E20",
      borderWidth: FORMA.bordeDestacado,
      paddingHorizontal: 22,
    },
    textoBotonBarra: {
      fontSize: 18,
      fontWeight: "700",
      color: c.texto,
    },
    textoBotonTerminar: {
      fontSize: 19,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    pulsadoPrimario: {
      opacity: 0.9,
    },
  });
