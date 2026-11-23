/**
 * Pantalla 36 — Alumnos del aula con buscador por nombre y acceso a ficha (SCRUM-233 / SCRUM-253 · T-TUT.2).
 * Permite al tutor filtrar en tiempo real a los estudiantes de la clase seleccionada por su nombre
 * y abrir la ficha individual limpia (Pantalla 37) al tocar su tarjeta.
 */

import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import type { Estudiante } from "../../tipos/estudiante";
import { FORMA, FormaClase, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import { obtenerAlumnosDeAula, obtenerAulaTutor, type AulaTutor } from "./datosAulasTutor";

export interface BuscadorAlumnosAulaProps {
  /** Identificador de la clase seleccionada en la Pantalla 35 (p. ej. `cua`, `tri`). */
  aulaId: string;
  /** Datos del aula si se desean sobreescribir. */
  aula?: AulaTutor;
  /** Lista de estudiantes del aula (por defecto los matriculados en `aulaId`). */
  alumnos?: Estudiante[];
  /** Nombre del tutor autenticado para la insignia superior. */
  nombreTutor?: string;
  /** Se invoca al tocar la tarjeta de un alumno para abrir su ficha (Pantalla 37). */
  alElegirAlumno: (alumnoId: string) => void;
  /** Acción del botón «Atrás» (vuelve a la Pantalla 35). */
  alAtras?: (() => void) | null;
  /** Acción del botón «Adelante». */
  alAdelante?: (() => void) | null;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

/**
 * Normaliza un texto eliminando tildes y pasándolo a minúsculas para búsquedas tolerantes.
 * @param texto Cadena a normalizar
 * @returns Cadena en minúsculas sin diacríticos
 */
export function normalizarBusquedaNombre(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Renderiza la Pantalla 36 del Tutor con buscador de alumnos por nombre y tarjetas de acceso a la ficha.
 * @param props Propiedades de configuración y callbacks de navegación
 * @returns Componente visual de listado y búsqueda de alumnos del aula
 */
export function BuscadorAlumnosAula({
  aulaId,
  aula,
  alumnos,
  nombreTutor = "María Carmen",
  alElegirAlumno,
  alAtras = null,
  alAdelante = null,
  alCerrarSesion,
}: BuscadorAlumnosAulaProps) {
  const [busqueda, setBusqueda] = useState("");
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const datosAula = useMemo(() => aula ?? obtenerAulaTutor(aulaId), [aula, aulaId]);
  const listaBase = useMemo(() => alumnos ?? obtenerAlumnosDeAula(aulaId), [alumnos, aulaId]);

  const alumnosFiltrados = useMemo(() => {
    const termino = normalizarBusquedaNombre(busqueda);
    if (!termino) return listaBase;
    return listaBase.filter(
      (est) =>
        normalizarBusquedaNombre(est.nombre).includes(termino) ||
        normalizarBusquedaNombre(est.nombreCompleto).includes(termino),
    );
  }, [busqueda, listaBase]);

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaRol} testID="insignia-tutor-36">
        <Texto style={estilos.textoInsigniaRol}>{`Tutor · ${nombreTutor}`}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-36"
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
      titulo={`Alumnos · ${datosAula.nombre}`}
      derecha={derecha}
      atras={alAtras}
      adelante={alAdelante}
    >
      <View style={estilos.contenedor} testID="pantalla-36-alumnos">
        <View style={estilos.barraSuperior}>
          <View style={estilos.infoAula}>
            <FormaClase claseId={datosAula.id} simbolo={datosAula.simbolo} tam={48} />
            <View>
              <Texto accessibilityRole="header" style={estilos.tituloAula}>
                {datosAula.nombre}
              </Texto>
              <Texto style={estilos.subtituloAula} testID="contador-alumnos-36">
                {`${alumnosFiltrados.length} alumnos en el aula · toca para abrir su ficha`}
              </Texto>
            </View>
          </View>

          <View style={estilos.cajaBuscador}>
            <Icono nombre="buscar" tam={20} color={colores.textoSecundario} />
            <TextInput
              testID="buscador-alumnos-36"
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar alumno por nombre..."
              placeholderTextColor={colores.textoSecundario}
              accessibilityLabel="Buscar alumno por nombre"
              style={[estilos.inputBuscador, { color: colores.texto }]}
            />
            {busqueda.trim().length > 0 ? (
              <Pressable
                testID="limpiar-busqueda-36"
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda de alumno"
                onPress={() => setBusqueda("")}
                style={estilos.botonLimpiar}
              >
                <Icono nombre="cerrar" tam={18} color={colores.textoSecundario} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {alumnosFiltrados.length === 0 ? (
          <View style={estilos.estadoVacio} testID="sin-resultados-36">
            <Texto style={estilos.textoVacio}>No hay alumnos que coincidan con la búsqueda</Texto>
          </View>
        ) : (
          <View style={estilos.cuadricula} testID="cuadricula-alumnos-36">
            {alumnosFiltrados.map((alumno) => (
              <Pressable
                key={alumno.id}
                testID={`tarjeta-alumno-${alumno.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${alumno.nombre}, Ver ficha y agenda`}
                accessibilityHint="Toca para abrir la ficha del alumno"
                onPress={() => alElegirAlumno(alumno.id)}
                style={({ pressed }) => [estilos.tarjetaAlumno, pressed && estilos.pulsado]}
              >
                <View style={[estilos.avatar, { borderColor: alumno.color }]}>
                  <Texto style={estilos.iconoAvatar}>{alumno.icono}</Texto>
                </View>
                <Texto style={estilos.nombreAlumno}>{alumno.nombre}</Texto>
                <Texto style={estilos.accionFicha}>Ver ficha y agenda</Texto>
              </Pressable>
            ))}
          </View>
        )}
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
    barraSuperior: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    infoAula: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    tituloAula: {
      fontSize: 22,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloAula: {
      fontSize: 15,
      color: c.textoSecundario,
    },
    cajaBuscador: {
      minWidth: 280,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inputBuscador: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 8,
    },
    botonLimpiar: {
      padding: 4,
    },
    cuadricula: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      alignContent: "stretch",
    },
    tarjetaAlumno: {
      width: "31%",
      flexGrow: 1,
      minHeight: 180,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      backgroundColor: c.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
    iconoAvatar: {
      fontSize: 44,
    },
    nombreAlumno: {
      fontSize: 22,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    accionFicha: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primario,
      textAlign: "center",
    },
    estadoVacio: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    textoVacio: {
      fontSize: 18,
      color: c.textoSecundario,
      textAlign: "center",
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
