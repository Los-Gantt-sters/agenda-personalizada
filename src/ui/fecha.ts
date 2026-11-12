/** «Jueves, 12 de noviembre»: el día de hoy en Lectura Fácil. */
export function fechaDeHoy(fecha: Date = new Date()): string {
  const texto = fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
