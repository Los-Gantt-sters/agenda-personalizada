// Modo tableta personal (HU-01, T-01.3 · SCRUM-52).
// Si la tableta es de un solo alumno, se recuerda quién entró la última vez para abrir
// directamente su credencial de 3 dibujos, sin pasar por la clase ni la cuadrícula de fotos.
// Se sigue pidiendo la credencial: recordar al alumno no es iniciar sesión sin ella.
import AsyncStorage from "@react-native-async-storage/async-storage";

// SCRUM-249: además del alumno se guarda su aula, porque con la base de datos los alumnos se piden
// aula a aula (alumnos_acceso) y la pantalla tiene que saber en cuál buscarlo.
const CLAVE = "tuagendita:tableta-personal:alumnoId";

export interface AlumnoRecordado {
  alumnoId: string;
  /** Aula del alumno; null en lo guardado antes de SCRUM-249 (solo el id, datos de prueba). */
  aulaId: string | null;
}

/** Lee lo guardado: el JSON de ahora o, si es de antes de SCRUM-249, el id del alumno sin más. */
function leer(valor: string): AlumnoRecordado | null {
  try {
    const datos = JSON.parse(valor);
    if (datos && typeof datos.alumnoId === "string") {
      return {
        alumnoId: datos.alumnoId,
        aulaId: typeof datos.aulaId === "string" ? datos.aulaId : null,
      };
    }
  } catch {
    // No es JSON: es el id guardado por la versión anterior
  }
  return typeof valor === "string" && valor ? { alumnoId: valor, aulaId: null } : null;
}

export async function obtenerAlumnoTableta(): Promise<AlumnoRecordado | null> {
  try {
    const valor = await AsyncStorage.getItem(CLAVE);
    return valor ? leer(valor) : null;
  } catch {
    return null; // Sin almacenamiento disponible: se usa el flujo normal de tableta compartida
  }
}

export async function recordarAlumnoTableta(alumnoId: string, aulaId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE, JSON.stringify({ alumnoId, aulaId }));
  } catch {
    // No recordar no impide entrar
  }
}

export async function olvidarAlumnoTableta(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer
  }
}
