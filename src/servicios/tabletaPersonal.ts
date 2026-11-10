// Modo tableta personal (HU-01, T-01.3 · SCRUM-52).
// Si la tableta es de un solo alumno, se recuerda quién entró la última vez para abrir
// directamente su credencial de 3 dibujos, sin pasar por la clase ni la cuadrícula de fotos.
// Se sigue pidiendo la credencial: recordar al alumno no es iniciar sesión sin ella.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE = "tuagendita:tableta-personal:alumnoId";

export async function obtenerAlumnoTableta(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CLAVE);
  } catch {
    return null; // Sin almacenamiento disponible: se usa el flujo normal de tableta compartida
  }
}

export async function recordarAlumnoTableta(alumnoId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE, alumnoId);
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
