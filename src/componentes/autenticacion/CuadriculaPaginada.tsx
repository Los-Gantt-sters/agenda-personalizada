// Cuadrícula de 3 x 3 con páginas de 9 (MOD HU-01 · SCRUM-247 · T-01.5): pantallas 01/01b (clases)
// y 02/02b (alumnos). Nunca hay scroll: si hay más de 9, un botón alto a la derecha («Más aulas»,
// «Más alumnos») lleva a la página siguiente, y en las páginas siguientes otro a la izquierda
// («Pág. 1») vuelve a la anterior. Los botones van a los lados, no debajo, para que la barra de
// abajo (Atrás / Adelante) siga sirviendo solo para moverse entre pantallas.
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { reproducirSonido } from "../../servicios/sonidos";
import type { Paleta } from "../../temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../ui";

export const ELEMENTOS_POR_PAGINA = 9;
const COLUMNAS = 3;
const ANCHO_CELDA = 282;
const SEPARACION = 14;

/** Reparte los elementos en páginas de `porPagina`. Sin elementos, una página vacía. */
export function paginar<T>(elementos: readonly T[], porPagina = ELEMENTOS_POR_PAGINA): T[][] {
  if (elementos.length === 0) return [[]];
  const paginas: T[][] = [];
  for (let i = 0; i < elementos.length; i += porPagina) {
    paginas.push(elementos.slice(i, i + porPagina));
  }
  return paginas;
}

export interface CuadriculaPaginadaProps<T> {
  elementos: readonly T[];
  /** Clave única de cada elemento (para React). */
  clave: (elemento: T) => string;
  /** Pinta la tarjeta de un elemento; ocupa todo el ancho de su celda. */
  pintar: (elemento: T) => React.ReactNode;
  /** Qué hay en la página siguiente, para el botón «Más …» (p. ej. «aulas», «alumnos»). */
  queHayMas: string;
  /** Página con la que se abre (0 = la primera); p. ej. la de antes, al volver con «Atrás». */
  paginaInicial?: number;
  /** Avisa de la página que se enseña (0 = la primera), p. ej. para poner «Página 2». */
  alCambiarPagina?: (pagina: number) => void;
  testID?: string;
}

export function CuadriculaPaginada<T>({
  elementos,
  clave,
  pintar,
  queHayMas,
  paginaInicial = 0,
  alCambiarPagina,
  testID = "cuadricula-paginada",
}: CuadriculaPaginadaProps<T>) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const paginas = paginar(elementos);
  const [paginaElegida, setPagina] = useState(paginaInicial);
  // Si la lista se acorta (p. ej. el admin quita aulas), no se queda en una página que ya no existe
  const pagina = Math.min(paginaElegida, paginas.length - 1);
  // Y avisa al padre, para que su «Página N» no se quede desfasada
  useEffect(() => {
    if (pagina !== paginaElegida) alCambiarPagina?.(pagina);
  }, [pagina, paginaElegida, alCambiarPagina]);
  const hayAnterior = pagina > 0;
  const haySiguiente = pagina < paginas.length - 1;

  const irA = (nueva: number) => {
    reproducirSonido("toque");
    setPagina(nueva);
    alCambiarPagina?.(nueva);
  };

  return (
    <View style={e.fila} testID={testID}>
      {hayAnterior ? (
        <TouchableOpacity
          style={e.botonLateral}
          accessibilityRole="button"
          accessibilityLabel={`Volver a la página ${pagina}`}
          testID={`${testID}-anterior`}
          onPress={() => irA(pagina - 1)}
        >
          <Icono nombre="atras" color={colores.primario} tam={34} grosor={2.8} />
          <Texto style={e.textoLateral}>{`Pág.\n${pagina}`}</Texto>
        </TouchableOpacity>
      ) : null}

      <View style={e.cuadricula} testID={`${testID}-pagina-${pagina + 1}`}>
        {paginas[pagina].map((elemento) => (
          <View key={clave(elemento)} style={e.celda}>
            {pintar(elemento)}
          </View>
        ))}
      </View>

      {haySiguiente ? (
        <TouchableOpacity
          style={e.botonLateral}
          accessibilityRole="button"
          accessibilityLabel={`Más ${queHayMas}: ver la página ${pagina + 2}`}
          testID={`${testID}-siguiente`}
          onPress={() => irA(pagina + 1)}
        >
          <Icono nombre="adelante" color={colores.primario} tam={34} grosor={2.8} />
          <Texto style={e.textoLateral}>{`Más\n${queHayMas}`}</Texto>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    fila: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SEPARACION,
    },
    cuadricula: {
      width: COLUMNAS * ANCHO_CELDA + (COLUMNAS - 1) * SEPARACION,
      maxWidth: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SEPARACION,
    },
    celda: { width: ANCHO_CELDA, maxWidth: "100%" },
    botonLateral: {
      width: 84,
      minHeight: 240,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 6,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    textoLateral: { fontSize: 16, fontWeight: "700", color: c.primario, textAlign: "center" },
  });
