/**
 * Pantalla 28b — Asignar tarea a clase y alumnos (todos marcados por defecto)
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/28b.html`
 * (SCRUM-89 / SCRUM-91 · T-07.2).
 *
 * Características y restricciones clave del boceto definitivo:
 * - SIN botón «Cambiar clases / alumnos».
 * - Columna 1: «1. Clase a la que asignar la tarea» con botón «Todas las clases»,
 *   rejilla de 6 clases geométricas (`FormaClase`) y barra inferior de resumen
 *   de la tarea con píldora de conteo (`1 clase · 6 alumnos (Todos)`).
 * - Columna 2: «2. Alumnos concretos (todos marcados por defecto)» con botón
 *   «Marcar todos» y rejilla de 6 alumnos marcados por defecto.
 * - Al seleccionar cualquier clase se marcan automáticamente todos sus alumnos por defecto.
 * - Barra inferior (`MarcoPantalla`): «Atrás» (-> 31) y botón primario «Horario» (-> 28c).
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { urlImagenPictograma } from "../../arasaac/urls";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, FormaClase, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import type { RolBibliotecaAdulto } from "./datosTareasPersonales";

export interface ClaseAsignacion28b {
  id: string;
  nombre: string;
  subtitulo: string;
  simbolo: string;
  color: string;
}

export interface AlumnoAsignacion28b {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
}

export const CLASES_ASIGNACION_28B: ClaseAsignacion28b[] = [
  {
    id: "tri",
    nombre: "Clase Triángulo",
    subtitulo: "Aula 1 · 6 alumnos",
    simbolo: "🔺",
    color: "#B42318",
  },
  {
    id: "cir",
    nombre: "Clase Círculo",
    subtitulo: "Aula 2 · 6 alumnos",
    simbolo: "🔵",
    color: "#2F5FBF",
  },
  {
    id: "cua",
    nombre: "Clase Cuadrado",
    subtitulo: "Aula 3 · 6 alumnos",
    simbolo: "🟩",
    color: "#1E7A46",
  },
  {
    id: "est",
    nombre: "Clase Estrella",
    subtitulo: "Aula 4 · 6 alumnos",
    simbolo: "⭐",
    color: "#D97706",
  },
  {
    id: "rom",
    nombre: "Clase Rombo",
    subtitulo: "Aula 5 · 6 alumnos",
    simbolo: "🔷",
    color: "#7A1F4D",
  },
  {
    id: "hex",
    nombre: "Clase Hexágono",
    subtitulo: "Aula 6 · 6 alumnos",
    simbolo: "⬢",
    color: "#0F766E",
  },
];

export const ALUMNOS_ASIGNACION_28B: AlumnoAsignacion28b[] = [
  { id: "ale", nombre: "Alejandro", iniciales: "A", color: "#2F5FBF" },
  { id: "mir", nombre: "Miriam", iniciales: "M", color: "#9A5B00" },
  { id: "mar", nombre: "Marcos", iniciales: "M", color: "#7A1F4D" },
  { id: "ser", nombre: "Sergio", iniciales: "S", color: "#1E7A46" },
  { id: "ele", nombre: "Elena", iniciales: "E", color: "#B42318" },
  { id: "fer", nombre: "Fernando", iniciales: "F", color: "#2D4A7A" },
];

export interface SeleccionAsignacion28b {
  claseSeleccionadaId: string;
  claseNombre: string;
  todasLasClases: boolean;
  alumnosSeleccionadosIds: string[];
  resumenTexto: string;
}

export interface AsignarClaseAlumnos28bProps {
  /** Rol activo: `"tutor"` o `"familia"`. */
  rol?: RolBibliotecaAdulto;
  /** Nombre del usuario mostrado en cabecera (`"Carmen Ruiz"` o `"Familia García"`). */
  nombreUsuario?: string;
  /** Título de la tarea que se está asignando (`"Lavarse las manos"` por defecto). */
  tituloTarea?: string;
  /** ID del pictograma ARASAAC de la tarea asignada (`2443` por defecto). */
  pictogramaTareaId?: number;
  /** Lista de clases disponibles. */
  clases?: ClaseAsignacion28b[];
  /** Lista de alumnos de la clase (todos marcados por defecto). */
  alumnos?: AlumnoAsignacion28b[];
  /** Clase seleccionada inicialmente (`"tri"` por defecto). */
  claseInicialId?: string;
  /** Se invoca al pulsar el botón inferior «Horario» (-> Pantalla 28c). */
  alContinuarHorario?: (seleccion: SeleccionAsignacion28b) => void;
  /** Acción del botón inferior «Atrás» (-> Pantalla 31). */
  alAtras?: (() => void) | null;
  /** Acción para cerrar sesión desde la cabecera. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 28b (Asignar tarea a clase y alumnos con todos marcados por defecto).
 * @param props Propiedades de asignación de clase y alumnos
 * @returns Vista de 2 columnas sin botón «Cambiar clases / alumnos» y con botón inferior «Horario»
 */
export function AsignarClaseAlumnos28b({
  rol = "tutor",
  nombreUsuario,
  tituloTarea = "Lavarse las manos",
  pictogramaTareaId = 2443,
  clases = CLASES_ASIGNACION_28B,
  alumnos = ALUMNOS_ASIGNACION_28B,
  claseInicialId = "tri",
  alContinuarHorario,
  alAtras = null,
  alCerrarSesion,
}: AsignarClaseAlumnos28bProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const todosLosIdsAlumnos = useMemo(() => alumnos.map((a) => a.id), [alumnos]);

  const [claseActivaId, setClaseActivaId] = useState<string>(claseInicialId);
  const [todasLasClases, setTodasLasClases] = useState<boolean>(false);
  // Por especificación de 28b.html: TODOS los alumnos vienen marcados por defecto
  const [alumnosMarcadosIds, setAlumnosMarcadosIds] = useState<string[]>(todosLosIdsAlumnos);

  const claseActiva = useMemo(
    () => clases.find((c) => c.id === claseActivaId) ?? clases[0],
    [clases, claseActivaId],
  );

  // Al seleccionar una clase se marcan automáticamente todos sus alumnos por defecto
  const manejarSeleccionClase = (idClase: string) => {
    setClaseActivaId(idClase);
    setTodasLasClases(false);
    setAlumnosMarcadosIds(todosLosIdsAlumnos);
  };

  const manejarTodasLasClases = () => {
    setTodasLasClases(true);
    setAlumnosMarcadosIds(todosLosIdsAlumnos);
  };

  const manejarMarcarTodos = () => {
    setAlumnosMarcadosIds(todosLosIdsAlumnos);
  };

  const alternarAlumno = (alumnoId: string) => {
    setAlumnosMarcadosIds((prev) =>
      prev.includes(alumnoId) ? prev.filter((id) => id !== alumnoId) : [...prev, alumnoId],
    );
  };

  const estanTodosMarcados = alumnosMarcadosIds.length === alumnos.length;
  const textoClases = todasLasClases ? `${clases.length} clases` : "1 clase";
  const textoAlumnos = `${alumnosMarcadosIds.length} ${
    alumnosMarcadosIds.length === 1 ? "alumno" : "alumnos"
  }${estanTodosMarcados ? " (Todos)" : ""}`;
  const textoPildoraResumen = `${textoClases} · ${textoAlumnos}`;

  const etiquetaUsuario = nombreUsuario ?? (rol === "familia" ? "Familia García" : "Carmen Ruiz");

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-usuario-28b">
        <Icono nombre="persona" tam={18} color={colores.primario} />
        <Texto style={estilos.textoUsuario}>{etiquetaUsuario}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-28b"
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
      titulo="Asignar tarea a clase y alumnos"
      simbolo={<Icono nombre="personas" tam={34} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras}
      adelante={() =>
        alContinuarHorario?.({
          claseSeleccionadaId: claseActiva.id,
          claseNombre: todasLasClases ? "Todas las clases" : claseActiva.nombre,
          todasLasClases,
          alumnosSeleccionadosIds: alumnosMarcadosIds,
          resumenTexto: textoPildoraResumen,
        })
      }
      textoAdelante="Horario"
    >
      <View style={estilos.contenedor} testID="pantalla-28b-asignar-alumnos">
        {/* Columna 1: Clase a la que asignar la tarea */}
        <View style={estilos.tarjetaColumna}>
          <View style={estilos.cabeceraTarjeta}>
            <View style={estilos.infoCabeceraTarjeta}>
              <Texto style={estilos.tituloTarjeta}>1. Clase a la que asignar la tarea</Texto>
              <Texto style={estilos.subtituloTarjeta}>
                Al elegir una clase se marcan todos sus alumnos por defecto
              </Texto>
            </View>
            <Pressable
              testID="btn-28b-todas-clases"
              accessibilityRole="button"
              accessibilityLabel="Todas las clases"
              onPress={manejarTodasLasClases}
              style={({ pressed }) => [
                estilos.botonAccionCabecera,
                todasLasClases && estilos.botonAccionCabeceraActivo,
                pressed && estilos.pulsado,
              ]}
            >
              <Icono nombre="check" tam={16} color={colores.primario} />
              <Texto style={estilos.textoAccionCabecera}>Todas las clases</Texto>
            </Pressable>
          </View>

          <View style={estilos.rejillaOpciones} testID="rejilla-clases-28b">
            {clases.map((clase) => {
              const seleccionada = todasLasClases || clase.id === claseActiva.id;
              return (
                <Pressable
                  key={clase.id}
                  testID={`tarjeta-clase-28b-${clase.id}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionada }}
                  accessibilityLabel={`${clase.nombre}, ${clase.subtitulo}`}
                  onPress={() => manejarSeleccionClase(clase.id)}
                  style={[estilos.tarjetaOpcion, seleccionada && estilos.tarjetaOpcionActiva]}
                >
                  <FormaClase claseId={clase.id} simbolo={clase.simbolo} tam={30} />
                  <View style={estilos.infoOpcion}>
                    <Texto style={estilos.tituloOpcion}>{clase.nombre}</Texto>
                    <Texto style={estilos.subtituloOpcion}>{clase.subtitulo}</Texto>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Resumen inferior de la tarea que se va a programar */}
          <View style={estilos.barraResumenTarea} testID="resumen-asignacion-28b">
            <Image
              source={{ uri: urlImagenPictograma(pictogramaTareaId) }}
              style={estilos.imagenResumenTarea}
              accessibilityIgnoresInvertColors
            />
            <View style={estilos.infoResumenTarea}>
              <Texto style={estilos.tituloResumenTarea}>{`Tarea: ${tituloTarea}`}</Texto>
              <Texto style={estilos.subtituloResumenTarea}>
                Se programará el día, hora y duración en el siguiente paso («Horario»)
              </Texto>
            </View>
            <View style={estilos.pildoraResumen} testID="pildora-resumen-28b">
              <Texto style={estilos.textoPildoraResumen}>{textoPildoraResumen}</Texto>
            </View>
          </View>
        </View>

        {/* Columna 2: Alumnos concretos (todos marcados por defecto) */}
        <View style={estilos.tarjetaColumna}>
          <View style={estilos.cabeceraTarjeta}>
            <View style={estilos.infoCabeceraTarjeta}>
              <Texto style={estilos.tituloTarjeta}>
                2. Alumnos concretos (todos marcados por defecto)
              </Texto>
              <Texto style={estilos.subtituloTarjeta}>
                Desmarca solo a quienes no deban realizar la tarea
              </Texto>
            </View>
            <Pressable
              testID="btn-28b-marcar-todos"
              accessibilityRole="button"
              accessibilityLabel="Marcar todos"
              onPress={manejarMarcarTodos}
              style={({ pressed }) => [estilos.botonAccionCabecera, pressed && estilos.pulsado]}
            >
              <Icono nombre="check" tam={16} color={colores.primario} />
              <Texto style={estilos.textoAccionCabecera}>Marcar todos</Texto>
            </Pressable>
          </View>

          <View style={estilos.rejillaOpciones} testID="rejilla-alumnos-28b">
            {alumnos.map((alumno) => {
              const marcado = alumnosMarcadosIds.includes(alumno.id);
              const subtituloAlumno = `${claseActiva.nombre} · ${
                marcado ? "Marcado" : "Sin marcar"
              }`;
              return (
                <Pressable
                  key={alumno.id}
                  testID={`tarjeta-alumno-28b-${alumno.id}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: marcado }}
                  accessibilityLabel={`${alumno.nombre}, ${subtituloAlumno}`}
                  onPress={() => alternarAlumno(alumno.id)}
                  style={[estilos.tarjetaOpcion, marcado && estilos.tarjetaOpcionActiva]}
                >
                  <View style={[estilos.avatarAlumno, { backgroundColor: alumno.color }]}>
                    <Texto style={estilos.textoAvatarAlumno}>{alumno.iniciales}</Texto>
                  </View>
                  <View style={estilos.infoOpcion}>
                    <Texto style={estilos.tituloOpcion}>{alumno.nombre}</Texto>
                    <Texto style={estilos.subtituloOpcion}>{subtituloAlumno}</Texto>
                  </View>
                </Pressable>
              );
            })}
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
      flexDirection: "row",
      padding: 16,
      gap: 14,
      backgroundColor: c.fondo,
    },
    tarjetaColumna: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 14,
      gap: 12,
    },
    cabeceraTarjeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    infoCabeceraTarjeta: {
      flex: 1,
      gap: 2,
    },
    tituloTarjeta: {
      fontSize: 17,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloTarjeta: {
      fontSize: 13,
      color: c.textoSecundario,
    },
    botonAccionCabecera: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
    },
    botonAccionCabeceraActivo: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    textoAccionCabecera: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primario,
    },
    rejillaOpciones: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      alignContent: "stretch",
    },
    tarjetaOpcion: {
      width: "48.5%",
      minHeight: 86,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    tarjetaOpcionActiva: {
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
    },
    infoOpcion: {
      flex: 1,
      gap: 2,
    },
    tituloOpcion: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloOpcion: {
      fontSize: 12,
      color: c.textoSecundario,
    },
    avatarAlumno: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    textoAvatarAlumno: {
      fontSize: 16,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    barraResumenTarea: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
    },
    imagenResumenTarea: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: "#FFFFFF",
    },
    infoResumenTarea: {
      flex: 1,
      gap: 2,
    },
    tituloResumenTarea: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloResumenTarea: {
      fontSize: 12,
      color: c.textoSecundario,
    },
    pildoraResumen: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
    },
    textoPildoraResumen: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
