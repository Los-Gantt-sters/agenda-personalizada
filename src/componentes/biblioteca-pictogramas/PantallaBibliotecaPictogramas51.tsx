/**
 * Pantalla 51 — Mi biblioteca · Mis pictogramas propios (unificación de 51 y 51b)
 * con aislamiento estricto entre Tutor y Familia (SCRUM-241 / SCRUM-275 · T-51.1).
 *
 * Sigue fielmente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/51.html`:
 *   - Una única pantalla compartida por Tutor (`Carmen Ruiz`, vuelve a `33`)
 *     y Familia (`Familia García`, vuelve a `34`).
 *   - Aislamiento estricto por rol (`data-bib-owner="tutor"` vs `data-bib-owner="familia"`):
 *     el Tutor solo ve y gestiona sus pictogramas escolares y la Familia solo ve y gestiona
 *     sus pictogramas del hogar.
 *   - Tabla con columnas `IMAGEN`, `PALABRA CLAVE`, `TEXTO ALTERNATIVO` y botón `Editar / Quitar`.
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import {
  CATALOGO_INICIAL_PICTOGRAMAS_51,
  filtrarPictogramasPorRol51,
} from "../../servicios/bibliotecaPictogramasService";
import type { Paleta } from "../../temas";
import type {
  PictogramaPropio51,
  RolBibliotecaPictogramas51,
} from "../../tipos/bibliotecaPictogramas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";

export interface PantallaBibliotecaPictogramas51Props {
  /** Rol adulto activo: `"tutor"` (por defecto) o `"familia"`. */
  rol?: RolBibliotecaPictogramas51;
  /** Nombre mostrado en el chip de cabecera (`"Carmen Ruiz"` para tutor o `"Familia García"` para familia). */
  nombreUsuario?: string;
  /** Catálogo inicial de pictogramas propios (por defecto los 6 del boceto `51.html`). */
  pictogramasIniciales?: readonly PictogramaPropio51[];
  /** Palabra clave inicial en el formulario superior. */
  palabraClaveInicial?: string;
  /** Texto alternativo inicial en el formulario superior. */
  textoAlternativoInicial?: string;
  /** Se invoca al quitar o editar un pictograma propio de la lista. */
  alCambiarBiblioteca?: (pictogramasDelRol: PictogramaPropio51[]) => void;
  /** Se invoca al pulsar «Atrás» (-> vuelve a 33 si es Tutor o a 34 si es Familia). */
  alAtras?: ((destinoPanel: "33" | "34") => void) | null;
  /** Acción para cerrar sesión desde la cabecera («Salir» -> 05). */
  alCerrarSesion?: () => void;
}

/**
 * Obtiene las iniciales del usuario adulto para el avatar circular de cabecera.
 * @param nombre Nombre del usuario
 * @returns Iniciales en mayúsculas (`"CR"` o `"FG"`)
 */
function obtenerInicialesAdulto(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "CR";
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Renderiza la Pantalla 51 unificada («Mi biblioteca · Mis pictogramas propios»)
 * para Tutor y Familia con aislamiento estricto de elementos por rol.
 * @param props Propiedades de configuración y callbacks
 * @returns Vista de biblioteca de pictogramas propios
 */
export function PantallaBibliotecaPictogramas51({
  rol = "tutor",
  nombreUsuario,
  pictogramasIniciales = CATALOGO_INICIAL_PICTOGRAMAS_51,
  palabraClaveInicial = "",
  textoAlternativoInicial = "",
  alCambiarBiblioteca,
  alAtras = null,
  alCerrarSesion,
}: PantallaBibliotecaPictogramas51Props) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const [catalogo, setCatalogo] = useState<PictogramaPropio51[]>(() =>
    pictogramasIniciales.map((item) => ({ ...item })),
  );
  const [palabraClave, setPalabraClave] = useState<string>(palabraClaveInicial);
  const [textoAlternativo, setTextoAlternativo] = useState<string>(textoAlternativoInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const etiquetaUsuario =
    nombreUsuario?.trim() || (rol === "familia" ? "Familia García" : "Carmen Ruiz");
  const destinoAtras: "33" | "34" = rol === "familia" ? "34" : "33";

  const pictogramasVisibles = useMemo(
    () => filtrarPictogramasPorRol51(catalogo, rol),
    [catalogo, rol],
  );

  const manejarQuitarPictograma = (id: string) => {
    const siguiente = catalogo.filter((item) => !(item.id === id && item.owner === rol));
    setCatalogo(siguiente);
    if (editandoId === id) {
      setEditandoId(null);
    }
    alCambiarBiblioteca?.(filtrarPictogramasPorRol51(siguiente, rol));
  };

  const manejarIniciarOGuardarEdicion = (item: PictogramaPropio51) => {
    if (editandoId === item.id) {
      const nuevaPalabra = palabraClave.trim() || item.palabraClave;
      const nuevoTextoAlt = textoAlternativo.trim() || item.textoAlternativo;
      const siguiente = catalogo.map((actual) =>
        actual.id === item.id && actual.owner === rol
          ? {
              ...actual,
              palabraClave: nuevaPalabra,
              textoAlternativo: nuevoTextoAlt,
            }
          : actual,
      );
      setCatalogo(siguiente);
      setEditandoId(null);
      setPalabraClave("");
      setTextoAlternativo("");
      alCambiarBiblioteca?.(filtrarPictogramasPorRol51(siguiente, rol));
      return;
    }

    setEditandoId(item.id);
    setPalabraClave(item.palabraClave);
    setTextoAlternativo(item.textoAlternativo);
  };

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-usuario-51">
        <View style={estilos.avatarIniciales}>
          <Texto style={estilos.textoIniciales}>{obtenerInicialesAdulto(etiquetaUsuario)}</Texto>
        </View>
        <Texto style={estilos.textoUsuario}>{etiquetaUsuario}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-51"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión y salir"
          onPress={alCerrarSesion}
          style={({ pressed }) => [estilos.botonSalir, pressed && estilos.pulsado]}
        >
          <Icono nombre="salir" tam={18} color={colores.texto} />
          <Texto style={estilos.textoSalir}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <MarcoPantalla
      titulo="Mi biblioteca · Mis pictogramas propios"
      simbolo={<Icono nombre="imagen" tam={28} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras ? () => alAtras(destinoAtras) : null}
      adelante={null}
      textoAdelante="Adelante"
    >
      <View style={estilos.contenedor} testID="pantalla-51-biblioteca-pictogramas">
        <Texto style={estilos.descripcionSuperior}>
          Adjunta y gestiona aquí exclusivamente tus propios pictogramas. Al buscar pictogramas en
          tareas o ayudas aparecerán junto a los de ARASAAC.
        </Texto>

        {/* Tarjeta superior con recuadro punteado «+» y campos de Palabra clave y Texto alternativo */}
        <View style={estilos.tarjetaSubida} testID="tarjeta-formulario-subida-51">
          <View
            testID="recuadro-subir-mas-51"
            style={estilos.recuadroPunteadoMas}
            accessibilityLabel="Pulsa aquí para subir tu archivo"
          >
            <Texto style={estilos.simboloMas}>+</Texto>
            <Texto style={estilos.textoSubirRecuadro}>Subir</Texto>
          </View>

          <View style={estilos.columnaCamposSubida}>
            <Texto style={estilos.textoEstadoSubida} testID="estado-subida-51">
              Pulsa directamente el icono «+» para subir un archivo propio
            </Texto>
            <View style={estilos.filaInputs}>
              <TextInput
                testID="input-palabra-clave-51"
                value={palabraClave}
                onChangeText={setPalabraClave}
                placeholder="Palabra clave…"
                placeholderTextColor={colores.textoSecundario}
                accessibilityLabel="Palabra clave del pictograma propio"
                style={[estilos.campoInput, estilos.campoPalabraClave]}
              />
              <TextInput
                testID="input-texto-alternativo-51"
                value={textoAlternativo}
                onChangeText={setTextoAlternativo}
                placeholder="Texto alternativo…"
                placeholderTextColor={colores.textoSecundario}
                accessibilityLabel="Texto alternativo del pictograma propio"
                style={[estilos.campoInput, estilos.campoTextoAlternativo]}
              />
            </View>
          </View>
        </View>

        {/* Tabla de pictogramas propios filtrada estrictamente por rol (tutor vs familia) */}
        <View style={estilos.tarjetaTabla} testID="tabla-pictogramas-propios-51">
          <View style={estilos.cabeceraTabla}>
            <Texto style={[estilos.celdaCabecera, estilos.columnaImagen]}>IMAGEN</Texto>
            <Texto style={[estilos.celdaCabecera, estilos.columnaPalabraClave]}>
              PALABRA CLAVE
            </Texto>
            <Texto style={[estilos.celdaCabecera, estilos.columnaTextoAlternativo]}>
              TEXTO ALTERNATIVO
            </Texto>
            <View style={estilos.columnaAcciones} />
          </View>

          {pictogramasVisibles.map((item) => {
            const estaEditando = editandoId === item.id;
            return (
              <View
                key={item.id}
                testID={`fila-pictograma-51-${item.id}`}
                style={estilos.filaTabla}
              >
                <View style={estilos.columnaImagen}>
                  <Image
                    source={{ uri: item.imagenUrl }}
                    style={estilos.miniaturaPicto}
                    resizeMode="contain"
                    accessibilityLabel={item.textoAlternativo}
                    accessibilityIgnoresInvertColors
                  />
                </View>

                <View style={estilos.columnaPalabraClave}>
                  <Texto style={estilos.textoPalabraClave}>{item.palabraClave}</Texto>
                </View>

                <View style={estilos.columnaTextoAlternativo}>
                  <Texto style={estilos.textoAlternativoFila}>{item.textoAlternativo}</Texto>
                </View>

                <View style={[estilos.columnaAcciones, estilos.filaBotonesAccion]}>
                  <Pressable
                    testID={`boton-editar-picto-51-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={
                      estaEditando
                        ? `Guardar cambios de ${item.palabraClave}`
                        : `Editar o quitar ${item.palabraClave}`
                    }
                    onPress={() => manejarIniciarOGuardarEdicion(item)}
                    style={({ pressed }) => [estilos.botonAccionFila, pressed && estilos.pulsado]}
                  >
                    <Texto style={estilos.textoBotonAccionFila}>
                      {estaEditando ? "Guardar" : "Editar / Quitar"}
                    </Texto>
                  </Pressable>

                  <Pressable
                    testID={`boton-quitar-picto-51-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${item.palabraClave}`}
                    onPress={() => manejarQuitarPictograma(item.id)}
                    style={({ pressed }) => [estilos.botonQuitarFila, pressed && estilos.pulsado]}
                  >
                    <Texto style={estilos.textoBotonQuitarFila}>✕</Texto>
                  </Pressable>
                </View>
              </View>
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
      gap: 10,
      height: 46,
      paddingRight: 14,
      paddingLeft: 5,
      borderRadius: 23,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    avatarIniciales: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    textoIniciales: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primario,
    },
    textoUsuario: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    botonSalir: {
      height: 44,
      paddingHorizontal: 12,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      backgroundColor: c.superficie,
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
      paddingVertical: 18,
      justifyContent: "center",
      gap: 12,
      backgroundColor: c.fondo,
    },
    descripcionSuperior: {
      fontSize: 14.5,
      color: c.textoSecundario,
    },
    tarjetaSubida: {
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
      borderRadius: FORMA.radio,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    recuadroPunteadoMas: {
      width: 74,
      height: 74,
      borderRadius: 12,
      backgroundColor: c.superficie,
      borderWidth: 3,
      borderStyle: "dashed",
      borderColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    simboloMas: {
      fontSize: 28,
      lineHeight: 30,
      fontWeight: "700",
      color: c.primario,
    },
    textoSubirRecuadro: {
      fontSize: 11,
      fontWeight: "700",
      color: c.primario,
    },
    columnaCamposSubida: {
      flex: 1,
      gap: 6,
    },
    textoEstadoSubida: {
      fontSize: 14.5,
      fontWeight: "700",
      color: c.primario,
    },
    filaInputs: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    campoInput: {
      minHeight: 38,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      paddingHorizontal: 14,
      paddingVertical: 6,
      fontSize: 14,
      color: c.texto,
    },
    campoPalabraClave: {
      flex: 1,
      minWidth: 160,
    },
    campoTextoAlternativo: {
      flex: 1.5,
      minWidth: 220,
    },
    tarjetaTabla: {
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      overflow: "hidden",
    },
    cabeceraTabla: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 9,
      paddingHorizontal: 16,
      backgroundColor: c.fondo,
    },
    celdaCabecera: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    filaTabla: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: c.borde,
    },
    columnaImagen: {
      width: 68,
    },
    columnaPalabraClave: {
      flex: 1.2,
      paddingRight: 8,
    },
    columnaTextoAlternativo: {
      flex: 2.1,
      paddingRight: 8,
    },
    columnaAcciones: {
      width: 156,
    },
    filaBotonesAccion: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 6,
    },
    miniaturaPicto: {
      width: 46,
      height: 46,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    textoPalabraClave: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    textoAlternativoFila: {
      fontSize: 14,
      color: c.texto,
    },
    botonAccionFila: {
      minHeight: 36,
      paddingHorizontal: 10,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    textoBotonAccionFila: {
      fontSize: 13,
      fontWeight: "700",
      color: c.texto,
    },
    botonQuitarFila: {
      minHeight: 36,
      minWidth: 34,
      paddingHorizontal: 8,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    textoBotonQuitarFila: {
      fontSize: 13,
      fontWeight: "700",
      color: c.peligro,
    },
    pulsado: {
      opacity: 0.85,
    },
  });
