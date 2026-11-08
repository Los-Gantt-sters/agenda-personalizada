// Tipos de la ejecución guiada de una tarea (T-08.1, HU-08).
// RF6.4: el refuerzo positivo al terminar se configura en el perfil del estudiante.
// T-08.2 (RNF6.1): también el modo de confirmación contra toques accidentales.

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
  confirmacion: PreferenciasConfirmacion;
}

/**
 * RNF6.1: «mantener» = pulsación mantenida; «simple» = un toque y luego «¿Seguro?» Sí / No
 * (para quien no puede mantener el dedo quieto).
 */
export type ModoConfirmacion = "mantener" | "simple";

export interface PreferenciasConfirmacion {
  modo: ModoConfirmacion;
  /** Tiempo que hay que mantener pulsado en el modo «mantener» (1,5 s por defecto). */
  duracionMantenerMs: number;
  /** Tiempo en que el botón no hace caso al aparecer, para que un mismo toque no valga dos veces. */
  bloqueoAlAparecerMs: number;
}

export const CONFIRMACION_POR_DEFECTO: PreferenciasConfirmacion = {
  modo: "mantener",
  duracionMantenerMs: 1500,
  bloqueoAlAparecerMs: 800,
};

export const PREFERENCIAS_EJECUCION_POR_DEFECTO: PreferenciasEjecucion = {
  refuerzo: { animacion: "check", sonido: true },
  confirmacion: CONFIRMACION_POR_DEFECTO,
};

/** Acción de los botones grandes de la tarea de «Ahora». */
export type AccionTarea = "empezar" | "terminar";
