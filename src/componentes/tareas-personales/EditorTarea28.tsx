/**
 * Pantalla 28 — Crear o editar tarea (Datos generales e icono + número de pasos)
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/28.html`
 * (SCRUM-89 / SCRUM-90 · T-07.1).
 *
 * Restricciones clave del boceto definitivo:
 * - SIN pestañas superiores («1. Datos generales e icono» / «2. Pasos y multimedia»).
 * - SIN bloque «Tipo de tarea / Plan B».
 * - Navegación exclusivamente mediante los botones inferiores («Atrás» y «Pasos»).
 * - Permite editar título, pictograma principal (-> 28p), descripción en texto
 *   y selector `+` / `−` del número de pasos (entre 1 y 5).
 * - Soporta edición en biblioteca general (Tutor / Familia) o edición exclusiva
 *   para un alumno concreto (`alumnoEditado`).
 */

import React, { useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { urlImagenPictograma } from "../../arasaac/urls";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import {
  PASOS_EDITOR_28_DEMO,
  type PasoTareaEditor28,
  type RolBibliotecaAdulto,
} from "./datosTareasPersonales";

export interface DatosGeneralesTarea28 {
  titulo: string;
  descripcion: string;
  pictogramaId: number;
  pictogramaNombre: string;
  pasosCount: number;
}

export interface EditorTarea28Props {
  /** Rol activo: `"tutor"` o `"familia"`. */
  rol?: RolBibliotecaAdulto;
  /** Nombre del usuario mostrado en cabecera (`"Carmen Ruiz"` o `"Familia García"`). */
  nombreUsuario?: string;
  /**
   * Si se indica (p. ej. `"Alejandro Pérez"` o `"Lucas"`), el banner muestra que la edición
   * se aplicará únicamente a ese alumno (flujo desde Pantallas 41 o 42b).
   */
  alumnoEditado?: string | null;
  /** Título inicial de la tarea. */
  tituloInicial?: string;
  /** Descripción inicial en texto (Lectura Fácil). */
  descripcionInicial?: string;
  /** ID de pictograma ARASAAC inicial. */
  pictogramaIdInicial?: number;
  /** Nombre descriptivo del pictograma principal actual. */
  pictogramaNombreInicial?: string;
  /** Número de pasos inicial (1..5, por defecto 5). */
  pasosCountInicial?: number;
  /** Lista de pasos de vista previa (hasta 5). */
  pasosPreview?: PasoTareaEditor28[];
  /** Se invoca al pulsar «Elegir en buscador (ARASAAC / Mi biblioteca)» (-> Pantalla 28p). */
  alAbrirBuscadorPictograma?: (datosActuales: DatosGeneralesTarea28) => void;
  /** Se invoca al pulsar el botón inferior «Pasos» (-> Pantalla 28s / 28ok). */
  alContinuarPasos?: (datosActuales: DatosGeneralesTarea28) => void;
  /** Acción del botón inferior «Atrás» (-> 31 o -> 41/42b si se edita para un alumno). */
  alAtras?: (() => void) | null;
  /** Acción para cerrar sesión desde la cabecera. */
  alCerrarSesion?: () => void;
}

/**
 * Acota el número de pasos entre 1 y 5 como establece el boceto 28.html.
 * @param valor Número de pasos solicitado
 * @returns Número entero entre 1 y 5
 */
export function acotarNumeroPasos28(valor: number): number {
  return Math.max(1, Math.min(5, Math.round(valor)));
}

/**
 * Renderiza la Pantalla 28 (Crear o editar tarea — Datos generales).
 * @param props Propiedades del editor de tarea
 * @returns Vista de edición de datos generales sin pestañas superiores ni bloque Plan B
 */
export function EditorTarea28({
  rol = "tutor",
  nombreUsuario,
  alumnoEditado = null,
  tituloInicial,
  descripcionInicial = "Tarea de higiene antes del recreo y del comedor con pictogramas y audio.",
  pictogramaIdInicial = 2443,
  pictogramaNombreInicial = "Lavarse las manos",
  pasosCountInicial = 5,
  pasosPreview = PASOS_EDITOR_28_DEMO,
  alAbrirBuscadorPictograma,
  alContinuarPasos,
  alAtras = null,
  alCerrarSesion,
}: EditorTarea28Props) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const tituloPorDefecto =
    tituloInicial ?? (rol === "familia" ? "Preparar la mochila" : "Lavarse las manos");

  const [titulo, setTitulo] = useState<string>(tituloPorDefecto);
  const [descripcion, setDescripcion] = useState<string>(descripcionInicial);
  const [pasosCount, setPasosCount] = useState<number>(() =>
    acotarNumeroPasos28(pasosCountInicial),
  );

  const etiquetaUsuario = nombreUsuario ?? (rol === "familia" ? "Familia García" : "Carmen Ruiz");

  const datosActuales: DatosGeneralesTarea28 = {
    titulo,
    descripcion,
    pictogramaId: pictogramaIdInicial,
    pictogramaNombre: pictogramaNombreInicial,
    pasosCount,
  };

  const pasosMostrados = pasosPreview.slice(0, pasosCount);

  const textoAmbito = alumnoEditado
    ? `Editando tarea únicamente para ${alumnoEditado} · Pulsa «Pasos» abajo para continuar`
    : "Creando / editando tarea en tu Biblioteca de tareas · Pulsa «Pasos» abajo para configurar cada paso";

  const pildoraAmbito = alumnoEditado
    ? `Solo alumno: ${alumnoEditado}`
    : rol === "familia"
      ? "Perfil activo: Familia"
      : "Perfil activo: Tutor";

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-usuario-28">
        <Icono nombre="persona" tam={18} color={colores.primario} />
        <Texto style={estilos.textoUsuario}>{etiquetaUsuario}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-28"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión y salir"
          onPress={alCerrarSesion}
          style={({ pressed }) => [estilos.botonSecundario, pressed && estilos.pulsado]}
        >
          <Icono nombre="salir" tam={18} color={colores.texto} />
          <Texto style={estilos.textoBotonSecundario}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <MarcoPantalla
      titulo="Crear o editar tarea"
      simbolo={<Icono nombre="lista" tam={34} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras}
      adelante={() => alContinuarPasos?.(datosActuales)}
      textoAdelante="Pasos"
    >
      <View style={estilos.contenedor} testID="pantalla-28-editor-tarea">
        {/* Banner superior de ámbito (Biblioteca del perfil o Solo alumno concreto) */}
        <View style={estilos.barraAmbito} testID="barra-ambito-edicion-28">
          <View style={estilos.infoAmbito}>
            <Icono nombre="lista" tam={18} color={colores.primario} />
            <Texto style={estilos.textoAmbito} testID="texto-ambito-edicion-28">
              {textoAmbito}
            </Texto>
          </View>
          <View style={estilos.pildoraAmbito} testID="pildora-ambito-edicion-28">
            <Texto style={estilos.textoPildoraAmbito}>{pildoraAmbito}</Texto>
          </View>
        </View>

        {/* Diseño de 2 columnas: izquierda Datos generales (1, 2, 3) y derecha Número de pasos (4) */}
        <View style={estilos.columnas}>
          {/* Tarjeta izquierda: Datos generales de la tarea */}
          <View style={estilos.tarjetaColumna}>
            <View style={estilos.cabeceraTarjeta}>
              <Texto style={estilos.tituloTarjeta}>Datos generales de la tarea</Texto>
              <Texto style={estilos.subtituloTarjeta}>
                Título, pictograma principal y descripción en texto
              </Texto>
            </View>

            {/* 1. Título de la tarea */}
            <View style={estilos.bloqueCampo}>
              <Texto style={estilos.etiquetaCampo}>1. Título de la tarea</Texto>
              <TextInput
                testID="input-titulo-tarea-28"
                value={titulo}
                onChangeText={setTitulo}
                accessibilityLabel="Título de la tarea"
                style={estilos.inputTexto}
              />
            </View>

            {/* 2. Pictograma principal de la tarea */}
            <View style={estilos.bloqueCampo}>
              <Texto style={estilos.etiquetaCampo}>2. Pictograma principal de la tarea</Texto>
              <View style={estilos.filaPictograma}>
                <Image
                  source={{ uri: urlImagenPictograma(pictogramaIdInicial) }}
                  style={estilos.imagenPictogramaPrincipal}
                  accessibilityIgnoresInvertColors
                />
                <View style={estilos.columnaPictogramaInfo}>
                  <View style={estilos.filaPildoraPicto}>
                    <View style={estilos.pildoraFuente}>
                      <Texto style={estilos.textoPildoraFuente}>ARASAAC + Mi biblioteca</Texto>
                    </View>
                    <Texto style={estilos.textoPictoActual}>
                      {`Pictograma actual: ${pictogramaNombreInicial}`}
                    </Texto>
                  </View>
                  <Pressable
                    testID="btn-28-abrir-buscador-picto"
                    accessibilityRole="button"
                    accessibilityLabel="Elegir en buscador (ARASAAC / Mi biblioteca)"
                    onPress={() => alAbrirBuscadorPictograma?.(datosActuales)}
                    style={({ pressed }) => [
                      estilos.botonBuscadorPicto,
                      pressed && estilos.pulsado,
                    ]}
                  >
                    <Icono nombre="buscar" tam={18} color={colores.texto} />
                    <Texto style={estilos.textoBotonBuscadorPicto}>
                      Elegir en buscador (ARASAAC / Mi biblioteca)
                    </Texto>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* 3. Descripción en texto de la tarea (Lectura Fácil) */}
            <View style={estilos.bloqueCampo}>
              <Texto style={estilos.etiquetaCampo}>
                3. Descripción en texto de la tarea (Lectura Fácil)
              </Texto>
              <TextInput
                testID="input-descripcion-tarea-28"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                accessibilityLabel="Descripción en texto de la tarea"
                style={[estilos.inputTexto, estilos.inputDescripcion]}
              />
            </View>
          </View>

          {/* Tarjeta derecha: 4. ¿Cuántos pasos tiene la tarea? */}
          <View style={estilos.tarjetaColumna}>
            <View style={estilos.cabeceraTarjeta}>
              <Texto style={estilos.tituloTarjeta}>4. ¿Cuántos pasos tiene la tarea?</Texto>
              <Texto style={estilos.subtituloTarjeta}>
                Elige el número de pasos y configúralos en la siguiente pantalla con el botón
                «Pasos»
              </Texto>
            </View>

            <View style={estilos.filaStepper}>
              <View style={estilos.infoStepper}>
                <Texto style={estilos.tituloStepper}>Número total de pasos</Texto>
                <Texto style={estilos.subtituloStepper}>
                  Cada paso tendrá su pictograma, texto, foto, vídeo y audio
                </Texto>
              </View>
              <View style={estilos.controlesStepper}>
                <Pressable
                  testID="btn-28-decrementar-pasos"
                  accessibilityRole="button"
                  accessibilityLabel="Disminuir número de pasos"
                  onPress={() => setPasosCount((prev) => acotarNumeroPasos28(prev - 1))}
                  style={({ pressed }) => [estilos.botonStepper, pressed && estilos.pulsado]}
                >
                  <Texto style={estilos.textoBotonStepper}>−</Texto>
                </Pressable>
                <Texto style={estilos.textoContadorPasos} testID="texto-contador-pasos-28">
                  {`${pasosCount} ${pasosCount === 1 ? "paso" : "pasos"}`}
                </Texto>
                <Pressable
                  testID="btn-28-incrementar-pasos"
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar número de pasos"
                  onPress={() => setPasosCount((prev) => acotarNumeroPasos28(prev + 1))}
                  style={({ pressed }) => [estilos.botonStepper, pressed && estilos.pulsado]}
                >
                  <Texto style={estilos.textoBotonStepper}>+</Texto>
                </Pressable>
              </View>
            </View>

            {/* Vista previa de los pasos activos (1..pasosCount) */}
            <View style={estilos.listaPasos} testID="lista-pasos-preview-28">
              {pasosMostrados.map((paso) => (
                <View
                  key={paso.numero}
                  style={estilos.filaPasoPreview}
                  testID={`paso-preview-28-${paso.numero}`}
                >
                  <Image
                    source={{ uri: paso.pictogramaUrl }}
                    style={estilos.imagenPasoPreview}
                    accessibilityIgnoresInvertColors
                  />
                  <View style={estilos.infoPasoPreview}>
                    <Texto style={estilos.tituloPasoPreview}>{paso.titulo}</Texto>
                    <Texto style={estilos.subtituloPasoPreview}>{paso.formatosResumen}</Texto>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </MarcoPantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cabeceraDerecha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    insigniaUsuario: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoUsuario: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primario,
    },
    botonSecundario: {
      minHeight: 40,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    textoBotonSecundario: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      padding: 16,
      gap: 12,
      backgroundColor: c.fondo,
    },
    barraAmbito: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.primario,
      borderRadius: FORMA.radioPequeno,
      gap: 10,
    },
    infoAmbito: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    textoAmbito: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primario,
    },
    pildoraAmbito: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoPildoraAmbito: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primario,
    },
    columnas: {
      flex: 1,
      flexDirection: "row",
      gap: 14,
    },
    tarjetaColumna: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 14,
      gap: 10,
    },
    cabeceraTarjeta: {
      gap: 2,
    },
    tituloTarjeta: {
      fontSize: 18,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloTarjeta: {
      fontSize: 13,
      color: c.textoSecundario,
    },
    bloqueCampo: {
      gap: 4,
    },
    etiquetaCampo: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    inputTexto: {
      minHeight: 42,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    inputDescripcion: {
      minHeight: 54,
      fontWeight: "400",
      fontSize: 14,
    },
    filaPictograma: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 10,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    imagenPictogramaPrincipal: {
      width: 68,
      height: 68,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    columnaPictogramaInfo: {
      flex: 1,
      gap: 6,
    },
    filaPildoraPicto: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    pildoraFuente: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
    },
    textoPildoraFuente: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    textoPictoActual: {
      fontSize: 13,
      color: c.textoSecundario,
    },
    botonBuscadorPicto: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    textoBotonBuscadorPicto: {
      fontSize: 13,
      fontWeight: "700",
      color: c.texto,
    },
    filaStepper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      gap: 10,
    },
    infoStepper: {
      flex: 1,
      gap: 2,
    },
    tituloStepper: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloStepper: {
      fontSize: 12,
      color: c.textoSecundario,
    },
    controlesStepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    botonStepper: {
      width: 38,
      height: 38,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      alignItems: "center",
      justifyContent: "center",
    },
    textoBotonStepper: {
      fontSize: 20,
      fontWeight: "700",
      color: c.texto,
    },
    textoContadorPasos: {
      minWidth: 70,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "800",
      color: c.primario,
    },
    listaPasos: {
      flex: 1,
      gap: 6,
    },
    filaPasoPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    imagenPasoPreview: {
      width: 34,
      height: 34,
      borderRadius: 6,
      backgroundColor: "#FFFFFF",
    },
    infoPasoPreview: {
      flex: 1,
    },
    tituloPasoPreview: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloPasoPreview: {
      fontSize: 12,
      color: c.textoSecundario,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
