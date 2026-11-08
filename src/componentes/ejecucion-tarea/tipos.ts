// Tipos de la ejecución guiada de una tarea (T-08.1, HU-08).
// RF6.4: el refuerzo positivo al terminar se configura en el perfil del estudiante.

/** Animación que se enseña al terminar una tarea. */
export type AnimacionRefuerzo = "check" | "estrellas" | "ninguna";

export interface PreferenciasRefuerzo {
  /** «check»: círculo verde con ✓; «estrellas»: además salen estrellas; «ninguna»: sin movimiento. */
  animacion: AnimacionRefuerzo;
  /** Suena un arpegio suave al terminar. */
  sonido: boolean;
}

/**
 * Preferencias de ejecución de tareas del perfil del estudiante.
 * TODO(SCRUM-66): leerlas del panel de preferencias cuando esa rama llegue a main.
 */
export interface PreferenciasEjecucion {
  refuerzo: PreferenciasRefuerzo;
}

export const PREFERENCIAS_EJECUCION_POR_DEFECTO: PreferenciasEjecucion = {
  refuerzo: { animacion: "check", sonido: true },
};

/** Acción de los botones grandes de la tarea de «Ahora». */
export type AccionTarea = "empezar" | "terminar";
