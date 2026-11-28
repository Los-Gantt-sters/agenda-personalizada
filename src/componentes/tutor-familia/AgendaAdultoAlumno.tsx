/**
 * Pantallas 39 y 40 — Agenda del alumno vista por Tutor (39) o Familia (40)
 * SIN botones duplicados de «Progreso e historial» ni «Nueva tarea» (SCRUM-234 / SCRUM-255 · T-TF.1).
 * Estructura de 3 columnas (HECHO | AHORA | DESPUÉS):
 *   - En la barra superior solo incluye el botón «Ver semana» (-> 06b), la fecha y el usuario/Salir.
 *   - En HECHO diferencia tareas completadas (verde) y tareas auto-pendientes por tiempo agotado (ámbar).
 *   - En AHORA muestra la píldora de permisos según rol/ámbito y el botón «Abrir tarea»
 *     (-> Pantalla 41 en Tutor, Pantalla 42 en Familia clase o Pantalla 42b en Familia hogar).
 */

import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import {
  FORMA,
  Icono,
  PictogramaInterfaz,
  Texto,
  colorSobre,
  useApariencia,
  useEstilos,
} from "../../ui";
import { AGENDA_ADULTO_DEMO, type TareaAgendaAdulto } from "./datosAgendaAdulto";

export type RolAdultoAgenda = "tutor" | "familia";
export type DestinoTareaAdulto = "41" | "42" | "42b";

export interface AgendaAdultoAlumnoProps {
  /** Rol que consulta la agenda: `"tutor"` (Pantalla 39) o `"familia"` (Pantalla 40). */
  rol: RolAdultoAgenda;
  /** Nombre del alumno cuya agenda se muestra (`"Lucas"` por defecto). */
  nombreAlumno?: string;
  /** Nombre del supervisor autenticado (`"María Carmen"` en tutor, `"Ramón"` en familia). */
  nombreAdulto?: string;
  /** Texto de la fecha actual mostrada en cabecera. */
  fechaTexto?: string;
  /** Tareas de la columna HECHO (completadas y auto-pendientes). */
  hecho?: TareaAgendaAdulto[];
  /** Tarea activa en la columna AHORA. */
  ahora?: TareaAgendaAdulto;
  /** Tareas próximas en la columna DESPUÉS. */
  despues?: TareaAgendaAdulto[];
  /** Número de tareas adicionales ocultas en DESPUÉS (para evitar scroll). */
  restantesDespues?: number;
  /** Se invoca al pulsar «Ver semana» (-> Pantalla 06b). */
  alVerSemana?: () => void;
  /**
   * Se invoca al pulsar una tarea o el botón «Abrir tarea».
   * Recibe la pantalla destino (`"41"`, `"42"` o `"42b"`) y la tarea seleccionada.
   */
  alAbrirTarea: (destino: DestinoTareaAdulto, tarea: TareaAgendaAdulto) => void;
  /** Acción del botón «Atrás» (vuelve a 37 en Tutor o a 38 en Familia). */
  alAtras?: (() => void) | null;
  /** Acción del botón «Adelante». */
  alAdelante?: (() => void) | null;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

/**
 * Determina la pantalla de detalle de tarea (`41`, `42` o `42b`) según el rol del adulto y el ámbito.
 * @param rol Rol del adulto (`"tutor"` o `"familia"`)
 * @param ambito Ámbito de la tarea (`"escolar"` o `"hogar"`)
 * @returns Identificador de pantalla destino (`"41"`, `"42"` o `"42b"`)
 */
export function resolverDestinoTareaAdulto(
  rol: RolAdultoAgenda,
  ambito: "escolar" | "hogar",
): DestinoTareaAdulto {
  if (rol === "tutor") return "41";
  return ambito === "hogar" ? "42b" : "42";
}

/**
 * Renderiza la Pantalla 39 (Agenda vista Tutor) o la Pantalla 40 (Agenda vista Familia)
 * sin botones duplicados de Progreso ni Nueva tarea.
 * @param props Propiedades de configuración de la agenda para adulto
 * @returns Componente visual de agenda de 3 columnas
 */
export function AgendaAdultoAlumno({
  rol,
  nombreAlumno = "Lucas",
  nombreAdulto,
  fechaTexto = "Martes, 12 de noviembre",
  hecho = AGENDA_ADULTO_DEMO.hecho,
  ahora = AGENDA_ADULTO_DEMO.ahora,
  despues = AGENDA_ADULTO_DEMO.despues,
  restantesDespues = AGENDA_ADULTO_DEMO.restantesDespues,
  alVerSemana,
  alAbrirTarea,
  alAtras = null,
  alAdelante = null,
  alCerrarSesion,
}: AgendaAdultoAlumnoProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const etiquetaAdulto = nombreAdulto ?? (rol === "tutor" ? "María Carmen" : "Ramón");
  const textoInsigniaRol =
    rol === "tutor" ? `Tutor · ${etiquetaAdulto}` : `Familia · ${etiquetaAdulto}`;

  const textoPermisoAhora =
    rol === "tutor"
      ? `Personalizar tarea solo para ${nombreAlumno}`
      : ahora.ambito === "hogar"
        ? "En casa (15:00–08:00) · Editable por familia"
        : "En clase · Solo lectura (gestiona tutor)";

  const destinoAhora = resolverDestinoTareaAdulto(rol, ahora.ambito);

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <Texto style={estilos.textoFecha} testID="fecha-agenda-adulto">
        {fechaTexto}
      </Texto>
      <Pressable
        testID="boton-ver-semana"
        accessibilityRole="button"
        accessibilityLabel="Ver semana"
        onPress={alVerSemana}
        style={({ pressed }) => [estilos.botonSecundario, pressed && estilos.pulsado]}
      >
        <Icono nombre="calendario" tam={18} color={colores.texto} />
        <Texto style={estilos.textoBotonSecundario}>Ver semana</Texto>
      </Pressable>
      <View style={estilos.insigniaRol} testID={`insignia-rol-${rol}`}>
        <Texto style={estilos.textoInsigniaRol}>{textoInsigniaRol}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-agenda-adulto"
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
      titulo={`Agenda de ${nombreAlumno}`}
      simbolo={<PictogramaInterfaz nombre="agenda" etiqueta="agenda" tam={40} />}
      derecha={derecha}
      atras={alAtras}
      adelante={alAdelante}
    >
      <View
        style={estilos.tablero}
        testID={rol === "tutor" ? "pantalla-39-agenda-tutor" : "pantalla-40-agenda-familia"}
      >
        {/* Columna 1: HECHO */}
        <View style={estilos.columnaLateral} testID="columna-hecho-adulto">
          <Texto style={estilos.tituloColumna}>HECHO</Texto>
          <View style={estilos.listaLateral}>
            {hecho.map((tarea) => {
              const esAutoPendiente = tarea.estado === "auto_pendiente";
              return (
                <Pressable
                  key={tarea.id}
                  testID={`tarjeta-hecho-${tarea.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${tarea.titulo}, ${subtituloMini(tarea)}`}
                  onPress={() => alAbrirTarea(resolverDestinoTareaAdulto(rol, tarea.ambito), tarea)}
                  style={[estilos.miniTarjeta, esAutoPendiente && estilos.miniTarjetaAutoPendiente]}
                >
                  <View style={estilos.contenedorMiniPicto}>
                    <Image
                      source={{ uri: tarea.pictogramaUrl }}
                      style={estilos.miniPicto}
                      accessibilityIgnoresInvertColors
                    />
                    <View
                      style={[
                        estilos.selloEstado,
                        esAutoPendiente ? estilos.selloAutoPendiente : estilos.selloHecha,
                      ]}
                    >
                      <Icono
                        nombre={esAutoPendiente ? "alerta" : "check"}
                        tam={14}
                        grosor={3}
                        color={colorSobre(esAutoPendiente ? colores.aviso : colores.exito)}
                      />
                    </View>
                  </View>
                  <Texto style={estilos.miniTitulo}>{tarea.titulo}</Texto>
                  <Texto
                    style={[estilos.miniSubtitulo, esAutoPendiente && estilos.textoAutoPendiente]}
                  >
                    {subtituloMini(tarea)}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Columna 2: AHORA (destacada) */}
        <View style={estilos.columnaAhora} testID="columna-ahora-adulto">
          <View style={estilos.cabeceraAhora}>
            <Texto style={estilos.tituloAhora}>AHORA</Texto>
            <View style={estilos.pildoraPermiso} testID="pildora-permiso-ahora">
              <Icono
                nombre={rol === "tutor" || ahora.ambito === "hogar" ? "persona" : "candado"}
                tam={16}
                color={colores.primario}
              />
              <Texto style={estilos.textoPildoraPermiso}>{textoPermisoAhora}</Texto>
            </View>
          </View>

          <View style={estilos.cuerpoAhora}>
            <Image
              source={{ uri: ahora.pictogramaUrl }}
              style={estilos.pictoAhora}
              accessibilityIgnoresInvertColors
            />
            <Texto accessibilityRole="header" style={estilos.nombreTareaAhora}>
              {ahora.titulo}
            </Texto>
            <Texto style={estilos.horarioAhora}>
              {`de ${ahora.horaInicio.replace(/^0/, "")} a ${ahora.horaFin}`}
            </Texto>

            <Pressable
              testID="boton-abrir-tarea-ahora"
              accessibilityRole="button"
              accessibilityLabel={`Abrir tarea ${ahora.titulo}`}
              onPress={() => alAbrirTarea(destinoAhora, ahora)}
              style={({ pressed }) => [estilos.botonAbrirTarea, pressed && estilos.pulsadoPrimario]}
            >
              <Icono
                nombre={rol === "familia" && ahora.ambito === "escolar" ? "ojo" : "reproducir"}
                tam={22}
                color="#FFFFFF"
              />
              <Texto style={estilos.textoBotonAbrirTarea}>Abrir tarea</Texto>
            </Pressable>
          </View>
        </View>

        {/* Columna 3: DESPUÉS */}
        <View style={estilos.columnaLateral} testID="columna-despues-adulto">
          <Texto style={estilos.tituloColumna}>DESPUÉS</Texto>
          <View style={estilos.listaLateral}>
            {despues.map((tarea) => (
              <Pressable
                key={tarea.id}
                testID={`tarjeta-despues-${tarea.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${tarea.titulo}, ${tarea.horaInicio}`}
                onPress={() => alAbrirTarea(resolverDestinoTareaAdulto(rol, tarea.ambito), tarea)}
                style={estilos.miniTarjetaCompacta}
              >
                <Image
                  source={{ uri: tarea.pictogramaUrl }}
                  style={estilos.miniPictoCompacto}
                  accessibilityIgnoresInvertColors
                />
                <View style={estilos.infoCompacta}>
                  <Texto style={estilos.miniTitulo}>{tarea.titulo}</Texto>
                  <Texto style={estilos.miniSubtitulo}>{tarea.horaInicio}</Texto>
                </View>
              </Pressable>
            ))}
          </View>
          {restantesDespues > 0 ? (
            <Texto style={estilos.textoRestantes} testID="restantes-despues-adulto">
              {`y ${restantesDespues} más`}
            </Texto>
          ) : null}
        </View>
      </View>
    </MarcoPantalla>
  );
}

/** «9:15» a partir de «09:15», como en los bocetos. */
const horaSinCero = (hora: string) => hora.replace(/^0(\d)/, "$1");

/** Lugar de la tarea en las tarjetas pequeñas: en el colegio, «Clase»; en casa, «Casa». */
const ETIQUETA_AMBITO: Record<TareaAgendaAdulto["ambito"], string> = {
  escolar: "Clase",
  hogar: "Casa",
};

/**
 * Segunda línea de las tarjetas de «Hecho» (bocetos 39 y 40): la hora, el aviso si se pasó a
 * pendiente sola y el lugar. P. ej. «9:30 · Auto-pendiente (tiempo agotado) · Clase».
 */
export function subtituloMini(tarea: TareaAgendaAdulto): string {
  return [
    horaSinCero(tarea.horaInicio),
    tarea.estado === "auto_pendiente" ? "Auto-pendiente (tiempo agotado)" : null,
    ETIQUETA_AMBITO[tarea.ambito],
  ]
    .filter(Boolean)
    .join(" · ");
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cabeceraDerecha: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    textoFecha: {
      fontSize: 16,
      fontWeight: "700",
      color: c.textoSecundario,
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
    insigniaRol: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoInsigniaRol: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primario,
    },
    tablero: {
      flex: 1,
      flexDirection: "row",
      padding: 16,
      gap: 16,
      backgroundColor: c.fondo,
    },
    columnaLateral: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 14,
      gap: 10,
    },
    columnaAhora: {
      flex: 2.5,
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
      borderRadius: FORMA.radio,
      padding: 18,
      gap: 12,
    },
    tituloColumna: {
      fontSize: 18,
      fontWeight: "700",
      color: c.texto,
    },
    cabeceraAhora: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
    },
    tituloAhora: {
      fontSize: 22,
      fontWeight: "700",
      color: c.primario,
    },
    pildoraPermiso: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoPildoraPermiso: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primario,
    },
    listaLateral: {
      flex: 1,
      gap: 10,
    },
    miniTarjeta: {
      flex: 1,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      padding: 10,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    // SCRUM-266: fondo amarillo suave y borde ámbar, como en los bocetos 39 y 40 (y en la 06).
    miniTarjetaAutoPendiente: {
      borderWidth: 3,
      borderColor: c.aviso,
      backgroundColor: c.resalteSuave,
    },
    contenedorMiniPicto: {
      position: "relative",
    },
    miniPicto: {
      width: 56,
      height: 56,
      borderRadius: 8,
    },
    selloEstado: {
      position: "absolute",
      right: -6,
      bottom: -4,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    selloHecha: {
      backgroundColor: c.exito,
    },
    selloAutoPendiente: {
      backgroundColor: c.aviso,
    },
    miniTitulo: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    miniSubtitulo: {
      fontSize: 14,
      color: c.textoSecundario,
      textAlign: "center",
    },
    textoAutoPendiente: {
      color: c.aviso,
      fontWeight: "700",
    },
    cuerpoAhora: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    pictoAhora: {
      width: 140,
      height: 140,
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
    },
    nombreTareaAhora: {
      fontSize: 32,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    horarioAhora: {
      fontSize: 18,
      color: c.textoSecundario,
    },
    botonAbrirTarea: {
      minHeight: 54,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.primario,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 4,
    },
    textoBotonAbrirTarea: {
      fontSize: 20,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    miniTarjetaCompacta: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radioPequeno,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    miniPictoCompacto: {
      width: 44,
      height: 44,
      borderRadius: 8,
    },
    infoCompacta: {
      flex: 1,
      alignItems: "flex-start",
    },
    textoRestantes: {
      fontSize: 15,
      fontWeight: "700",
      color: c.textoSecundario,
      textAlign: "center",
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    pulsadoPrimario: {
      opacity: 0.88,
    },
  });
