/**
 * Pantalla 31 — Biblioteca de tareas unificada para Tutor y Familia
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/31.html`
 * (SCRUM-89 / SCRUM-90 · T-07.1).
 *
 * Características clave del boceto definitivo:
 * - Interfaz idéntica para Tutor (`Carmen Ruiz`) y Familia (`Familia García`),
 *   aislada estrictamente por perfil activo (`owner: "tutor" | "familia"`).
 * - Buscador por título, filtros «Todas las tareas» y «Creadas por mí»,
 *   y botón «Crear nueva tarea» (-> 28).
 * - Tarjetas seleccionables en rejilla de 2 columnas con insignia
 *   «Creada por mí» / «General» y botón «Editar» (-> 28).
 * - Barra inferior única (`MarcoPantalla`) con «Atrás» (-> 33 Tutor / 34 Familia)
 *   y botón primario «Asignar» (-> 28b).
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import {
  CATALOGO_BIBLIOTECA_31,
  filtrarTareasBiblioteca31,
  type FiltroBiblioteca31,
  type RolBibliotecaAdulto,
  type TareaBiblioteca31,
} from "./datosTareasPersonales";

export interface BibliotecaTareas31Props {
  /** Rol activo que determina qué tareas se listan: `"tutor"` o `"familia"`. */
  rol?: RolBibliotecaAdulto;
  /** Nombre del usuario mostrado en la cabecera (`"Carmen Ruiz"` o `"Familia García"` por defecto). */
  nombreUsuario?: string;
  /** Catálogo de tareas (por defecto `CATALOGO_BIBLIOTECA_31`). */
  tareas?: TareaBiblioteca31[];
  /** Filtro inicial (`"all"` o `"mine"`). */
  filtroInicial?: FiltroBiblioteca31;
  /** ID de la tarea seleccionada inicialmente. */
  tareaSeleccionadaInicialId?: string;
  /** Se invoca al pulsar «Crear nueva tarea» (-> Pantalla 28). */
  alCrearNuevaTarea?: () => void;
  /** Se invoca al pulsar «Editar» en una tarjeta (-> Pantalla 28). */
  alEditarTarea?: (tarea: TareaBiblioteca31) => void;
  /** Se invoca al pulsar el botón inferior «Asignar» (-> Pantalla 28b). */
  alAsignar?: (tarea: TareaBiblioteca31 | null) => void;
  /** Se invoca al cambiar la tarea seleccionada. */
  alSeleccionarTarea?: (tarea: TareaBiblioteca31) => void;
  /** Acción del botón inferior «Atrás» (-> Pantalla 33 en Tutor, -> 34 en Familia). */
  alAtras?: (() => void) | null;
  /** Acción para cerrar sesión desde la cabecera. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 31 (Biblioteca de tareas) para Tutor o Familia.
 * @param props Propiedades de la biblioteca de tareas
 * @returns Vista de Biblioteca de tareas con filtro «Creadas por mí» y acciones Editar/Asignar
 */
export function BibliotecaTareas31({
  rol = "tutor",
  nombreUsuario,
  tareas = CATALOGO_BIBLIOTECA_31,
  filtroInicial = "all",
  tareaSeleccionadaInicialId,
  alCrearNuevaTarea,
  alEditarTarea,
  alAsignar,
  alSeleccionarTarea,
  alAtras = null,
  alCerrarSesion,
}: BibliotecaTareas31Props) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const [filtro, setFiltro] = useState<FiltroBiblioteca31>(filtroInicial);
  const [busqueda, setBusqueda] = useState<string>("");

  const tareasVisibles = useMemo(
    () => filtrarTareasBiblioteca31(tareas, rol, filtro, busqueda),
    [tareas, rol, filtro, busqueda],
  );

  const idPorDefecto =
    tareaSeleccionadaInicialId ?? tareasVisibles[0]?.id ?? (rol === "familia" ? "f1" : "t1");

  const [seleccionadaId, setSeleccionadaId] = useState<string>(idPorDefecto);

  const tareaActiva = useMemo(
    () => tareasVisibles.find((t) => t.id === seleccionadaId) ?? tareasVisibles[0] ?? null,
    [tareasVisibles, seleccionadaId],
  );

  const etiquetaUsuario = nombreUsuario ?? (rol === "familia" ? "Familia García" : "Carmen Ruiz");

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-usuario-31">
        <Icono nombre="persona" tam={18} color={colores.primario} />
        <Texto style={estilos.textoUsuario}>{etiquetaUsuario}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-31"
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

  const manejarSeleccion = (tarea: TareaBiblioteca31) => {
    setSeleccionadaId(tarea.id);
    alSeleccionarTarea?.(tarea);
  };

  return (
    <MarcoPantalla
      titulo="Biblioteca de tareas"
      simbolo={<Icono nombre="lista" tam={34} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras}
      adelante={() => alAsignar?.(tareaActiva)}
      textoAdelante="Asignar"
    >
      <View style={estilos.contenedor} testID="pantalla-31-biblioteca-tareas">
        {/* Fila superior: buscador, filtros Todas / Creadas por mí y botón Crear nueva tarea */}
        <View style={estilos.barraSuperior}>
          <View style={estilos.campoBusqueda}>
            <Icono nombre="buscar" tam={20} color={colores.textoSecundario} />
            <TextInput
              testID="input-buscar-tarea-31"
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar tarea por título…"
              placeholderTextColor={colores.textoSecundario}
              accessibilityLabel="Buscar tarea por título"
              style={estilos.inputBusqueda}
            />
          </View>

          <Pressable
            testID="filtro-31-all"
            accessibilityRole="button"
            accessibilityState={{ selected: filtro === "all" }}
            accessibilityLabel="Todas las tareas"
            onPress={() => setFiltro("all")}
            style={[estilos.botonFiltro, filtro === "all" && estilos.botonFiltroActivo]}
          >
            <Texto style={[estilos.textoFiltro, filtro === "all" && estilos.textoFiltroActivo]}>
              Todas las tareas
            </Texto>
          </Pressable>

          <Pressable
            testID="filtro-31-mine"
            accessibilityRole="button"
            accessibilityState={{ selected: filtro === "mine" }}
            accessibilityLabel="Creadas por mí"
            onPress={() => setFiltro("mine")}
            style={[estilos.botonFiltro, filtro === "mine" && estilos.botonFiltroActivo]}
          >
            <Icono
              nombre="persona"
              tam={16}
              color={filtro === "mine" ? colores.primario : colores.texto}
            />
            <Texto style={[estilos.textoFiltro, filtro === "mine" && estilos.textoFiltroActivo]}>
              Creadas por mí
            </Texto>
          </Pressable>

          <Pressable
            testID="btn-31-crear-nueva-tarea"
            accessibilityRole="button"
            accessibilityLabel="Crear nueva tarea"
            onPress={alCrearNuevaTarea}
            style={({ pressed }) => [estilos.botonPrimario, pressed && estilos.pulsadoPrimario]}
          >
            <Icono nombre="lista" tam={20} color="#FFFFFF" />
            <Texto style={estilos.textoBotonPrimario}>Crear nueva tarea</Texto>
          </Pressable>
        </View>

        {/* Rejilla de 2 columnas con las tareas del rol activo */}
        <View style={estilos.rejilla} testID="rejilla-tareas-31">
          {tareasVisibles.map((tarea) => {
            const activa = tareaActiva?.id === tarea.id;
            return (
              <Pressable
                key={tarea.id}
                testID={`tarjeta-tarea-31-${tarea.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={`${tarea.titulo}, ${tarea.subtitulo}`}
                onPress={() => manejarSeleccion(tarea)}
                style={[estilos.tarjetaTarea, activa && estilos.tarjetaTareaActiva]}
              >
                <View
                  style={[
                    estilos.pildoraOrigen,
                    tarea.mine ? estilos.pildoraMia : estilos.pildoraGeneral,
                  ]}
                  testID={`pildora-origen-31-${tarea.id}`}
                >
                  <Texto
                    style={[
                      estilos.textoPildoraOrigen,
                      tarea.mine ? estilos.textoPildoraMia : estilos.textoPildoraGeneral,
                    ]}
                  >
                    {tarea.mine ? "Creada por mí" : "General"}
                  </Texto>
                </View>

                <Image
                  source={{ uri: tarea.pictogramaUrl }}
                  style={estilos.imagenPictograma}
                  accessibilityIgnoresInvertColors
                />

                <View style={estilos.infoTarea}>
                  <Texto style={estilos.tituloTarea}>{tarea.titulo}</Texto>
                  <Texto style={estilos.subtituloTarea}>{tarea.subtitulo}</Texto>
                </View>

                <Pressable
                  testID={`btn-31-editar-${tarea.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${tarea.titulo}`}
                  onPress={() => {
                    manejarSeleccion(tarea);
                    alEditarTarea?.(tarea);
                  }}
                  style={({ pressed }) => [estilos.botonEditar, pressed && estilos.pulsado]}
                >
                  <Icono nombre="lista" tam={16} color={colores.texto} />
                  <Texto style={estilos.textoBotonEditar}>Editar</Texto>
                </Pressable>
              </Pressable>
            );
          })}
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
    barraSuperior: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    campoBusqueda: {
      flex: 1,
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    inputBusqueda: {
      flex: 1,
      fontSize: 16,
      color: c.texto,
      paddingVertical: 6,
    },
    botonFiltro: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    botonFiltroActivo: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    textoFiltro: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    textoFiltroActivo: {
      color: c.primario,
    },
    botonPrimario: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: c.primario,
      borderRadius: FORMA.radioPequeno,
    },
    textoBotonPrimario: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    rejilla: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      alignContent: "stretch",
    },
    tarjetaTarea: {
      width: "49%",
      minHeight: 112,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      paddingTop: 22,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      position: "relative",
    },
    tarjetaTareaActiva: {
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
    },
    pildoraOrigen: {
      position: "absolute",
      top: 6,
      right: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    pildoraMia: {
      backgroundColor: c.superficieDestacada,
    },
    pildoraGeneral: {
      backgroundColor: c.fondo,
    },
    textoPildoraOrigen: {
      fontSize: 12,
      fontWeight: "700",
    },
    textoPildoraMia: {
      color: c.primario,
    },
    textoPildoraGeneral: {
      color: c.textoSecundario,
    },
    imagenPictograma: {
      width: 64,
      height: 64,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    infoTarea: {
      flex: 1,
      gap: 2,
    },
    tituloTarea: {
      fontSize: 17,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloTarea: {
      fontSize: 13,
      color: c.textoSecundario,
    },
    botonEditar: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBotonEditar: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    pulsadoPrimario: {
      opacity: 0.9,
    },
  });
