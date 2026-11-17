export { BotonAccesible } from "./BotonAccesible";
export { BotonVistaAccesible } from "./BotonVistaAccesible";
export type { BotonVistaAccesibleProps } from "./BotonVistaAccesible";
export { PantallaVistaAccesible } from "./PantallaVistaAccesible";
export type { PantallaVistaAccesibleProps } from "./PantallaVistaAccesible";
export { estilosApariencia, AREA_TACTIL_MINIMA } from "./estilos";
export type { EstilosApariencia, EstilosBoton } from "./estilos";
export { useFuentesPreferencias } from "./fuentes";
export {
  CAJAS_LETRA,
  FORMAS_BOTON,
  FUENTES,
  MODOS_CANAL,
  NECESIDADES_AYUDA,
  ORDEN_CAJAS_LETRA,
  ORDEN_MODOS_CANAL,
  ORDEN_NECESIDADES_AYUDA,
  ORDEN_TAREAS_VISIBLES,
  ORDEN_VER_RELOJ,
  PREFERENCIAS_POR_DEFECTO,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
  TAREAS_VISIBLES,
  VER_RELOJ,
  normalizarPreferencias,
} from "./opciones";
export type {
  CajaLetra,
  FormaBoton,
  FuenteLetra,
  InfoModoCanal,
  ModoCanal,
  PreferenciasApariencia,
  TamanoBoton,
  TamanoLetra,
  TareasVisibles,
  VerReloj,
} from "./opciones";
export { PanelPreferencias } from "./PanelPreferencias";
export {
  PreferenciasProvider,
  usePreferencias,
  usePreferenciasOpcional,
} from "./PreferenciasProvider";
