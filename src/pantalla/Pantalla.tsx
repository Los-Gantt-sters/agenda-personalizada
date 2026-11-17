// Envoltorio común de todas las pantallas (mejoras de la profesora, noviembre de 2026):
// - Cabecera arriba con el nombre de la pantalla: el alumno sabe siempre dónde está.
// - Barra abajo, siempre igual y en el mismo sitio: «Ayuda» a la izquierda, «Atrás» y «Adelante»
//   en el centro y «Accesibilidad» a la derecha. Así no hay que buscar los botones en cada pantalla
//   y quien tiene dificultades motoras los encuentra siempre a la misma distancia.
// - En medio, el contenido: cabe en una sola pantalla, sin scroll.
// - Sin ventanas emergentes: «Accesibilidad» abre una pantalla completa encima de esta (esta no se
//   quita, así que al volver todo sigue igual). «Ayuda» la pinta ProveedorNecesidades, también como
//   pantalla completa encima de todo.
// - En las pantallas de entrar (clase, foto y contraseña) no hay «Ayuda» (sinAyuda): el hueco se
//   queda vacío para que las flechas sigan en el centro.
// - En el navegador, la pestaña lleva el nombre de la pantalla («Mi agenda · Agensible»), no el de
//   la ruta («index»).
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Platform, View, type LayoutChangeEvent } from "react-native";
import { useRouter } from "expo-router";

import { BotonNecesidades } from "../necesidades/BotonNecesidades";
import { useNecesidadesOpcional } from "../necesidades/ProveedorNecesidades";
import { PantallaVistaAccesible } from "../preferencias/PantallaVistaAccesible";
import { usePreferenciasOpcional } from "../preferencias/PreferenciasProvider";
import { ALTO_BOTON_BARRA, ANCHO_BOTON_LADO, BotonBarra, MarcoPantalla } from "./MarcoPantalla";

export { ALTO_BOTON_BARRA } from "./MarcoPantalla";

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
  /** Sin botón «Ayuda» (pantallas de entrar). El hueco se queda para no mover las flechas. */
  sinAyuda?: boolean;
  children: ReactNode;
  testID?: string;
}

/** Nombre de la app detrás del de cada pantalla en la pestaña del navegador. */
const NOMBRE_APP = "Agensible";

/**
 * Pone el nombre de la pantalla en la pestaña del navegador al aparecer y al cambiar de título.
 * Devuelve el manejador de onLayout: al volver con «Atrás», la pantalla anterior sigue montada y
 * solo se vuelve a ver (pasa de medir 0 a medir algo), así que también se pone ahí.
 */
function useTituloPestana(titulo: string) {
  const poner = useCallback(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = `${titulo} · ${NOMBRE_APP}`;
    }
  }, [titulo]);
  useEffect(() => poner(), [poner]);
  return useCallback(
    (e: LayoutChangeEvent) => {
      if (e.nativeEvent.layout.width > 0) poner();
    },
    [poner],
  );
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
  sinAyuda = false,
  children,
  testID,
}: PantallaProps) {
  const router = useRouter();
  const necesidades = useNecesidadesOpcional();
  const prefs = usePreferenciasOpcional();
  const [vistaAbierta, setVistaAbierta] = useState(false);
  const canal = prefs?.preferencias.canal ?? "ambos";
  const alMedir = useTituloPestana(titulo);

  // Atrás por defecto: la pantalla anterior, si la hay (al entrar con «replace» no la hay).
  const puedeVolver = typeof router?.canGoBack === "function" ? router.canGoBack() : false;
  const atras = alAtras === null ? null : (alAtras ?? (puedeVolver ? () => router.back() : null));

  return (
    <View style={{ flex: 1 }} onLayout={alMedir}>
      {/* Con la pantalla de Accesibilidad encima, la de debajo no se lee con el lector de pantalla. */}
      <View style={{ flex: 1 }} aria-hidden={vistaAbierta}>
        <MarcoPantalla
          titulo={titulo}
          simbolo={simbolo}
          derecha={derecha}
          atras={atras}
          adelante={alAdelante}
          etiquetaAtras={etiquetaAtras}
          etiquetaAdelante={etiquetaAdelante}
          textoAdelante={textoAdelante}
          conSonido={conSonido}
          testID={testID}
          barraIzquierda={
            necesidades && !sinAyuda ? (
              <BotonNecesidades
                onPress={necesidades.abrirModalNecesidades}
                variante={necesidades.varianteBoton}
                canal={canal}
                tamanio={ALTO_BOTON_BARRA}
                enBarra={{ ancho: ANCHO_BOTON_LADO, alto: ALTO_BOTON_BARRA }}
                testID="btn-necesidades"
              />
            ) : null
          }
          barraDerecha={
            prefs ? (
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
            ) : null
          }
        >
          {children}
        </MarcoPantalla>
      </View>

      {prefs ? (
        <PantallaVistaAccesible visible={vistaAbierta} alCerrar={() => setVistaAbierta(false)} />
      ) : null}
    </View>
  );
}
