import { render, screen } from "@testing-library/react-native";

import {
  CSS_SIN_DISTRACCIONES,
  ID_ESTILO_SIN_DISTRACCIONES,
  aplicarModoSinDistracciones,
  type DocumentoMinimo,
} from "../modoSinDistracciones";
import { AgendaTresBloques, calcularMedidas } from "../AgendaTresBloques";
import { dividirEnBloques } from "../logica";
import type { EntradaAgenda } from "../tipos";

function documentoFalso() {
  const nodos = new Map<string, { remove(): void }>();
  const oyentes = new Set<unknown>();
  const doc = {
    head: {
      appendChild: jest.fn((n: { id: string; remove(): void }) => nodos.set(n.id, n)),
    },
    getElementById: (id: string) => nodos.get(id) ?? null,
    createElement: () => {
      const n = { id: "", textContent: null as string | null, remove: () => nodos.delete(n.id) };
      return n;
    },
    addEventListener: jest.fn((_t: string, f: unknown) => oyentes.add(f)),
    removeEventListener: jest.fn((_t: string, f: unknown) => oyentes.delete(f)),
  };
  return { doc: doc as unknown as DocumentoMinimo, nodos, oyentes };
}

const e = (id: string, hora: string): EntradaAgenda => ({
  id,
  estudiante_id: "al1",
  tarea_id: `t-${id}`,
  fecha: "2026-11-05",
  hora_inicio: hora,
  duracion_prevista_min: 30,
  orden: 0,
  estado: "pendiente",
  tarea: { id: `t-${id}`, titulo: `Tarea ${id}`, emoji: "⭐" },
});

describe("Modo sin distracciones (SCRUM-72: T-06.4 Supresión de barras de scroll y elementos de distracción)", () => {
  it("en web oculta las barras de scroll, la selección de texto y el resaltado al tocar", () => {
    expect(CSS_SIN_DISTRACCIONES).toContain("overflow: hidden");
    expect(CSS_SIN_DISTRACCIONES).toContain("::-webkit-scrollbar { display: none");
    expect(CSS_SIN_DISTRACCIONES).toContain("scrollbar-width: none");
    expect(CSS_SIN_DISTRACCIONES).toContain("user-select: none");
    expect(CSS_SIN_DISTRACCIONES).toContain("-webkit-tap-highlight-color: transparent");
  });

  it("mantiene visible el foco de teclado y no bloquea el zoom con dos dedos (accesibilidad)", () => {
    expect(CSS_SIN_DISTRACCIONES).toContain(":focus-visible { outline: 4px");
    expect(CSS_SIN_DISTRACCIONES).not.toContain("user-scalable");
    expect(CSS_SIN_DISTRACCIONES).toContain("touch-action: manipulation");
  });

  it("se aplica al abrir la agenda y se quita al salir, sin duplicarse", () => {
    const { doc, nodos, oyentes } = documentoFalso();

    const deshacer = aplicarModoSinDistracciones(doc);
    aplicarModoSinDistracciones(doc); // segunda vez: no añade otro estilo
    expect(nodos.has(ID_ESTILO_SIN_DISTRACCIONES)).toBe(true);
    expect(doc.head.appendChild).toHaveBeenCalledTimes(1);
    expect(oyentes.size).toBe(1); // bloquea el menú contextual

    deshacer();
    expect(nodos.has(ID_ESTILO_SIN_DISTRACCIONES)).toBe(false);
    expect(oyentes.size).toBe(0);
  });

  it("la vista de la agenda no usa ScrollView (RNF4.1)", async () => {
    const dia = Array.from({ length: 10 }, (_, i) => e(String(i), `${9 + i}:00`));
    await render(
      <AgendaTresBloques
        bloques={dividirEnBloques(dia, { maxDespues: 9 })}
        onConfirmarFin={() => {}}
        onAbrir={() => {}}
      />,
    );
    const tipos = new Set<string>();
    const recorrer = (n: unknown): void => {
      if (!n || typeof n !== "object") return;
      if (Array.isArray(n)) return n.forEach(recorrer);
      const nodo = n as { type?: string; children?: unknown };
      if (nodo.type) tipos.add(nodo.type);
      recorrer(nodo.children);
    };
    recorrer(screen.toJSON());
    expect(tipos.has("View")).toBe(true);
    expect(tipos.has("RCTScrollView")).toBe(false);
  });

  it.each([
    [1024, 768],
    [768, 1024],
    [390, 844],
  ])(
    "con muchas tareas, a cada lado solo se pintan las que caben en %ix%i (máx. 3)",
    async (w, h) => {
      const m = calcularMedidas(w, h);
      expect(m.maxLado).toBeGreaterThanOrEqual(1);
      expect(m.maxLado).toBeLessThanOrEqual(3);
    },
  );
});
