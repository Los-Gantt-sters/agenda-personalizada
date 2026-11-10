// Supresión de barras de scroll y elementos de distracción en la agenda del alumno (T-06.4, HU-06).
// RNF4.1: la vista diaria no tiene barras de desplazamiento ni elementos accesorios.
//
// En la app nativa la vista ya no usa ScrollView y solo pinta las tarjetas que caben (T-06.1).
// En web (React Native Web en Vercel) el navegador añade cosas que distraen o estorban al gesto de
// «mantener pulsado»: barras de scroll, rebote al arrastrar, selección de texto, menú contextual,
// resaltado azul al tocar y zoom con doble toque. Este módulo las quita SOLO mientras la pantalla
// de la agenda está abierta; al salir (login de tutores, preferencias...) todo vuelve a ser normal.
// El zoom con dos dedos se mantiene a propósito (WCAG 1.4.4, alumnado con baja visión).
import { useEffect } from "react";
import { Platform } from "react-native";

export const ID_ESTILO_SIN_DISTRACCIONES = "agenda-sin-distracciones";

export const CSS_SIN_DISTRACCIONES = `
html, body, #root { height: 100%; width: 100%; margin: 0; overflow: hidden; }
html, body { overscroll-behavior: none; }
* { scrollbar-width: none; -ms-overflow-style: none; }
*::-webkit-scrollbar { display: none; width: 0; height: 0; }
body {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
:focus:not(:focus-visible) { outline: none; }
:focus-visible { outline: 4px solid #2B6CB0; outline-offset: 3px; }
`;

/** Lo mínimo del `document` del navegador que se usa (así se puede probar sin navegador). */
export interface DocumentoMinimo {
  head: { appendChild(n: unknown): unknown };
  getElementById(id: string): { remove(): void } | null;
  createElement(etiqueta: "style"): { id: string; textContent: string | null; remove(): void };
  addEventListener(tipo: "contextmenu", f: (e: { preventDefault(): void }) => void): void;
  removeEventListener(tipo: "contextmenu", f: (e: { preventDefault(): void }) => void): void;
}

const sinMenuContextual = (e: { preventDefault(): void }) => e.preventDefault();

/** Aplica el modo sin distracciones al documento y devuelve la función que lo deshace. */
export function aplicarModoSinDistracciones(doc: DocumentoMinimo): () => void {
  if (doc.getElementById(ID_ESTILO_SIN_DISTRACCIONES)) return () => {};
  const estilo = doc.createElement("style");
  estilo.id = ID_ESTILO_SIN_DISTRACCIONES;
  estilo.textContent = CSS_SIN_DISTRACCIONES;
  doc.head.appendChild(estilo);
  // Sin menú al hacer clic derecho o mantener pulsado (estorbaría a «He terminado»).
  doc.addEventListener("contextmenu", sinMenuContextual);

  return () => {
    estilo.remove();
    doc.removeEventListener("contextmenu", sinMenuContextual);
  };
}

/** Activa el modo sin distracciones mientras el componente que lo usa está en pantalla (solo web). */
export function useModoSinDistracciones(): void {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    return aplicarModoSinDistracciones(document as unknown as DocumentoMinimo);
  }, []);
}
