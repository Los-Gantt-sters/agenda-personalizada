// Envoltorio común de todas las pantallas (mejoras de la profesora, noviembre de 2026):
// - Cabecera arriba con el nombre de la pantalla: el alumno sabe siempre dónde está.
// - Barra abajo, siempre igual y en el mismo sitio: «Ayuda» a la izquierda, «Atrás» y «Adelante»
//   en el centro y «Accesibilidad» a la derecha. Así no hay que buscar los botones en cada pantalla
//   y quien tiene dificultades motoras los encuentra siempre a la misma distancia.
// - En medio, el contenido: cabe en una sola pantalla, sin scroll.
import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { BotonNecesidades } from "../necesidades/BotonNecesidades";
import { ModalNecesidades } from "../necesidades/ModalNecesidades";
import { useNecesidadesOpcional } from "../necesidades/ProveedorNecesidades";
import { ModalVistaAccesible } from "../preferencias/ModalVistaAccesible";
import { usePreferenciasOpcional } from "../preferencias/PreferenciasProvider";
import { reproducirSonido } from "../servicios/sonidos";
import type { Paleta } from "../temas";
import { Icono, type NombreIcono } from "../ui/Icono";
import { Texto } from "../ui/Texto";
import { useApariencia, useEstilos } from "../ui/apariencia";

/** Alto de los botones de la barra inferior (muy por encima de los 48 px mínimos). */
export const ALTO_BOTON_BARRA = 72;
const ANCHO_BOTON_LADO = 160;

export interface PantallaProps {
  /** Nombre de la pantalla, en pocas palabras («¿Cuál es tu clase?», «Mi agenda»...). */
  titulo: string;
  /** Dibujo que acompaña al título (pictograma, forma de la clase, foto del alumno...). */
  simbolo?: ReactNode;
  /** Algo a la derecha de la cabecera: la fecha, el logo del colegio... */
  derecha?: ReactNode;
  /**
   * Qué hace «Atrás». Si no se indica, vuelve a la pantalla anterior cuando la hay; con null, el
   * botón se ve pero está desactivado (p. ej. en la primera pantalla).
   */
  alAtras?: (() => void) | null;
  /** Qué hace «Adelante». Sin indicar o con null está desactivado. */
  alAdelante?: (() => void) | null;
  /** Nombre que lee la ayuda de voz para «Atrás» (p. ej. «Atrás, no soy yo»). */
  etiquetaAtras?: string;
  etiquetaAdelante?: string;
  /** Texto visible de «Adelante» cuando avanzar es una acción concreta («Entrar»). */
  textoAdelante?: string;
  /** Sonido suave al pulsar Atrás y Adelante (pantallas del alumno, T-01.3). */
  conSonido?: boolean;
  /**
   * La pantalla va dentro de otra ventana (Modal), como la felicitación al terminar una tarea:
   * la ventana de «Ayuda» se pinta aquí dentro para que salga encima y no debajo.
   */
  enVentana?: boolean;
  children: ReactNode;
  testID?: string;
}

export function Pantalla({
  titulo,
  simbolo,
  derecha,
  alAtras,
  alAdelante,
  etiquetaAtras = "Atrás",
  etiquetaAdelante,
  textoAdelante = "Adelante",
  conSonido = false,
  enVentana = false,
  children,
  testID,
}: PantallaProps) {
  const router = useRouter();
  const e = useEstilos(crearEstilos);
  const necesidades = useNecesidadesOpcional();
  const prefs = usePreferenciasOpcional();
  const [vistaAbierta, setVistaAbierta] = useState(false);
  const canal = prefs?.preferencias.canal ?? "ambos";
  const registrarVentanaLocal = necesidades?.registrarVentanaLocal;
  useEffect(() => {
    if (enVentana && registrarVentanaLocal) return registrarVentanaLocal();
  }, [enVentana, registrarVentanaLocal]);

  // Atrás por defecto: la pantalla anterior, si la hay (al entrar con «replace» no la hay).
  const puedeVolver = typeof router?.canGoBack === "function" ? router.canGoBack() : false;
  const atras = alAtras === null ? null : (alAtras ?? (puedeVolver ? () => router.back() : null));
  const adelante = alAdelante ?? null;

  const conToque = (accion: () => void) => () => {
    if (conSonido) reproducirSonido("toque");
    accion();
  };

  return (
    <View style={e.raiz} testID={testID}>
      <SafeAreaView edges={["top"]} style={e.cabecera}>
        <View style={e.filaCabecera}>
          {simbolo ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {simbolo}
            </View>
          ) : null}
          <Texto
            style={e.titulo}
            accessibilityRole="header"
            numberOfLines={1}
            testID="titulo-pantalla"
          >
            {titulo}
          </Texto>
          {derecha ? <View style={e.derecha}>{derecha}</View> : null}
        </View>
      </SafeAreaView>

      <View style={e.contenido}>{children}</View>

      <SafeAreaView edges={["bottom"]} style={e.barra}>
        <View style={e.filaBarra} accessibilityRole="toolbar">
          <View style={e.lado}>
            {necesidades ? (
              <BotonNecesidades
                onPress={necesidades.abrirModalNecesidades}
                variante={necesidades.varianteBoton}
                canal={canal}
                tamanio={ALTO_BOTON_BARRA}
                enBarra={{ ancho: ANCHO_BOTON_LADO, alto: ALTO_BOTON_BARRA }}
                testID="btn-necesidades"
              />
            ) : null}
          </View>

          <View style={e.centro}>
            <BotonBarra
              icono="flechaAtras"
              texto="Atrás"
              etiqueta={etiquetaAtras}
              canal={canal}
              alPulsar={atras ? conToque(atras) : null}
              testID="btn-barra-atras"
            />
            <BotonBarra
              icono="adelante"
              texto={textoAdelante}
              etiqueta={etiquetaAdelante ?? textoAdelante}
              canal={canal}
              alPulsar={adelante ? conToque(adelante) : null}
              iconoDetras
              destacado={Boolean(adelante) && textoAdelante !== "Adelante"}
              testID="btn-barra-adelante"
            />
          </View>

          <View style={[e.lado, e.ladoDerecho]}>
            {prefs ? (
              <BotonBarra
                icono="accesibilidad"
                texto="Accesibilidad"
                etiqueta="Accesibilidad: cómo se ve la pantalla"
                canal={canal}
                alPulsar={() => setVistaAbierta(true)}
                ancho={ANCHO_BOTON_LADO}
                textoPequeno
                testID="btn-barra-accesibilidad"
              />
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      {prefs ? (
        <ModalVistaAccesible visible={vistaAbierta} alCerrar={() => setVistaAbierta(false)} />
      ) : null}
      {enVentana && necesidades ? (
        <ModalNecesidades
          visible={necesidades.modalAbierto}
          alSeleccionarNecesidad={necesidades.solicitarNecesidad}
          alCerrar={necesidades.cerrarModalNecesidades}
          necesidadEnviada={necesidades.necesidadEnviada}
          alConfirmarAvisoEnviado={necesidades.cerrarModalNecesidades}
          nombreTutora={necesidades.nombreTutora}
          variante={necesidades.varianteBoton}
          canal={necesidades.canalVisual}
        />
      ) : null}
    </View>
  );
}

/** Botón de la barra inferior: siempre con icono y texto (o solo uno, según «Qué se ve»). */
function BotonBarra({
  icono,
  texto,
  etiqueta,
  canal,
  alPulsar,
  iconoDetras = false,
  destacado = false,
  ancho,
  textoPequeno = false,
  testID,
}: {
  icono: NombreIcono;
  texto: string;
  etiqueta: string;
  canal: string;
  /** null: desactivado (se ve, pero apagado y con borde discontinuo). */
  alPulsar: (() => void) | null;
  iconoDetras?: boolean;
  destacado?: boolean;
  ancho?: number;
  textoPequeno?: boolean;
  testID?: string;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const activo = alPulsar !== null;
  const colorTinta = destacado ? colores.textoSobrePrimario : colores.texto;
  const colorIcono = !activo
    ? colores.textoSecundario
    : destacado
      ? colores.textoSobrePrimario
      : colores.primario;
  // Las flechas se ven siempre: en «Solo texto» quitan el dibujo, pero una flecha no distrae.
  const verTexto = canal !== "soloPictograma";
  const dibujoFinal = <Icono nombre={icono} color={colorIcono} tam={32} />;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !activo }}
      disabled={!activo}
      onPress={alPulsar ?? undefined}
      testID={testID}
      style={({ pressed }) => [
        e.botonBarra,
        ancho ? { width: ancho } : null,
        textoPequeno && e.botonVertical,
        destacado && e.botonDestacado,
        !activo && e.botonApagado,
        pressed && e.pulsado,
      ]}
    >
      {!iconoDetras || textoPequeno ? dibujoFinal : null}
      {verTexto ? (
        <Texto
          // «Accesibilidad» va en un botón de ancho fijo: con letra extra grande no cabría.
          escalar={!textoPequeno}
          style={[
            e.textoBoton,
            textoPequeno && e.textoPequeno,
            { color: activo ? colorTinta : colores.textoSecundario },
          ]}
          numberOfLines={1}
        >
          {texto}
        </Texto>
      ) : null}
      {iconoDetras && !textoPequeno ? dibujoFinal : null}
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    raiz: { flex: 1, backgroundColor: c.fondo },
    cabecera: {
      backgroundColor: c.superficie,
      borderBottomWidth: 2,
      borderBottomColor: c.borde,
    },
    filaCabecera: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    titulo: { flex: 1, fontSize: 26, fontWeight: "700", color: c.texto },
    derecha: { flexShrink: 0, alignItems: "flex-end" },
    contenido: { flex: 1, overflow: "hidden" },
    barra: {
      backgroundColor: c.superficie,
      borderTopWidth: 2,
      borderTopColor: c.borde,
    },
    filaBarra: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    lado: { flex: 1, flexDirection: "row", alignItems: "center" },
    ladoDerecho: { justifyContent: "flex-end" },
    centro: { flexDirection: "row", alignItems: "center", gap: 16 },
    botonBarra: {
      minHeight: ALTO_BOTON_BARRA,
      minWidth: 160,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 18,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    botonVertical: { flexDirection: "column", gap: 4, minWidth: 0, paddingHorizontal: 6 },
    botonDestacado: { backgroundColor: c.primario },
    botonApagado: { borderStyle: "dashed", borderColor: c.borde, borderWidth: 2, opacity: 0.55 },
    pulsado: { opacity: 0.8 },
    textoBoton: { fontSize: 22, fontWeight: "700" },
    textoPequeno: { fontSize: 15 },
  });
