// Consola de administración: asignar tutor de aula y familia a cada estudiante (HU-03, SCRUM-61).
// Prototipo de referencia: 61-administracion-usuarios (vínculos) y 46-tutora-ficha-datos.
// Como todas las pantallas, con cabecera y barra de abajo (Pantalla). Es una herramienta de adultos
// con una lista que puede ser larga: aquí sí se deja hacer scroll dentro de la lista.
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { ModalElegirSupervisor } from "../../src/componentes/administracion/ModalElegirSupervisor";
import { Pantalla } from "../../src/pantalla";
import { useSesionOpcional } from "../../src/sesion";
import type { Paleta } from "../../src/temas";
import { Icono, Texto, useApariencia, useEstilos } from "../../src/ui";
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
  const { colores } = useApariencia();
  const estilos = useEstilos(crearEstilos);
  const router = useRouter();
  const sesion = useSesionOpcional();
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

  const cerrarSesion = async () => {
    await sesion?.cerrarSesion();
    router.replace("/");
  };

  return (
    <Pantalla
      titulo="Tutores y familias"
      simbolo={<Icono nombre="personas" color={colores.primario} tam={36} />}
      derecha={
        sesion ? (
          <Pressable
            style={estilos.botonSalir}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => void cerrarSesion()}
          >
            <Icono nombre="salir" color={colores.primario} tam={24} />
            <Texto style={estilos.textoSalir}>Cerrar sesión</Texto>
          </Pressable>
        ) : null
      }
    >
      <View style={estilos.pantalla}>
        <Texto style={estilos.subtitulo}>
          Cada estudiante tiene un tutor de aula y, como mucho, una familia. Solo administración
          cambia estos vínculos.
        </Texto>

        {cargando && <Texto style={estilos.estado}>Cargando estudiantes…</Texto>}

        {errorCarga && (
          <View style={estilos.filaError}>
            <Icono nombre="alerta" color={colores.peligro} tam={22} />
            <Texto style={estilos.error} accessibilityRole="alert">
              {errorCarga}
            </Texto>
            <Boton texto="Reintentar" etiqueta="Reintentar la carga" alPulsar={reintentar} />
          </View>
        )}

        {!cargando && !errorCarga && alumnos.length === 0 && (
          <Texto style={estilos.estado}>Todavía no hay estudiantes dados de alta.</Texto>
        )}

        {!cargando && !errorCarga && (
          <ScrollView contentContainerStyle={estilos.lista}>
            {alumnos.map((a) => (
              <View key={a.id} style={estilos.fila} testID={`fila-${a.id}`}>
                <View style={estilos.columnaAlumno}>
                  <Texto style={estilos.nombre}>{nombreCompleto(a)}</Texto>
                  <Texto style={estilos.detalle}>{a.aula ?? "Sin aula"}</Texto>
                  {a.requiereTutorPresencial && (
                    <View style={estilos.filaIcono}>
                      <Icono nombre="alerta" color={colores.aviso} tam={20} />
                      <Texto style={estilos.distintivo}>Requiere tutor presencial</Texto>
                    </View>
                  )}
                  {guardadoId === a.id && (
                    <View style={estilos.filaIcono}>
                      <Icono nombre="check" color={colores.exito} tam={20} grosor={3} />
                      <Texto style={estilos.guardado} accessibilityLiveRegion="polite">
                        Guardado
                      </Texto>
                    </View>
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
    </Pantalla>
  );
}

function Vinculo(props: {
  titulo: string;
  valor: string;
  etiquetaBoton: string;
  alCambiar: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.columnaVinculo}>
      <Texto style={estilos.detalle}>{props.titulo}</Texto>
      <Texto style={estilos.valor}>{props.valor}</Texto>
      <Boton texto="Cambiar" etiqueta={props.etiquetaBoton} alPulsar={props.alCambiar} />
    </View>
  );
}

function Boton(props: { texto: string; etiqueta: string; alPulsar: () => void }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <Pressable
      style={estilos.boton}
      accessibilityRole="button"
      accessibilityLabel={props.etiqueta}
      onPress={props.alPulsar}
    >
      <Texto style={estilos.textoBoton}>{props.texto}</Texto>
    </Pressable>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: c.fondo, padding: 16, gap: 12 },
    botonSalir: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.primario,
    },
    textoSalir: { fontSize: 16, fontWeight: "700", color: c.primario },
    subtitulo: { fontSize: 16, color: c.textoSecundario, maxWidth: 760 },
    estado: { fontSize: 18, color: c.textoSecundario },
    filaError: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
    error: { fontSize: 16, fontWeight: "700", color: c.peligro },
    lista: { gap: 10, paddingBottom: 24 },
    fila: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    columnaAlumno: { flexGrow: 1, flexBasis: 220, gap: 4 },
    columnaVinculo: { flexGrow: 1, flexBasis: 200, gap: 4 },
    nombre: { fontSize: 20, fontWeight: "700", color: c.texto },
    detalle: { fontSize: 15, color: c.textoSecundario },
    valor: { fontSize: 18, fontWeight: "700", color: c.texto },
    filaIcono: { flexDirection: "row", alignItems: "center", gap: 6 },
    distintivo: { fontSize: 15, fontWeight: "700", color: c.aviso },
    guardado: { fontSize: 15, fontWeight: "700", color: c.exito },
    boton: {
      alignSelf: "flex-start",
      minHeight: 48,
      minWidth: 48,
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: 10,
      backgroundColor: c.primario,
    },
    textoBoton: { fontSize: 16, fontWeight: "700", color: c.textoSobrePrimario },
  });
