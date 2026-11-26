/**
 * Pantalla 26d — Permisos del alumno simplificados (HU-23 / SCRUM-141 / SCRUM-143 · T-23.2).
 *
 * Sigue fielmente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/26d.html`:
 *   - Pantalla de adulto (`MarcoPantalla` sin botones de Ayuda ni Accesibilidad de alumno).
 *   - Simplificada: SIN selector de nivel de dependencia y SIN etiquetas de «Categoría».
 *   - Tarjeta 1: «Formatos multimedia habilitados debajo de cada paso»
 *     (`Pictograma`, `Texto`, `Foto`, `Vídeo`, `Audio`, exigiendo al menos 1 activo).
 *   - Tarjeta 2: «Acceso a Preferencias y pantallas»
 *     (`Entrada tras login: Semana (06b)`, `Entrada tras login: Solo Hoy (06)` y
 *      `Mostrar botón Preferencias (16)`).
 */

import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import {
  CATALOGO_FORMATOS_MULTIMEDIA,
  ORDEN_FORMATOS_MULTIMEDIA,
  alternarFormatoMultimediaAlumno,
  guardarPermisosAlumno26d,
  normalizarFormatosPermitidos,
} from "../../servicios/permisosAlumnoService";
import type { Paleta } from "../../temas";
import type {
  DestinoEntradaLoginAlumno,
  FormatoMultimediaAlumno,
  PermisosAlumno26d,
} from "../../tipos/permisosAlumno";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";

export interface PantallaPermisosAlumno26dProps {
  /** Identificador del alumno (`"ale"` por defecto). */
  alumnoId?: string;
  /** Nombre del alumno mostrado en el título (`"Alejandro"` por defecto). */
  nombreAlumno?: string;
  /** Nombre del tutor autenticado en la cabecera (`"Carmen Ruiz"` por defecto). */
  nombreTutor?: string;
  /** Formatos multimedia habilitados inicialmente (los 5 por defecto como en `26d.html`). */
  formatosIniciales?: readonly FormatoMultimediaAlumno[];
  /** Pantalla inicial tras login (`"06b"` Semana por defecto como en `26d.html`). */
  entradaInicial?: DestinoEntradaLoginAlumno;
  /** Si el botón Preferencias (16) está activo inicialmente (`true` por defecto). */
  mostrarPreferenciasInicial?: boolean;
  /** Se invoca al pulsar «Guardar» en la barra inferior (-> vuelve a Ficha 37). */
  alGuardar?: (permisos: PermisosAlumno26d) => void;
  /** Se invoca cada vez que cambia algún permiso en pantalla. */
  alCambiarPermisos?: (permisos: {
    formatosPermitidos: FormatoMultimediaAlumno[];
    entradaTrasLogin: DestinoEntradaLoginAlumno;
    mostrarBotonPreferencias16: boolean;
  }) => void;
  /** Acción opcional para abrir la vista previa de ejecución restringida (Pantalla 07e). */
  alAbrirVistaPrevia07e?: (permisos: {
    formatosPermitidos: FormatoMultimediaAlumno[];
    entradaTrasLogin: DestinoEntradaLoginAlumno;
    mostrarBotonPreferencias16: boolean;
  }) => void;
  /** Acción del botón inferior «Atrás» (-> vuelve a Ficha 37). */
  alAtras?: (() => void) | null;
  /** Acción del botón superior «Salir» (-> vuelve a 05). */
  alCerrarSesion?: () => void;
}

/**
 * Obtiene las iniciales en mayúsculas de un nombre para el avatar circular de cabecera.
 * @param nombre Nombre completo del usuario adulto
 * @returns Iniciales de hasta 2 letras
 */
function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "CR";
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Renderiza la Pantalla 26d simplificada de configuración de permisos del alumno.
 * @param props Propiedades de configuración inicial y callbacks
 * @returns Vista de permisos del alumno sin nivel de dependencia ni categoría
 */
export function PantallaPermisosAlumno26d({
  alumnoId = "ale",
  nombreAlumno = "Alejandro",
  nombreTutor = "Carmen Ruiz",
  formatosIniciales = ORDEN_FORMATOS_MULTIMEDIA,
  entradaInicial = "06b",
  mostrarPreferenciasInicial = true,
  alGuardar,
  alCambiarPermisos,
  alAbrirVistaPrevia07e,
  alAtras = null,
  alCerrarSesion,
}: PantallaPermisosAlumno26dProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const [formatosPermitidos, setFormatosPermitidos] = useState<FormatoMultimediaAlumno[]>(() => {
    const norm = normalizarFormatosPermitidos(formatosIniciales);
    return norm.length > 0 ? norm : [...ORDEN_FORMATOS_MULTIMEDIA];
  });
  const [entradaTrasLogin, setEntradaTrasLogin] =
    useState<DestinoEntradaLoginAlumno>(entradaInicial);
  const [mostrarBotonPreferencias16, setMostrarBotonPreferencias16] = useState<boolean>(
    mostrarPreferenciasInicial,
  );
  const [avisoMinimoFormato, setAvisoMinimoFormato] = useState<boolean>(false);
  const [guardadoOk, setGuardadoOk] = useState<boolean>(false);

  const notificarCambio = (
    nuevosFormatos: FormatoMultimediaAlumno[],
    nuevaEntrada: DestinoEntradaLoginAlumno,
    nuevoMostrarPref: boolean,
  ) => {
    alCambiarPermisos?.({
      formatosPermitidos: nuevosFormatos,
      entradaTrasLogin: nuevaEntrada,
      mostrarBotonPreferencias16: nuevoMostrarPref,
    });
  };

  const manejarAlternarFormato = (clave: FormatoMultimediaAlumno) => {
    const resultado = alternarFormatoMultimediaAlumno(formatosPermitidos, clave);
    setGuardadoOk(false);
    if (resultado.bloqueadoPorMinimo) {
      setAvisoMinimoFormato(true);
      return;
    }
    setAvisoMinimoFormato(false);
    setFormatosPermitidos(resultado.formatos);
    notificarCambio(resultado.formatos, entradaTrasLogin, mostrarBotonPreferencias16);
  };

  const manejarSeleccionarEntrada = (destino: DestinoEntradaLoginAlumno) => {
    setGuardadoOk(false);
    setEntradaTrasLogin(destino);
    notificarCambio(formatosPermitidos, destino, mostrarBotonPreferencias16);
  };

  const manejarAlternarPreferencias16 = () => {
    setGuardadoOk(false);
    const siguiente = !mostrarBotonPreferencias16;
    setMostrarBotonPreferencias16(siguiente);
    notificarCambio(formatosPermitidos, entradaTrasLogin, siguiente);
  };

  const manejarGuardar = async () => {
    const guardado = await guardarPermisosAlumno26d({
      alumnoId,
      nombreAlumno,
      formatosPermitidos,
      entradaTrasLogin,
      mostrarBotonPreferencias16,
    });
    setGuardadoOk(true);
    alGuardar?.(guardado);
  };

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-tutor-26d">
        <View style={estilos.avatarIniciales}>
          <Texto style={estilos.textoIniciales}>{obtenerIniciales(nombreTutor)}</Texto>
        </View>
        <Texto style={estilos.textoUsuario}>{nombreTutor}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-26d"
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
      titulo={`Permisos del alumno · ${nombreAlumno}`}
      simbolo={<Icono nombre="candado" tam={28} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras}
      adelante={manejarGuardar}
      textoAdelante="Guardar"
    >
      <View style={estilos.contenedor} testID="pantalla-26d-permisos-alumno">
        {/* Tarjeta 1: Formatos multimedia habilitados debajo de cada paso */}
        <View style={estilos.tarjetaSeccion} testID="seccion-formatos-multimedia-26d">
          <View style={estilos.cabeceraSeccion}>
            <Texto style={estilos.tituloSeccion}>
              Formatos multimedia habilitados debajo de cada paso
            </Texto>
            <Texto style={estilos.subtituloSeccion}>
              Selecciona qué botones de apoyo ve el alumno en sus tareas
            </Texto>
          </View>

          <View style={estilos.filaOpciones}>
            {CATALOGO_FORMATOS_MULTIMEDIA.map((item) => {
              const activo = formatosPermitidos.includes(item.clave);
              return (
                <Pressable
                  key={item.clave}
                  testID={`opcion-formato-26d-${item.clave}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: activo }}
                  accessibilityLabel={`Formato ${item.etiqueta}`}
                  onPress={() => manejarAlternarFormato(item.clave)}
                  style={[estilos.opcionTarjeta, activo && estilos.opcionTarjetaActiva]}
                >
                  {activo ? (
                    <View style={estilos.insigniaCheck} testID={`check-formato-26d-${item.clave}`}>
                      <Texto style={estilos.textoCheck}>✓</Texto>
                    </View>
                  ) : null}
                  <Texto style={[estilos.textoOpcion, activo && estilos.textoOpcionActiva]}>
                    {item.etiqueta}
                  </Texto>
                </Pressable>
              );
            })}
          </View>

          {avisoMinimoFormato ? (
            <Texto style={estilos.textoAvisoMinimo} testID="aviso-minimo-formato-26d">
              Debe permanecer al menos 1 formato multimedia activo para que el alumno pueda ver los
              pasos.
            </Texto>
          ) : null}
        </View>

        {/* Tarjeta 2: Acceso a Preferencias y pantallas */}
        <View style={estilos.tarjetaSeccion} testID="seccion-acceso-pantallas-26d">
          <View style={estilos.cabeceraSeccion}>
            <Texto style={estilos.tituloSeccion}>Acceso a Preferencias y pantallas</Texto>
            <Texto style={estilos.subtituloSeccion}>
              Configura la pantalla inicial tras login y el acceso a Preferencias (16)
            </Texto>
          </View>

          <View style={estilos.filaOpciones}>
            <Pressable
              testID="opcion-entrada-login-06b"
              accessibilityRole="radio"
              accessibilityState={{ checked: entradaTrasLogin === "06b" }}
              accessibilityLabel="Entrada tras login: Semana (06b)"
              onPress={() => manejarSeleccionarEntrada("06b")}
              style={[
                estilos.opcionTarjeta,
                entradaTrasLogin === "06b" && estilos.opcionTarjetaActiva,
              ]}
            >
              {entradaTrasLogin === "06b" ? (
                <View style={estilos.insigniaCheck} testID="check-entrada-06b">
                  <Texto style={estilos.textoCheck}>✓</Texto>
                </View>
              ) : null}
              <Texto
                style={[
                  estilos.textoOpcion,
                  entradaTrasLogin === "06b" && estilos.textoOpcionActiva,
                ]}
              >
                Entrada tras login: Semana (06b)
              </Texto>
            </Pressable>

            <Pressable
              testID="opcion-entrada-login-06"
              accessibilityRole="radio"
              accessibilityState={{ checked: entradaTrasLogin === "06" }}
              accessibilityLabel="Entrada tras login: Solo Hoy (06)"
              onPress={() => manejarSeleccionarEntrada("06")}
              style={[
                estilos.opcionTarjeta,
                entradaTrasLogin === "06" && estilos.opcionTarjetaActiva,
              ]}
            >
              {entradaTrasLogin === "06" ? (
                <View style={estilos.insigniaCheck} testID="check-entrada-06">
                  <Texto style={estilos.textoCheck}>✓</Texto>
                </View>
              ) : null}
              <Texto
                style={[
                  estilos.textoOpcion,
                  entradaTrasLogin === "06" && estilos.textoOpcionActiva,
                ]}
              >
                Entrada tras login: Solo Hoy (06)
              </Texto>
            </Pressable>

            <Pressable
              testID="opcion-mostrar-preferencias-16"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: mostrarBotonPreferencias16 }}
              accessibilityLabel="Mostrar botón Preferencias (16)"
              onPress={manejarAlternarPreferencias16}
              style={[
                estilos.opcionTarjeta,
                estilos.opcionTarjetaPreferencias,
                mostrarBotonPreferencias16 && estilos.opcionTarjetaActiva,
              ]}
            >
              {mostrarBotonPreferencias16 ? (
                <View style={estilos.insigniaCheck} testID="check-mostrar-preferencias-16">
                  <Texto style={estilos.textoCheck}>✓</Texto>
                </View>
              ) : null}
              <Texto
                style={[
                  estilos.textoOpcion,
                  mostrarBotonPreferencias16 && estilos.textoOpcionActiva,
                ]}
              >
                Mostrar botón Preferencias (16)
              </Texto>
            </Pressable>
          </View>
        </View>

        {/* Barra inferior de estado / vista previa de 07e si se solicita */}
        {(guardadoOk || alAbrirVistaPrevia07e) && (
          <View style={estilos.filaAccionesExtra}>
            {guardadoOk ? (
              <Texto style={estilos.textoGuardadoOk} testID="mensaje-permisos-guardados-26d">
                ✓ Permisos guardados para {nombreAlumno}
              </Texto>
            ) : null}
            {alAbrirVistaPrevia07e ? (
              <Pressable
                testID="boton-vista-previa-07e"
                accessibilityRole="button"
                accessibilityLabel="Ver ejecución restringida del alumno (07e)"
                onPress={() =>
                  alAbrirVistaPrevia07e({
                    formatosPermitidos,
                    entradaTrasLogin,
                    mostrarBotonPreferencias16,
                  })
                }
                style={({ pressed }) => [estilos.botonVistaPrevia, pressed && estilos.pulsado]}
              >
                <Texto style={estilos.textoBotonVistaPrevia}>Ver ejecución restringida (07e)</Texto>
              </Pressable>
            ) : null}
          </View>
        )}
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
      paddingVertical: 20,
      justifyContent: "center",
      gap: 16,
      backgroundColor: c.fondo,
    },
    tarjetaSeccion: {
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      paddingVertical: 18,
      paddingHorizontal: 20,
      gap: 12,
    },
    cabeceraSeccion: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      paddingBottom: 6,
      gap: 8,
    },
    tituloSeccion: {
      fontSize: 18,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloSeccion: {
      fontSize: 13.5,
      color: c.textoSecundario,
    },
    filaOpciones: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "wrap",
    },
    opcionTarjeta: {
      flex: 1,
      minWidth: 140,
      minHeight: 66,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      paddingHorizontal: 10,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      position: "relative",
    },
    opcionTarjetaPreferencias: {
      flex: 1.15,
    },
    opcionTarjetaActiva: {
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    insigniaCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    textoCheck: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textoSobrePrimario,
    },
    textoOpcion: {
      fontSize: 15.5,
      fontWeight: "700",
      color: c.texto,
      textAlign: "center",
    },
    textoOpcionActiva: {
      color: c.primario,
    },
    textoAvisoMinimo: {
      fontSize: 13.5,
      fontWeight: "700",
      color: c.peligro,
    },
    filaAccionesExtra: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    textoGuardadoOk: {
      fontSize: 15,
      fontWeight: "700",
      color: c.exito,
    },
    botonVistaPrevia: {
      minHeight: 42,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: FORMA.radioPequeno,
      borderWidth: FORMA.borde,
      borderColor: c.primario,
      backgroundColor: c.superficie,
      alignItems: "center",
      justifyContent: "center",
    },
    textoBotonVistaPrevia: {
      fontSize: 14.5,
      fontWeight: "700",
      color: c.primario,
    },
    pulsado: {
      opacity: 0.85,
    },
  });
