/**
 * Pantalla 35 — Mis alumnos · Elegir clase (SCRUM-233 / SCRUM-252 · T-TUT.1).
 * Muestra las 9 clases del centro a la vez en la misma pantalla (cuadrícula 3x3 sin paginación).
 * En la barra inferior solo aparecen los botones centrales «Atrás» y «Adelante» (MarcoPantalla),
 * sin botones de Ayuda ni Preferencias de alumno.
 */

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, FormaClase, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import { AULAS_TUTOR, type AulaTutor } from "./datosAulasTutor";

export interface SelectorAulasTutorProps {
  /** Nombre del tutor autenticado para la insignia superior. */
  nombreTutor?: string;
  /** Lista de aulas a mostrar (por defecto las 9 clases oficiales). */
  aulas?: AulaTutor[];
  /** Se invoca al tocar una de las 9 clases para abrir la Pantalla 36. */
  alElegirAula: (aulaId: string) => void;
  /** Acción del botón «Atrás» de la barra inferior. */
  alAtras?: (() => void) | null;
  /** Acción del botón «Adelante» de la barra inferior. */
  alAdelante?: (() => void) | null;
  /** Acción para cerrar sesión y volver al inicio. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 35 del Tutor con las 9 clases simultáneas sin paginación.
 * @param props Propiedades de configuración y navegación de la Pantalla 35
 * @returns Componente visual de selección de clase
 */
export function SelectorAulasTutor({
  nombreTutor = "María Carmen",
  aulas = AULAS_TUTOR,
  alElegirAula,
  alAtras = null,
  alAdelante = null,
  alCerrarSesion,
}: SelectorAulasTutorProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaRol} testID="insignia-tutor-35">
        <Texto style={estilos.textoInsigniaRol}>{`Tutor · ${nombreTutor}`}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-35"
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
      titulo="Mis alumnos · Elegir clase"
      derecha={derecha}
      atras={alAtras}
      adelante={alAdelante}
    >
      <View style={estilos.contenedor} testID="pantalla-35-aulas">
        <View style={estilos.encabezado}>
          <Texto accessibilityRole="header" style={estilos.tituloSeccion}>
            Elige una clase
          </Texto>
          <Texto style={estilos.subtituloSeccion}>
            Las 9 aulas del centro en una sola vista · toca una clase para ver sus alumnos
          </Texto>
        </View>

        <View style={estilos.cuadricula} testID="cuadricula-9-clases">
          {aulas.map((aula) => (
            <Pressable
              key={aula.id}
              testID={`tarjeta-aula-${aula.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${aula.nombre}, ${aula.totalAlumnos} alumnos`}
              accessibilityHint="Toca para ver los alumnos de esta clase"
              onPress={() => alElegirAula(aula.id)}
              style={({ pressed }) => [estilos.tarjetaAula, pressed && estilos.pulsado]}
            >
              <FormaClase claseId={aula.id} simbolo={aula.simbolo} tam={56} />
              <Texto style={estilos.nombreAula} numberOfLines={1}>
                {aula.nombre}
              </Texto>
              <Texto style={estilos.contadorAlumnos}>{`${aula.totalAlumnos} alumnos`}</Texto>
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
      paddingVertical: 14,
      gap: 12,
      backgroundColor: c.fondo,
    },
    encabezado: {
      gap: 2,
    },
    tituloSeccion: {
      fontSize: 24,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloSeccion: {
      fontSize: 16,
      color: c.textoSecundario,
    },
    cuadricula: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      alignContent: "stretch",
    },
    tarjetaAula: {
      width: "31.5%",
      flexGrow: 1,
      minHeight: 110,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    nombreAula: {
      fontSize: 19,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    contadorAlumnos: {
      fontSize: 15,
      color: c.textoSecundario,
      textAlign: "center",
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
