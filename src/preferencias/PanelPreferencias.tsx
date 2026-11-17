// Panel de preferencias de apariencia (T-04.3, HU-04), sin pasos técnicos (RNF3.3).
// Cubre RF3.1 (paleta y canal de información), RF3.2 (tipo de letra), RF3.3 (tamaño de letra),
// RF3.4 (tamaño de botones, tres opciones), RF3.5 (forma de los botones) y RF3.15 (vista previa).
// Mejoras de la profesora (noviembre de 2026):
// - Sin scroll: primero un menú con lo que se puede cambiar y, al tocar uno, una pantalla solo para
//   eso, con la vista previa al lado. «Atrás» vuelve al menú; «Adelante» pasa al apartado siguiente.
// - Dos apartados nuevos: «Mayúsculas o minúsculas» (cada colegio enseña a leer con una) y
//   «Tareas que se ven» en «Hecho» y «Después» (hay quien se orienta con pocas y quien quiere todas).
// - Segunda ronda: «Reloj en la tarea» (se ve o no; si se ve, es pequeño) y «Qué puede pedir en
//   Ayuda» (qué necesidades salen; «Urgencia» sale siempre). Aún no se guardan por alumno.
import React, { useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { urlImagenPictograma } from "../arasaac/urls";
import { PictogramaTarea } from "../componentes/agenda/PictogramaTarea";
import { RelojVisual } from "../componentes/reloj-visual/RelojVisual";
import { OPCIONES_NECESIDADES_BASICAS } from "../necesidades/opcionesNecesidades";
import { Pantalla } from "../pantalla/Pantalla";
import { NOMBRES_TEMAS, TEMAS, type Paleta } from "../temas";
import { Icono, type NombreIcono } from "../ui/Icono";
import { Texto as Text } from "../ui/Texto";
import { colorSobre, useApariencia, useEstilos } from "../ui/apariencia";
import { BotonAccesible } from "./BotonAccesible";
import { OpcionPreferencia } from "./OpcionPreferencia";
import { usePreferencias } from "./PreferenciasProvider";
import {
  CAJAS_LETRA,
  FORMAS_BOTON,
  FUENTES,
  MODOS_CANAL,
  NECESIDADES_AYUDA,
  ORDEN_CAJAS_LETRA,
  ORDEN_FORMAS,
  ORDEN_FUENTES,
  ORDEN_MODOS_CANAL,
  ORDEN_NECESIDADES_AYUDA,
  ORDEN_TAMANOS_BOTON,
  ORDEN_TAMANOS_LETRA,
  ORDEN_TAREAS_VISIBLES,
  ORDEN_VER_RELOJ,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
  TAREAS_VISIBLES,
  VER_RELOJ,
  type PreferenciasApariencia,
} from "./opciones";

type Apartado =
  | "canal"
  | "tema"
  | "fuente"
  | "caja"
  | "tamanoLetra"
  | "tamanoBoton"
  | "forma"
  | "tareasVisibles"
  | "reloj"
  | "necesidades";

/** Apartados del menú, en el orden en que se recorren con «Adelante». */
const APARTADOS: { clave: Apartado; titulo: string; ayuda: string; icono: NombreIcono }[] = [
  {
    clave: "canal",
    titulo: "Qué se ve (Dibujos y palabras)",
    ayuda: "Solo dibujos, solo texto en letra grande o las dos cosas.",
    icono: "imagen",
  },
  { clave: "tema", titulo: "Fondo y colores", ayuda: "Colores de toda la app.", icono: "paleta" },
  {
    clave: "fuente",
    titulo: "Tipo de letra",
    ayuda: "Letras pensadas para leer con más facilidad.",
    icono: "lista",
  },
  {
    clave: "caja",
    titulo: "Mayúsculas o minúsculas",
    ayuda: "Como se lee en el colegio: cada centro enseña con una.",
    icono: "lista",
  },
  {
    clave: "tamanoLetra",
    titulo: "Tamaño de letra",
    ayuda: "Más grande se lee mejor de lejos.",
    icono: "lista",
  },
  {
    clave: "tamanoBoton",
    titulo: "Tamaño de los botones",
    ayuda: "Más grandes son más fáciles de tocar.",
    icono: "accesibilidad",
  },
  {
    clave: "forma",
    titulo: "Forma de los botones",
    ayuda: "La que se reconozca mejor.",
    icono: "accesibilidad",
  },
  {
    clave: "tareasVisibles",
    titulo: "Tareas que se ven",
    ayuda: "Cuántas tareas se ven en «Hecho» y en «Después».",
    icono: "calendario",
  },
  {
    clave: "reloj",
    titulo: "Reloj en la tarea",
    ayuda: "Un reloj pequeño enseña cuánto queda. A quien le agobie, mejor sin reloj.",
    icono: "reloj",
  },
  {
    clave: "necesidades",
    titulo: "Qué puede pedir en Ayuda",
    ayuda: "Lo que sale al pulsar «Ayuda». «Urgencia» sale siempre. Elige al menos una.",
    icono: "campana",
  },
];

/** Texto del valor elegido en cada apartado, para el menú. */
function valorActual(apartado: Apartado, p: PreferenciasApariencia): string {
  switch (apartado) {
    case "canal":
      return MODOS_CANAL[p.canal].etiqueta;
    case "tema":
      return TEMAS[p.tema].etiqueta;
    case "fuente":
      return FUENTES[p.fuente].etiqueta;
    case "caja":
      return CAJAS_LETRA[p.caja].etiqueta;
    case "tamanoLetra":
      return TAMANOS_LETRA[p.tamanoLetra].etiqueta;
    case "tamanoBoton":
      return TAMANOS_BOTON[p.tamanoBoton].etiqueta;
    case "forma":
      return FORMAS_BOTON[p.forma].etiqueta;
    case "tareasVisibles":
      return TAREAS_VISIBLES[p.tareasVisibles].etiqueta;
    case "reloj":
      return VER_RELOJ[p.reloj].etiqueta;
    case "necesidades":
      return p.necesidades.map((n) => NECESIDADES_AYUDA[n].etiqueta).join(", ");
  }
}

// Las etiquetas «Minúsculas» y «MAYÚSCULAS» se ven siempre tal cual, aunque se elija mayúsculas.
const TAL_CUAL = { textTransform: "none" } as const;

export function PanelPreferencias() {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { preferencias, restablecer } = usePreferencias();
  const [abierto, setAbierto] = useState<Apartado | null>(null);

  // ---- Menú: qué quieres cambiar ----
  if (!abierto) {
    return (
      <Pantalla
        titulo="Preferencias"
        simbolo={<Icono nombre="paleta" color={colores.primario} tam={36} />}
      >
        <View style={e.menu}>
          <Text accessibilityRole="header" style={e.pregunta}>
            ¿Qué quieres cambiar?
          </Text>
          <View style={e.rejilla} testID="menu-preferencias">
            {APARTADOS.map((a) => {
              const valor = valorActual(a.clave, preferencias);
              return (
                <Pressable
                  key={a.clave}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.titulo}: ${valor}`}
                  testID={`apartado-${a.clave}`}
                  onPress={() => setAbierto(a.clave)}
                  style={({ pressed }) => [e.tarjeta, pressed && e.pulsado]}
                >
                  <MuestraApartado apartado={a.clave} preferencias={preferencias} />
                  <Text style={e.tituloTarjeta} numberOfLines={2}>
                    {a.titulo}
                  </Text>
                  <View style={e.filaValor}>
                    <Icono nombre="check" color={colores.primario} tam={20} grosor={3} />
                    <Text
                      style={[e.valorTarjeta, a.clave === "caja" ? TAL_CUAL : null]}
                      numberOfLines={1}
                    >
                      {valor}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <BotonAccesible
            variante="suave"
            etiqueta="Volver a lo de siempre"
            onPress={restablecer}
            style={e.botonRestablecer}
          />
        </View>
      </Pantalla>
    );
  }

  // ---- Un apartado en su propia pantalla ----
  const indice = APARTADOS.findIndex((a) => a.clave === abierto);
  const actual = APARTADOS[indice];
  const siguiente = APARTADOS[indice + 1];

  return (
    <Pantalla
      titulo={actual.titulo}
      simbolo={<Icono nombre={actual.icono} color={colores.primario} tam={36} />}
      alAtras={() => setAbierto(null)}
      etiquetaAtras="Atrás: volver a las preferencias"
      alAdelante={siguiente ? () => setAbierto(siguiente.clave) : null}
      etiquetaAdelante={siguiente ? `Adelante: ${siguiente.titulo}` : undefined}
    >
      <View style={e.apartado}>
        <View style={e.columnaOpciones}>
          <Text style={e.ayuda}>{actual.ayuda}</Text>
          <View
            style={e.opciones}
            // «Qué puede pedir en Ayuda» admite varias: son casillas, no un grupo de radio.
            accessibilityRole={abierto === "necesidades" ? undefined : "radiogroup"}
            accessibilityLabel={actual.titulo}
            testID={`opciones-${abierto}`}
          >
            <Opciones apartado={abierto} />
          </View>
        </View>
        <VistaPrevia apartado={abierto} />
      </View>
    </Pantalla>
  );
}

/** Las opciones de un apartado (radio: solo una elegida). */
function Opciones({ apartado }: { apartado: Apartado }) {
  const { preferencias: p, cambiar } = usePreferencias();
  const e = useEstilos(crearEstilos);

  switch (apartado) {
    case "canal":
      return (
        <>
          {ORDEN_MODOS_CANAL.map((modo) => (
            <OpcionPreferencia
              key={modo}
              etiqueta={MODOS_CANAL[modo].etiqueta}
              elegida={p.canal === modo}
              onPress={() => cambiar({ canal: modo })}
            />
          ))}
        </>
      );
    case "tema":
      return (
        <>
          {NOMBRES_TEMAS.map((nombre) => {
            const tema = TEMAS[nombre];
            return (
              <OpcionPreferencia
                key={nombre}
                etiqueta={tema.etiqueta}
                elegida={p.tema === nombre}
                onPress={() => cambiar({ tema: nombre })}
                muestra={
                  <View
                    accessibilityElementsHidden
                    style={[
                      e.muestraColor,
                      { backgroundColor: tema.paleta.fondo, borderColor: tema.paleta.borde },
                    ]}
                  >
                    <Text style={[e.textoMuestra, { color: tema.paleta.primario }]}>Aa</Text>
                  </View>
                }
              />
            );
          })}
        </>
      );
    case "fuente":
      return (
        <>
          {ORDEN_FUENTES.map((fuente) => (
            <OpcionPreferencia
              key={fuente}
              etiqueta={FUENTES[fuente].etiqueta}
              elegida={p.fuente === fuente}
              onPress={() => cambiar({ fuente })}
              fuente={FUENTES[fuente].familiaNegrita}
            />
          ))}
        </>
      );
    case "caja":
      return (
        <>
          {ORDEN_CAJAS_LETRA.map((caja) => (
            <OpcionPreferencia
              key={caja}
              etiqueta={CAJAS_LETRA[caja].etiqueta}
              elegida={p.caja === caja}
              onPress={() => cambiar({ caja })}
              estiloTexto={TAL_CUAL}
              muestra={
                <Text style={[e.muestraCaja, TAL_CUAL]} accessibilityElementsHidden>
                  {caja === "mayusculas" ? "DESAYUNO" : "Desayuno"}
                </Text>
              }
            />
          ))}
        </>
      );
    case "tamanoLetra":
      return (
        <>
          {ORDEN_TAMANOS_LETRA.map((tamano) => (
            <OpcionPreferencia
              key={tamano}
              etiqueta={TAMANOS_LETRA[tamano].etiqueta}
              elegida={p.tamanoLetra === tamano}
              onPress={() => cambiar({ tamanoLetra: tamano })}
            />
          ))}
        </>
      );
    case "tamanoBoton":
      return (
        <>
          {ORDEN_TAMANOS_BOTON.map((tamano) => (
            <OpcionPreferencia
              key={tamano}
              etiqueta={TAMANOS_BOTON[tamano].etiqueta}
              elegida={p.tamanoBoton === tamano}
              onPress={() => cambiar({ tamanoBoton: tamano })}
            />
          ))}
        </>
      );
    case "forma":
      return (
        <>
          {ORDEN_FORMAS.map((forma) => (
            <OpcionPreferencia
              key={forma}
              etiqueta={FORMAS_BOTON[forma].etiqueta}
              elegida={p.forma === forma}
              onPress={() => cambiar({ forma })}
            />
          ))}
        </>
      );
    case "tareasVisibles":
      return (
        <>
          {ORDEN_TAREAS_VISIBLES.map((t) => (
            <OpcionPreferencia
              key={t}
              etiqueta={TAREAS_VISIBLES[t].etiqueta}
              elegida={p.tareasVisibles === t}
              onPress={() => cambiar({ tareasVisibles: t })}
            />
          ))}
        </>
      );
    case "reloj":
      return (
        <>
          {ORDEN_VER_RELOJ.map((r) => (
            <OpcionPreferencia
              key={r}
              etiqueta={VER_RELOJ[r].etiqueta}
              elegida={p.reloj === r}
              onPress={() => cambiar({ reloj: r })}
            />
          ))}
        </>
      );
    case "necesidades":
      // Se pueden elegir varias; la última que queda no se puede quitar (Ayuda nunca sale vacía).
      return (
        <>
          {ORDEN_NECESIDADES_AYUDA.map((n) => {
            const elegida = p.necesidades.includes(n);
            const opcion = OPCIONES_NECESIDADES_BASICAS.find((o) => o.clave === n)!;
            return (
              <OpcionPreferencia
                key={n}
                multiple
                testID={`necesidad-${n}`}
                etiqueta={NECESIDADES_AYUDA[n].etiqueta}
                elegida={elegida}
                onPress={() => {
                  if (elegida && p.necesidades.length === 1) return;
                  cambiar({
                    necesidades: elegida
                      ? p.necesidades.filter((x) => x !== n)
                      : [...p.necesidades, n],
                  });
                }}
                muestra={
                  <PictogramaTarea
                    tarea={{
                      titulo: opcion.etiqueta,
                      emoji: opcion.simbolo,
                      pictograma_url: opcion.urlPictograma,
                    }}
                    tam={56}
                  />
                }
              />
            );
          })}
        </>
      );
  }
}

/** Dibujo pequeño de cada apartado en el menú: se ve lo elegido sin tener que leer. */
function MuestraApartado({
  apartado,
  preferencias: p,
}: {
  apartado: Apartado;
  preferencias: PreferenciasApariencia;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  let contenido: ReactNode;
  switch (apartado) {
    case "canal":
      contenido = (
        <View style={e.filaMuestra}>
          {p.canal !== "soloTexto" ? <PictogramaTarea tarea={PICTOGRAMA_MUESTRA} tam={44} /> : null}
          {p.canal !== "soloPictograma" ? <Text style={e.letrasMuestra}>Aa</Text> : null}
        </View>
      );
      break;
    case "tema": {
      const paleta = TEMAS[p.tema].paleta;
      contenido = (
        <View
          style={[e.muestraColor, { backgroundColor: paleta.fondo, borderColor: paleta.borde }]}
        >
          <Text style={[e.textoMuestra, { color: paleta.primario }]}>Aa</Text>
        </View>
      );
      break;
    }
    case "fuente":
      contenido = (
        <Text style={[e.letrasMuestra, { fontFamily: FUENTES[p.fuente].familiaNegrita }]}>Aa</Text>
      );
      break;
    case "caja":
      contenido = (
        <Text style={[e.letrasMuestra, TAL_CUAL]}>{p.caja === "mayusculas" ? "AA" : "Aa"}</Text>
      );
      break;
    case "tamanoLetra":
      contenido = (
        <Text
          escalar={false}
          style={[e.letrasMuestra, { fontSize: 30 * TAMANOS_LETRA[p.tamanoLetra].escala }]}
        >
          A
        </Text>
      );
      break;
    case "tamanoBoton":
    case "forma": {
      const escala = TAMANOS_BOTON[p.tamanoBoton].escala;
      contenido = (
        <View
          style={[
            e.botonMuestra,
            {
              width: 64 * escala,
              height: 36 * escala,
              borderRadius: Math.min(FORMAS_BOTON[p.forma].radioBoton, 18 * escala),
            },
          ]}
        />
      );
      break;
    }
    case "tareasVisibles": {
      const n = p.tareasVisibles === "una" ? 1 : p.tareasVisibles === "tres" ? 3 : 5;
      contenido = (
        <View style={e.filaMuestra}>
          {Array.from({ length: n }, (_, i) => (
            <View key={i} style={[e.cuadroTarea, { borderColor: colores.borde }]} />
          ))}
        </View>
      );
      break;
    }
    case "reloj":
      contenido = (
        <View style={e.filaMuestra}>
          <Icono
            nombre="reloj"
            color={p.reloj === "si" ? colores.primario : colores.textoSecundario}
            tam={40}
          />
          {p.reloj === "no" ? (
            <Icono nombre="cerrar" color={colores.textoSecundario} tam={28} grosor={3} />
          ) : null}
        </View>
      );
      break;
    case "necesidades":
      contenido = (
        <View style={e.filaMuestra}>
          {OPCIONES_NECESIDADES_BASICAS.filter((o) => p.necesidades.includes(o.clave)).map((o) => (
            <PictogramaTarea
              key={o.clave}
              tarea={{ titulo: o.etiqueta, emoji: o.simbolo, pictograma_url: o.urlPictograma }}
              tam={40}
            />
          ))}
        </View>
      );
      break;
  }
  return (
    <View
      style={e.muestra}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {contenido}
    </View>
  );
}

/** «Así se ve»: la tarjeta de «Ahora» (o los bloques del día) con lo elegido, al momento (RF3.15). */
function VistaPrevia({ apartado }: { apartado: Apartado }) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { preferencias, estilos } = usePreferencias();
  const verDibujo = preferencias.canal === "ambos" || preferencias.canal === "soloPictograma";
  const verTexto = preferencias.canal === "ambos" || preferencias.canal === "soloTexto";

  return (
    <View style={e.columnaPrevia}>
      <Text style={e.leyenda}>Así se ve</Text>
      <View
        accessibilityLabel="Vista previa de la agenda con tus elecciones"
        style={[e.vistaPrevia, { borderRadius: estilos.radioTarjeta }]}
      >
        {apartado === "tareasVisibles" ? (
          <BloquesMuestra />
        ) : apartado === "reloj" ? (
          <RelojMuestra />
        ) : apartado === "necesidades" ? (
          <AyudaMuestra />
        ) : (
          <>
            <View style={[e.tareaAhora, { borderRadius: estilos.radioTarjeta }]}>
              <Text
                escalar={false}
                style={{
                  color: colores.primario,
                  fontFamily: estilos.fuenteNegrita,
                  fontSize: estilos.texto(16),
                  fontWeight: "700",
                }}
              >
                Ahora
              </Text>
              <View style={e.filaContenidoTarea}>
                {verDibujo && (
                  <View
                    testID="preview-pictograma"
                    style={[
                      e.cajaPictograma,
                      {
                        width: preferencias.canal === "soloPictograma" ? 96 : 68,
                        height: preferencias.canal === "soloPictograma" ? 96 : 68,
                      },
                    ]}
                  >
                    <PictogramaTarea
                      tarea={PICTOGRAMA_MUESTRA}
                      tam={preferencias.canal === "soloPictograma" ? 88 : 62}
                    />
                  </View>
                )}
                {verTexto && (
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      escalar={false}
                      testID="preview-titulo-texto"
                      style={{
                        color: colores.texto,
                        fontFamily: estilos.fuenteNegrita,
                        fontSize:
                          preferencias.canal === "soloTexto"
                            ? estilos.texto(26)
                            : estilos.texto(22),
                        fontWeight: "700",
                      }}
                    >
                      Lavarse las manos
                    </Text>
                    <Text
                      escalar={false}
                      testID="preview-descripcion-texto"
                      style={{
                        color: colores.textoSecundario,
                        fontFamily: estilos.fuenteNormal,
                        fontSize: estilos.tamanoTexto,
                      }}
                    >
                      Usa agua y jabón.
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={e.botonesVista}>
              <BotonAccesible etiqueta="Empezar" onPress={() => {}} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

/** Muestra de «Tareas que se ven»: Hecho | Ahora | Después con 1, 3 o muchas tarjetas. */
function BloquesMuestra() {
  const e = useEstilos(crearEstilos);
  const { preferencias } = usePreferencias();
  const n =
    preferencias.tareasVisibles === "una" ? 1 : preferencias.tareasVisibles === "tres" ? 3 : 6;
  const columna = (titulo: string) => (
    <View style={e.columnaBloque}>
      <Text style={e.tituloBloque}>{titulo}</Text>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={[e.tarjetaBloque, n > 3 ? e.tarjetaBloqueBaja : null]}
          testID={`muestra-${titulo}-${i}`}
        />
      ))}
    </View>
  );
  return (
    <View style={e.bloquesMuestra}>
      {columna("Hecho")}
      <View style={[e.columnaBloque, e.columnaAhora]}>
        <Text style={[e.tituloBloque, e.tituloAhora]}>Ahora</Text>
        <PictogramaTarea tarea={PICTOGRAMA_MUESTRA} tam={72} />
      </View>
      {columna("Después")}
    </View>
  );
}

/** Muestra de «Reloj en la tarea»: la tarea con su reloj pequeño, o sin él. */
function RelojMuestra() {
  const e = useEstilos(crearEstilos);
  const { preferencias } = usePreferencias();
  return (
    <View style={e.relojMuestra}>
      <PictogramaTarea tarea={PICTOGRAMA_MUESTRA} tam={150} />
      {preferencias.reloj === "si" ? (
        <View testID="muestra-reloj">
          <RelojVisual
            duracionMs={10 * 60_000}
            transcurridoMs={4 * 60_000}
            tamano={110}
            sonidoAlTerminar={false}
            parpadeoAlTerminar={false}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Muestra de «Qué puede pedir en Ayuda»: las necesidades elegidas y «Urgencia», siempre. */
function AyudaMuestra() {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { preferencias } = usePreferencias();
  return (
    <View style={e.ayudaMuestra}>
      <View style={e.filaMuestra}>
        {OPCIONES_NECESIDADES_BASICAS.filter((o) => preferencias.necesidades.includes(o.clave)).map(
          (o) => (
            <View key={o.clave} style={e.necesidadMuestra} testID={`muestra-necesidad-${o.clave}`}>
              <PictogramaTarea
                tarea={{ titulo: o.etiqueta, emoji: o.simbolo, pictograma_url: o.urlPictograma }}
                tam={64}
              />
              <Text style={e.textoNecesidadMuestra} numberOfLines={1}>
                {NECESIDADES_AYUDA[o.clave].etiqueta}
              </Text>
            </View>
          ),
        )}
      </View>
      <View style={[e.urgenciaMuestra, { backgroundColor: colores.peligro }]}>
        <Icono nombre="alerta" color={colorSobre(colores.peligro)} tam={24} grosor={3} />
        <Text style={[e.textoUrgenciaMuestra, { color: colorSobre(colores.peligro) }]}>
          Urgencia
        </Text>
      </View>
    </View>
  );
}

/** Pictograma de ARASAAC de la vista previa (el mismo de «Lavarse las manos» en la agenda). */
const PICTOGRAMA_MUESTRA = {
  titulo: "Lavarse las manos",
  emoji: "🧼",
  pictograma_url: urlImagenPictograma(8975, 300),
};

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    // Menú
    menu: { flex: 1, padding: 20, gap: 16, justifyContent: "center" },
    pregunta: { fontSize: 26, fontWeight: "700", color: c.texto },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    tarjeta: {
      // Cinco por fila: los diez apartados caben en dos filas, sin scroll.
      flexBasis: "18%",
      flexGrow: 1,
      minHeight: 176,
      padding: 14,
      gap: 8,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    pulsado: { opacity: 0.85 },
    tituloTarjeta: { fontSize: 19, fontWeight: "700", color: c.texto },
    filaValor: { flexDirection: "row", alignItems: "center", gap: 6 },
    valorTarjeta: { flexShrink: 1, fontSize: 17, color: c.textoSecundario, fontWeight: "700" },
    muestra: { height: 56, justifyContent: "center" },
    filaMuestra: { flexDirection: "row", alignItems: "center", gap: 8 },
    letrasMuestra: { fontSize: 30, fontWeight: "700", color: c.primario },
    botonMuestra: { backgroundColor: c.primario },
    cuadroTarea: { width: 16, height: 30, borderRadius: 4, borderWidth: 2 },
    botonRestablecer: { alignSelf: "flex-start" },
    // Apartado
    apartado: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      alignContent: "center",
      justifyContent: "center",
      gap: 32,
      padding: 20,
    },
    columnaOpciones: { flexBasis: 440, flexGrow: 1, maxWidth: 560, gap: 18 },
    ayuda: { fontSize: 22, color: c.texto },
    opciones: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    muestraColor: {
      width: 72,
      height: 48,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    textoMuestra: { fontSize: 22, fontWeight: "700" },
    muestraCaja: { fontSize: 24, fontWeight: "700", color: c.primario },
    columnaPrevia: { flexBasis: 340, flexGrow: 1, maxWidth: 420, gap: 10 },
    leyenda: { fontSize: 20, fontWeight: "700", color: c.texto },
    vistaPrevia: {
      borderWidth: 3,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      padding: 16,
      gap: 16,
    },
    tareaAhora: {
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
      padding: 14,
      gap: 6,
    },
    filaContenidoTarea: { flexDirection: "row", alignItems: "center", gap: 14 },
    cajaPictograma: {
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    botonesVista: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    // Muestra de «Tareas que se ven»
    bloquesMuestra: { flexDirection: "row", gap: 8, height: 250 },
    columnaBloque: {
      flex: 1,
      gap: 6,
      padding: 6,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.fondo,
    },
    columnaAhora: {
      flex: 2,
      alignItems: "center",
      justifyContent: "center",
      borderColor: c.primario,
      borderWidth: 3,
      backgroundColor: c.superficieDestacada,
    },
    tituloBloque: { fontSize: 15, fontWeight: "700", color: c.texto },
    tituloAhora: { color: c.primario },
    tarjetaBloque: {
      height: 52,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    tarjetaBloqueBaja: { height: 26 },
    // Muestras de «Reloj» y «Ayuda»
    relojMuestra: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      minHeight: 200,
    },
    ayudaMuestra: { gap: 12, alignItems: "center", minHeight: 200, justifyContent: "center" },
    necesidadMuestra: {
      alignItems: "center",
      gap: 4,
      padding: 8,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.fondo,
    },
    textoNecesidadMuestra: { fontSize: 16, fontWeight: "700", color: c.texto },
    urgenciaMuestra: {
      alignSelf: "stretch",
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 10,
    },
    textoUrgenciaMuestra: { fontSize: 18, fontWeight: "700" },
  });
