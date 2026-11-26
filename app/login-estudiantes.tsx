// Acceso del alumnado (HU-01). Es la primera pantalla de la app: ya no hay pantalla de bienvenida,
// que era un toque más para quien tiene dificultades motoras. Tres pasos, cada uno a pantalla
// completa y sin scroll:
//   1. ¿Cuál es tu clase?  → toca la forma de la clase. Desde aquí entran también los adultos.
//      (pantallas 01 y 01b: 9 clases por página y «Más aulas», MOD HU-01 · SCRUM-247)
//   2. Clase Triángulo     → busca tu foto o dibujo y tócalo.
//      (pantallas 02 y 02b: 9 alumnos por página y «Más alumnos»)
//   3. ¿Eres Alejandro?    → toca tus 3 dibujos y pulsa «Entrar».
// «Atrás» y «Adelante» van siempre en la barra de abajo (componente Pantalla).
// Sin «Ayuda» en estos tres pasos (petición de la profesora): el hueco de la izquierda se queda
// vacío para que las flechas no se muevan de sitio.
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import {
  CLASES,
  ESTUDIANTES_MOCK,
  Estudiante,
  Clase,
  LONGITUD_SECUENCIA_DIBUJOS,
} from "../src/tipos/estudiante";
import {
  AvatarEstudiante,
  CredencialDibujos,
  CuadriculaEstudiantes,
  CuadriculaPaginada,
} from "../src/componentes/autenticacion";
import { signInEstudianteConDibujos } from "../src/servicios/authService";
import { destinoTrasLoginAlumno } from "../src/servicios/destinoAgendaAlumno";
import { reproducirSonido } from "../src/servicios/sonidos";
import {
  obtenerAlumnoTableta,
  olvidarAlumnoTableta,
  recordarAlumnoTableta,
} from "../src/servicios/tabletaPersonal";
import type { AuthResult } from "../src/tipos/auth";
import type { Paleta } from "../src/temas";
import { Pantalla } from "../src/pantalla";
import {
  FormaClase,
  Icono,
  LogoColegio,
  PictogramaInterfaz,
  Texto,
  useApariencia,
  useEstilos,
} from "../src/ui";

// Mensaje del prototipo (pantalla 04): amable y sin decir si el alumno existe (RF1.8)
const MENSAJE_SECUENCIA_INCORRECTA = "No es esa. Prueba otra vez";

export interface LoginEstudiantesScreenProps {
  /**
   * Callback opcional para conectar con SCRUM-51 (Jaime / signInEstudianteConDibujos).
   * Recibe el identificador del alumno y el array con los 3 dibujos seleccionados.
   */
  alCompletarCredencialVisual?: (
    alumnoId: string,
    secuenciaDibujos: string[],
  ) => Promise<void> | void;
  /**
   * Modo tableta personal (T-01.3): la tableta recuerda al último alumno que entró y abre
   * directamente su contraseña de 3 dibujos. En tabletas compartidas del aula se deja a false.
   */
  modoTabletaPersonal?: boolean;
}

export default function LoginEstudiantesScreen({
  alCompletarCredencialVisual,
  modoTabletaPersonal = process.env.EXPO_PUBLIC_MODO_TABLETA_PERSONAL === "true",
}: LoginEstudiantesScreenProps = {}) {
  const router = useRouter();
  const { colores } = useApariencia();
  const e = useEstilos(crearEstilos);
  const [clase, setClase] = useState<Clase | null>(null);
  // Clase de la que se acaba de volver: «Adelante» lleva otra vez a ella.
  const [claseAnterior, setClaseAnterior] = useState<Clase | null>(null);
  const [alumno, setAlumno] = useState<Estudiante | null>(null);
  const [secuencia, setSecuencia] = useState<string[]>([]);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [comprobando, setComprobando] = useState(false);
  // Página de clases y de alumnos que se ve (0 = la primera), para «Página 2» y para volver a ella
  const [paginaClases, setPaginaClases] = useState(0);
  const [paginaAlumnos, setPaginaAlumnos] = useState(0);

  const alumnosDeClase = clase ? ESTUDIANTES_MOCK.filter((s) => s.claseId === clase.id) : [];

  // Modo tableta personal: si la tableta recuerda a un alumno, se abre directamente su contraseña
  useEffect(() => {
    if (!modoTabletaPersonal) return;
    let montado = true;
    obtenerAlumnoTableta().then((alumnoId) => {
      const recordado = ESTUDIANTES_MOCK.find((x) => x.id === alumnoId);
      if (!montado || !recordado) return;
      setClase(Object.values(CLASES).find((c) => c.id === recordado.claseId) ?? null);
      setAlumno(recordado);
    });
    return () => {
      montado = false;
    };
  }, [modoTabletaPersonal]);

  const elegirClase = (c: Clase) => {
    reproducirSonido("toque"); // T-01.3: feedback sonoro al pulsar
    setPaginaAlumnos(0);
    setClase(c);
  };

  // La tarjeta de la foto ya suena al tocarla (TarjetaEstudiante)
  const elegirAlumno = (a: Estudiante) => {
    setMensajeError(null);
    setSecuencia([]);
    setAlumno(a);
  };

  const cambiarSecuencia = (nueva: string[]) => {
    // Al volver a tocar dibujos tras un fallo, el aviso ya ha cumplido: se quita.
    if (nueva.length > secuencia.length) setMensajeError(null);
    setSecuencia(nueva);
  };

  // «No soy yo»: la tableta deja de recordar a este alumno y se vuelve a las fotos de la clase.
  const noSoyYo = () => {
    if (modoTabletaPersonal) void olvidarAlumnoTableta();
    setMensajeError(null);
    setSecuencia([]);
    setAlumno(null);
  };

  const volverAClases = () => {
    setClaseAnterior(clase);
    setClase(null);
    setAlumno(null);
  };

  const entrar = async () => {
    if (!alumno || secuencia.length !== LONGITUD_SECUENCIA_DIBUJOS || comprobando) return;
    reproducirSonido("acierto");
    const dibujos = secuencia;

    if (alCompletarCredencialVisual) {
      if (modoTabletaPersonal) await recordarAlumnoTableta(alumno.id);
      await alCompletarCredencialVisual(alumno.id, dibujos);
      return;
    }

    // SCRUM-51: Supabase Auth comprueba la secuencia; la app nunca conoce la correcta
    setComprobando(true);
    let resultado: AuthResult | null = null;
    try {
      resultado = await signInEstudianteConDibujos(alumno.id, dibujos);
    } catch {
      // Sin conexión u otro fallo: para el alumno es igual que una secuencia incorrecta
      resultado = null;
    }
    setComprobando(false);

    if (!resultado?.success) {
      setMensajeError(MENSAJE_SECUENCIA_INCORRECTA);
      setSecuencia([]);
      return;
    }

    setMensajeError(null);
    // La tableta solo recuerda al alumno cuando ha entrado de verdad
    if (modoTabletaPersonal) await recordarAlumnoTableta(alumno.id);
    // SCRUM-227: a SU agenda con sus datos, semanal o diaria según su preferencia (HU-01 → HU-06).
    // replace: con «atrás» no se vuelve a la pantalla de acceso
    router.replace((await destinoTrasLoginAlumno(alumno.id)) as Href);
  };

  // ---- Paso 3: contraseña de 3 dibujos ----
  if (clase && alumno) {
    const completa = secuencia.length === LONGITUD_SECUENCIA_DIBUJOS;
    return (
      <Pantalla
        titulo={`¿Eres ${alumno.nombre}?`}
        simbolo={<AvatarEstudiante estudiante={alumno} />}
        alAtras={noSoyYo}
        etiquetaAtras="Atrás: no soy yo, volver a las fotos de la clase"
        alAdelante={completa && !comprobando ? () => void entrar() : null}
        etiquetaAdelante="Adelante: entrar"
        conSonido
        sinAyuda
      >
        <CredencialDibujos
          estudiante={alumno}
          secuencia={secuencia}
          alCambiarSecuencia={cambiarSecuencia}
          alEntrar={() => void entrar()}
          mensajeError={mensajeError}
          comprobando={comprobando}
        />
      </Pantalla>
    );
  }

  // ---- Paso 2: fotos de la clase ----
  if (clase) {
    return (
      <Pantalla
        titulo={`Clase ${clase.nombre}`}
        simbolo={<FormaClase claseId={clase.id} simbolo={clase.simbolo} tam={40} />}
        alAtras={volverAClases}
        etiquetaAtras="Atrás: elegir otra clase"
        conSonido
        sinAyuda
      >
        <View style={e.paso}>
          {/* Instrucción: texto con dibujo, sin borde ni fondo para que no parezca un botón */}
          <Instruccion texto="Busca tu foto o tu dibujo y tócalo" pagina={paginaAlumnos} />
          <CuadriculaEstudiantes
            key={clase.id}
            estudiantes={alumnosDeClase}
            alSeleccionarEstudiante={elegirAlumno}
            paginaInicial={paginaAlumnos}
            alCambiarPagina={setPaginaAlumnos}
          />
        </View>
      </Pantalla>
    );
  }

  // ---- Paso 1: elegir clase (primera pantalla de la app) ----
  return (
    <Pantalla
      titulo="¿Cuál es tu clase?"
      simbolo={<PictogramaInterfaz nombre="colegio" etiqueta="colegio" tam={48} />}
      derecha={<LogoColegio ancho={190} />}
      alAtras={null}
      alAdelante={claseAnterior ? () => setClase(claseAnterior) : null}
      etiquetaAdelante={claseAnterior ? `Adelante: clase ${claseAnterior.nombre}` : undefined}
      conSonido
      sinAyuda
    >
      <View style={e.paso}>
        <Instruccion texto="Toca la forma de tu clase" pagina={paginaClases} />

        <CuadriculaPaginada
          elementos={Object.values(CLASES)}
          clave={(c) => c.id}
          queHayMas="aulas"
          paginaInicial={paginaClases}
          alCambiarPagina={setPaginaClases}
          testID="selector-clases-estudiante"
          pintar={(c) => (
            <TouchableOpacity
              style={e.tarjetaClase}
              accessibilityRole="button"
              accessibilityLabel={`Clase ${c.nombre}`}
              testID={`tarjeta-clase-${c.id}`}
              onPress={() => elegirClase(c)}
            >
              <FormaClase claseId={c.id} simbolo={c.simbolo} tam={52} />
              <Texto style={e.nombreClase}>Clase {c.nombre}</Texto>
            </TouchableOpacity>
          )}
        />

        {/* Los adultos (tutores, familias, administración y cocina) entran desde aquí */}
        <TouchableOpacity
          style={e.accesoAdultos}
          onPress={() => {
            reproducirSonido("toque");
            router.push("/login");
          }}
          accessibilityRole="button"
          accessibilityLabel="Acceso para tutores, familias, administración y cocina"
          testID="btn-acceso-supervisores"
        >
          <Icono nombre="llave" color={colores.primario} tam={26} />
          <Texto style={e.textoAdultos}>Tutores, familias, administración y cocina</Texto>
        </TouchableOpacity>
      </View>
    </Pantalla>
  );
}

/**
 * Instrucción de los pasos 1 y 2: dibujo de «tocar» y texto, sin borde ni fondo para que no parezca
 * un botón. En las páginas siguientes, la marca «Página 2» (pantallas 01b y 02b).
 */
function Instruccion({ texto, pagina }: { texto: string; pagina: number }) {
  const e = useEstilos(crearEstilos);
  return (
    <View style={e.instruccion}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <PictogramaInterfaz nombre="tocar" etiqueta="tocar" tam={52} />
      </View>
      <Texto style={e.textoInstruccion}>{texto}</Texto>
      {pagina > 0 ? (
        <View style={e.marcaPagina} testID="marca-pagina">
          <Texto style={e.textoMarcaPagina}>{`Página ${pagina + 1}`}</Texto>
        </View>
      ) : null}
    </View>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    paso: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      padding: 20,
    },
    instruccion: { flexDirection: "row", alignItems: "center", gap: 14 },
    textoInstruccion: { fontSize: 26, fontWeight: "700", color: c.texto },
    marcaPagina: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.primario,
      backgroundColor: c.superficieDestacada,
    },
    textoMarcaPagina: { fontSize: 16, fontWeight: "700", color: c.primario },
    // Tarjeta horizontal de la pantalla 01: forma (o dibujo) a la izquierda y nombre a la derecha
    tarjetaClase: {
      width: "100%",
      minHeight: 120,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    nombreClase: { fontSize: 22, fontWeight: "700", color: c.texto, flexShrink: 1 },
    accesoAdultos: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    textoAdultos: { fontSize: 17, fontWeight: "700", color: c.texto },
  });
