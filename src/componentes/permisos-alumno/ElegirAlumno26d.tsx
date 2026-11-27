/**
 * Antes de la Pantalla 26d: el tutor elige de qué alumno quiere cambiar los permisos
 * (HU-23 · SCRUM-141). Salen solo sus alumnos: la base de datos no deja leer los de otros tutores.
 *
 * Reglas de la profesora: sin scroll ni ventanas emergentes. Caben 9 alumnos por pantalla; si hay
 * más, «Adelante» pasa a los siguientes y «Atrás» vuelve a los anteriores (o al panel, en la primera).
 * Un toque en un alumno abre su 26d.
 */

import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";

/** Alumnos que caben a la vez (3 × 3), como en el resto de pantallas de elegir. */
export const ALUMNOS_POR_PAGINA_26D = 9;

export interface AlumnoElegible26d {
  id: string;
  nombre: string;
  apellidos?: string | null;
  color?: string | null;
}

export interface ElegirAlumno26dProps {
  alumnos: AlumnoElegible26d[];
  /** Mientras se cargan los alumnos. */
  cargando?: boolean;
  /** Mensaje si no se han podido cargar. */
  error?: string | null;
  alElegir: (alumno: AlumnoElegible26d) => void;
  /** «Atrás» en la primera página (vuelve al panel del tutor). */
  alAtras: () => void;
  alCerrarSesion?: () => void;
  /** La misma lista sirve para otras pantallas (Plan B de un alumno). */
  titulo?: string;
  pregunta?: string;
  /** Lo que se lee tras el nombre en cada alumno («cambiar sus permisos»). */
  accion?: string;
}

export function ElegirAlumno26d({
  alumnos,
  cargando = false,
  error = null,
  alElegir,
  alAtras,
  alCerrarSesion,
  titulo = "Permisos del alumno",
  pregunta = "¿De qué alumno quieres cambiar los permisos?",
  accion = "cambiar sus permisos",
}: ElegirAlumno26dProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [pagina, setPagina] = useState(0);

  const paginas = Math.max(1, Math.ceil(alumnos.length / ALUMNOS_POR_PAGINA_26D));
  const actual = Math.min(pagina, paginas - 1);
  const visibles = alumnos.slice(
    actual * ALUMNOS_POR_PAGINA_26D,
    (actual + 1) * ALUMNOS_POR_PAGINA_26D,
  );

  const mensaje = cargando
    ? "Cargando tus alumnos…"
    : error
      ? error
      : alumnos.length === 0
        ? "Todavía no tienes alumnos vinculados."
        : null;

  return (
    <MarcoPantalla
      titulo={titulo}
      derecha={
        alCerrarSesion ? (
          <Pressable
            testID="boton-salir-elegir-26d"
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión y salir"
            onPress={alCerrarSesion}
            style={({ pressed }) => [e.botonSalir, pressed && e.pulsado]}
          >
            <Icono nombre="salir" tam={20} color={colores.texto} />
            <Texto style={e.textoSalir}>Salir</Texto>
          </Pressable>
        ) : null
      }
      atras={actual > 0 ? () => setPagina(actual - 1) : alAtras}
      etiquetaAtras={actual > 0 ? "Atrás: alumnos anteriores" : "Atrás: volver al panel"}
      adelante={actual < paginas - 1 ? () => setPagina(actual + 1) : null}
      etiquetaAdelante="Adelante: más alumnos"
      testID="pantalla-elegir-alumno-26d"
    >
      <View style={e.contenedor}>
        <Texto style={e.pregunta} accessibilityRole="header">
          {pregunta}
        </Texto>
        {mensaje ? (
          <Texto style={e.mensaje} testID="mensaje-elegir-alumno-26d">
            {mensaje}
          </Texto>
        ) : (
          <View style={e.cuadricula} testID="cuadricula-elegir-alumno-26d">
            {visibles.map((alumno) => {
              const color = alumno.color || colores.primario;
              const completo = [alumno.nombre, alumno.apellidos].filter(Boolean).join(" ");
              return (
                <Pressable
                  key={alumno.id}
                  testID={`elegir-alumno-26d-${alumno.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${completo}: ${accion}`}
                  onPress={() => alElegir(alumno)}
                  style={({ pressed }) => [e.tarjeta, pressed && e.pulsado]}
                >
                  <View style={[e.inicial, { borderColor: color }]}>
                    <Texto style={[e.textoInicial, { color }]}>
                      {alumno.nombre.trim().charAt(0).toUpperCase()}
                    </Texto>
                  </View>
                  <Texto style={e.nombre} numberOfLines={1}>
                    {alumno.nombre}
                  </Texto>
                  {alumno.apellidos ? (
                    <Texto style={e.apellidos} numberOfLines={1}>
                      {alumno.apellidos}
                    </Texto>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
        {paginas > 1 ? (
          <Texto style={e.paginas} testID="paginas-elegir-alumno-26d">
            {`Página ${actual + 1} de ${paginas}`}
          </Texto>
        ) : null}
      </View>
    </MarcoPantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenedor: { flex: 1, padding: 20, gap: 16 },
    pregunta: { fontSize: 24, fontWeight: "700", color: c.texto },
    mensaje: { fontSize: 20, color: c.textoSecundario, marginTop: 24, textAlign: "center" },
    cuadricula: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "flex-start",
      gap: 16,
    },
    tarjeta: {
      width: "31%",
      minHeight: 120,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      gap: 6,
    },
    inicial: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.fondo,
    },
    textoInicial: { fontSize: 26, fontWeight: "700" },
    nombre: { fontSize: 20, fontWeight: "700", color: c.texto },
    apellidos: { fontSize: 15, color: c.textoSecundario },
    paginas: { fontSize: 16, color: c.textoSecundario, textAlign: "center" },
    botonSalir: {
      minHeight: 42,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    textoSalir: { fontSize: 16, fontWeight: "700", color: c.texto },
    pulsado: { opacity: 0.85 },
  });
