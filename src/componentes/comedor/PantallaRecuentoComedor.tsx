// Comedor · Recuento por aulas (pantalla 11, HU-12 · SCRUM-104 · T-12.3).
// El alumno encargado (PTVAL) pasa por cada clase con la tableta. Un paso por clase («Paso 1 de 9»):
// la forma y el nombre de la clase, sus compañeros, y el alumno toca a los que NO están hoy (el
// colegio lo pidió así el 19/11: «solo apuntan quien falta»). Debajo, cuántos comen. «Siguiente»
// guarda esa clase (la cocina lo ve al momento en la pantalla 54) y pasa a la siguiente; en la
// última, «Terminar» y la confirmación grande de tarea hecha (como la pantalla 10).
// Si una clase ya estaba contada hoy, sale como se dejó y se puede corregir.
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { urlImagenPictograma } from "../../arasaac/urls";
import { IconoAula } from "../administracion/IconoAula";
import { PantallaTareaHecha } from "../agenda/PantallaTareaHecha";
import { Pantalla } from "../../pantalla/Pantalla";
import {
  confirmarRecuentoComedor,
  obtenerRecuentoComedorHoy,
  type ClaseRecuento,
} from "../../servicios/comedorService";
import { reproducirSonido } from "../../servicios/sonidos";
import type { Paleta } from "../../temas";
import { Icono, PictogramaInterfaz, Texto, useApariencia, useEstilos } from "../../ui";

/** Pictograma «comer» de ARASAAC (catálogo del proyecto). */
const PICTOGRAMA_COMER = 2349;

export const TAREA_RECUENTO = {
  titulo: "Recuento del comedor",
  emoji: "🍽️",
  pictograma_url: urlImagenPictograma(PICTOGRAMA_COMER, 500),
};

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | { tipo: "listo"; clases: ClaseRecuento[] }
  | { tipo: "hecho" };

export interface PantallaRecuentoComedorProps {
  /** Salir del recuento (volver a la agenda). */
  alSalir: () => void;
}

export function PantallaRecuentoComedor({ alSalir }: PantallaRecuentoComedorProps) {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const montado = useRef(true);

  const pedirClases = useCallback(() => {
    obtenerRecuentoComedorHoy().then((r) => {
      if (!montado.current) return;
      setEstado(r.success && r.data ? { tipo: "listo", clases: r.data } : { tipo: "error" });
    });
  }, []);

  useEffect(() => {
    montado.current = true;
    pedirClases();
    return () => {
      montado.current = false;
    };
  }, [pedirClases]);

  if (estado.tipo === "hecho") {
    return <PantallaTareaHecha tarea={TAREA_RECUENTO} alAtras={alSalir} conSonido />;
  }
  if (estado.tipo === "listo" && estado.clases.length > 0) {
    return (
      <PasosRecuento
        clases={estado.clases}
        alSalir={alSalir}
        alTerminar={() => {
          reproducirSonido("acierto");
          setEstado({ tipo: "hecho" });
        }}
      />
    );
  }
  return (
    <AvisoRecuento
      tipo={estado.tipo === "listo" ? "vacio" : estado.tipo}
      alSalir={alSalir}
      alVolverAProbar={() => {
        setEstado({ tipo: "cargando" });
        pedirClases();
      }}
    />
  );
}

/** Los pasos del recuento: una clase por pantalla. */
function PasosRecuento({
  clases,
  alSalir,
  alTerminar,
}: {
  clases: ClaseRecuento[];
  alSalir: () => void;
  alTerminar: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [paso, setPaso] = useState(0);
  // Ausentes de cada clase; si ya estaba contada hoy, se empieza por lo que se guardó. Solo los que
  // siguen en la clase: uno que se dio de baja o cambió de clase no se podría desmarcar, contaría de
  // menos y la base de datos rechazaría guardar la clase.
  const [ausentes, setAusentes] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      clases.map((c) => [c.aulaId, c.ausentes.filter((id) => c.alumnos.some((a) => a.id === id))]),
    ),
  );
  const [guardando, setGuardando] = useState(false);
  // Evita guardar dos veces con un doble toque (el estado tarda un render en llegar)
  const enCurso = useRef(false);
  const [errorGuardar, setErrorGuardar] = useState(false);

  const clase = clases[paso];
  const faltan = ausentes[clase.aulaId] ?? [];
  const comen = clase.alumnos.length - faltan.length;
  const ultimo = paso === clases.length - 1;

  const tocarCompanero = (id: string) => {
    if (guardando) return;
    reproducirSonido("toque");
    setErrorGuardar(false);
    setAusentes((antes) => {
      const lista = antes[clase.aulaId] ?? [];
      return {
        ...antes,
        [clase.aulaId]: lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id],
      };
    });
  };

  // «Siguiente»: guarda esta clase y pasa a la siguiente (o termina)
  // Mientras se guarda no se puede tocar nada (ni «Atrás» ni los compañeros), para que no se pierda
  // un cambio ni se salte a una clase que no toca.
  const siguiente = async () => {
    if (enCurso.current) return;
    enCurso.current = true;
    setGuardando(true);
    setErrorGuardar(false);
    try {
      const r = await confirmarRecuentoComedor(clase.aulaId, faltan);
      if (!r.success) {
        setErrorGuardar(true);
        return;
      }
      if (ultimo) alTerminar();
      else setPaso((p) => p + 1);
    } finally {
      enCurso.current = false;
      setGuardando(false);
    }
  };

  return (
    <Pantalla
      titulo="Comedor · Recuento por aulas"
      alAtras={guardando ? null : paso === 0 ? alSalir : () => setPaso((p) => p - 1)}
      etiquetaAtras={paso === 0 ? "Atrás: volver a mi agenda" : "Atrás: clase anterior"}
      alAdelante={guardando ? null : () => void siguiente()}
      textoAdelante={ultimo ? "Terminar" : "Siguiente"}
      etiquetaAdelante={
        ultimo ? "Terminar: guardar esta clase y acabar" : "Siguiente: guardar esta clase"
      }
      conSonido
    >
      <View style={e.paso} testID={`paso-recuento-${paso + 1}`}>
        {/* La insignia del paso va justo encima de la tarjeta, alineada con ella */}
        <View style={e.columna}>
          <View style={e.insigniaPaso}>
            <Texto style={e.textoPaso}>{`Paso ${paso + 1} de ${clases.length}`}</Texto>
          </View>

          <View style={e.tarjeta}>
            {/* La clase en la que está */}
            <View style={e.cabeceraClase}>
              <IconoAula iconoForma={clase.iconoForma} iconoUrl={clase.iconoUrl} tam={64} />
              <Texto style={e.nombreClase} accessibilityRole="header">
                {clase.nombre}
              </Texto>
            </View>

            <View style={e.instruccion}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <PictogramaInterfaz nombre="tocar" etiqueta="tocar" tam={44} />
              </View>
              <Texto style={e.textoInstruccion}>Toca a los que no están hoy</Texto>
            </View>

            {/* Compañeros: tocar = no está (gris, con una X y «No está»); otra vez = sí está */}
            <View style={e.companeros} testID="companeros-recuento">
              {clase.alumnos.map((a) => {
                const noEsta = faltan.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${a.nombre}: ${noEsta ? "no está" : "está"}`}
                    accessibilityState={{ selected: noEsta, disabled: guardando }}
                    disabled={guardando}
                    testID={`companero-${a.id}`}
                    onPress={() => tocarCompanero(a.id)}
                    style={({ pressed }) => [
                      e.companero,
                      noEsta && e.companeroAusente,
                      pressed && e.pulsado,
                    ]}
                  >
                    <View
                      style={[
                        e.avatar,
                        { borderColor: noEsta ? colores.borde : a.color || colores.borde },
                      ]}
                    >
                      <Text style={[e.iconoAvatar, noEsta && e.apagado]}>{a.icono ?? "⭐"}</Text>
                      {noEsta ? (
                        <View style={e.marcaAusente}>
                          <Icono nombre="cerrar" color={colores.peligro} tam={40} grosor={3.4} />
                        </View>
                      ) : null}
                    </View>
                    <Texto
                      style={[e.nombreCompanero, noEsta && e.textoAusente]}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                    >
                      {a.nombre}
                    </Texto>
                    {noEsta ? <Texto style={e.etiquetaAusente}>No está</Texto> : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Lo que se lleva a cocina de esta clase */}
            <Texto style={e.resumen} testID="comen-en-clase">
              {`${clase.nombre} · Comen ${comen}`}
            </Texto>
          </View>
        </View>

        {errorGuardar ? (
          <View style={e.error} accessibilityRole="alert" testID="error-guardar-recuento">
            <Icono nombre="alerta" color={colores.peligro} tam={28} grosor={2.8} />
            <Texto style={e.textoError}>
              No se ha podido guardar. Pulsa otra vez «{ultimo ? "Terminar" : "Siguiente"}».
            </Texto>
          </View>
        ) : null}
      </View>
    </Pantalla>
  );
}

/** Cargando, error al cargar o ninguna clase que contar. */
function AvisoRecuento({
  tipo,
  alSalir,
  alVolverAProbar,
}: {
  tipo: "cargando" | "error" | "vacio";
  alSalir: () => void;
  alVolverAProbar: () => void;
}) {
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  return (
    <Pantalla
      titulo="Comedor · Recuento por aulas"
      alAtras={alSalir}
      etiquetaAtras="Atrás: volver a mi agenda"
      conSonido
    >
      <View
        style={e.centro}
        testID={`recuento-${tipo}`}
        accessibilityLiveRegion={tipo === "error" ? undefined : "polite"}
      >
        {tipo === "cargando" ? (
          <>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <PictogramaInterfaz nombre="esperar" etiqueta="esperar" tam={72} />
            </View>
            <Texto style={e.textoCentro}>Cargando…</Texto>
          </>
        ) : tipo === "vacio" ? (
          <Texto style={e.textoCentro}>Hoy no hay clases que contar.</Texto>
        ) : (
          <>
            <View style={e.filaError} accessibilityRole="alert">
              <Icono nombre="alerta" color={colores.peligro} tam={32} grosor={2.8} />
              <Texto style={[e.textoCentro, { color: colores.peligro }]}>
                No se han podido cargar las clases.
              </Texto>
            </View>
            <Pressable
              style={e.botonVolverAProbar}
              accessibilityRole="button"
              accessibilityLabel="Volver a probar"
              testID="btn-volver-a-probar-recuento"
              onPress={() => {
                reproducirSonido("toque");
                alVolverAProbar();
              }}
            >
              <Texto style={e.textoVolverAProbar}>Volver a probar</Texto>
            </Pressable>
          </>
        )}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    paso: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 20 },
    columna: { width: "100%", maxWidth: 900, gap: 14 },
    insigniaPaso: {
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    textoPaso: { fontSize: 18, fontWeight: "700", color: c.primario },
    tarjeta: {
      width: "100%",
      alignItems: "center",
      gap: 14,
      padding: 20,
      borderRadius: 18,
      borderWidth: 3,
      borderColor: c.primario,
      backgroundColor: c.superficie,
    },
    cabeceraClase: { flexDirection: "row", alignItems: "center", gap: 16 },
    nombreClase: { fontSize: 32, fontWeight: "700", color: c.texto },
    instruccion: { flexDirection: "row", alignItems: "center", gap: 12 },
    textoInstruccion: { fontSize: 24, fontWeight: "700", color: c.texto },
    companeros: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14 },
    // RNF1.1: cada compañero mide al menos 120 x 120
    companero: {
      width: 150,
      minHeight: 150,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 8,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer", userSelect: "none" }, default: {} }),
    },
    companeroAusente: { borderWidth: 3, borderColor: c.peligro, backgroundColor: c.fondo },
    pulsado: { opacity: 0.7 },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 3,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    iconoAvatar: { fontSize: 42 },
    apagado: { opacity: 0.35 },
    marcaAusente: { position: "absolute", alignItems: "center", justifyContent: "center" },
    nombreCompanero: { fontSize: 19, fontWeight: "700", color: c.texto },
    textoAusente: { color: c.textoSecundario, textDecorationLine: "line-through" },
    etiquetaAusente: { fontSize: 16, fontWeight: "700", color: c.peligro },
    resumen: { fontSize: 28, fontWeight: "700", color: c.texto, textAlign: "center" },
    error: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: c.peligro,
      backgroundColor: c.superficie,
    },
    textoError: { flexShrink: 1, fontSize: 19, fontWeight: "700", color: c.peligro },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 24 },
    filaError: { flexDirection: "row", alignItems: "center", gap: 12 },
    textoCentro: { fontSize: 24, fontWeight: "700", color: c.texto, textAlign: "center" },
    botonVolverAProbar: {
      minWidth: 280,
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: c.primario,
    },
    textoVolverAProbar: { fontSize: 26, fontWeight: "700", color: c.textoSobrePrimario },
  });
