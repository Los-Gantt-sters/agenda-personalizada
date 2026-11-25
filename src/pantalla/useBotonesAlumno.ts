// SCRUM-245 · T-ACC.1 y SCRUM-246 · T-ACC.2 (SCRUM-230): qué botones de alumno lleva la barra de
// abajo. «Ayuda» (izquierda) y «Preferencias» (derecha) son SOLO para el alumno con sesión
// iniciada: nunca en las pantallas de entrar (01-05, aún sin sesión) ni con la sesión de un tutor,
// una familia, administración o cocina. «Preferencias» sale además solo si su tutor lo permite en
// Permisos del alumno (26d).
// Modo demo: con /agenda?alumnoDemo=1 se hace como si hubiera un alumno con sesión iniciada, para
// probar la barra sin una cuenta de alumno en Supabase. Solo sirve sin sesión de nadie.
import { useEffect, useState, useSyncExternalStore } from "react";

import { useSesionOpcional } from "../sesion/SesionProvider";
import { alumnoDeCorreo, obtenerPermisoPreferencias } from "../servicios/permisoPreferencias";

export interface BotonesAlumno {
  conAyuda: boolean;
  conPreferencias: boolean;
}

let alumnoDemo = false;
const oyentesDemo = new Set<() => void>();

/** Activa (o quita) el alumno de demostración mientras la app está abierta. */
export function activarAlumnoDemo(activar = true): void {
  if (alumnoDemo === activar) return;
  alumnoDemo = activar;
  oyentesDemo.forEach((avisar) => avisar());
}

function suscribirDemo(avisar: () => void) {
  oyentesDemo.add(avisar);
  return () => {
    oyentesDemo.delete(avisar);
  };
}

export function useBotonesAlumno(): BotonesAlumno {
  const contexto = useSesionOpcional();
  const demo = useSyncExternalStore(suscribirDemo, () => alumnoDemo);
  // Fuera de <SesionProvider> (componentes sueltos y sus pruebas) no hay a quién preguntar: se
  // enseñan los dos, como antes. En la app siempre hay proveedor.
  const sinProveedor = contexto === null;
  const usuario = contexto?.sesion?.user ?? null;
  const esAlumno =
    sinProveedor || usuario?.role === "estudiante" || (demo && contexto?.sesion == null);
  const alumnoId = esAlumno ? alumnoDeCorreo(usuario?.email) : null;

  const [permiso, setPermiso] = useState<{ alumnoId: string; puede: boolean } | null>(null);
  useEffect(() => {
    if (!alumnoId) return;
    let vivo = true;
    void obtenerPermisoPreferencias(alumnoId).then((puede) => {
      if (vivo) setPermiso({ alumnoId, puede });
    });
    return () => {
      vivo = false;
    };
  }, [alumnoId]);

  // Mientras se comprueba el permiso no sale, para que no aparezca y desaparezca.
  const puedePreferencias = alumnoId ? permiso?.alumnoId === alumnoId && permiso.puede : true;
  return { conAyuda: esAlumno, conPreferencias: esAlumno && puedePreferencias };
}
