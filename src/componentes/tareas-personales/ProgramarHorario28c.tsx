/**
 * Pantalla 28c — Programar horario de la tarea (interfaz única Tutor 08:00-15:00 / Familia 15:00-08:00)
 * siguiendo exactamente el boceto `BOCETOS_NUEVOS/definitiva_v2/pantallas/28c.html`
 * (SCRUM-89 / SCRUM-91 · T-07.2).
 *
 * Características clave del boceto definitivo:
 * - Interfaz EXACTAMENTE IGUAL para Tutor y Familia (una única pantalla sin duplicar vistas).
 * - Si `rol === "tutor"`, solo permite horas de mañana entre las `08:00` y las `15:00`
 *   (`08:00`, `09:30`, `11:00`, `12:30`, `14:00`) y muestra el aviso de bloqueo de tarde/noche.
 * - Si `rol === "familia"`, solo permite horas de tarde/noche entre las `15:00` y las `08:00`
 *   (`16:00`, `17:30`, `19:00`, `20:30`, `07:30`) y muestra el aviso de bloqueo del tramo lectivo.
 * - Permite elegir días de la semana (Lunes a Domingo, selección múltiple), hora de inicio y
 *   duración (`15 min`, `30 min`, `45 min`, `60 min`) con aviso de paso automático a Pendiente.
 * - Barra inferior (`MarcoPantalla`): «Atrás» (-> 28b) y botón primario «Guardar» (-> 31).
 */

import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { urlImagenPictograma } from "../../arasaac/urls";
import { MarcoPantalla } from "../../pantalla/MarcoPantalla";
import {
  validarProgramacionHorario28c,
  type DuracionTarea28c,
} from "../../servicios/tareasPersonalesService";
import type { Paleta } from "../../temas";
import { FORMA, Icono, Texto, useApariencia, useEstilos } from "../../ui";
import type { RolBibliotecaAdulto } from "./datosTareasPersonales";

export interface FranjaHoraria28c {
  hora: string;
  etiqueta: string;
  rol: RolBibliotecaAdulto;
}

export interface OpcionDuracion28c {
  minutos: DuracionTarea28c;
  titulo: string;
  subtitulo: string;
}

export const DIAS_SEMANA_28C: string[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const FRANJAS_HORARIAS_28C: FranjaHoraria28c[] = [
  // Franja Tutor (08:00 a 15:00)
  { hora: "08:00", etiqueta: "Entrada", rol: "tutor" },
  { hora: "09:30", etiqueta: "Mañana", rol: "tutor" },
  { hora: "11:00", etiqueta: "Antes recreo", rol: "tutor" },
  { hora: "12:30", etiqueta: "Mediodía", rol: "tutor" },
  { hora: "14:00", etiqueta: "Antes salida", rol: "tutor" },
  // Franja Familia (15:00 a 08:00)
  { hora: "16:00", etiqueta: "Tarde", rol: "familia" },
  { hora: "17:30", etiqueta: "Merienda", rol: "familia" },
  { hora: "19:00", etiqueta: "Tarde-noche", rol: "familia" },
  { hora: "20:30", etiqueta: "Antes cena", rol: "familia" },
  { hora: "07:30", etiqueta: "Antes colegio", rol: "familia" },
];

export const DURACIONES_28C: OpcionDuracion28c[] = [
  { minutos: 15, titulo: "15 min", subtitulo: "Tarea rápida" },
  { minutos: 30, titulo: "30 min", subtitulo: "Estándar" },
  { minutos: 45, titulo: "45 min", subtitulo: "Con apoyo" },
  { minutos: 60, titulo: "60 min", subtitulo: "Sesión larga" },
];

export interface DatosGuardadoHorario28c {
  rol: RolBibliotecaAdulto;
  diasSeleccionados: string[];
  horaInicio: string;
  duracionMinutos: DuracionTarea28c;
}

export interface ProgramarHorario28cProps {
  /** Rol activo que adapta automáticamente las horas permitidas: `"tutor"` (08-15h) o `"familia"` (15-08h). */
  rol?: RolBibliotecaAdulto;
  /** Nombre del usuario mostrado en cabecera (`"Carmen Ruiz"` o `"Familia García"`). */
  nombreUsuario?: string;
  /** Título de la tarea programada. */
  tituloTarea?: string;
  /** Texto de destinatarios mostrado junto al título en la tarjeta superior. */
  destinatariosTexto?: string;
  /** ID del pictograma ARASAAC de la tarea. */
  pictogramaTareaId?: number;
  /** Días seleccionados inicialmente (por defecto Lunes a Viernes). */
  diasIniciales?: string[];
  /** Hora seleccionada inicialmente (`"11:00"` en Tutor, `"17:30"` en Familia). */
  horaInicial?: string;
  /** Duración seleccionada inicialmente (`45` minutos por defecto). */
  duracionInicial?: DuracionTarea28c;
  /** Se invoca al pulsar el botón inferior «Guardar» cuando el horario es válido. */
  alGuardarHorario?: (datos: DatosGuardadoHorario28c) => void;
  /** Acción del botón inferior «Atrás» (-> Pantalla 28b). */
  alAtras?: (() => void) | null;
  /** Acción para cerrar sesión desde la cabecera. */
  alCerrarSesion?: () => void;
}

/**
 * Renderiza la Pantalla 28c (Programar horario de la tarea) compartiendo exactamente la misma interfaz
 * para Tutor (08:00–15:00) y Familia (15:00–08:00).
 * @param props Propiedades de programación de horario
 * @returns Vista de selección de días, hora de inicio restringida por rol y duración
 */
export function ProgramarHorario28c({
  rol = "tutor",
  nombreUsuario,
  tituloTarea,
  destinatariosTexto,
  pictogramaTareaId,
  diasIniciales = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  horaInicial,
  duracionInicial = 45,
  alGuardarHorario,
  alAtras = null,
  alCerrarSesion,
}: ProgramarHorario28cProps) {
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);

  const franjasPermitidas = useMemo(() => FRANJAS_HORARIAS_28C.filter((f) => f.rol === rol), [rol]);

  const horaPorDefecto = horaInicial ?? (rol === "familia" ? "17:30" : "11:00");

  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>(diasIniciales);
  const [horaActiva, setHoraActiva] = useState<string>(horaPorDefecto);
  const [duracionActiva, setDuracionActiva] = useState<DuracionTarea28c>(duracionInicial);

  // Si cambia el rol dinámicamente, resuelve la hora activa dentro de la franja permitida del rol
  const horaResuelta = useMemo(
    () =>
      franjasPermitidas.some((f) => f.hora === horaActiva)
        ? horaActiva
        : rol === "familia"
          ? "17:30"
          : "11:00",
    [franjasPermitidas, horaActiva, rol],
  );

  const alternarDia = (dia: string) => {
    setDiasSeleccionados((prev) => {
      if (prev.includes(dia)) {
        return prev.length > 1 ? prev.filter((d) => d !== dia) : prev;
      }
      return [...prev, dia];
    });
  };

  const tituloMostrado =
    tituloTarea ?? (rol === "familia" ? "Preparar la mochila" : "Lavarse las manos");
  const destinoMostrado =
    destinatariosTexto ??
    (rol === "familia" ? "Alejandro Pérez (Casa)" : "Clase Triángulo (6 alumnos)");
  const pictoId = pictogramaTareaId ?? (rol === "familia" ? 2475 : 2443);

  const textoReglaRol =
    rol === "familia"
      ? "Perfil Familia: misma interfaz adaptada automáticamente al horario de tarde/noche (de 15:00 a 08:00)."
      : "Perfil Tutor / Profesor: solo permite horario lectivo de mañana (entre las 08:00 y las 15:00).";

  const textoInsigniaFranja =
    rol === "familia" ? "Franja Familia: 15:00 a 08:00" : "Franja Tutor: 08:00 a 15:00";

  const textoPildoraRango =
    rol === "familia" ? "Permitido: 15:00 – 08:00" : "Permitido: 08:00 – 15:00";

  const textoNotaBloqueo =
    rol === "familia"
      ? "🔒 El tramo lectivo de mañana (08:00 a 15:00) está reservado al tutor."
      : "🔒 Las horas de 15:00 a 08:00 corresponden al ámbito familiar.";

  const etiquetaUsuario = nombreUsuario ?? (rol === "familia" ? "Familia García" : "Carmen Ruiz");

  const derecha = (
    <View style={estilos.cabeceraDerecha}>
      <View style={estilos.insigniaUsuario} testID="chip-usuario-28c">
        <Icono nombre="persona" tam={18} color={colores.primario} />
        <Texto style={estilos.textoUsuario}>{etiquetaUsuario}</Texto>
      </View>
      {alCerrarSesion ? (
        <Pressable
          testID="boton-salir-28c"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión y salir"
          onPress={alCerrarSesion}
          style={({ pressed }) => [estilos.botonSecundario, pressed && estilos.pulsado]}
        >
          <Icono nombre="salir" tam={18} color={colores.texto} />
          <Texto style={estilos.textoBotonSecundario}>Salir</Texto>
        </Pressable>
      ) : null}
    </View>
  );

  const manejarGuardar = () => {
    const validacion = validarProgramacionHorario28c({
      rol,
      diasSemana: diasSeleccionados,
      horaInicio: horaResuelta,
      duracionMinutos: duracionActiva,
      alumnosIds: ["ale"],
    });
    if (validacion.valido) {
      alGuardarHorario?.({
        rol,
        diasSeleccionados,
        horaInicio: horaResuelta,
        duracionMinutos: duracionActiva,
      });
    }
  };

  return (
    <MarcoPantalla
      titulo="Programar horario de la tarea"
      simbolo={<Icono nombre="reloj" tam={34} color={colores.primario} />}
      derecha={derecha}
      atras={alAtras}
      adelante={manejarGuardar}
      textoAdelante="Guardar"
    >
      <View style={estilos.contenedor} testID="pantalla-28c-horario">
        {/* Tarjeta superior de resumen y franja horaria según perfil activo */}
        <View style={estilos.bannerSuperior} testID="banner-horario-rol-28c">
          <Image
            source={{ uri: urlImagenPictograma(pictoId) }}
            style={estilos.imagenTareaBanner}
            accessibilityIgnoresInvertColors
          />
          <View style={estilos.infoBanner}>
            <Texto style={estilos.tituloBanner} testID="titulo-tarea-horario-28c">
              {`${tituloMostrado} · ${destinoMostrado}`}
            </Texto>
            <Texto style={estilos.subtituloBanner} testID="texto-regla-rol-28c">
              {textoReglaRol}
            </Texto>
          </View>
          <View style={estilos.insigniaFranja} testID="insignia-franja-rol-28c">
            <Icono nombre="reloj" tam={16} color={colores.primario} />
            <Texto style={estilos.textoInsigniaFranja}>{textoInsigniaFranja}</Texto>
          </View>
        </View>

        {/* 1. ¿Qué día o días de la semana se va a realizar la tarea? */}
        <View style={estilos.tarjetaSeccion}>
          <View style={estilos.cabeceraSeccion}>
            <Texto style={estilos.tituloSeccion}>
              1. ¿Qué día o días de la semana se va a realizar la tarea?
            </Texto>
            <View style={estilos.pildoraSeccion}>
              <Texto style={estilos.textoPildoraSeccion}>Selección múltiple</Texto>
            </View>
          </View>

          <View style={estilos.filaBotones} testID="fila-dias-28c">
            {DIAS_SEMANA_28C.map((dia) => {
              const activo = diasSeleccionados.includes(dia);
              return (
                <Pressable
                  key={dia}
                  testID={`btn-dia-28c-${dia}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  accessibilityLabel={dia}
                  onPress={() => alternarDia(dia)}
                  style={[estilos.botonDia, activo && estilos.botonOpcionActivo]}
                >
                  <Texto style={[estilos.textoDia, activo && estilos.textoOpcionActivo]}>
                    {dia}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. ¿A qué hora empieza? (restringida por rol Tutor 08-15h vs Familia 15-08h) */}
        <View style={estilos.tarjetaSeccion}>
          <View style={estilos.cabeceraSeccion}>
            <Texto style={estilos.tituloSeccion}>2. ¿A qué hora empieza?</Texto>
            <View style={estilos.pildoraSeccion} testID="pildora-rango-permitido-28c">
              <Texto style={estilos.textoPildoraSeccion}>{textoPildoraRango}</Texto>
            </View>
          </View>

          <View style={estilos.filaBotones} testID="fila-horas-28c">
            {franjasPermitidas.map((slot) => {
              const activa = slot.hora === horaResuelta;
              return (
                <Pressable
                  key={slot.hora}
                  testID={`btn-hora-28c-${slot.hora}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                  accessibilityLabel={`${slot.hora}, ${slot.etiqueta}`}
                  onPress={() => setHoraActiva(slot.hora)}
                  style={[estilos.botonHora, activa && estilos.botonOpcionActivo]}
                >
                  <Texto style={[estilos.textoHoraPrincipal, activa && estilos.textoOpcionActivo]}>
                    {slot.hora}
                  </Texto>
                  <Texto style={estilos.textoSubtituloOpcion}>{slot.etiqueta}</Texto>
                </Pressable>
              );
            })}
          </View>

          <Texto style={estilos.textoNotaSeccion} testID="nota-bloqueo-franja-28c">
            {textoNotaBloqueo}
          </Texto>
        </View>

        {/* 3. ¿Qué duración tiene? */}
        <View style={estilos.tarjetaSeccion}>
          <View style={estilos.cabeceraSeccion}>
            <Texto style={estilos.tituloSeccion}>3. ¿Qué duración tiene?</Texto>
            <View style={estilos.pildoraSeccion}>
              <Texto style={estilos.textoPildoraSeccion}>Tiempo estimado</Texto>
            </View>
          </View>

          <View style={estilos.filaBotones} testID="fila-duraciones-28c">
            {DURACIONES_28C.map((d) => {
              const activa = d.minutos === duracionActiva;
              return (
                <Pressable
                  key={d.minutos}
                  testID={`btn-duracion-28c-${d.minutos}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                  accessibilityLabel={`${d.titulo}, ${d.subtitulo}`}
                  onPress={() => setDuracionActiva(d.minutos)}
                  style={[estilos.botonDuracion, activa && estilos.botonOpcionActivo]}
                >
                  <Texto style={[estilos.textoHoraPrincipal, activa && estilos.textoOpcionActivo]}>
                    {d.titulo}
                  </Texto>
                  <Texto style={estilos.textoSubtituloOpcion}>{d.subtitulo}</Texto>
                </Pressable>
              );
            })}
          </View>

          <Texto style={estilos.textoNotaSeccion} testID="nota-autopendiente-28c">
            Si expira la duración y no se ha terminado, pasará automáticamente a Pendiente.
          </Texto>
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
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoUsuario: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primario,
    },
    botonSecundario: {
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
    textoBotonSecundario: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    contenedor: {
      flex: 1,
      padding: 16,
      gap: 10,
      backgroundColor: c.fondo,
    },
    bannerSuperior: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
    },
    imagenTareaBanner: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    infoBanner: {
      flex: 1,
      gap: 2,
    },
    tituloBanner: {
      fontSize: 16,
      fontWeight: "700",
      color: c.texto,
    },
    subtituloBanner: {
      fontSize: 13,
      color: c.textoSecundario,
    },
    insigniaFranja: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
      borderWidth: 1,
      borderColor: c.primario,
    },
    textoInsigniaFranja: {
      fontSize: 13,
      fontWeight: "800",
      color: c.primario,
    },
    tarjetaSeccion: {
      flex: 1,
      backgroundColor: c.superficie,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      borderRadius: FORMA.radio,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      justifyContent: "center",
    },
    cabeceraSeccion: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    tituloSeccion: {
      fontSize: 15,
      fontWeight: "700",
      color: c.texto,
    },
    pildoraSeccion: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: c.superficieDestacada,
    },
    textoPildoraSeccion: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    filaBotones: {
      flexDirection: "row",
      gap: 8,
    },
    botonDia: {
      flex: 1,
      minHeight: 48,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },
    botonHora: {
      flex: 1,
      minHeight: 54,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      gap: 2,
    },
    botonDuracion: {
      flex: 1,
      minHeight: 54,
      borderRadius: FORMA.radioPequeno,
      backgroundColor: c.fondo,
      borderWidth: FORMA.borde,
      borderColor: c.borde,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      gap: 2,
    },
    botonOpcionActivo: {
      backgroundColor: c.superficieDestacada,
      borderWidth: FORMA.bordeDestacado,
      borderColor: c.primario,
    },
    textoDia: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    textoHoraPrincipal: {
      fontSize: 17,
      fontWeight: "800",
      color: c.texto,
    },
    textoOpcionActivo: {
      color: c.primario,
    },
    textoSubtituloOpcion: {
      fontSize: 11,
      color: c.textoSecundario,
    },
    textoNotaSeccion: {
      fontSize: 12,
      color: c.textoSecundario,
    },
    pulsado: {
      backgroundColor: c.superficieDestacada,
      borderColor: c.primario,
    },
  });
