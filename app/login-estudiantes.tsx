// Acceso del alumnado (HU-01). Es la primera pantalla de la app: ya no hay pantalla de bienvenida,
// que era un toque más para quien tiene dificultades motoras. Tres pasos, cada uno a pantalla
// completa y sin scroll:
//   1. ¿Cuál es tu clase?  → toca la forma de la clase. Desde aquí entran también los adultos.
//   2. Clase Triángulo     → busca tu foto o dibujo y tócalo.
//   3. ¿Eres Alejandro?    → toca tus 3 dibujos y pulsa «Entrar».
// «Atrás» y «Adelante» van siempre en la barra de abajo (componente Pantalla).
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

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
} from "../src/componentes/autenticacion";
import { signInEstudianteConDibujos } from "../src/servicios/authService";
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
// Agenda estructurada del alumno (HU-06)
const RUTA_AGENDA_ESTUDIANTE = "/agenda";

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
    // replace: con «atrás» no se vuelve a la pantalla de acceso
    router.replace(RUTA_AGENDA_ESTUDIANTE);
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
      >
        <View style={e.paso}>
          {/* Instrucción: texto con dibujo, sin borde ni fondo para que no parezca un botón */}
          <View style={e.instruccion}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <PictogramaInterfaz nombre="tocar" etiqueta="tocar" tam={52} />
            </View>
            <Texto style={e.textoInstruccion}>Busca tu foto o tu dibujo y tócalo</Texto>
          </View>
          <CuadriculaEstudiantes
            estudiantes={alumnosDeClase}
            alSeleccionarEstudiante={elegirAlumno}
            tamanioMinimoTarjeta={150}
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
    >
      <View style={e.paso}>
        <View style={e.instruccion}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <PictogramaInterfaz nombre="tocar" etiqueta="tocar" tam={52} />
          </View>
          <Texto style={e.textoInstruccion}>Toca la forma de tu clase</Texto>
        </View>

        <View style={e.clases} testID="selector-clases-estudiante">
          {Object.values(CLASES).map((c) => (
            <TouchableOpacity
              key={c.id}
              style={e.tarjetaClase}
              accessibilityRole="button"
              accessibilityLabel={`Clase ${c.nombre}`}
              testID={`tarjeta-clase-${c.id}`}
              onPress={() => elegirClase(c)}
            >
              <FormaClase claseId={c.id} simbolo={c.simbolo} tam={96} />
              <Texto style={e.nombreClase}>Clase {c.nombre}</Texto>
            </TouchableOpacity>
          ))}
        </View>

        {/* Los adultos (tutores, familias, administración) entran desde aquí, sin pantalla aparte */}
        <TouchableOpacity
          style={e.accesoAdultos}
          onPress={() => {
            reproducirSonido("toque");
            router.push("/login");
          }}
          accessibilityRole="button"
          accessibilityLabel="Acceso para tutores, familias y administración"
          testID="btn-acceso-supervisores"
        >
          <Icono nombre="llave" color={colores.primario} tam={26} />
          <Texto style={e.textoAdultos}>Tutores, familias y administración</Texto>
        </TouchableOpacity>
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Paleta) =>
  StyleSheet.create({
    paso: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: 20,
    },
    instruccion: { flexDirection: "row", alignItems: "center", gap: 14 },
    textoInstruccion: { fontSize: 26, fontWeight: "700", color: c.texto },
    clases: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 24,
      justifyContent: "center",
    },
    tarjetaClase: {
      width: 230,
      minHeight: 210,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    nombreClase: { fontSize: 22, fontWeight: "700", color: c.texto, textAlign: "center" },
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
