/**
 * Pantalla 37 — Ficha del alumno limpia SIN etiquetas RGPD con enlaces a 39, 43, 16, 26d y 47b
 * (SCRUM-233 / SCRUM-254 · T-TUT.3).
 * Presenta el perfil limpio del estudiante (avatar, nombre y clase, sin píldoras RGPD) y las
 * 5 tarjetas de acción pedagógica:
 *   1. Agenda y tareas -> Pantalla 39
 *   2. Progreso e historial -> Pantalla 43
 *   3. Preferencias -> Pantalla 16 (/preferencias)
 *   4. Permisos del alumno -> Pantalla 26d
 *   5. Plan B del alumno -> Pantalla 47b
 */

import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import type { Estudiante } from "../../tipos/estudiante";
import { FORMA, Icono, Texto, useApariencia, useEstilos, type NombreIcono } from "../../ui";
import { obtenerAlumnoTutor, obtenerAulaTutor, type AulaTutor } from "./datosAulasTutor";

export type DestinoFichaTutor = "39" | "43" | "16" | "26d" | "47b";

export interface FichaAlumnoTutorProps {
  /** Identificador del alumno seleccionado en la Pantalla 36 (p. ej. `luc`, `ale`). */
  alumnoId: string;
  /** Datos del alumno si se desean sobreescribir. */
  alumno?: Estudiante;
  /** Datos del aula del alumno si se desean sobreescribir. */
  aula?: AulaTutor;
  /** Nombre del tutor autenticado para la insignia superior. */
  nombreTutor?: string;
  /** Se invoca al pulsar cualquiera de las 5 tarjetas de la ficha (`39`, `43`, `16`, `26d`, `47b`). */
  alNavegarDestino: (destino: DestinoFichaTutor, alumnoId: string) => void;
  /** Acción del botón «Atrás» (vuelve a la Pantalla 36). */
  alAtras?: (() => void) | null;
  /** Acción del botón «Adelante». */
  alAdelante?: (() => void) | null;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

interface TarjetaAccionFicha {
  destino: DestinoFichaTutor;
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
  destacada?: boolean;
  insignia?: string;
}

/**
 * Renderiza la Pantalla 37 del Tutor: ficha limpia del alumno sin etiquetas RGPD y con enlaces a 39, 43, 16, 26d y 47b.
 * @param props Propiedades de configuración de la ficha y callbacks de navegación
 * @returns Componente visual de la ficha individual del alumno
 */
export function FichaAlumnoTutor({
  alumnoId,
  alumno,
  aula,
  nombreTutor = "María Carmen",
  alNavegarDestino,
  alAtras = null,
  alAdelante = null,
  alCerrarSesion,
}: FichaAlumnoTutorProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const datosAlumno = useMemo(() => alumno ?? obtenerAlumnoTutor(alumnoId), [alumno, alumnoId]);
  const datosAula = useMemo(
    () => aula ?? obtenerAulaTutor(datosAlumno.claseId),
    [aula, datosAlumno.claseId],
  );

  const tarjetas: TarjetaAccionFicha[] = useMemo(
    () => [
      {
        destino: "39",
        icono: "calendario",
        titulo: "Agenda y tareas",
        descripcion: `Agenda diaria y semanal de ${datosAlumno.nombre} (edición individual).`,
        destacada: true,
        insignia: "PRINCIPAL",
      },
      {
        destino: "43",
        icono: "cronometro",
        titulo: "Progreso e historial",
        descripcion: "Completadas, pendientes, emociones y filtro por días/mes.",
      },
      {
        destino: "16",
        icono: "paleta",
        titulo: "Preferencias",
        descripcion: "Colores, tipografía, botones, reloj y hasta 3 ayudas.",
      },
      {
        destino: "26d",
        icono: "candado",
        titulo: "Permisos del alumno",
        descripcion: "Formatos multimedia bajo cada paso y acceso a Preferencias y pantallas.",
      },
      {
        destino: "47b",
        icono: "enlace",
        titulo: `Plan B de ${datosAlumno.nombre}`,
        descripcion: `Vincula una tarea Plan B a una tarea principal de ${datosAlumno.nombre} y actívala.`,
      },
    ],
    [datosAlumno.nombre],
  );

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaRol} testID="insignia-tutor-37">
        <Texto style={estilos.textoInsigniaRol}>{`Tutor · ${nombreTutor}`}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-37"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión y salir"
          onPress={alCerrarSesion}
          style={({ pressed }) => [estilos.botonSalir, pressed && estilos.pulsado]}
        >
          <Icono nombre="salir" tam={20} color={colores.texto} />
          <Texto style={estilos.textoSalir}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <MarcoPantalla
      titulo={`Ficha del alumno · ${datosAlumno.nombre}`}
      derecha={derecha}
      atras={alAtras}
      adelante={alAdelante}
    >
      <View style={estilos.contenedor} testID="pantalla-37-ficha">
        {/* Cabecera limpia del alumno SIN etiquetas RGPD */}
        <View style={estilos.bannerAlumno} testID="cabecera-ficha-37">
          <View style={[estilos.avatar, { borderColor: datosAlumno.color }]}>
            <Texto style={estilos.iconoAvatar}>{datosAlumno.icono}</Texto>
          </View>
          <View style={estilos.infoAlumno}>
            <Texto accessibilityRole="header" style={estilos.nombreAlumno}>
              {datosAlumno.nombre}
            </Texto>
            <Texto style={estilos.subtituloAlumno}>
              {`${datosAula.nombre} · Ficha individual de trabajo`}
            </Texto>
          </View>
        </View>

        {/* Cuadrícula de 5 accesos: 39, 43, 16, 26d y 47b */}
        <View style={estilos.cuadricula} testID="cuadricula-acciones-37">
          {tarjetas.map((item) => (
            <Pressable
              key={item.destino}
              testID={`enlace-ficha-${item.destino}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.titulo}. ${item.descripcion}`}
              onPress={() => alNavegarDestino(item.destino, datosAlumno.id)}
              style={({ pressed }) => [
                estilos.tarjetaAccion,
                item.destacada && estilos.tarjetaDestacada,
                pressed && estilos.pulsado,
              ]}
            >
              <View style={estilos.cabeceraTarjeta}>
                <Icono nombre={item.icono} tam={28} color={colores.primario} />
                {item.insignia ? (
                  <View style={estilos.insigniaPrincipal}>
                    <Texto style={estilos.textoInsigniaPrincipal}>{item.insignia}</Texto>
                  </View>
                ) : null}
              </View>
              <Texto style={estilos.tituloTarjeta}>{item.titulo}</Texto>
              <Texto style={estilos.descripcionTarjeta}>{item.descripcion}</Texto>
            </Pressable>
          ))}
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
    botonSalir: {
      minHeight: 42,
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
    textoSalir: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 16,
      gap: 16,
      backgroundColor: c.fondo,
    },
    bannerAlumno: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      paddingVertical: 14,
      paddingHorizontal: 22,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 3,
      backgroundColor: c.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
    iconoAvatar: {
      fontSize: 36,
    },
    infoAlumno: {
      flex: 1,
      gap: 2,
    },
    nombreAlumno: {
      fontSize: 28,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloAlumno: {
      fontSize: 16,
      color: c.textoSecundario,
    },
    cuadricula: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      alignContent: "stretch",
    },
    tarjetaAccion: {
      width: "31%",
      flexGrow: 1,
      minHeight: 155,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 18,
      justifyContent: "center",
      gap: 8,
    },
    tarjetaDestacada: {
      borderColor: c.primario,
      borderWidth: FORMA.bordeDestacado,
      backgroundColor: c.superficieDestacada,
    },
    cabeceraTarjeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    insigniaPrincipal: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.primario,
    },
    textoInsigniaPrincipal: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    tituloTarjeta: {
      fontSize: 20,
      fontWeight: "700",
      color: c.texto,
    },
    descripcionTarjeta: {
      fontSize: 15,
      color: c.textoSecundario,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
