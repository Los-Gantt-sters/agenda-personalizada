import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AuthResult } from "../../tipos/auth";
import { DIBUJOS_ACCESO, LONGITUD_SECUENCIA, type DibujoAcceso } from "../../tipos/dibujosAcceso";

// Paleta clara del prototipo (.pal-clara)
const COLORES = {
  fondo: "#f4f7fb",
  tarjeta: "#ffffff",
  tinta: "#14213d",
  acento: "#1f5fa8",
  aviso: "#e3edfb",
  linea: "#c6d1e2",
};

const LADO_DIBUJO = 112;
const SEPARACION = 14;

type Props = {
  alumnoId: string;
  /** Nombre y dibujo del alumno, para que vea que está entrando con su perfil. */
  nombre: string;
  icono: string;
  /** Comprueba la secuencia en el servidor (signInEstudianteConDibujos de authService). */
  iniciarSesion: (alumnoId: string, secuenciaDibujos: string[]) => Promise<AuthResult>;
  /** Se llama cuando la secuencia es correcta. */
  alEntrar: (resultado: AuthResult) => void;
  /** «No soy yo»: vuelve a la cuadrícula de alumnos. */
  alVolver: () => void;
};

/**
 * Acceso del alumnado tocando 3 dibujos en orden (HU-01, T-01.2; prototipo 03 y 04).
 * Al tocar el tercer dibujo se comprueba solo, sin botón «Entrar», para que no haga falta leer.
 * Si falla, avisa con un mensaje amable y se vuelve a empezar; nunca dice si el alumno existe.
 */
export function SecuenciaDibujos({
  alumnoId,
  nombre,
  icono,
  iniciarSesion,
  alEntrar,
  alVolver,
}: Props) {
  const [secuencia, setSecuencia] = useState<DibujoAcceso[]>([]);
  const [comprobando, setComprobando] = useState(false);
  const [error, setError] = useState(false);

  async function comprobar(dibujos: DibujoAcceso[]) {
    setComprobando(true);
    let resultado: AuthResult | null = null;
    try {
      resultado = await iniciarSesion(
        alumnoId,
        dibujos.map((d) => d.nombre),
      );
    } catch {
      // Sin conexión u otro fallo: para el alumno es igual que una secuencia incorrecta
      resultado = null;
    }
    setComprobando(false);

    if (resultado?.success) {
      alEntrar(resultado);
      return;
    }
    setSecuencia([]);
    setError(true);
  }

  function tocarDibujo(dibujo: DibujoAcceso) {
    if (comprobando || secuencia.length >= LONGITUD_SECUENCIA) return;
    const nueva = [...secuencia, dibujo];
    setSecuencia(nueva);
    setError(false);
    if (nueva.length === LONGITUD_SECUENCIA) void comprobar(nueva);
  }

  function borrar() {
    setSecuencia((actual) => actual.slice(0, -1));
    setError(false);
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <View style={estilos.alumno}>
          <Text
            style={estilos.iconoAlumno}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {icono}
          </Text>
          <Text style={estilos.nombre}>{nombre}</Text>
        </View>
        <Pressable
          style={estilos.botonSecundario}
          accessibilityRole="button"
          accessibilityLabel="No soy yo"
          onPress={alVolver}
        >
          <Text style={estilos.textoBotonSecundario}>⬅ No soy yo</Text>
        </Pressable>
      </View>

      <Text style={estilos.instruccion} accessibilityRole="header">
        🔑 Toca tus 3 dibujos en orden
      </Text>

      {/* Se muestran puntos y no los dibujos, para que nadie vea la secuencia por encima del hombro */}
      <View
        style={estilos.huecos}
        accessible
        accessibilityLabel={`${secuencia.length} de ${LONGITUD_SECUENCIA} dibujos`}
      >
        {Array.from({ length: LONGITUD_SECUENCIA }, (_, i) => (
          <View
            key={i}
            style={[
              estilos.hueco,
              i === secuencia.length && !comprobando && estilos.huecoSiguiente,
            ]}
          >
            {i < secuencia.length && <Text style={estilos.punto}>●</Text>}
          </View>
        ))}
      </View>

      {error && (
        <Text style={estilos.aviso} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          🔁 No es esa. Prueba otra vez
        </Text>
      )}

      <View style={estilos.rejilla}>
        {DIBUJOS_ACCESO.map((dibujo) => (
          <Pressable
            key={dibujo.nombre}
            style={({ pressed }) => [
              estilos.dibujo,
              pressed && estilos.dibujoPulsado,
              comprobando && estilos.desactivado,
            ]}
            accessibilityRole="button"
            accessibilityLabel={dibujo.etiqueta}
            accessibilityState={{ disabled: comprobando }}
            disabled={comprobando}
            onPress={() => tocarDibujo(dibujo)}
          >
            <Text style={estilos.emoji}>{dibujo.emoji}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[estilos.botonSecundario, secuencia.length === 0 && estilos.desactivado]}
        accessibilityRole="button"
        accessibilityLabel="Borrar el último dibujo"
        accessibilityState={{ disabled: secuencia.length === 0 || comprobando }}
        disabled={secuencia.length === 0 || comprobando}
        onPress={borrar}
      >
        <Text style={estilos.textoBotonSecundario}>⌫ Borrar</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 16,
    backgroundColor: COLORES.fondo,
  },
  cabecera: {
    width: "100%",
    maxWidth: 760,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  alumno: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconoAlumno: { fontSize: 52 },
  nombre: { fontSize: 28, fontWeight: "700", color: COLORES.tinta },
  instruccion: { fontSize: 26, fontWeight: "700", color: COLORES.tinta, textAlign: "center" },
  huecos: { flexDirection: "row", gap: SEPARACION },
  hueco: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.tarjeta,
    alignItems: "center",
    justifyContent: "center",
  },
  huecoSiguiente: { borderColor: COLORES.acento, borderStyle: "dashed" },
  punto: { fontSize: 30, color: COLORES.acento },
  aviso: {
    backgroundColor: COLORES.aviso,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: COLORES.acento,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: "700",
    color: COLORES.tinta,
  },
  rejilla: {
    width: LADO_DIBUJO * 3 + SEPARACION * 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SEPARACION,
  },
  dibujo: {
    width: LADO_DIBUJO,
    height: LADO_DIBUJO,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.tarjeta,
    alignItems: "center",
    justifyContent: "center",
  },
  dibujoPulsado: { borderColor: COLORES.acento, backgroundColor: COLORES.aviso },
  emoji: { fontSize: 64 },
  botonSecundario: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.tarjeta,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonSecundario: { fontSize: 18, fontWeight: "700", color: COLORES.tinta },
  desactivado: { opacity: 0.5 },
});
