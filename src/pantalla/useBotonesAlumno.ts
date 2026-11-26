// SCRUM-245 · T-ACC.1 (SCRUM-230): qué botones de alumno lleva la barra de abajo. «Ayuda»
// (izquierda) y «Preferencias» (derecha) son SOLO para el alumno con sesión iniciada: nunca en las
// pantallas de entrar (01-05, aún sin sesión) ni con la sesión de un tutor, una familia,
// administración o cocina.
import { useSesionOpcional } from "../sesion/SesionProvider";

export interface BotonesAlumno {
  conAyuda: boolean;
  conPreferencias: boolean;
}

export function useBotonesAlumno(): BotonesAlumno {
  const contexto = useSesionOpcional();
  // Fuera de <SesionProvider> (componentes sueltos y sus pruebas) no hay a quién preguntar: se
  // enseñan los dos, como antes. En la app siempre hay proveedor.
  const esAlumno = contexto === null || contexto.sesion?.user.role === "estudiante";
  return { conAyuda: esAlumno, conPreferencias: esAlumno };
}
