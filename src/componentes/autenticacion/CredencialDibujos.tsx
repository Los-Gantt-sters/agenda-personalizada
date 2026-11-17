// Contraseña del alumno con 3 dibujos (RF1.1, RF1.2, RF1.7), a pantalla completa: antes era una
// ventana pequeña encima de la lista y costaba acertar con los dibujos. A la izquierda, los 3 huecos,
// «Borrar dibujo» y «Entrar»; a la derecha, los 9 dibujos grandes. Al tocar el tercer dibujo NO se
// entra sola: el alumno lo comprueba y pulsa «Entrar» (o «Adelante» en la barra de abajo).
// El componente no guarda la secuencia: la lleva la pantalla, que también la usa en «Adelante».
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  DIBUJOS_CREDENCIAL_VISUAL,
  DibujoCredencialVisual,
  Estudiante,
  LONGITUD_SECUENCIA_DIBUJOS,
} from "../../tipos/estudiante";
import { reproducirSonido } from "../../servicios/sonidos";
import { urlImagenPictograma } from "../../arasaac/urls";
import { PictogramaTarea } from "../agenda/PictogramaTarea";
import type { Paleta } from "../../temas";
import { Icono, PictogramaInterfaz, Texto, useApariencia, useEstilos } from "../../ui";

/** Pictograma de un dibujo de la credencial; si no carga, su emoji. */
function DibujoCredencial({ dibujo, tam }: { dibujo: DibujoCredencialVisual; tam: number }) {
  return (
    <PictogramaTarea
      tarea={{
        titulo: dibujo.etiqueta,
        emoji: dibujo.icono,
        pictograma_url: dibujo.pictograma ? urlImagenPictograma(dibujo.pictograma, 300) : null,
      }}
      tam={tam}
    />
  );
}

/** Foto (o dibujo) del alumno en un círculo, para la cabecera de la pantalla. */
export function AvatarEstudiante({
  estudiante,
  tam = 48,
}: {
  estudiante: Estudiante;
  tam?: number;
}) {
  const { colores } = useApariencia();
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam / 2,
        borderWidth: 3,
        borderColor: estudiante.color || colores.borde,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: tam * 0.55 }}>{estudiante.icono}</Text>
    </View>
  );
}

export interface CredencialDibujosProps {
  estudiante: Estudiante;
  /** Dibujos tocados hasta ahora, en orden (p. ej. ['manzana', 'perro']). */
  secuencia: string[];
  alCambiarSecuencia: (secuencia: string[]) => void;
  /** Se llama al pulsar «Entrar» con los 3 dibujos puestos. */
  alEntrar: () => void;
  /** Mensaje si la secuencia no era la buena (va con icono, no solo con color). */
  mensajeError?: string | null;
  /** Mientras se comprueba con el colegio, «Entrar» no se puede volver a pulsar. */
  comprobando?: boolean;
  /** Catálogo de dibujos (por defecto los 9 del prototipo 03-estudiante-contrasena.html). */
  opcionesDibujos?: DibujoCredencialVisual[];
}

export function CredencialDibujos({
  estudiante,
  secuencia,
  alCambiarSecuencia,
  alEntrar,
  mensajeError,
  comprobando = false,
  opcionesDibujos = DIBUJOS_CREDENCIAL_VISUAL,
}: CredencialDibujosProps) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const completa = secuencia.length === LONGITUD_SECUENCIA_DIBUJOS;
  const dibujoPorSlug = (slug: string) => opcionesDibujos.find((d) => d.slug === slug);

  const tocarDibujo = (slug: string) => {
    if (completa) return;
    reproducirSonido("toque"); // T-01.3: cada toque suena suave
    alCambiarSecuencia([...secuencia, slug]);
  };

  const borrarUltimo = () => {
    reproducirSonido("borrar"); // nunca un pitido de error
    alCambiarSecuencia(secuencia.slice(0, -1));
  };

  return (
    <View
      style={e.raiz}
      testID="credencial-dibujos"
      accessibilityLabel={`Contraseña de ${estudiante.nombre}. Toca tus 3 dibujos en orden y pulsa Entrar`}
    >
      <View style={e.columnaIzquierda}>
        <View style={e.filaInstruccion}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <PictogramaInterfaz nombre="contrasena" etiqueta="contraseña" tam={52} />
          </View>
          <Texto style={e.instruccion}>Toca tus 3 dibujos en orden</Texto>
        </View>

        {/* 3 huecos: el siguiente con borde grueso; los puestos, con el dibujo y borde verde */}
        <View
          style={e.huecos}
          accessibilityLabel={`${secuencia.length} de ${LONGITUD_SECUENCIA_DIBUJOS} dibujos seleccionados`}
          testID="huecos-secuencia-dibujos"
        >
          {[0, 1, 2].map((indice) => {
            const slug = secuencia[indice];
            const dibujo = slug ? dibujoPorSlug(slug) : undefined;
            return (
              <View
                key={indice}
                testID={`hueco-dibujo-${indice}`}
                style={[
                  e.hueco,
                  slug ? e.huecoPuesto : null,
                  indice === secuencia.length ? e.huecoSiguiente : null,
                ]}
              >
                {dibujo ? (
                  <DibujoCredencial dibujo={dibujo} tam={64} />
                ) : slug ? (
                  <Text style={e.puntoHueco}>●</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {mensajeError ? (
          <View style={e.error} testID="error-credencial-visual" accessibilityRole="alert">
            <Icono nombre="alerta" color={colores.peligro} tam={28} grosor={2.8} />
            <Texto style={e.textoError}>{mensajeError}</Texto>
          </View>
        ) : null}

        <View style={e.acciones}>
          <TouchableOpacity
            style={[e.boton, e.botonBorrar, secuencia.length === 0 && e.apagado]}
            disabled={secuencia.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Borrar último dibujo"
            accessibilityState={{ disabled: secuencia.length === 0 }}
            testID="btn-borrar-dibujo"
            onPress={borrarUltimo}
          >
            <Icono nombre="cerrar" color={colores.texto} tam={24} grosor={2.8} />
            <Texto style={e.textoBorrar}>Borrar dibujo</Texto>
          </TouchableOpacity>

          <TouchableOpacity
            style={[e.boton, e.botonEntrar, (!completa || comprobando) && e.entrarApagado]}
            disabled={!completa || comprobando}
            accessibilityRole="button"
            accessibilityLabel="Entrar"
            accessibilityState={{ disabled: !completa || comprobando }}
            testID="btn-entrar-credencial"
            onPress={alEntrar}
          >
            <Icono
              nombre="check"
              color={completa ? colores.textoSobrePrimario : colores.textoSecundario}
              tam={30}
              grosor={3}
            />
            <Texto style={[e.textoEntrar, !completa && { color: colores.textoSecundario }]}>
              {comprobando ? "Comprobando…" : "Entrar"}
            </Texto>
          </TouchableOpacity>
        </View>
      </View>

      {/* Los 9 dibujos, grandes y separados para quien tiene poca precisión al tocar */}
      <View style={e.cuadricula} testID="cuadricula-dibujos-credencial">
        {opcionesDibujos.map((dibujo) => (
          <TouchableOpacity
            key={dibujo.slug}
            style={[e.dibujo, completa && e.apagado]}
            disabled={completa}
            accessibilityRole="button"
            accessibilityLabel={`Dibujo ${dibujo.etiqueta}`}
            testID={`dibujo-credencial-${dibujo.slug}`}
            onPress={() => tocarDibujo(dibujo.slug)}
          >
            <DibujoCredencial dibujo={dibujo} tam={72} />
            <Texto style={e.etiquetaDibujo}>{dibujo.etiqueta}</Texto>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    raiz: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      alignContent: "center",
      justifyContent: "center",
      gap: 32,
      padding: 20,
    },
    columnaIzquierda: { width: 380, maxWidth: "100%", alignItems: "center", gap: 16 },
    filaInstruccion: { flexDirection: "row", alignItems: "center", gap: 12 },
    instruccion: { fontSize: 24, fontWeight: "700", color: c.texto, flexShrink: 1 },
    huecos: { flexDirection: "row", gap: 16 },
    hueco: {
      width: 92,
      height: 92,
      borderRadius: 14,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: c.borde,
      backgroundColor: c.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
    huecoPuesto: {
      borderStyle: "solid",
      borderWidth: 3,
      borderColor: c.exito,
      backgroundColor: "#FFFFFF",
    },
    huecoSiguiente: {
      borderStyle: "solid",
      borderColor: c.primario,
      borderWidth: 4,
      backgroundColor: c.superficieDestacada,
    },
    puntoHueco: { fontSize: 34, color: c.texto },
    error: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: c.peligro,
      backgroundColor: c.superficie,
    },
    textoError: {
      flexShrink: 1,
      fontSize: 19,
      fontWeight: "700",
      color: c.peligro,
      textAlign: "center",
    },
    acciones: { width: "100%", gap: 12 },
    boton: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 18,
      borderRadius: 14,
    },
    botonBorrar: { backgroundColor: c.superficie, borderWidth: 2, borderColor: c.borde },
    textoBorrar: { fontSize: 19, fontWeight: "700", color: c.texto },
    botonEntrar: { minHeight: 76, backgroundColor: c.primario },
    entrarApagado: {
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: c.borde,
    },
    textoEntrar: { fontSize: 28, fontWeight: "700", color: c.textoSobrePrimario },
    apagado: { opacity: 0.45 },
    cuadricula: {
      width: 3 * 120 + 2 * 14,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    dibujo: {
      width: 120,
      height: 120,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      padding: 6,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    etiquetaDibujo: { fontSize: 15, fontWeight: "700", color: c.texto },
  });
