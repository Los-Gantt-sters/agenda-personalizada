// Panel de preferencias de apariencia (SCRUM-240 · MOD HU-04: Pantallas 16, 16b, 17, 18, 19, 22, 24, 25 y 26).
// Reproduce exactamente los bocetos de BOCETOS_NUEVOS/definitiva_v2/pantallas/16.html..26.html:
// - Menú 16 (y 16b en mayúsculas) con las tarjetas agrupadas («Qué se ve en tareas», «Fondo y colores»,
//   «Texto y tipografía», «Botones (tamaño y forma)», «Agenda (día / semana)», «Reloj en la tarea»,
//   «Ayuda (máximo 3)» y «Barrido por pulsadores») + botón «Volver a lo de siempre».
// - Todas las opciones (incluidas 17, 24, 25, 26 y Barrido) viven en PreferenciasProvider (y
//   MotorBarridoProvider), por lo que se mantienen en memoria al salir de /preferencias y se aplican en la app.
// - Al entrar en cada apartado, los cambios se previsualizan al momento en «Así se ve» sobre un
//   borrador temporal:
//   * El botón inferior «Atrás» vuelve al menú 16 SIN guardar los cambios del borrador.
//   * El botón inferior «Guardar cambios» confirma y guarda los cambios en PreferenciasProvider y
//     vuelve al menú 16.
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import {
  ETIQUETAS_MODO_BARRIDO,
  VELOCIDADES_BARRIDO_MS,
  type ModoBarridoPulsador,
} from "../componentes/barrido-pulsadores/tiposBarrido";
import { Pantalla } from "../pantalla/Pantalla";
import { TEMAS, type NombreTema, type Paleta } from "../temas";
import { Icono, type NombreIcono } from "../ui/Icono";
import { Texto as Text } from "../ui/Texto";
import { useApariencia, useEstilos } from "../ui/apariencia";
import { usePreferencias } from "./PreferenciasProvider";
import { SubpantallaAyuda26 } from "./SubpantallaAyuda26";
import {
  BotonOpcionBoceto,
  MuestraApartado16,
  VistaPreviaEnVivo,
  type ApartadoPreferencias16,
} from "./VistaPreviaPreferencias";
import {
  AVISO_PREVIO_25,
  CAJAS_LETRA,
  FORMAS_BOTON,
  FORMATOS_VISUALES_17,
  FUENTES,
  LOCUCIONES_AUDIO_17,
  ORDEN_CAJAS_LETRA,
  ORDEN_FORMAS,
  ORDEN_FUENTES,
  ORDEN_TAMANOS_BOTON,
  ORDEN_TAMANOS_LETRA,
  ORDEN_TAREAS_VISIBLES,
  ORDEN_VER_RELOJ,
  ORDEN_VISTAS_AGENDA,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
  TAREAS_VISIBLES,
  VER_RELOJ,
  VISTAS_AGENDA,
  moverTareasVisibles,
  type AvisoPrevio25,
  type FormatoVisualTarea17,
  type LocucionAudio17,
  type PreferenciasApariencia,
} from "./opciones";

export type { ApartadoPreferencias16 };

const APARTADOS_MENU_16: {
  clave: ApartadoPreferencias16;
  codigoPantalla: string;
  titulo: string;
  tituloPantalla: string;
  subtitulo: string;
  icono: NombreIcono;
}[] = [
  {
    clave: "queSeVe17",
    codigoPantalla: "17",
    titulo: "Qué se ve en tareas",
    tituloPantalla: "Qué se ve en las tareas",
    subtitulo: "Configura por separado el formato visual inicial y la locución automática.",
    icono: "imagen",
  },
  {
    clave: "fondoColores18",
    codigoPantalla: "18",
    titulo: "Fondo y colores",
    tituloPantalla: "Fondo y colores",
    subtitulo: "Separa la paleta de color base y el modo de alto contraste.",
    icono: "paleta",
  },
  {
    clave: "textoTipografia19",
    codigoPantalla: "19",
    titulo: "Texto y tipografía",
    tituloPantalla: "Texto y tipografía",
    subtitulo: "Tres categorías diferenciadas: fuente, tamaño de letra y caja de texto.",
    icono: "lista",
  },
  {
    clave: "botones22",
    codigoPantalla: "22",
    titulo: "Botones (tamaño y forma)",
    tituloPantalla: "Botones (tamaño y forma)",
    subtitulo: "Diferencia claramente la categoría de Tamaño y la categoría de Forma.",
    icono: "accesibilidad",
  },
  {
    clave: "agenda24",
    codigoPantalla: "24",
    titulo: "Agenda (día / semana)",
    tituloPantalla: "Agenda (vistas y tareas visibles)",
    subtitulo: "Diferencia la vista temporal permitida y la cantidad de tareas en pantalla.",
    icono: "calendario",
  },
  {
    clave: "reloj25",
    codigoPantalla: "25",
    titulo: "Reloj en la tarea",
    tituloPantalla: "Reloj en la tarea",
    subtitulo: "Diferencia la visibilidad del reloj superior y el aviso previo de cambio.",
    icono: "reloj",
  },
  {
    clave: "ayuda26",
    codigoPantalla: "26",
    titulo: "Ayuda (máximo 3)",
    tituloPantalla: "Ayuda: qué puede pedir (máximo 3)",
    subtitulo: "Elige hasta 3 pictogramas de ayuda de ARASAAC o de Mi biblioteca propia.",
    icono: "campana",
  },
  {
    clave: "barridoPulsadores",
    codigoPantalla: "05",
    titulo: "Barrido por pulsadores",
    tituloPantalla: "Barrido por pulsadores (movilidad reducida)",
    subtitulo: "Configura el barrido visual con foco grueso y la velocidad para 1 o 2 pulsadores.",
    icono: "accesibilidad",
  },
];

function resumenApartado16(clave: ApartadoPreferencias16, p: PreferenciasApariencia): string {
  switch (clave) {
    case "queSeVe17":
      return FORMATOS_VISUALES_17[p.formatoTarea].resumenMenu;
    case "fondoColores18": {
      if (p.tema === "altoContrasteClaro") return "Contraste claro";
      if (p.tema === "altoContrasteOscuro") return "Contraste oscuro";
      return `${TEMAS[p.tema].etiqueta} · Sin contraste`;
    }
    case "textoTipografia19": {
      const nombreFuente = p.fuente === "andika" ? "Escolar" : FUENTES[p.fuente].etiqueta;
      return `${nombreFuente} · ${TAMANOS_LETRA[p.tamanoLetra].etiqueta} · ${CAJAS_LETRA[p.caja].resumenMenu}`;
    }
    case "botones22":
      return `${TAMANOS_BOTON[p.tamanoBoton].etiquetaBoceto} · ${FORMAS_BOTON[p.forma].etiqueta}`;
    case "agenda24":
      return `${VISTAS_AGENDA[p.vistaAgenda].resumenMenu} · ${TAREAS_VISIBLES[p.tareasVisibles].resumenMenu}`;
    case "reloj25":
      return `${VER_RELOJ[p.reloj].etiqueta} · ${AVISO_PREVIO_25[p.avisoPrevio].resumenMenu}`;
    case "ayuda26":
      return `${p.ayudas.length} ayudas (máx. 3)`;
    case "barridoPulsadores":
      return ETIQUETAS_MODO_BARRIDO[p.modoBarrido].titulo;
  }
}

export function PanelPreferencias() {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const { preferencias, cambiar, restablecer } = usePreferencias();

  const [abierto, setAbierto] = useState<ApartadoPreferencias16 | null>(null);
  const [borrador, setBorrador] = useState<PreferenciasApariencia | null>(null);
  const [busquedaAyuda26, setBusquedaAyuda26] = useState<string>("");

  const abrirApartado = (clave: ApartadoPreferencias16) => {
    setBorrador({
      ...preferencias,
      necesidades: [...preferencias.necesidades],
      ayudas: [...preferencias.ayudas],
    });
    setBusquedaAyuda26("");
    setAbierto(clave);
  };

  // «Atrás»: vuelve al menú 16 SIN guardar los cambios hechos en el borrador
  const cancelarYVolverAlMenu16 = () => {
    setBorrador(null);
    setAbierto(null);
  };

  // «Guardar cambios»: confirma y guarda el borrador en PreferenciasProvider y vuelve al menú 16
  const guardarCambiosYVolverAlMenu16 = () => {
    if (borrador) {
      cambiar(borrador);
    }
    setBorrador(null);
    setAbierto(null);
  };

  // ---- Pantalla 16 / 16b: Menú principal de Preferencias ----
  if (!abierto || !borrador) {
    return (
      <Pantalla
        titulo="Preferencias · Alejandro"
        simbolo={<Icono nombre="paleta" color={colores.primario} tam={32} />}
      >
        <View style={e.menu}>
          <View style={e.cabeceraMenu16}>
            <Text accessibilityRole="header" style={e.pregunta}>
              ¿Qué quieres configurar?
            </Text>
            <Text style={e.notaMenu16}>El botón Preferencias redirige siempre aquí (16)</Text>
          </View>

          <View style={e.rejilla} testID="menu-preferencias">
            {APARTADOS_MENU_16.map((a) => {
              const valor = resumenApartado16(a.clave, preferencias);
              return (
                <Pressable
                  key={a.clave}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.titulo}: ${valor}`}
                  testID={`apartado-${a.clave}`}
                  onPress={() => abrirApartado(a.clave)}
                  style={({ pressed }) => [e.tarjeta, pressed && e.pulsado]}
                >
                  <MuestraApartado16 apartado={a.clave} preferencias={preferencias} />
                  <View style={e.bloqueTextoTarjeta}>
                    <Text style={e.tituloTarjeta} numberOfLines={2}>
                      {a.titulo}
                    </Text>
                    <View style={e.filaValor}>
                      <Icono nombre="check" color={colores.exito} tam={16} grosor={3} />
                      <Text style={e.valorTarjeta} numberOfLines={1}>
                        {valor}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            testID="btn-restablecer-preferencias"
            accessibilityRole="button"
            accessibilityLabel="Volver a lo de siempre"
            onPress={restablecer}
            style={({ pressed }) => [e.botonVolverSiempre, pressed && e.pulsado]}
          >
            <Text style={e.textoVolverSiempre}>↺ Volver a lo de siempre</Text>
          </Pressable>
        </View>
      </Pantalla>
    );
  }

  // ---- Subpantallas 17, 18, 19, 22, 24, 25, 26 y Barrido ----
  const actual = APARTADOS_MENU_16.find((a) => a.clave === abierto)!;

  const actualizarBorrador = (cambios: Partial<PreferenciasApariencia>) => {
    setBorrador((prev) => (prev ? { ...prev, ...cambios } : prev));
  };

  return (
    <Pantalla
      titulo={actual.tituloPantalla}
      simbolo={<Icono nombre={actual.icono} color={colores.primario} tam={32} />}
      alAtras={cancelarYVolverAlMenu16}
      etiquetaAtras="Atrás: volver sin guardar cambios"
      alAdelante={guardarCambiosYVolverAlMenu16}
      textoAdelante="Guardar cambios"
      etiquetaAdelante="Guardar cambios y volver a Preferencias"
    >
      {abierto === "ayuda26" ? (
        <SubpantallaAyuda26
          borrador={borrador}
          busqueda={busquedaAyuda26}
          onChangeBusqueda={setBusquedaAyuda26}
          actualizarBorrador={actualizarBorrador}
          alGuardar={guardarCambiosYVolverAlMenu16}
        />
      ) : (
        <View style={e.apartado}>
          <View style={e.columnaOpciones}>
            <Text style={e.ayuda}>{actual.subtitulo}</Text>
            <TarjetasCategoriasSubpantalla
              apartado={abierto}
              borrador={borrador}
              actualizarBorrador={actualizarBorrador}
            />
          </View>
          <VistaPreviaEnVivo apartado={abierto} borrador={borrador} />
        </View>
      )}
    </Pantalla>
  );
}

/** Tarjetas de opciones de las subpantallas 17, 18, 19, 22, 24, 25 y Barrido (sin etiquetas "Categoría"). */
function TarjetasCategoriasSubpantalla({
  apartado,
  borrador: p,
  actualizarBorrador,
}: {
  apartado: ApartadoPreferencias16;
  borrador: PreferenciasApariencia;
  actualizarBorrador: (c: Partial<PreferenciasApariencia>) => void;
}) {
  const e = useEstilos(crearEstilos);

  switch (apartado) {
    // ---- Pantalla 17: Qué se ve en las tareas (17.html) ----
    case "queSeVe17": {
      const formatos: FormatoVisualTarea17[] = [
        "pictograma",
        "textoFacil",
        "fotoReal",
        "video",
        "soloPictograma",
      ];
      const locuciones: LocucionAudio17[] = ["automatica", "manual"];
      return (
        <View style={e.contenedorTarjetasSub} testID="opciones-queSeVe17">
          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Formato visual por defecto</Text>
              <Text style={e.subtituloTarjetaCat}>Al abrir cada paso</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Formato visual por defecto"
            >
              {formatos.map((fmt) => (
                <BotonOpcionBoceto
                  key={fmt}
                  testID={`opcion-formato17-${fmt}`}
                  etiqueta={FORMATOS_VISUALES_17[fmt].etiqueta}
                  activo={p.formatoTarea === fmt}
                  onPress={() =>
                    actualizarBorrador({
                      formatoTarea: fmt,
                      canal: FORMATOS_VISUALES_17[fmt].canalAsociado,
                    })
                  }
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Locución de audio</Text>
              <Text style={e.subtituloTarjetaCat}>Apoyo auditivo del paso</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Locución de audio"
            >
              {locuciones.map((loc) => (
                <BotonOpcionBoceto
                  key={loc}
                  testID={`opcion-locucion17-${loc}`}
                  etiqueta={LOCUCIONES_AUDIO_17[loc].etiqueta}
                  activo={p.locucion === loc}
                  onPress={() => actualizarBorrador({ locucion: loc })}
                />
              ))}
            </View>
          </View>
        </View>
      );
    }

    // ---- Pantalla 18: Fondo y colores (18.html) ----
    case "fondoColores18": {
      const temasBase: { clave: NombreTema; etiqueta: string; fondo: string; texto: string }[] = [
        { clave: "claro", etiqueta: "Claro", fondo: "#FFFFFF", texto: "#7A1F4D" },
        { clave: "oscuro", etiqueta: "Oscuro", fondo: "#11161F", texto: "#78A8FF" },
        { clave: "pastel", etiqueta: "Pastel", fondo: "#E3F1E9", texto: "#1E7A46" },
      ];
      const esAltoContraste = p.tema === "altoContrasteClaro" || p.tema === "altoContrasteOscuro";

      return (
        <View style={e.contenedorTarjetasSub} testID="opciones-fondoColores18">
          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Tema de color principal</Text>
              <Text style={e.subtituloTarjetaCat}>Paleta general</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Tema de color principal"
            >
              {temasBase.map((t) => (
                <BotonOpcionBoceto
                  key={t.clave}
                  testID={`opcion-tema-${t.clave}`}
                  etiqueta={t.etiqueta}
                  activo={p.tema === t.clave}
                  onPress={() => actualizarBorrador({ tema: t.clave })}
                  insigniaIzquierda={
                    <View
                      style={[e.insigniaAa, { backgroundColor: t.fondo, borderColor: "#C9CED6" }]}
                    >
                      <Text style={[e.textoInsigniaAa, { color: t.texto }]}>Aa</Text>
                    </View>
                  }
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Modo de alto contraste</Text>
              <Text style={e.subtituloTarjetaCat}>Para baja visión</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Modo de alto contraste"
            >
              <BotonOpcionBoceto
                testID="opcion-contraste-estandar"
                etiqueta="Estándar (sin contraste extra)"
                activo={!esAltoContraste}
                onPress={() => {
                  if (esAltoContraste) actualizarBorrador({ tema: "claro" });
                }}
              />
              <BotonOpcionBoceto
                testID="opcion-tema-altoContrasteClaro"
                etiqueta="Contraste claro"
                activo={p.tema === "altoContrasteClaro"}
                onPress={() => actualizarBorrador({ tema: "altoContrasteClaro" })}
                insigniaIzquierda={
                  <View
                    style={[
                      e.insigniaAa,
                      { backgroundColor: "#FFFFFF", borderColor: "#000000", borderWidth: 2 },
                    ]}
                  >
                    <Text style={[e.textoInsigniaAa, { color: "#0000CC" }]}>Aa</Text>
                  </View>
                }
              />
              <BotonOpcionBoceto
                testID="opcion-tema-altoContrasteOscuro"
                etiqueta="Contraste oscuro"
                activo={p.tema === "altoContrasteOscuro"}
                onPress={() => actualizarBorrador({ tema: "altoContrasteOscuro" })}
                insigniaIzquierda={
                  <View
                    style={[e.insigniaAa, { backgroundColor: "#000000", borderColor: "#000000" }]}
                  >
                    <Text style={[e.textoInsigniaAa, { color: "#FFD400" }]}>Aa</Text>
                  </View>
                }
              />
            </View>
          </View>
        </View>
      );
    }

    // ---- Pantalla 19: Texto y tipografía (19.html) ----
    case "textoTipografia19":
      return (
        <View style={e.contenedorTarjetasSub} testID="opciones-textoTipografia19">
          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Tipo de letra (Fuente)</Text>
              <Text style={e.subtituloTarjetaCat}>Tipografía</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Tipo de letra (Fuente)"
            >
              {ORDEN_FUENTES.map((fuente) => (
                <BotonOpcionBoceto
                  key={fuente}
                  testID={`opcion-fuente-${fuente}`}
                  etiqueta={FUENTES[fuente].etiquetaBoceto}
                  activo={p.fuente === fuente}
                  onPress={() => actualizarBorrador({ fuente })}
                  insigniaIzquierda={
                    <Text
                      style={{
                        fontFamily: FUENTES[fuente].familiaNegrita,
                        fontSize: 20,
                        fontWeight: "700",
                        color: "#7A1F4D",
                      }}
                    >
                      Aa
                    </Text>
                  }
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Tamaño de la letra</Text>
              <Text style={e.subtituloTarjetaCat}>Escala de texto</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Tamaño de la letra"
            >
              {ORDEN_TAMANOS_LETRA.map((tam) => (
                <BotonOpcionBoceto
                  key={tam}
                  testID={`opcion-tamanoLetra-${tam}`}
                  etiqueta={TAMANOS_LETRA[tam].etiqueta}
                  activo={p.tamanoLetra === tam}
                  onPress={() => actualizarBorrador({ tamanoLetra: tam })}
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Mayúsculas o minúsculas</Text>
              <Text style={e.subtituloTarjetaCat}>Caja tipográfica</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Mayúsculas o minúsculas"
            >
              {ORDEN_CAJAS_LETRA.map((caja) => (
                <BotonOpcionBoceto
                  key={caja}
                  testID={`opcion-caja-${caja}`}
                  etiqueta={CAJAS_LETRA[caja].etiquetaBoceto}
                  activo={p.caja === caja}
                  onPress={() => actualizarBorrador({ caja })}
                  forzarTextoTalCual
                />
              ))}
            </View>
          </View>
        </View>
      );

    // ---- Pantalla 22: Botones (tamaño y forma) (22.html) ----
    case "botones22":
      return (
        <View style={e.contenedorTarjetasSub} testID="opciones-botones22">
          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Tamaño de los botones</Text>
              <Text style={e.subtituloTarjetaCat}>Altura y área táctil</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Tamaño de los botones"
            >
              {ORDEN_TAMANOS_BOTON.map((tam) => (
                <BotonOpcionBoceto
                  key={tam}
                  testID={`opcion-tamanoBoton-${tam}`}
                  etiqueta={TAMANOS_BOTON[tam].etiquetaBoceto}
                  activo={p.tamanoBoton === tam}
                  onPress={() => actualizarBorrador({ tamanoBoton: tam })}
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Forma de las esquinas</Text>
              <Text style={e.subtituloTarjetaCat}>Contorno visual</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Forma de las esquinas"
            >
              {ORDEN_FORMAS.map((forma) => (
                <BotonOpcionBoceto
                  key={forma}
                  testID={`opcion-forma-${forma}`}
                  etiqueta={FORMAS_BOTON[forma].etiqueta}
                  activo={p.forma === forma}
                  onPress={() => actualizarBorrador({ forma })}
                />
              ))}
            </View>
          </View>
        </View>
      );

    // ---- Pantalla 24: Agenda (vistas y tareas visibles) unificada con HU-17 y SCRUM-251 (24.html) ----
    case "agenda24": {
      const enMinimo = p.tareasVisibles === ORDEN_TAREAS_VISIBLES[0];
      const enMaximo = p.tareasVisibles === ORDEN_TAREAS_VISIBLES[ORDEN_TAREAS_VISIBLES.length - 1];

      return (
        <View style={e.contenedorTarjetasSub} testID="opciones-agenda24">
          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>
                Pantalla inicial tras login (según nivel cognitivo)
              </Text>
              <Text style={e.subtituloTarjetaCat}>Destino al entrar el alumno</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Pantalla inicial tras login"
            >
              {ORDEN_VISTAS_AGENDA.map((vista) => (
                <BotonOpcionBoceto
                  key={vista}
                  testID={`vista-agenda-${vista}`}
                  etiqueta={VISTAS_AGENDA[vista].etiquetaBoceto}
                  activo={p.vistaAgenda === vista}
                  onPress={() => actualizarBorrador({ vistaAgenda: vista })}
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Cantidad de tareas visibles</Text>
              <Text style={e.subtituloTarjetaCat}>Carga visual por columna (botones + y −)</Text>
            </View>
            <View style={e.filaStepper24}>
              <Pressable
                testID="btn-menos-tareas"
                accessibilityRole="button"
                accessibilityLabel="Menos tareas"
                accessibilityState={{ disabled: enMinimo }}
                disabled={enMinimo}
                onPress={() =>
                  actualizarBorrador({
                    tareasVisibles: moverTareasVisibles(p.tareasVisibles, -1),
                  })
                }
                style={[e.botonStepperNeutro, enMinimo && e.botonStepperApagado]}
              >
                <Text style={e.textoStepperNeutro}>−</Text>
              </Pressable>

              <View testID="valor-tareas-visibles" style={e.campoValorStepper24}>
                <Text style={e.textoValorStepper24}>
                  {TAREAS_VISIBLES[p.tareasVisibles].etiquetaStepper}
                </Text>
              </View>

              <Pressable
                testID="btn-mas-tareas"
                accessibilityRole="button"
                accessibilityLabel="Más tareas"
                accessibilityState={{ disabled: enMaximo }}
                disabled={enMaximo}
                onPress={() =>
                  actualizarBorrador({
                    tareasVisibles: moverTareasVisibles(p.tareasVisibles, 1),
                  })
                }
                style={[e.botonStepperPrimario, enMaximo && e.botonStepperApagado]}
              >
                <Text style={e.textoStepperPrimario}>+</Text>
              </Pressable>

              <Text style={e.ayudaStepper24}>Sumar de 1 a 5 con + y − (después de 5: «Todas»)</Text>
            </View>
          </View>
        </View>
      );
    }

    // ---- Pantalla 25: Reloj en la tarea (25.html) ----
    case "reloj25":
      return (
        <View style={e.contenedorTarjetasSub} testID="opciones-reloj25">
          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Reloj visual encima del paso</Text>
              <Text style={e.subtituloTarjetaCat}>Indicador de tiempo</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Reloj visual encima del paso"
            >
              {ORDEN_VER_RELOJ.map((r) => (
                <BotonOpcionBoceto
                  key={r}
                  testID={`opcion-reloj25-${r}`}
                  etiqueta={VER_RELOJ[r].etiquetaBoceto}
                  activo={p.reloj === r}
                  onPress={() => actualizarBorrador({ reloj: r })}
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Aviso previo de cambio</Text>
              <Text style={e.subtituloTarjetaCat}>Transición de actividad</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Aviso previo de cambio"
            >
              {(["si", "no"] as AvisoPrevio25[]).map((av) => (
                <BotonOpcionBoceto
                  key={av}
                  testID={`opcion-aviso25-${av}`}
                  etiqueta={AVISO_PREVIO_25[av].etiqueta}
                  activo={p.avisoPrevio === av}
                  onPress={() => actualizarBorrador({ avisoPrevio: av })}
                />
              ))}
            </View>
          </View>
        </View>
      );

    // ---- Pantalla extra: Barrido por pulsadores (HU-05 / SCRUM-119) ----
    case "barridoPulsadores": {
      const idxVel = VELOCIDADES_BARRIDO_MS.indexOf(p.intervaloBarridoMs);
      const enMinVel = idxVel <= 0;
      const enMaxVel = idxVel >= VELOCIDADES_BARRIDO_MS.length - 1;
      const cambiarVel = (delta: -1 | 1) => {
        const nuevoIdx = Math.max(0, Math.min(VELOCIDADES_BARRIDO_MS.length - 1, idxVel + delta));
        actualizarBorrador({ intervaloBarridoMs: VELOCIDADES_BARRIDO_MS[nuevoIdx] });
      };
      const segundosTexto = `${(p.intervaloBarridoMs / 1000).toFixed(1).replace(".", ",")} segundos`;

      return (
        <View style={e.contenedorTarjetasSub} testID="opciones-barridoPulsadores">
          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Modo de interacción por pulsador</Text>
              <Text style={e.subtituloTarjetaCat}>Accesibilidad motora (RNF3.4)</Text>
            </View>
            <View
              style={e.filaOpcionesCat}
              accessibilityRole="radiogroup"
              accessibilityLabel="Modo de interacción por pulsador"
            >
              {(["desactivado", "automatico", "manual"] as ModoBarridoPulsador[]).map((modo) => (
                <BotonOpcionBoceto
                  key={modo}
                  testID={`opcion-barrido-${modo}`}
                  etiqueta={ETIQUETAS_MODO_BARRIDO[modo].titulo}
                  activo={p.modoBarrido === modo}
                  onPress={() => actualizarBorrador({ modoBarrido: modo })}
                />
              ))}
            </View>
          </View>

          <View style={e.tarjetaCategoria}>
            <View style={e.cabeceraTarjetaCat}>
              <Text style={e.tituloTarjetaCat}>Velocidad del barrido automático</Text>
              <Text style={e.subtituloTarjetaCat}>Tiempo en cada botón (botones + y −)</Text>
            </View>
            <View style={e.filaStepper24}>
              <Pressable
                testID="btn-barrido-vel-dec"
                accessibilityRole="button"
                accessibilityLabel="Disminuir tiempo de barrido"
                accessibilityState={{ disabled: enMinVel }}
                disabled={enMinVel}
                onPress={() => cambiarVel(-1)}
                style={[e.botonStepperNeutro, enMinVel && e.botonStepperApagado]}
              >
                <Text style={e.textoStepperNeutro}>−</Text>
              </Pressable>
              <View testID="valor-barrido-vel" style={e.campoValorStepper24}>
                <Text style={e.textoValorStepper24}>{segundosTexto}</Text>
              </View>
              <Pressable
                testID="btn-barrido-vel-inc"
                accessibilityRole="button"
                accessibilityLabel="Aumentar tiempo de barrido"
                accessibilityState={{ disabled: enMaxVel }}
                disabled={enMaxVel}
                onPress={() => cambiarVel(1)}
                style={[e.botonStepperPrimario, enMaxVel && e.botonStepperApagado]}
              >
                <Text style={e.textoStepperPrimario}>+</Text>
              </Pressable>
              <Text style={e.ayudaStepper24}>Ajustar de 1,2 s a 3,2 s con + y −</Text>
            </View>
          </View>
        </View>
      );
    }

    default:
      return null;
  }
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    menu: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 18,
      gap: 14,
      justifyContent: "center",
    },
    cabeceraMenu16: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    pregunta: { fontSize: 22, fontWeight: "700", color: c.texto },
    notaMenu16: { fontSize: 14, color: c.textoSecundario },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    tarjeta: {
      flexBasis: "22%",
      flexGrow: 1,
      minHeight: 132,
      paddingHorizontal: 14,
      paddingVertical: 12,
      justifyContent: "space-between",
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    pulsado: { opacity: 0.85 },
    bloqueTextoTarjeta: { gap: 4 },
    tituloTarjeta: { fontSize: 16, fontWeight: "700", color: c.texto, lineHeight: 20 },
    filaValor: { flexDirection: "row", alignItems: "center", gap: 5 },
    valorTarjeta: { flexShrink: 1, fontSize: 13, color: c.textoSecundario, fontWeight: "700" },
    botonVolverSiempre: {
      alignSelf: "flex-start",
      minHeight: 48,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    textoVolverSiempre: { fontSize: 15, fontWeight: "700", color: c.texto },
    apartado: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    columnaOpciones: { flex: 1, minWidth: 420, gap: 10 },
    ayuda: { fontSize: 15, color: c.textoSecundario },
    contenedorTarjetasSub: { gap: 10 },
    tarjetaCategoria: {
      backgroundColor: c.superficie,
      borderWidth: 2,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      gap: 8,
    },
    cabeceraTarjetaCat: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      paddingBottom: 5,
    },
    tituloTarjetaCat: { fontSize: 16, fontWeight: "700", color: c.texto },
    subtituloTarjetaCat: { fontSize: 12.5, color: c.textoSecundario },
    filaOpcionesCat: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    insigniaAa: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    textoInsigniaAa: { fontSize: 18, fontWeight: "700" },
    filaStepper24: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14 },
    botonStepperNeutro: {
      width: 52,
      height: 52,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    textoStepperNeutro: { fontSize: 26, fontWeight: "700", color: c.texto },
    campoValorStepper24: {
      width: 190,
      height: 52,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
      alignItems: "center",
      justifyContent: "center",
    },
    textoValorStepper24: { fontSize: 18, fontWeight: "700", color: c.texto },
    botonStepperPrimario: {
      width: 52,
      height: 52,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    textoStepperPrimario: { fontSize: 26, fontWeight: "700", color: c.textoSobrePrimario },
    botonStepperApagado: { opacity: 0.45 },
    ayudaStepper24: { flex: 1, minWidth: 160, fontSize: 13.5, color: c.textoSecundario },
  });
