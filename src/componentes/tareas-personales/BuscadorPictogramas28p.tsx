/**
 * Pantalla 28p — Buscador general de pictogramas (ARASAAC + Mi biblioteca)
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/28p.html`
 * (SCRUM-89 / SCRUM-90 · T-07.1).
 *
 * Restricciones clave del boceto definitivo:
 * - Es una pantalla general para elegir el pictograma de una tarea o paso
 *   (NO dice «Paso 3»).
 * - SIN panel derecho «Pictograma seleccionado».
 * - SIN botón «Adjuntar propio» (la subida se hace pulsando la tarjeta `+` en la pantalla 32).
 * - Busca simultáneamente en el catálogo oficial de ARASAAC y en «Mi biblioteca»
 *   con pestañas de filtro «Todos (8)», «ARASAAC (5)» y «Mi biblioteca (3)».
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import {
  PICTOGRAMAS_BUSCADOR_28P,
  type FuentePictograma28p,
  type PictogramaBuscador28p,
  type RolBibliotecaAdulto,
} from "./datosTareasPersonales";

export interface BuscadorPictogramas28pProps {
  /** Rol activo: `"tutor"` o `"familia"`. */
  rol?: RolBibliotecaAdulto;
  /** Nombre del usuario mostrado en cabecera (`"Carmen Ruiz"` o `"Familia García"`). */
  nombreUsuario?: string;
  /** Catálogo unificado de pictogramas ARASAAC + propios. */
  pictogramas?: PictogramaBuscador28p[];
  /** Filtro de fuente inicial (`"all"`, `"arasaac"` o `"mio"`). */
  fuenteInicial?: FuentePictograma28p;
  /** Texto inicial en la barra de búsqueda. */
  busquedaInicial?: string;
  /** ID del pictograma seleccionado inicialmente. */
  pictogramaSeleccionadoInicialId?: string;
  /** Se invoca al pulsar el botón inferior «Seleccionar» (-> vuelve a 28 o 28s). */
  alSeleccionarPictograma?: (pictograma: PictogramaBuscador28p | null) => void;
  /** Acción del botón inferior «Atrás» (-> vuelve a 28 o 28s). */
  alAtras?: (() => void) | null;
  /** Acción para cerrar sesión desde la cabecera. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 28p (Buscador general de pictogramas ARASAAC + Mi biblioteca).
 * @param props Propiedades del buscador de pictogramas
 * @returns Vista de rejilla de 4 columnas sin panel lateral derecho ni botón Adjuntar propio
 */
export function BuscadorPictogramas28p({
  rol = "tutor",
  nombreUsuario,
  pictogramas = PICTOGRAMAS_BUSCADOR_28P,
  fuenteInicial = "all",
  busquedaInicial = "",
  pictogramaSeleccionadoInicialId = "p-arasaac-agua",
  alSeleccionarPictograma,
  alAtras = null,
  alCerrarSesion,
}: BuscadorPictogramas28pProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const [fuente, setFuente] = useState<FuentePictograma28p>(fuenteInicial);
  const [busqueda, setBusqueda] = useState<string>(busquedaInicial);
  const [seleccionadoId, setSeleccionadoId] = useState<string>(pictogramaSeleccionadoInicialId);

  const totalTodos = pictogramas.length;
  const totalArasaac = useMemo(
    () => pictogramas.filter((p) => p.fuente === "arasaac").length,
    [pictogramas],
  );
  const totalMios = useMemo(
    () => pictogramas.filter((p) => p.fuente === "mio").length,
    [pictogramas],
  );

  const pictogramasVisibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return pictogramas.filter((p) => {
      if (fuente !== "all" && p.fuente !== fuente) return false;
      if (termino.length > 0) {
        return (
          p.titulo.toLowerCase().includes(termino) ||
          p.etiquetaFuente.toLowerCase().includes(termino)
        );
      }
      return true;
    });
  }, [pictogramas, fuente, busqueda]);

  const pictogramaActivo = useMemo(
    () =>
      pictogramasVisibles.find((p) => p.id === seleccionadoId) ?? pictogramasVisibles[0] ?? null,
    [pictogramasVisibles, seleccionadoId],
  );

  const etiquetaUsuario = nombreUsuario ?? (rol === "familia" ? "Familia García" : "Carmen Ruiz");

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-usuario-28p">
        <Icono nombre="persona" tam={18} color={colores.primario} />
        <Texto style={estilos.textoUsuario}>{etiquetaUsuario}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-28p"
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
      titulo="Buscador de pictogramas"
      simbolo={<Icono nombre="buscar" tam={34} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras}
      adelante={() => alSeleccionarPictograma?.(pictogramaActivo)}
      textoAdelante="Seleccionar"
    >
      <View style={estilos.contenedor} testID="pantalla-28p-buscador-pictogramas">
        {/* Barra superior de búsqueda unificada y filtros de fuente */}
        <View style={estilos.barraSuperior}>
          <View style={estilos.campoBusqueda}>
            <Icono nombre="buscar" tam={20} color={colores.textoSecundario} />
            <TextInput
              testID="input-buscar-picto-28p"
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscando a la vez en ARASAAC y en Mi biblioteca de pictogramas…"
              placeholderTextColor={colores.textoSecundario}
              accessibilityLabel="Buscar pictograma en ARASAAC y Mi biblioteca"
              style={estilos.inputBusqueda}
            />
          </View>

          <Pressable
            testID="filtro-28p-all"
            accessibilityRole="button"
            accessibilityState={{ selected: fuente === "all" }}
            accessibilityLabel={`Todos (${totalTodos})`}
            onPress={() => setFuente("all")}
            style={[estilos.botonFiltro, fuente === "all" && estilos.botonFiltroActivo]}
          >
            <Texto style={[estilos.textoFiltro, fuente === "all" && estilos.textoFiltroActivo]}>
              {`Todos (${totalTodos})`}
            </Texto>
          </Pressable>

          <Pressable
            testID="filtro-28p-arasaac"
            accessibilityRole="button"
            accessibilityState={{ selected: fuente === "arasaac" }}
            accessibilityLabel={`ARASAAC (${totalArasaac})`}
            onPress={() => setFuente("arasaac")}
            style={[estilos.botonFiltro, fuente === "arasaac" && estilos.botonFiltroActivo]}
          >
            <Texto style={[estilos.textoFiltro, fuente === "arasaac" && estilos.textoFiltroActivo]}>
              {`ARASAAC (${totalArasaac})`}
            </Texto>
          </Pressable>

          <Pressable
            testID="filtro-28p-mio"
            accessibilityRole="button"
            accessibilityState={{ selected: fuente === "mio" }}
            accessibilityLabel={`Mi biblioteca (${totalMios})`}
            onPress={() => setFuente("mio")}
            style={[estilos.botonFiltro, fuente === "mio" && estilos.botonFiltroActivo]}
          >
            <Texto style={[estilos.textoFiltro, fuente === "mio" && estilos.textoFiltroActivo]}>
              {`Mi biblioteca (${totalMios})`}
            </Texto>
          </Pressable>
        </View>

        {/* Rejilla de 4 columnas a ancho completo (sin panel derecho) */}
        <View style={estilos.rejilla} testID="rejilla-pictogramas-28p">
          {pictogramasVisibles.map((item) => {
            const activo = pictogramaActivo?.id === item.id;
            const esMio = item.fuente === "mio";
            return (
              <Pressable
                key={item.id}
                testID={`tarjeta-picto-28p-${item.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={`${item.titulo}, ${item.etiquetaFuente}`}
                onPress={() => setSeleccionadoId(item.id)}
                style={[estilos.tarjetaPicto, activo && estilos.tarjetaPictoActiva]}
              >
                <View
                  style={[
                    estilos.pildoraFuente,
                    esMio ? estilos.pildoraMia : estilos.pildoraArasaac,
                  ]}
                >
                  <Texto
                    style={[
                      estilos.textoPildoraFuente,
                      esMio ? estilos.textoPildoraMia : estilos.textoPildoraArasaac,
                    ]}
                  >
                    {item.etiquetaFuente}
                  </Texto>
                </View>

                <Image
                  source={{ uri: item.pictogramaUrl }}
                  style={estilos.imagenPicto}
                  accessibilityIgnoresInvertColors
                />

                <Texto style={estilos.tituloPicto}>{item.titulo}</Texto>
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
      fontSize: 15,
      color: c.texto,
      paddingVertical: 6,
    },
    botonFiltro: {
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      alignItems: "center",
      justifyContent: "center",
    },
    botonFiltroActivo: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    textoFiltro: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    textoFiltroActivo: {
      color: c.primario,
    },
    rejilla: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    tarjetaPicto: {
      width: "24%",
      minHeight: 170,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 10,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    tarjetaPictoActiva: {
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
    },
    pildoraFuente: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    pildoraArasaac: {
      backgroundColor: c.superficieDestacada,
    },
    pildoraMia: {
      backgroundColor: "#DCFCE7",
    },
    textoPildoraFuente: {
      fontSize: 12,
      fontWeight: "700",
    },
    textoPildoraArasaac: {
      color: c.primario,
    },
    textoPildoraMia: {
      color: "#15803D",
    },
    imagenPicto: {
      width: 78,
      height: 78,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    tituloPicto: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
