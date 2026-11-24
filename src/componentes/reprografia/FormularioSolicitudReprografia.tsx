/**
 * Formulario docente para solicitud de trabajos al Taller de Reprografía PTVAL
 * (HU-14 / SCRUM-108 / SCRUM-111 · T-14.3).
 * Permite al profesorado configurar un encargo desglosado en parámetros sencillos (documento,
 * copias, color/blanco y negro, 1 o 2 caras, acabado, aula de destino y alumno PTVAL asignado)
 * y previsualizar en tiempo real los 5 pasos en Lectura Fácil que verá el alumno en la Pantalla 12.
 */

import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import {
  crearEncargoReprografia,
  generarPasosReprografia,
} from "../../servicios/reprografiaService";
import type { Paleta } from "../../temas";
import type {
  EncargoReprografia,
  ModoCarasReprografia,
  ModoColorReprografia,
  TipoEncuadernacionReprografia,
} from "../../tipos/reprografia";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";

export interface FormularioSolicitudReprografiaProps {
  /** Nombre del docente solicitante (`"María Carmen"` por defecto). */
  nombreDocente?: string;
  /** Título inicial del documento para agilizar la solicitud. */
  tituloInicial?: string;
  /** Número inicial de copias (`20` por defecto). */
  copiasIniciales?: number;
  /** Se invoca tras validar y registrar con éxito el encargo de reprografía. */
  alCrearEncargo?: (encargo: EncargoReprografia) => void;
  /** Acción del botón «Atrás». */
  alAtras?: (() => void) | null;
  /** Acción para cerrar sesión. */
  alCerrarSesion?: () => void;
}

const AULAS_DESTINO = [
  { id: "tri", nombre: "Clase Triángulo" },
  { id: "cir", nombre: "Clase Círculo" },
  { id: "cua", nombre: "Clase Cuadrado" },
] as const;

const ALUMNOS_PTVAL = [
  { id: "luc", nombre: "Lucas" },
  { id: "ale", nombre: "Alejandro" },
  { id: "ser", nombre: "Sergio" },
] as const;

const ACABADOS: { clave: TipoEncuadernacionReprografia; etiqueta: string }[] = [
  { clave: "ninguno", etiqueta: "Sin acabado" },
  { clave: "grapado", etiqueta: "Grapado" },
  { clave: "plastificado", etiqueta: "Plastificado" },
  { clave: "espiral", etiqueta: "Espiral" },
];

/**
 * Renderiza el formulario docente de solicitud de encargos al Taller de Reprografía.
 * @param props Propiedades iniciales y callbacks de confirmación
 * @returns Componente visual del formulario docente con previsualización de los 5 pasos
 */
export function FormularioSolicitudReprografia({
  nombreDocente = "María Carmen",
  tituloInicial = "Fichas de lectura",
  copiasIniciales = 20,
  alCrearEncargo,
  alAtras = null,
  alCerrarSesion,
}: FormularioSolicitudReprografiaProps) {
  const [tituloDocumento, setTituloDocumento] = useState(tituloInicial);
  const [copiasTexto, setCopiasTexto] = useState(String(copiasIniciales));
  const [modoColor, setModoColor] = useState<ModoColorReprografia>("blanco_y_negro");
  const [modoCaras, setModoCaras] = useState<ModoCarasReprografia>("dos_caras");
  const [acabado, setAcabado] = useState<TipoEncuadernacionReprografia>("grapado");
  const [aulaDestino, setAulaDestino] = useState<string>("Clase Triángulo");
  const [estudianteId, setEstudianteId] = useState<string>("luc");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [encargoCreado, setEncargoCreado] = useState<EncargoReprografia | null>(null);

  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const copiasNumero = Number.parseInt(copiasTexto, 10);
  const copiasSeguras =
    Number.isInteger(copiasNumero) && copiasNumero >= 1 && copiasNumero <= 500 ? copiasNumero : 20;

  const pasosPreview = useMemo(
    () =>
      generarPasosReprografia({
        copias: copiasSeguras,
        modoColor,
        modoCaras,
        aulaDestino: aulaDestino || "Clase Triángulo",
        profesorSolicitante: nombreDocente,
      }),
    [aulaDestino, copiasSeguras, modoCaras, modoColor, nombreDocente],
  );

  const enviarSolicitud = async () => {
    setErrorMsg(null);
    const res = await crearEncargoReprografia({
      tituloDocumento,
      copias: Number.parseInt(copiasTexto, 10),
      modoColor,
      modoCaras,
      acabado,
      aulaDestino,
      profesorSolicitante: nombreDocente,
      estudianteId,
    });

    if (!res.success || !res.data) {
      setErrorMsg(res.error ?? "No se pudo registrar el encargo de reprografía.");
      setEncargoCreado(null);
      return;
    }

    setEncargoCreado(res.data);
    alCrearEncargo?.(res.data);
  };

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaRol} testID="insignia-docente-reprografia">
        <Texto style={estilos.textoInsigniaRol}>{`Tutor · ${nombreDocente}`}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-form-reprografia"
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
      titulo="Solicitar encargo · Taller de Reprografía"
      derecha={derecha}
      atras={alAtras}
    >
      <View style={estilos.contenedor} testID="formulario-solicitud-reprografia">
        {/* Columna izquierda: Configuración desglosada del encargo */}
        <View style={estilos.panelFormulario}>
          <Texto accessibilityRole="header" style={estilos.tituloPanel}>
            Configurar trabajo para alumno PTVAL
          </Texto>

          {/* Bloque 1: Documento y copias */}
          <View style={estilos.filaCampos}>
            <View style={estilos.campoFlex}>
              <Texto style={estilos.etiquetaCampo}>Documento a fotocopiar</Texto>
              <TextInput
                testID="input-titulo-documento"
                value={tituloDocumento}
                onChangeText={setTituloDocumento}
                placeholder="Ej. Fichas de lectura..."
                placeholderTextColor={colores.textoSecundario}
                accessibilityLabel="Documento a fotocopiar"
                style={[estilos.inputTexto, { color: colores.texto }]}
              />
            </View>

            <View style={estilos.campoCopias}>
              <Texto style={estilos.etiquetaCampo}>Nº de copias (1–500)</Texto>
              <TextInput
                testID="input-copias"
                value={copiasTexto}
                onChangeText={setCopiasTexto}
                keyboardType="numeric"
                accessibilityLabel="Número de copias"
                style={[estilos.inputTexto, { color: colores.texto }]}
              />
            </View>
          </View>

          {/* Bloque 2: Color y caras */}
          <View style={estilos.filaCampos}>
            <View style={estilos.campoFlex}>
              <Texto style={estilos.etiquetaCampo}>Modo de color</Texto>
              <View style={estilos.grupoPildoras}>
                <Pressable
                  testID="btn-color-bn"
                  accessibilityRole="button"
                  accessibilityState={{ selected: modoColor === "blanco_y_negro" }}
                  onPress={() => setModoColor("blanco_y_negro")}
                  style={[
                    estilos.pildoraOpcion,
                    modoColor === "blanco_y_negro" && estilos.pildoraActiva,
                  ]}
                >
                  <Texto style={estilos.textoPildora}>Blanco y negro</Texto>
                </Pressable>
                <Pressable
                  testID="btn-color-color"
                  accessibilityRole="button"
                  accessibilityState={{ selected: modoColor === "color" }}
                  onPress={() => setModoColor("color")}
                  style={[estilos.pildoraOpcion, modoColor === "color" && estilos.pildoraActiva]}
                >
                  <Texto style={estilos.textoPildora}>En color</Texto>
                </Pressable>
              </View>
            </View>

            <View style={estilos.campoFlex}>
              <Texto style={estilos.etiquetaCampo}>Caras del folio</Texto>
              <View style={estilos.grupoPildoras}>
                <Pressable
                  testID="btn-caras-una"
                  accessibilityRole="button"
                  accessibilityState={{ selected: modoCaras === "una_cara" }}
                  onPress={() => setModoCaras("una_cara")}
                  style={[estilos.pildoraOpcion, modoCaras === "una_cara" && estilos.pildoraActiva]}
                >
                  <Texto style={estilos.textoPildora}>1 cara</Texto>
                </Pressable>
                <Pressable
                  testID="btn-caras-dos"
                  accessibilityRole="button"
                  accessibilityState={{ selected: modoCaras === "dos_caras" }}
                  onPress={() => setModoCaras("dos_caras")}
                  style={[
                    estilos.pildoraOpcion,
                    modoCaras === "dos_caras" && estilos.pildoraActiva,
                  ]}
                >
                  <Texto style={estilos.textoPildora}>2 caras</Texto>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Bloque 3: Acabado, Aula destino y Alumno PTVAL */}
          <View style={estilos.campoVertical}>
            <Texto style={estilos.etiquetaCampo}>Acabado del encargo</Texto>
            <View style={estilos.grupoPildoras}>
              {ACABADOS.map((item) => (
                <Pressable
                  key={item.clave}
                  testID={`btn-acabado-${item.clave}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: acabado === item.clave }}
                  onPress={() => setAcabado(item.clave)}
                  style={[estilos.pildoraOpcion, acabado === item.clave && estilos.pildoraActiva]}
                >
                  <Texto style={estilos.textoPildora}>{item.etiqueta}</Texto>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={estilos.filaCampos}>
            <View style={estilos.campoFlex}>
              <Texto style={estilos.etiquetaCampo}>Aula de entrega (Reparto)</Texto>
              <View style={estilos.grupoPildoras}>
                {AULAS_DESTINO.map((a) => (
                  <Pressable
                    key={a.id}
                    testID={`btn-aula-destino-${a.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: aulaDestino === a.nombre }}
                    onPress={() => setAulaDestino(a.nombre)}
                    style={[
                      estilos.pildoraOpcion,
                      aulaDestino === a.nombre && estilos.pildoraActiva,
                    ]}
                  >
                    <Texto style={estilos.textoPildora}>{a.nombre}</Texto>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={estilos.campoFlex}>
              <Texto style={estilos.etiquetaCampo}>Alumno PTVAL encargado</Texto>
              <View style={estilos.grupoPildoras}>
                {ALUMNOS_PTVAL.map((al) => (
                  <Pressable
                    key={al.id}
                    testID={`btn-alumno-ptval-${al.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: estudianteId === al.id }}
                    onPress={() => setEstudianteId(al.id)}
                    style={[estilos.pildoraOpcion, estudianteId === al.id && estilos.pildoraActiva]}
                  >
                    <Texto style={estilos.textoPildora}>{al.nombre}</Texto>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {errorMsg ? (
            <View style={estilos.cajaError} testID="error-formulario-reprografia">
              <Texto style={estilos.textoError}>{errorMsg}</Texto>
            </View>
          ) : null}

          {encargoCreado ? (
            <View style={estilos.cajaExito} testID="confirmacion-encargo-creado">
              <Texto style={estilos.textoExito}>
                {`Encargo asignado a la agenda (${encargoCreado.copias} copias · ${encargoCreado.aulaDestino})`}
              </Texto>
            </View>
          ) : null}

          <Pressable
            testID="btn-enviar-encargo-reprografia"
            accessibilityRole="button"
            accessibilityLabel="Asignar encargo de reprografía al alumno"
            onPress={() => void enviarSolicitud()}
            style={({ pressed }) => [estilos.botonEnviar, pressed && estilos.pulsadoPrimario]}
          >
            <Icono nombre="check" tam={22} color="#FFFFFF" />
            <Texto style={estilos.textoBotonEnviar}>Asignar encargo a la agenda del alumno</Texto>
          </Pressable>
        </View>

        {/* Columna derecha: Previsualización de los 5 pasos de Pantalla 12 */}
        <View style={estilos.panelPreview} testID="previsualizacion-5-pasos">
          <Texto style={estilos.tituloPreview}>
            5 pasos generados para el alumno (Pantalla 12)
          </Texto>
          {pasosPreview.map((paso) => (
            <View
              key={paso.orden}
              style={estilos.itemPasoPreview}
              testID={`preview-paso-${paso.orden}`}
            >
              <Texto style={estilos.tituloPasoPreview}>
                {`Paso ${paso.orden} (${paso.fase.toUpperCase()}): ${paso.titulo}`}
              </Texto>
              <Texto style={estilos.textoPasoPreview}>{paso.texto}</Texto>
            </View>
          ))}
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
    insigniaRol: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoInsigniaRol: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primario,
    },
    botonSalir: {
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
    textoSalir: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      flexDirection: "row",
      paddingHorizontal: 22,
      paddingVertical: 12,
      gap: 16,
      backgroundColor: c.fondo,
    },
    panelFormulario: {
      flex: 1.5,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 16,
      gap: 10,
      justifyContent: "space-between",
    },
    tituloPanel: {
      fontSize: 20,
      fontWeight: "700",
      color: c.texto,
    },
    filaCampos: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "wrap",
    },
    campoFlex: {
      flex: 1,
      minWidth: 180,
      gap: 4,
    },
    campoCopias: {
      width: 150,
      gap: 4,
    },
    campoVertical: {
      gap: 4,
    },
    etiquetaCampo: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textoSecundario,
    },
    inputTexto: {
      minHeight: 42,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      fontSize: 16,
    },
    grupoPildoras: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    pildoraOpcion: {
      minHeight: 38,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      alignItems: "center",
      justifyContent: "center",
    },
    pildoraActiva: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
      borderWidth: FORMA.bordeDestacado,
    },
    textoPildora: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    cajaError: {
      padding: 10,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: "#FEE2E2",
      borderWidth: 1,
      borderColor: "#DC2626",
    },
    textoError: {
      fontSize: 14,
      fontWeight: "700",
      color: "#991B1B",
    },
    cajaExito: {
      padding: 10,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#16A34A",
    },
    textoExito: {
      fontSize: 14,
      fontWeight: "700",
      color: "#166534",
    },
    botonEnviar: {
      minHeight: 50,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.primario,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    textoBotonEnviar: {
      fontSize: 17,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    panelPreview: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      padding: 14,
      gap: 8,
      justifyContent: "space-between",
    },
    tituloPreview: {
      fontSize: 17,
      fontWeight: "700",
      color: c.primario,
    },
    itemPasoPreview: {
      padding: 8,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      gap: 2,
    },
    tituloPasoPreview: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    textoPasoPreview: {
      fontSize: 13,
      color: c.textoSecundario,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
    pulsadoPrimario: {
      opacity: 0.9,
    },
  });
