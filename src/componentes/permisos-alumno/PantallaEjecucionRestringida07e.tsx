/**
 * Pantalla 07e — Ejecución paso a paso restringida según los permisos configurados
 * por el tutor en la Pantalla 26d (HU-23 / SCRUM-141 / SCRUM-143 · T-23.2).
 *
 * Sigue fielmente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/07e.html`:
 *   - Cabecera con el título de la tarea («Lavarse las manos») y chip del alumno («Alejandro»).
 *   - Píldora «Paso X de 5» y tarjeta central con borde destacado (`3px solid var(--pri)`),
 *     imagen/pictograma de 216x216 y título del paso («Abre el grifo»).
 *   - Fila inferior de apoyos multimedia filtrada dinámicamente según `formatosPermitidos`
 *     de `26d` (por defecto en `07e.html`: únicamente `Pictograma` y `Audio`, ocultando
 *     `Texto`, `Foto` y `Vídeo`).
 *   - Barra inferior de alumno con botón «Ayuda» (izquierda), «Atrás» y «Siguiente» /
 *     «Terminar tarea» (centro) y botón «Preferencias» (derecha, visible solo si
 *     `mostrarBotonPreferencias16` está habilitado en `26d`).
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { urlImagenPictograma } from "../../arasaac/urls";
import {
  FORMATOS_RESTRINGIDOS_DEMO_07E,
  PASOS_LAVARSE_MANOS_07E,
  filtrarCatalogoFormatosPorPermiso,
} from "../../servicios/permisosAlumnoService";
import { leer } from "../../servicios/voz";
import type { Paleta } from "../../temas";
import type { FormatoMultimediaAlumno, PasoEjecucionTarea07e } from "../../tipos/permisosAlumno";
import { FORMA, Icono, PictogramaInterfaz, Texto, useApariencia, useEstilos } from "../../ui";

export interface PantallaEjecucionRestringida07eProps {
  /** Título de la tarea en cabecera (`"Lavarse las manos"` por defecto como en `07e.html`). */
  tituloTarea?: string;
  /** Nombre del alumno en cabecera (`"Alejandro"` por defecto). */
  nombreAlumno?: string;
  /** Lista de pasos de la tarea (5 pasos de «Lavarse las manos» por defecto). */
  pasos?: readonly PasoEjecucionTarea07e[];
  /** Paso inicial (1 a N; `1` por defecto como en `07e.html`). */
  pasoInicial?: number;
  /**
   * Formatos multimedia permitidos por el tutor en 26d.
   * Por defecto `["pictograma", "audio"]` como en el boceto `07e.html`.
   */
  formatosPermitidos?: readonly FormatoMultimediaAlumno[];
  /**
   * Si se muestra el botón «Preferencias» (menú 16) abajo a la derecha
   * según el permiso configurado en 26d (`true` por defecto).
   */
  mostrarBotonPreferencias16?: boolean;
  /** Se invoca al cambiar de paso. */
  alCambiarPaso?: (ordenPaso: number) => void;
  /** Se invoca al pulsar «Terminar tarea» en el último paso. */
  alTerminarTarea?: () => void;
  /** Se invoca al pulsar «Atrás» en el primer paso. */
  alAtras?: () => void;
  /** Se invoca al pulsar «Ayuda» (-> Pantalla 14). */
  alPedirAyuda?: () => void;
  /** Se invoca al pulsar «Preferencias» (-> Pantalla 16). */
  alAbrirPreferencias?: () => void;
}

/**
 * Renderiza la Pantalla 07e de ejecución de tarea del alumno con filtrado dinámico
 * de formatos multimedia y acceso a Preferencias (16) según los permisos de 26d.
 * @param props Propiedades de la tarea, permisos activos y callbacks
 * @returns Vista de ejecución restringida del alumno
 */
export function PantallaEjecucionRestringida07e({
  tituloTarea = "Lavarse las manos",
  nombreAlumno = "Alejandro",
  pasos = PASOS_LAVARSE_MANOS_07E,
  pasoInicial = 1,
  formatosPermitidos = FORMATOS_RESTRINGIDOS_DEMO_07E,
  mostrarBotonPreferencias16 = true,
  alCambiarPaso,
  alTerminarTarea,
  alAtras,
  alPedirAyuda,
  alAbrirPreferencias,
}: PantallaEjecucionRestringida07eProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const botonesMultimediaVisibles = useMemo(
    () => filtrarCatalogoFormatosPorPermiso(formatosPermitidos),
    [formatosPermitidos],
  );

  const primerFormatoPermitido: FormatoMultimediaAlumno =
    botonesMultimediaVisibles[0]?.clave ?? "pictograma";

  const [indicePaso, setIndicePaso] = useState<number>(() => {
    const idx = Math.max(1, Math.min(pasoInicial, pasos.length)) - 1;
    return idx;
  });
  const [formatoSeleccionado, setFormatoSeleccionado] =
    useState<FormatoMultimediaAlumno>(primerFormatoPermitido);
  const [reproduciendoAudio, setReproduciendoAudio] = useState<boolean>(false);

  const formatoActivo: FormatoMultimediaAlumno = botonesMultimediaVisibles.some(
    (b) => b.clave === formatoSeleccionado,
  )
    ? formatoSeleccionado
    : primerFormatoPermitido;

  const pasoActual = pasos[indicePaso] ?? pasos[0];
  const totalPasos = pasos.length;
  const numeroPaso = indicePaso + 1;
  const esUltimoPaso = numeroPaso >= totalPasos;

  const seleccionarFormato = (clave: FormatoMultimediaAlumno) => {
    setFormatoSeleccionado(clave);
    if (clave === "audio") {
      setReproduciendoAudio(true);
      leer(pasoActual.textoAudio);
    } else {
      setReproduciendoAudio(false);
    }
  };

  const irPasoAnterior = () => {
    setReproduciendoAudio(false);
    if (indicePaso <= 0) {
      alAtras?.();
      return;
    }
    const nuevoIndice = indicePaso - 1;
    setIndicePaso(nuevoIndice);
    alCambiarPaso?.(nuevoIndice + 1);
  };

  const irPasoSiguiente = () => {
    setReproduciendoAudio(false);
    if (esUltimoPaso) {
      alTerminarTarea?.();
      return;
    }
    const nuevoIndice = indicePaso + 1;
    setIndicePaso(nuevoIndice);
    alCambiarPaso?.(nuevoIndice + 1);
  };

  return (
    <SafeAreaView style={estilos.seguro} testID="pantalla-07e-ejecucion-restringida">
      {/* Barra superior (72px): título de tarea e insignia del alumno */}
      <View style={estilos.barraSuperior}>
        <Texto style={estilos.tituloCabecera}>{tituloTarea}</Texto>
        <View style={estilos.chipAlumno} testID="chip-alumno-07e">
          <View style={estilos.avatarAlumno}>
            <Icono nombre="persona" tam={20} color={colores.primario} />
          </View>
          <Texto style={estilos.nombreAlumno}>{nombreAlumno}</Texto>
        </View>
      </View>

      {/* Cuerpo central: Píldora Paso X de 5 + Tarjeta central + Botones multimedia permitidos */}
      <View style={estilos.cuerpo}>
        <View style={estilos.filaInsigniaPaso}>
          <View style={estilos.pildoraPaso} testID="insignia-paso-07e">
            <Texto style={estilos.textoPildoraPaso}>{`Paso ${numeroPaso} de ${totalPasos}`}</Texto>
          </View>
        </View>

        <View style={estilos.tarjetaPaso} testID="tarjeta-paso-central-07e">
          {(formatoActivo === "pictograma" || formatoActivo === "audio") && (
            <>
              <Image
                testID={`imagen-paso-07e-${pasoActual.orden}`}
                source={{ uri: urlImagenPictograma(pasoActual.pictogramaId) }}
                style={estilos.imagenPaso}
                resizeMode="contain"
                accessibilityLabel={pasoActual.titulo}
                accessibilityIgnoresInvertColors
              />
              <Texto style={estilos.tituloPaso} testID="titulo-paso-07e">
                {pasoActual.titulo}
              </Texto>
            </>
          )}

          {formatoActivo === "texto" && (
            <View style={estilos.bloqueFormatoAlternativo} testID="vista-formato-texto-07e">
              <Texto style={estilos.tituloPaso} testID="titulo-paso-07e">
                {pasoActual.titulo}
              </Texto>
              <Texto style={estilos.textoDetalleFormato}>{pasoActual.textoLecturaFacil}</Texto>
            </View>
          )}

          {formatoActivo === "foto" && (
            <View style={estilos.bloqueFormatoAlternativo} testID="vista-formato-foto-07e">
              <Image
                source={{ uri: urlImagenPictograma(pasoActual.pictogramaId) }}
                style={estilos.imagenPasoPequena}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Texto style={estilos.tituloPaso} testID="titulo-paso-07e">
                {pasoActual.titulo}
              </Texto>
              <Texto style={estilos.textoDetalleFormato}>{pasoActual.descripcionFoto}</Texto>
            </View>
          )}

          {formatoActivo === "video" && (
            <View style={estilos.bloqueFormatoAlternativo} testID="vista-formato-video-07e">
              <Image
                source={{ uri: urlImagenPictograma(pasoActual.pictogramaId) }}
                style={estilos.imagenPasoPequena}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Texto style={estilos.tituloPaso} testID="titulo-paso-07e">
                {pasoActual.titulo}
              </Texto>
              <Texto style={estilos.textoDetalleFormato}>{pasoActual.descripcionVideo}</Texto>
            </View>
          )}
        </View>

        {/* Barra de formatos multimedia filtrada dinámicamente según los permisos de 26d */}
        <View style={estilos.filaFormatos} testID="barra-formatos-multimedia-07e">
          {botonesMultimediaVisibles.map((item) => {
            const seleccionado = formatoActivo === item.clave;
            return (
              <Pressable
                key={item.clave}
                testID={`boton-formato-07e-${item.clave}`}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
                accessibilityLabel={item.etiqueta}
                onPress={() => seleccionarFormato(item.clave)}
                style={[
                  estilos.botonFormato,
                  seleccionado ? estilos.botonFormatoActivo : estilos.botonFormatoInactivo,
                ]}
              >
                <Texto
                  style={[
                    estilos.textoBotonFormato,
                    seleccionado
                      ? estilos.textoBotonFormatoActivo
                      : estilos.textoBotonFormatoInactivo,
                  ]}
                >
                  {item.etiqueta}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        {reproduciendoAudio ? (
          <Texto style={estilos.mensajeAudio} testID="mensaje-audio-07e">
            🔊 Reproduciendo audio del paso...
          </Texto>
        ) : null}
      </View>

      {/* Barra inferior de alumno (96px): Ayuda | Atrás · Siguiente/Terminar | Preferencias (condicional) */}
      <View style={estilos.barraInferior}>
        <Pressable
          testID="boton-ayuda-alumno-07e"
          accessibilityRole="button"
          accessibilityLabel="Pedir ayuda"
          onPress={alPedirAyuda}
          style={({ pressed }) => [estilos.botonAyuda, pressed && estilos.pulsado]}
        >
          <View style={estilos.cajaPictoAyuda}>
            <PictogramaInterfaz nombre="ayuda" etiqueta="Ayuda" tam={32} />
          </View>
          <Texto style={estilos.textoBotonAyuda}>Ayuda</Texto>
        </Pressable>

        <View style={estilos.navegacionCentral}>
          <Pressable
            testID="boton-atras-07e"
            accessibilityRole="button"
            accessibilityLabel="Paso anterior"
            onPress={irPasoAnterior}
            style={({ pressed }) => [estilos.botonNavSecundario, pressed && estilos.pulsado]}
          >
            <Icono nombre="atras" tam={24} color={colores.primario} />
            <Texto style={estilos.textoNavSecundario}>Atrás</Texto>
          </Pressable>

          <Pressable
            testID={esUltimoPaso ? "boton-terminar-tarea-07e" : "boton-siguiente-07e"}
            accessibilityRole="button"
            accessibilityLabel={esUltimoPaso ? "Terminar tarea" : "Siguiente paso"}
            onPress={irPasoSiguiente}
            style={({ pressed }) => [
              estilos.botonNavPrimario,
              esUltimoPaso && estilos.botonTerminarVerde,
              pressed && estilos.pulsado,
            ]}
          >
            <Texto style={estilos.textoNavPrimario}>
              {esUltimoPaso ? "Terminar tarea" : "Siguiente"}
            </Texto>
            <Icono
              nombre={esUltimoPaso ? "check" : "adelante"}
              tam={24}
              color={colores.textoSobrePrimario}
            />
          </Pressable>
        </View>

        {mostrarBotonPreferencias16 ? (
          <Pressable
            testID="boton-preferencias-alumno-07e"
            accessibilityRole="button"
            accessibilityLabel="Abrir Preferencias"
            onPress={alAbrirPreferencias}
            style={({ pressed }) => [estilos.botonPreferencias, pressed && estilos.pulsado]}
          >
            <Icono nombre="accesibilidad" tam={26} color={colores.primario} />
            <Texto style={estilos.textoBotonPreferencias}>Preferencias</Texto>
          </Pressable>
        ) : (
          <View
            style={estilos.espaciadorPreferenciasOculto}
            testID="preferencias-oculto-por-permiso-07e"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    seguro: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    barraSuperior: {
      minHeight: 72,
      paddingHorizontal: 24,
      backgroundColor: c.superficie,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    tituloCabecera: {
      fontSize: 24,
      fontWeight: "700",
      color: c.texto,
    },
    chipAlumno: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 46,
      paddingRight: 14,
      paddingLeft: 5,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    avatarAlumno: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    nombreAlumno: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    cuerpo: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    filaInsigniaPaso: {
      width: "100%",
      maxWidth: 680,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pildoraPaso: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.primario,
    },
    textoPildoraPaso: {
      fontSize: 17,
      fontWeight: "700",
      color: c.primario,
    },
    tarjetaPaso: {
      width: "100%",
      maxWidth: 680,
      minHeight: 320,
      backgroundColor: c.superficie,
      borderRadius: FORMA.radio,
      borderWidth: 3,
      borderColor: c.primario,
      padding: 18,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    imagenPaso: {
      width: 210,
      height: 210,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    imagenPasoPequena: {
      width: 140,
      height: 140,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    tituloPaso: {
      fontSize: 30,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    bloqueFormatoAlternativo: {
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 12,
    },
    textoDetalleFormato: {
      fontSize: 18,
      color: c.textoSecundario,
      textAlign: "center",
    },
    filaFormatos: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      flexWrap: "wrap",
    },
    botonFormato: {
      minHeight: 54,
      minWidth: 108,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: FORMA.radio,
      borderWidth: FORMA.borde,
      alignItems: "center",
      justifyContent: "center",
    },
    botonFormatoActivo: {
      backgroundColor: c.primario,
      borderColor: c.primario,
    },
    botonFormatoInactivo: {
      backgroundColor: c.superficie,
      borderColor: c.borde,
    },
    textoBotonFormato: {
      fontSize: 14.5,
      fontWeight: "700",
    },
    textoBotonFormatoActivo: {
      color: c.textoSobrePrimario,
    },
    textoBotonFormatoInactivo: {
      color: c.texto,
    },
    mensajeAudio: {
      fontSize: 13.5,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    barraInferior: {
      minHeight: 96,
      paddingHorizontal: 24,
      paddingVertical: 14,
      backgroundColor: c.superficie,
      borderTopWidth: 1,
      borderTopColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    botonAyuda: {
      width: 150,
      height: 64,
      borderRadius: FORMA.radio,
      backgroundColor: "#C95A54",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    cajaPictoAyuda: {
      width: 36,
      height: 36,
      borderRadius: 6,
      backgroundColor: "rgba(255,255,255,0.95)",
      alignItems: "center",
      justifyContent: "center",
    },
    textoBotonAyuda: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    navegacionCentral: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    },
    botonNavSecundario: {
      minWidth: 168,
      height: 64,
      paddingHorizontal: 18,
      borderRadius: FORMA.radio,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    textoNavSecundario: {
      fontSize: 20,
      fontWeight: "700",
      color: c.primario,
    },
    botonNavPrimario: {
      minWidth: 168,
      height: 64,
      paddingHorizontal: 18,
      borderRadius: FORMA.radio,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
      backgroundColor: c.primario,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    botonTerminarVerde: {
      backgroundColor: c.exito,
      borderColor: c.exito,
    },
    textoNavPrimario: {
      fontSize: 20,
      fontWeight: "700",
      color: c.textoSobrePrimario,
    },
    botonPreferencias: {
      width: 160,
      height: 64,
      borderRadius: FORMA.radio,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    textoBotonPreferencias: {
      fontSize: 16,
      fontWeight: "700",
      color: c.primario,
    },
    espaciadorPreferenciasOculto: {
      width: 160,
      height: 64,
    },
    pulsado: {
      opacity: 0.85,
    },
  });
