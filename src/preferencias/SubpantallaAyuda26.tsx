// Subpantalla 26: «Ayuda: qué puede pedir (máximo 3)» fiel a BOCETOS_NUEVOS/26.html.
// Respeta la paleta activa (incluido el modo de alto contraste) y etiqueta accesible en el buscador.
// MOD HU-18 (SCRUM-269): el buscador busca de verdad en ARASAAC y en Mi biblioteca del adulto que
// la abre (tutor o familia) y cada ayuda elegida se guarda completa (AyudaElegida). Sin texto se
// enseñan como sugerencias los 8 pictogramas del catálogo.
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import type { ClienteArasaac } from "../arasaac/clienteArasaac";
import { normalizarTexto } from "../arasaac/texto";
import { useBuscadorPictogramas } from "../arasaac/useBuscadorPictogramas";
import { PictogramaTarea } from "../componentes/agenda/PictogramaTarea";
import type { AyudaElegida } from "../necesidades/tipos";
import {
  cargarPictogramasPropiosDesdeBD,
  obtenerPictogramasPropiosPorRol51,
} from "../servicios/bibliotecaPictogramasService";
import { useSesionOpcional } from "../sesion/SesionProvider";
import type { Paleta } from "../temas";
import type {
  PictogramaPropio51,
  RolBibliotecaPictogramas51,
} from "../tipos/bibliotecaPictogramas";
import { Icono } from "../ui/Icono";
import { Texto as Text } from "../ui/Texto";
import { colorSobre, useApariencia, useEstilos } from "../ui/apariencia";
import {
  MAXIMO_AYUDAS,
  ayudaDesdeArasaac,
  ayudaDesdeBiblioteca,
  ayudaDesdeCatalogo26,
  necesidadesDesdeAyudas,
} from "./ayudas";
import { CATALOGO_AYUDAS_26, type PreferenciasApariencia } from "./opciones";

/** Resultados que caben en la cuadrícula sin scroll (2 filas de 4). */
const MAXIMO_RESULTADOS = 8;

const SUGERENCIAS = CATALOGO_AYUDAS_26.map(ayudaDesdeCatalogo26);

export interface SubpantallaAyuda26Props {
  borrador: PreferenciasApariencia;
  busqueda: string;
  onChangeBusqueda: (q: string) => void;
  actualizarBorrador: (c: Partial<PreferenciasApariencia>) => void;
  alGuardar: () => void;
  /** Cliente de ARASAAC (por defecto, el compartido de la app; en las pruebas, uno simulado). */
  clienteArasaac?: ClienteArasaac;
  /**
   * Cómo se carga Mi biblioteca del rol. Por defecto: con un adulto dentro, de Supabase (como la
   * pantalla 51); sin sesión, el catálogo en memoria.
   */
  cargarBiblioteca?: (rol: RolBibliotecaPictogramas51) => Promise<PictogramaPropio51[]>;
}

export function SubpantallaAyuda26({
  borrador: p,
  busqueda,
  onChangeBusqueda,
  actualizarBorrador,
  alGuardar,
  clienteArasaac,
  cargarBiblioteca,
}: SubpantallaAyuda26Props) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const elegidas = p.ayudas;

  // Mi biblioteca del adulto que configura: la familia ve la suya; cualquier otro, la del tutor.
  const sesion = useSesionOpcional()?.sesion ?? null;
  const rol: RolBibliotecaPictogramas51 = sesion?.user.role === "familiar" ? "familia" : "tutor";
  const [biblioteca, setBiblioteca] = useState<PictogramaPropio51[]>([]);
  const [errorBiblioteca, setErrorBiblioteca] = useState(false);
  useEffect(() => {
    let activo = true;
    const cargar =
      cargarBiblioteca ??
      (sesion
        ? cargarPictogramasPropiosDesdeBD
        : async (r: RolBibliotecaPictogramas51) => obtenerPictogramasPropiosPorRol51(r));
    cargar(rol)
      .then((lista) => {
        if (activo) setBiblioteca(lista);
      })
      .catch(() => {
        if (activo) setErrorBiblioteca(true);
      });
    return () => {
      activo = false;
    };
    // Se carga una vez por rol; la función de carga no cambia mientras la pantalla está abierta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  const arasaac = useBuscadorPictogramas(
    busqueda,
    clienteArasaac ? { cliente: clienteArasaac } : {},
  );
  const termino = normalizarTexto(busqueda.trim());
  const resultados = useMemo<AyudaElegida[]>(() => {
    if (!termino) return SUGERENCIAS;
    const propios = biblioteca
      .filter((pic) => normalizarTexto(pic.palabraClave).includes(termino))
      .map(ayudaDesdeBiblioteca);
    const deArasaac = arasaac.resultados.map(ayudaDesdeArasaac);
    return [...propios, ...deArasaac].slice(0, MAXIMO_RESULTADOS);
  }, [termino, biblioteca, arasaac.resultados]);

  const estaElegida = (ayuda: AyudaElegida) => elegidas.some((x) => x.id === ayuda.id);

  const alternarAyuda = (ayuda: AyudaElegida) => {
    let nuevas: AyudaElegida[];
    if (estaElegida(ayuda)) {
      if (elegidas.length <= 1) return; // Nunca dejar vacía la pantalla de Ayuda
      nuevas = elegidas.filter((x) => x.id !== ayuda.id);
    } else {
      if (elegidas.length >= MAXIMO_AYUDAS) return; // Máximo 3 ayudas
      nuevas = [...elegidas, ayuda];
    }
    actualizarBorrador({
      ayudas: nuevas,
      necesidades: necesidadesDesdeAyudas(nuevas, p.necesidades),
    });
  };

  return (
    <View style={e.contenedor26} testID="opciones-ayuda26">
      {/* Columna izquierda: buscador y cuadrícula de 8 pictogramas (26.html) */}
      <View style={e.columnaIzquierda26}>
        <View style={e.cabeceraIzquierda26}>
          <Text style={e.tituloSeccion26}>Elige hasta 3 pictogramas de ayuda (máximo 3)</Text>
          <View style={e.pildoraPrimaria26} testID="contador-ayudas-26">
            <Text style={e.textoPildoraPrimaria26}>
              {elegidas.length} de 3 seleccionados (máx. 3)
            </Text>
          </View>
        </View>

        <View style={e.campoBusqueda26}>
          <Icono nombre="buscar" color={colores.primario} tam={18} />
          <TextInput
            testID="input-buscar-ayudas-26"
            accessibilityLabel="Buscar pictogramas de ayuda en ARASAAC y en Mi biblioteca propia"
            value={busqueda}
            onChangeText={onChangeBusqueda}
            placeholder="Buscar en ARASAAC y en Mi biblioteca propia…"
            placeholderTextColor={colores.textoSecundario}
            style={e.inputBusqueda26}
          />
        </View>

        {termino && arasaac.estado === "cargando" ? (
          <Text testID="cargando-arasaac-26" style={e.avisoBusqueda26}>
            Buscando en ARASAAC…
          </Text>
        ) : null}
        {termino && arasaac.estado === "error" ? (
          <Text testID="error-arasaac-26" style={e.avisoBusqueda26}>
            ARASAAC no responde ahora: se ven solo los de Mi biblioteca.
          </Text>
        ) : null}
        {errorBiblioteca ? (
          <Text testID="error-biblioteca-26" style={e.avisoBusqueda26}>
            No se pudo cargar Mi biblioteca.
          </Text>
        ) : null}

        <View style={e.rejilla26}>
          {resultados.map((ayuda) => {
            const activa = estaElegida(ayuda);
            const esPropio = ayuda.origen === "biblioteca";
            return (
              <Pressable
                key={ayuda.id}
                testID={`resultado-ayuda-${ayuda.id}`}
                accessibilityRole="checkbox"
                accessibilityLabel={`${ayuda.texto}, ${esPropio ? "Mi biblioteca" : "ARASAAC"}`}
                accessibilityState={{ checked: activa }}
                onPress={() => alternarAyuda(ayuda)}
                style={[e.tarjetaPicto26, activa && e.tarjetaPicto26Activa]}
              >
                {activa ? (
                  <View style={e.circuloCheckBoceto}>
                    <Text style={e.textoCheckBoceto}>✓</Text>
                  </View>
                ) : null}
                <View
                  style={[
                    e.pildoraOrigen26,
                    esPropio ? e.pildoraOrigenBiblioteca : e.pildoraOrigenArasaac,
                  ]}
                >
                  <Text
                    style={[
                      e.textoPildoraOrigen26,
                      esPropio ? e.textoOrigenBiblioteca : e.textoOrigenArasaac,
                    ]}
                  >
                    {esPropio ? "Mi biblioteca" : "ARASAAC"}
                  </Text>
                </View>
                <PictogramaTarea
                  tarea={{ titulo: ayuda.texto, pictograma_url: ayuda.imagenUrl }}
                  tam={48}
                />
                <Text style={e.etiquetaPicto26} numberOfLines={2}>
                  {ayuda.texto}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Columna derecha: 3 huecos activos + Urgencia fija + botón Guardar (26.html) */}
      <View style={e.tarjetaDerecha26}>
        <View style={e.cabeceraIzquierda26}>
          <Text style={e.tituloSeccion26}>Ayudas activas (máx. 3)</Text>
          <View style={e.pildoraExito26}>
            <Text style={e.textoPildoraExito26}>Límite: 3</Text>
          </View>
        </View>

        <View style={e.filaHuecos26}>
          {[0, 1, 2].map((idx) => {
            const item = elegidas[idx];
            return (
              <View
                key={idx}
                testID={item ? `muestra-ayuda-${item.id}` : `hueco-vacio-26-${idx}`}
                style={[e.hueco26, !item && e.hueco26Vacio]}
              >
                <View style={e.pildoraPrimaria26}>
                  <Text style={e.textoHuecoBadge26}>Hueco {idx + 1} de 3</Text>
                </View>
                {item ? (
                  <>
                    <PictogramaTarea
                      tarea={{ titulo: item.texto, pictograma_url: item.imagenUrl }}
                      tam={52}
                    />
                    <Text style={e.textoHuecoNombre26} numberOfLines={2}>
                      {item.texto}
                    </Text>
                  </>
                ) : (
                  <Text style={e.textoHuecoVacio26}>Libre</Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={e.bannerUrgenciaFija26}>
          <Text style={e.textoBannerUrgencia26}>⚠ Urgencia (siempre fija abajo)</Text>
        </View>

        <Pressable
          testID="btn-guardar-tres-ayudas-26"
          accessibilityRole="button"
          accessibilityLabel="Guardar las 3 ayudas"
          onPress={alGuardar}
          style={e.botonGuardar26}
        >
          <Text style={e.textoBotonGuardar26}>✓ Guardar las 3 ayudas</Text>
        </Pressable>
      </View>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    contenedor26: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 20,
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    columnaIzquierda26: { flex: 1.25, minWidth: 460, gap: 10 },
    cabeceraIzquierda26: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    tituloSeccion26: { fontSize: 18, fontWeight: "700", color: c.texto },
    avisoBusqueda26: { fontSize: 15, fontWeight: "600", color: c.texto, marginBottom: 6 },
    pildoraPrimaria26: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    textoPildoraPrimaria26: { fontSize: 13, fontWeight: "700", color: c.primario },
    campoBusqueda26: {
      height: 42,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      gap: 10,
    },
    inputBusqueda26: { flex: 1, fontSize: 15, color: c.texto },
    rejilla26: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    tarjetaPicto26: {
      width: 124,
      height: 122,
      padding: 6,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
    },
    tarjetaPicto26Activa: {
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    circuloCheckBoceto: {
      position: "absolute",
      right: -9,
      top: -9,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    textoCheckBoceto: { color: c.textoSobrePrimario, fontSize: 15, fontWeight: "700" },
    pildoraOrigen26: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 7,
      paddingVertical: 1,
    },
    pildoraOrigenArasaac: { backgroundColor: c.superficie, borderColor: c.exito },
    pildoraOrigenBiblioteca: { backgroundColor: c.superficieDestacada, borderColor: c.primario },
    textoPildoraOrigen26: { fontSize: 10, fontWeight: "700" },
    textoOrigenArasaac: { color: c.exito },
    textoOrigenBiblioteca: { color: c.primario },
    etiquetaPicto26: { fontSize: 11.5, fontWeight: "700", color: c.texto, textAlign: "center" },
    tarjetaDerecha26: {
      width: 400,
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    pildoraExito26: {
      backgroundColor: c.superficie,
      borderColor: c.exito,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    textoPildoraExito26: { fontSize: 13, fontWeight: "700", color: c.exito },
    filaHuecos26: { flexDirection: "row", gap: 10, justifyContent: "center" },
    hueco26: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      gap: 6,
    },
    hueco26Vacio: {
      borderColor: c.borde,
      backgroundColor: c.fondo,
      borderStyle: "dashed",
    },
    textoHuecoBadge26: { fontSize: 10.5, fontWeight: "700", color: c.primario },
    textoHuecoNombre26: {
      fontSize: 12,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    textoHuecoVacio26: { fontSize: 12, color: c.textoSecundario, paddingVertical: 18 },
    bannerUrgenciaFija26: {
      height: 46,
      borderRadius: 12,
      backgroundColor: c.peligro,
      alignItems: "center",
      justifyContent: "center",
    },
    textoBannerUrgencia26: {
      color: colorSobre(c.peligro),
      fontSize: 15,
      fontWeight: "700",
    },
    botonGuardar26: {
      height: 52,
      borderRadius: 12,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    textoBotonGuardar26: {
      color: c.textoSobrePrimario,
      fontSize: 17,
      fontWeight: "700",
    },
  });
