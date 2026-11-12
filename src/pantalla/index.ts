// Pantalla común (cabecera + barra inferior con Ayuda, Atrás, Adelante y Accesibilidad) y el panel
// de los adultos. Va aparte de src/ui porque usa piezas de necesidades y preferencias, que a su vez
// usan src/ui.
export { ALTO_BOTON_BARRA, Pantalla } from "./Pantalla";
export type { PantallaProps } from "./Pantalla";
export { PanelAdulto } from "./PanelAdulto";
export type { AccesoPanel } from "./PanelAdulto";
