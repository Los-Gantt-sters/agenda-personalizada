/**
 * Pantalla 51 — Mi biblioteca · Mis pictogramas propios (unificación de 51 y 51b)
 * con aislamiento estricto entre Tutor y Familia y subida directa al pulsar el recuadro «+»
 * (SCRUM-241 / SCRUM-275 · T-51.1 / SCRUM-279 · T-51.2).
 *
 * Sigue fielmente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/51.html`:
 *   - Una única pantalla compartida por Tutor (`Carmen Ruiz`, vuelve a `33`)
 *     y Familia (`Familia García`, vuelve a `34`).
 *   - Aislamiento estricto por rol (`data-bib-owner="tutor"` vs `data-bib-owner="familia"`):
 *     el Tutor solo ve y gestiona sus pictogramas escolares y la Familia solo ve y gestiona
 *     sus pictogramas del hogar.
 *   - SIN botón independiente «Subir archivo propio»: la subida se activa directamente al pulsar
 *     el recuadro punteado «+» (`data-upload-plus`), cambiando su estado a verde con el mensaje
 *     «✓ Archivo propio seleccionado y adjuntado a tu biblioteca» y añadiendo el pictograma
 *     a la biblioteca aislada del rol activo.
 *   - Tabla con columnas `IMAGEN`, `PALABRA CLAVE`, `TEXTO ALTERNATIVO` y botón `Editar / Quitar`.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import {
  CATALOGO_INICIAL_PICTOGRAMAS_51,
  MENSAJE_EXITO_SUBIDA_51,
  MENSAJE_INICIAL_SUBIDA_51,
  actualizarPictogramaPropioEnBD51,
  cargarPictogramasPropiosDesdeBD,
  eliminarPictogramaPropioEnBD51,
  filtrarPictogramasPorRol51,
  seleccionarArchivoImagenPropio,
  subirArchivoPictogramaPropio51,
  subirPictogramaPropioAlPulsarMas,
} from "../../servicios/bibliotecaPictogramasService";
import type { Paleta } from "../../temas";
import type {
  ArchivoImagenSeleccionado51,
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
  /** Si es `true`, carga y persiste los pictogramas reales del usuario en Supabase (`pictogramas_propios` + Storage). */
  usarBaseDeDatos?: boolean;
  /** Selector de archivo inyectable (por defecto abre el selector nativo de archivos de imagen del navegador). */
  seleccionarArchivo?: () => Promise<ArchivoImagenSeleccionado51 | null>;
  /** Palabra clave inicial en el formulario superior. */
  palabraClaveInicial?: string;
  /** Texto alternativo inicial en el formulario superior. */
  textoAlternativoInicial?: string;
  /** Se invoca al subir un nuevo pictograma pulsando el recuadro punteado «+». */
  alSubirPictograma?: (nuevo: PictogramaPropio51) => void;
  /** Se invoca al subir, quitar o editar un pictograma propio de la lista. */
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
 * para Tutor y Familia con aislamiento estricto por rol y subida directa al pulsar «+».
 * @param props Propiedades de configuración y callbacks
 * @returns Vista de biblioteca de pictogramas propios
 */
export function PantallaBibliotecaPictogramas51({
  rol = "tutor",
  nombreUsuario,
  pictogramasIniciales = CATALOGO_INICIAL_PICTOGRAMAS_51,
  usarBaseDeDatos = false,
  seleccionarArchivo,
  palabraClaveInicial = "",
  textoAlternativoInicial = "",
  alSubirPictograma,
  alCambiarBiblioteca,
  alAtras = null,
  alCerrarSesion,
}: PantallaBibliotecaPictogramas51Props) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const [catalogo, setCatalogo] = useState<PictogramaPropio51[]>(() =>
    usarBaseDeDatos ? [] : pictogramasIniciales.map((item) => ({ ...item })),
  );
  const [palabraClave, setPalabraClave] = useState<string>(palabraClaveInicial);
  const [textoAlternativo, setTextoAlternativo] = useState<string>(textoAlternativoInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [archivoSubidoOk, setArchivoSubidoOk] = useState<boolean>(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);

  useEffect(() => {
    if (!usarBaseDeDatos) return;
    let activo = true;
    cargarPictogramasPropiosDesdeBD(rol)
      .then((filas) => {
        if (activo) {
          setCatalogo(filas);
          setErrorSubida(null);
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setErrorSubida(
            err instanceof Error ? err.message : "No se pudo cargar tu biblioteca de pictogramas.",
          );
        }
      });
    return () => {
      activo = false;
    };
  }, [usarBaseDeDatos, rol]);

  const etiquetaUsuario =
    nombreUsuario?.trim() || (rol === "familia" ? "Familia García" : "Carmen Ruiz");
  const destinoAtras: "33" | "34" = rol === "familia" ? "34" : "33";

  const pictogramasVisibles = useMemo(
    () => filtrarPictogramasPorRol51(catalogo, rol),
    [catalogo, rol],
  );

  const manejarSubidaDirectaAlPulsarMas = async () => {
    setErrorSubida(null);
    try {
      let nuevo: PictogramaPropio51;
      if (usarBaseDeDatos || seleccionarArchivo) {
        const selector = seleccionarArchivo ?? seleccionarArchivoImagenPropio;
        const elegido = await selector();
        if (!elegido) {
          return;
        }
        nuevo = await subirArchivoPictogramaPropio51({
          owner: rol,
          archivo: elegido.archivo,
          nombreArchivo: elegido.nombreArchivo,
          tipoMime: elegido.tipoMime,
          palabraClave,
          textoAlternativo,
        });
      } else {
        nuevo = await subirPictogramaPropioAlPulsarMas({
          owner: rol,
          palabraClave,
          textoAlternativo,
        });
      }
      const siguiente = [nuevo, ...catalogo];
      setCatalogo(siguiente);
      setArchivoSubidoOk(true);
      setEditandoId(null);
      setPalabraClave("");
      setTextoAlternativo("");
      alSubirPictograma?.(nuevo);
      alCambiarBiblioteca?.(filtrarPictogramasPorRol51(siguiente, rol));
    } catch (err: unknown) {
      setArchivoSubidoOk(false);
      setErrorSubida(
        err instanceof Error ? err.message : "No se pudo subir el archivo seleccionado.",
      );
    }
  };

  const manejarQuitarPictograma = async (id: string) => {
    setErrorSubida(null);
    const objetivo = catalogo.find((item) => item.id === id && item.owner === rol);
    if (usarBaseDeDatos && objetivo) {
      try {
        await eliminarPictogramaPropioEnBD51(id, rol, objetivo.rutaStorage);
      } catch (err: unknown) {
        setErrorSubida(
          err instanceof Error ? err.message : "No se pudo eliminar el pictograma propio.",
        );
        return;
      }
    }
    const siguiente = catalogo.filter((item) => !(item.id === id && item.owner === rol));
    setCatalogo(siguiente);
    if (editandoId === id) {
      setEditandoId(null);
    }
    alCambiarBiblioteca?.(filtrarPictogramasPorRol51(siguiente, rol));
  };

  const manejarIniciarOGuardarEdicion = async (item: PictogramaPropio51) => {
    setErrorSubida(null);
    if (editandoId === item.id) {
      const nuevaPalabra = palabraClave.trim() || item.palabraClave;
      const nuevoTextoAlt = textoAlternativo.trim() || item.textoAlternativo;
      if (usarBaseDeDatos) {
        try {
          await actualizarPictogramaPropioEnBD51({
            id: item.id,
            owner: rol,
            palabraClave: nuevaPalabra,
            textoAlternativo: nuevoTextoAlt,
          });
        } catch (err: unknown) {
          setErrorSubida(
            err instanceof Error ? err.message : "No se pudo actualizar el pictograma propio.",
          );
          return;
        }
      }
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

        {/* Tarjeta superior con recuadro punteado «+» interactivo (SIN botón separado «Subir archivo propio») */}
        <View style={estilos.tarjetaSubida} testID="tarjeta-formulario-subida-51">
          <Pressable
            testID="recuadro-subir-mas-51"
            accessibilityRole="button"
            accessibilityLabel="Pulsa aquí para subir tu archivo"
            onPress={manejarSubidaDirectaAlPulsarMas}
            style={({ pressed }) => [
              estilos.recuadroPunteadoMas,
              archivoSubidoOk && estilos.recuadroPunteadoMasExito,
              pressed && estilos.pulsado,
            ]}
          >
            <Texto style={[estilos.simboloMas, archivoSubidoOk && estilos.textoRecuadroExito]}>
              +
            </Texto>
            <Texto
              style={[estilos.textoSubirRecuadro, archivoSubidoOk && estilos.textoRecuadroExito]}
            >
              Subir
            </Texto>
          </Pressable>

          <View style={estilos.columnaCamposSubida}>
            <Texto
              style={[estilos.textoEstadoSubida, archivoSubidoOk && estilos.textoEstadoSubidaExito]}
              testID="estado-subida-51"
            >
              {archivoSubidoOk ? MENSAJE_EXITO_SUBIDA_51 : MENSAJE_INICIAL_SUBIDA_51}
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
    recuadroPunteadoMasExito: {
      borderColor: c.exito,
      backgroundColor: "#E6F4EC",
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
    textoRecuadroExito: {
      color: c.exito,
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
    textoEstadoSubidaExito: {
      color: c.exito,
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
