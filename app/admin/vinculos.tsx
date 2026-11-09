// Consola de administración: asignar tutor de aula y familia a cada estudiante (HU-03, SCRUM-61).
// Prototipo de referencia: 61-administracion-usuarios (vínculos) y 46-tutora-ficha-datos.
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  COLORES_CONSOLA as C,
  ModalElegirSupervisor,
} from "../../src/componentes/administracion/ModalElegirSupervisor";
import {
  asignarSupervisor,
  listarAlumnosConVinculos,
  listarSupervisores,
  type AlumnoConVinculos,
  type Supervisor,
} from "../../src/servicios/vinculosService";
import type { TipoVinculo } from "../../src/tipos/alumnos";

const ERROR_CARGA = "No se han podido cargar los estudiantes. Inténtalo otra vez.";

type Edicion = { alumno: AlumnoConVinculos; tipo: TipoVinculo };

/** Estudiantes, tutores y familias a la vez; null si falla cualquiera de las tres consultas. */
async function obtenerDatos() {
  const [rAlumnos, rTutores, rFamilias] = await Promise.all([
    listarAlumnosConVinculos(),
    listarSupervisores("aula"),
    listarSupervisores("familiar"),
  ]);
  if (!rAlumnos.success || !rTutores.success || !rFamilias.success) return null;
  return {
    alumnos: rAlumnos.data ?? [],
    tutores: rTutores.data ?? [],
    familias: rFamilias.data ?? [],
  };
}

export default function ConsolaVinculos() {
  const [alumnos, setAlumnos] = useState<AlumnoConVinculos[]>([]);
  const [tutores, setTutores] = useState<Supervisor[]>([]);
  const [familias, setFamilias] = useState<Supervisor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  /** id del estudiante recién guardado, para mostrar «Guardado» en su fila. */
  const [guardadoId, setGuardadoId] = useState<string | null>(null);

  // Guarda en el estado lo que devuelve obtenerDatos (se llama cuando ya han llegado los datos)
  const aplicarDatos = useCallback((datos: Awaited<ReturnType<typeof obtenerDatos>>) => {
    if (datos) {
      setAlumnos(datos.alumnos);
      setTutores(datos.tutores);
      setFamilias(datos.familias);
    }
    setErrorCarga(datos ? null : ERROR_CARGA);
    setCargando(false);
  }, []);

  useEffect(() => {
    let montada = true;
    obtenerDatos().then((datos) => montada && aplicarDatos(datos));
    return () => {
      montada = false;
    };
  }, [aplicarDatos]);

  function reintentar() {
    setCargando(true);
    setErrorCarga(null);
    void obtenerDatos().then(aplicarDatos);
  }

  function abrir(alumno: AlumnoConVinculos, tipo: TipoVinculo) {
    setErrorGuardar(null);
    setGuardadoId(null);
    setEdicion({ alumno, tipo });
  }

  async function elegir(supervisorId: string | null) {
    if (!edicion) return;
    const { alumno, tipo } = edicion;
    setGuardando(true);
    setErrorGuardar(null);
    const r = await asignarSupervisor(alumno.id, tipo, supervisorId);
    setGuardando(false);

    if (!r.success) {
      setErrorGuardar(r.error ?? null);
      return;
    }
    const lista = tipo === "aula" ? tutores : familias;
    const elegido = lista.find((s) => s.id === supervisorId) ?? null;
    setAlumnos((actuales) =>
      actuales.map((a) =>
        a.id !== alumno.id
          ? a
          : tipo === "aula"
            ? { ...a, tutorAula: elegido }
            : { ...a, familia: elegido },
      ),
    );
    setGuardadoId(alumno.id);
    setEdicion(null);
  }

  const nombreCompleto = (a: AlumnoConVinculos) =>
    [a.nombre, a.apellidos].filter(Boolean).join(" ");

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Tutores y familias
      </Text>
      <Text style={estilos.subtitulo}>
        Cada estudiante tiene un tutor de aula y, como mucho, una familia. Solo administración
        cambia estos vínculos.
      </Text>

      {cargando && <Text style={estilos.estado}>Cargando estudiantes…</Text>}

      {errorCarga && (
        <View style={estilos.filaError}>
          <Text style={estilos.error} accessibilityRole="alert">
            ⚠️ {errorCarga}
          </Text>
          <Boton texto="Reintentar" etiqueta="Reintentar la carga" alPulsar={reintentar} />
        </View>
      )}

      {!cargando && !errorCarga && alumnos.length === 0 && (
        <Text style={estilos.estado}>Todavía no hay estudiantes dados de alta.</Text>
      )}

      {!cargando && !errorCarga && (
        <ScrollView contentContainerStyle={estilos.lista}>
          {alumnos.map((a) => (
            <View key={a.id} style={estilos.fila} testID={`fila-${a.id}`}>
              <View style={estilos.columnaAlumno}>
                <Text style={estilos.nombre}>{nombreCompleto(a)}</Text>
                <Text style={estilos.detalle}>{a.aula ?? "Sin aula"}</Text>
                {a.requiereTutorPresencial && (
                  <Text style={estilos.distintivo}>⚠️ Requiere tutor presencial</Text>
                )}
                {guardadoId === a.id && (
                  <Text style={estilos.guardado} accessibilityLiveRegion="polite">
                    ✓ Guardado
                  </Text>
                )}
              </View>

              <Vinculo
                titulo="Tutor de aula"
                valor={a.tutorAula?.nombre ?? "Sin asignar"}
                etiquetaBoton={`Cambiar tutor de aula de ${nombreCompleto(a)}`}
                alCambiar={() => abrir(a, "aula")}
              />
              <Vinculo
                titulo="Familia"
                valor={a.familia?.nombre ?? "Sin familia"}
                etiquetaBoton={`Cambiar familia de ${nombreCompleto(a)}`}
                alCambiar={() => abrir(a, "familiar")}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {edicion && (
        <ModalElegirSupervisor
          visible
          titulo={`${edicion.tipo === "aula" ? "Tutor de aula" : "Familia"} de ${nombreCompleto(edicion.alumno)}`}
          opciones={edicion.tipo === "aula" ? tutores : familias}
          actualId={
            (edicion.tipo === "aula" ? edicion.alumno.tutorAula : edicion.alumno.familia)?.id ??
            null
          }
          textoSinAsignar={edicion.tipo === "familiar" ? "Sin familia" : undefined}
          guardando={guardando}
          error={errorGuardar}
          alElegir={elegir}
          alCerrar={() => setEdicion(null)}
        />
      )}
    </View>
  );
}

function Vinculo(props: {
  titulo: string;
  valor: string;
  etiquetaBoton: string;
  alCambiar: () => void;
}) {
  return (
    <View style={estilos.columnaVinculo}>
      <Text style={estilos.detalle}>{props.titulo}</Text>
      <Text style={estilos.valor}>{props.valor}</Text>
      <Boton texto="Cambiar" etiqueta={props.etiquetaBoton} alPulsar={props.alCambiar} />
    </View>
  );
}

function Boton(props: { texto: string; etiqueta: string; alPulsar: () => void }) {
  return (
    <Pressable
      style={estilos.boton}
      accessibilityRole="button"
      accessibilityLabel={props.etiqueta}
      onPress={props.alPulsar}
    >
      <Text style={estilos.textoBoton}>{props.texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: C.fondo, padding: 16, gap: 12 },
  titulo: { fontSize: 28, fontWeight: "700", color: C.tinta },
  subtitulo: { fontSize: 16, color: C.secundario, maxWidth: 760 },
  estado: { fontSize: 18, color: C.secundario },
  filaError: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  error: { fontSize: 16, fontWeight: "700", color: C.error },
  lista: { gap: 10, paddingBottom: 24 },
  fila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.linea,
    backgroundColor: C.tarjeta,
  },
  columnaAlumno: { flexGrow: 1, flexBasis: 220, gap: 4 },
  columnaVinculo: { flexGrow: 1, flexBasis: 200, gap: 4 },
  nombre: { fontSize: 20, fontWeight: "700", color: C.tinta },
  detalle: { fontSize: 15, color: C.secundario },
  valor: { fontSize: 18, fontWeight: "600", color: C.tinta },
  distintivo: { fontSize: 15, fontWeight: "700", color: C.error },
  guardado: { fontSize: 15, fontWeight: "700", color: C.exito },
  boton: {
    alignSelf: "flex-start",
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: C.primario,
  },
  textoBoton: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
});
