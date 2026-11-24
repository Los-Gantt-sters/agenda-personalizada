// Cocina · Parte del día (pantalla 54, HU-12 · SCRUM-103 · T-12.2).
// Lo que ve la cocina al entrar (05 → 54): cuántos menús de cada tipo preparar y el total de
// comensales de HOY, ya sin los alumnos que faltan según el recuento del alumno encargado
// (pantalla 11). Debajo, cuántas clases están contadas («Aulas confirmadas: 3 de 3»), la última y a
// qué hora, y las alergias de los que comen. Cuando están todas, «Parte confirmado».
// Los tipos de menú y las alergias los pone Administración (46/46b). Se actualiza solo cada minuto,
// porque el recuento llega a lo largo de la mañana. Sin exportación a PDF (no está en el prototipo).
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { nombreAlergia, nombreTipoMenu } from "../../src/componentes/administracion/menus";
import { Pantalla } from "../../src/pantalla";
import { obtenerParteCocinaDia, type ParteCocinaDia } from "../../src/servicios/comedorService";
import { useSesionOpcional } from "../../src/sesion";
import type { Paleta } from "../../src/temas";
import { Icono, Texto, fechaDeHoy, useApariencia, useEstilos } from "../../src/ui";

/** Cada cuánto se vuelve a pedir el parte mientras la pantalla está abierta. */
const REFRESCO_PARTE_MS = 60_000;

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  // horaDatos: cuándo llegó este parte (HH:MM); sinActualizar: el último refresco falló
  | { tipo: "ok"; parte: ParteCocinaDia; horaDatos: string; sinActualizar: boolean };

const horaActual = () =>
  new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

/** Fecha del parte («2026-11-25») en texto, la del centro; si aún no hay parte, la de hoy. */
function fechaDelParte(fecha?: string): string {
  const [a, m, d] = (fecha ?? "").split("-").map(Number);
  return a && m && d ? fechaDeHoy(new Date(a, m - 1, d)) : fechaDeHoy();
}

export default function ParteDelDiaCocina() {
  const router = useRouter();
  const sesion = useSesionOpcional();
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const montado = useRef(true);
  // Solo cuenta la respuesta de la última petición (las anteriores pueden llegar más tarde)
  const ultimaPeticion = useRef(0);

  // Pide el parte. Si falla al refrescar, se queda el último que había, pero con un aviso de que no
  // está al día y de qué hora es: la cocina no debe preparar menús con datos viejos sin saberlo.
  const pedirParte = useCallback(() => {
    const peticion = ++ultimaPeticion.current;
    obtenerParteCocinaDia().then((r) => {
      if (!montado.current || peticion !== ultimaPeticion.current) return;
      if (r.success && r.data) {
        setEstado({ tipo: "ok", parte: r.data, horaDatos: horaActual(), sinActualizar: false });
      } else {
        setEstado((antes) =>
          antes.tipo === "ok"
            ? { ...antes, sinActualizar: true }
            : { tipo: "error", mensaje: r.error ?? "No se ha podido cargar el parte." },
        );
      }
    });
  }, []);

  useEffect(() => {
    montado.current = true;
    pedirParte();
    const intervalo = setInterval(pedirParte, REFRESCO_PARTE_MS);
    return () => {
      montado.current = false;
      clearInterval(intervalo);
    };
  }, [pedirParte]);

  const volverAProbar = () => {
    setEstado({ tipo: "cargando" });
    pedirParte();
  };

  const cerrarSesion = async () => {
    await sesion?.cerrarSesion();
    router.replace("/");
  };

  return (
    <Pantalla
      titulo="Cocina · Parte del día"
      simbolo={<Icono nombre="lista" color={colores.primario} tam={36} />}
      derecha={
        <View style={e.cabeceraDerecha}>
          <Texto style={e.fecha}>
            {fechaDelParte(estado.tipo === "ok" ? estado.parte.fecha : undefined)}
          </Texto>
          {sesion ? (
            <Pressable
              style={e.botonSalir}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={() => void cerrarSesion()}
            >
              <Icono nombre="salir" color={colores.primario} tam={24} />
              <Texto style={e.textoSalir}>Salir</Texto>
            </Pressable>
          ) : null}
        </View>
      }
      alAtras={null}
    >
      {estado.tipo === "cargando" ? (
        <View style={e.centro} testID="parte-cargando">
          <Texto style={e.textoCentro}>Cargando el parte del día…</Texto>
        </View>
      ) : estado.tipo === "error" ? (
        <View style={e.centro} testID="parte-error" accessibilityRole="alert">
          <View style={e.fila}>
            <Icono nombre="alerta" color={colores.peligro} tam={30} grosor={2.8} />
            <Texto style={[e.textoCentro, { color: colores.peligro }]}>{estado.mensaje}</Texto>
          </View>
          <Pressable
            style={e.botonPrimario}
            accessibilityRole="button"
            accessibilityLabel="Volver a probar"
            testID="btn-volver-a-probar-parte"
            onPress={volverAProbar}
          >
            <Texto style={e.textoBotonPrimario}>Volver a probar</Texto>
          </Pressable>
        </View>
      ) : (
        <Parte
          parte={estado.parte}
          horaDatos={estado.horaDatos}
          sinActualizar={estado.sinActualizar}
          alActualizar={pedirParte}
        />
      )}
    </Pantalla>
  );
}

/** Contenido del parte: tarjetas de menús y total, aulas confirmadas y alergias. */
function Parte({
  parte,
  horaDatos,
  sinActualizar,
  alActualizar,
}: {
  parte: ParteCocinaDia;
  horaDatos: string;
  sinActualizar: boolean;
  alActualizar: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const completo = parte.aulasTotal > 0 && parte.aulasConfirmadas >= parte.aulasTotal;
  const faltanAulas = parte.aulasTotal - parte.aulasConfirmadas;

  return (
    <ScrollView contentContainerStyle={e.contenido}>
      {sinActualizar ? (
        <View style={e.avisoDesfasado} accessibilityRole="alert" testID="parte-sin-actualizar">
          <Icono nombre="alerta" color={colores.peligro} tam={24} grosor={2.6} />
          <Texto style={e.textoDesfasado}>
            {`No se ha podido actualizar. Estos datos son de las ${horaDatos}.`}
          </Texto>
        </View>
      ) : null}

      {/* Una tarjeta por tipo de menú que hay hoy, y el total al final */}
      <View style={e.tarjetas} testID="tarjetas-menus">
        {parte.menus.map((m) => (
          <View
            key={m.tipo}
            style={e.tarjeta}
            accessible
            accessibilityLabel={`${nombreTipoMenu(m.tipo)}: ${m.total}`}
            testID={`menu-${m.tipo}`}
          >
            <Texto style={e.etiquetaTarjeta}>{nombreTipoMenu(m.tipo).toUpperCase()}</Texto>
            <Texto style={[e.numero, { color: colores.primario }]}>{m.total}</Texto>
          </View>
        ))}
        <View
          style={e.tarjeta}
          accessible
          accessibilityLabel={`Total comensales${completo ? "" : " (provisional)"}: ${parte.total}`}
          testID="total-comensales"
        >
          <Texto style={e.etiquetaTarjeta}>TOTAL COMENSALES</Texto>
          {/* Mientras falten clases por contar, se cuenta a sus alumnos como presentes */}
          {completo ? null : <Texto style={e.provisional}>Provisional</Texto>}
          <Texto style={[e.numero, { color: colores.exito }]}>{parte.total}</Texto>
        </View>
      </View>

      {/* Estado del recuento de hoy */}
      <View style={e.panel} testID="estado-recuento">
        <View style={e.textoPanel}>
          <Texto style={e.tituloPanel}>
            {`Aulas confirmadas: ${parte.aulasConfirmadas} de ${parte.aulasTotal}`}
          </Texto>
          <Texto style={e.detalle}>
            {parte.ultima
              ? `Última actualización: ${parte.ultima.aula} (${parte.ultima.hora})`
              : "Todavía no ha llegado el recuento de ninguna clase"}
            {parte.ausentes > 0 ? ` · Hoy faltan ${parte.ausentes}` : ""}
          </Texto>
        </View>
        {completo ? (
          <View style={[e.insignia, { backgroundColor: colores.exito }]} testID="parte-confirmado">
            <Icono nombre="check" color="#FFFFFF" tam={22} grosor={3} />
            <Texto style={e.textoInsignia}>Parte confirmado</Texto>
          </View>
        ) : (
          <View style={[e.insignia, e.insigniaPendiente]} testID="parte-pendiente">
            <Icono nombre="reloj" color={colores.aviso} tam={22} grosor={2.6} />
            <Texto style={[e.textoInsignia, { color: colores.aviso }]}>
              {faltanAulas === 1 ? "Falta 1 aula" : `Faltan ${faltanAulas} aulas`}
            </Texto>
          </View>
        )}
      </View>

      {/* Alergias y observaciones de los que comen hoy */}
      <View style={e.panelAlergias} testID="avisos-alergias">
        <View style={e.fila}>
          <Icono nombre="alerta" color={colores.peligro} tam={24} grosor={2.6} />
          <Texto style={e.tituloPanel}>Alergias y avisos de hoy</Texto>
        </View>
        {parte.avisos.length === 0 ? (
          <Texto style={e.detalle}>Hoy no come nadie con alergias ni avisos.</Texto>
        ) : (
          parte.avisos.map((a) => (
            <Texto key={a.alumnoId} style={e.aviso} testID={`aviso-${a.alumnoId}`}>
              <Texto style={e.avisoNombre}>{`${a.nombre}${a.aula ? ` (${a.aula})` : ""}: `}</Texto>
              {[a.alergias.map(nombreAlergia).join(", "), a.observaciones]
                .filter(Boolean)
                .join(" · ")}
            </Texto>
          ))
        )}
      </View>

      <Pressable
        style={e.botonSecundario}
        accessibilityRole="button"
        accessibilityLabel="Actualizar el parte"
        testID="btn-actualizar-parte"
        onPress={alActualizar}
      >
        <Texto style={e.textoBotonSecundario}>Actualizar</Texto>
      </Pressable>
    </ScrollView>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    cabeceraDerecha: { flexDirection: "row", alignItems: "center", gap: 16 },
    fecha: { fontSize: 16, color: c.textoSecundario },
    botonSalir: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    textoSalir: { fontSize: 16, fontWeight: "700", color: c.primario },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 24 },
    textoCentro: { fontSize: 22, fontWeight: "700", color: c.texto, textAlign: "center" },
    fila: { flexDirection: "row", alignItems: "center", gap: 10 },
    contenido: { flexGrow: 1, justifyContent: "center", gap: 16, padding: 24 },
    tarjetas: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    tarjeta: {
      flexGrow: 1,
      flexBasis: 200,
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 16,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    etiquetaTarjeta: { fontSize: 16, color: c.textoSecundario, textAlign: "center" },
    provisional: { fontSize: 15, fontWeight: "700", color: c.aviso },
    avisoDesfasado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: c.peligro,
      backgroundColor: c.superficie,
    },
    textoDesfasado: { flexShrink: 1, fontSize: 18, fontWeight: "700", color: c.peligro },
    numero: { fontSize: 44, fontWeight: "700" },
    panel: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: 18,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    textoPanel: { flexShrink: 1, gap: 4 },
    tituloPanel: { fontSize: 19, fontWeight: "700", color: c.texto },
    detalle: { fontSize: 16, color: c.textoSecundario },
    insignia: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 18,
      borderRadius: 12,
    },
    insigniaPendiente: { borderWidth: 2, borderColor: c.aviso, backgroundColor: c.superficie },
    textoInsignia: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
    panelAlergias: {
      gap: 8,
      padding: 18,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.peligro,
      backgroundColor: c.superficie,
    },
    aviso: { fontSize: 17, color: c.texto },
    avisoNombre: { fontWeight: "700" },
    botonPrimario: {
      minHeight: 56,
      minWidth: 220,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: c.primario,
    },
    textoBotonPrimario: { fontSize: 18, fontWeight: "700", color: c.textoSobrePrimario },
    botonSecundario: {
      alignSelf: "center",
      minHeight: 48,
      minWidth: 180,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
    },
    textoBotonSecundario: { fontSize: 17, fontWeight: "700", color: c.primario },
  });
