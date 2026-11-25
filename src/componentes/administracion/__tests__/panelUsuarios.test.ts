import type { UsuarioPanel } from "../../../servicios/usuariosPanelService";
import { filtrarUsuarios, SIN_FILTROS, textoAcceso, textoVinculos } from "../panelUsuarios";

const ALEJANDRO: UsuarioPanel = {
  id: "e1",
  nombre: "Alejandro Pérez",
  rol: "estudiante",
  cursos: ["2026-2027"],
  aulas: ["Clase Triángulo"],
  tutor: "Carmen Ruiz",
  familia: "Familia García",
  menu: "normal",
};
const MIRIAM: UsuarioPanel = {
  id: "e2",
  nombre: "Miriam Núñez",
  rol: "estudiante",
  cursos: ["2025-2026"],
  aulas: ["Clase Círculo"],
  menu: "sin_gluten",
};
const CARMEN: UsuarioPanel = {
  id: "t1",
  nombre: "Carmen Ruiz",
  rol: "tutor",
  email: "carmen.ruiz@purisima.es",
  cursos: ["2026-2027"],
  aulas: ["Clase Triángulo", "Clase Círculo"],
};
const GARCIA: UsuarioPanel = {
  id: "f1",
  nombre: "Familia García",
  rol: "familia",
  email: "familia.garcia@correo.es",
  cursos: ["2026-2027"],
  aulas: ["Clase Triángulo"],
  hijos: [{ nombre: "Alejandro Pérez", aula: "Clase Triángulo" }],
};
const MARTA: UsuarioPanel = {
  id: "m1",
  nombre: "Marta Soler",
  rol: "admin",
  email: "marta@purisima.es",
  cursos: [],
  aulas: [],
};
const TODOS = [ALEJANDRO, MIRIAM, CARMEN, GARCIA, MARTA];

describe("panelUsuarios (pantalla 48)", () => {
  describe("textos de las columnas", () => {
    it("estudiante: aula, tutor y familia, y su menú", () => {
      expect(textoVinculos(ALEJANDRO)).toBe(
        "Clase Triángulo · Tutor: Carmen Ruiz · Familia García",
      );
      expect(textoAcceso(ALEJANDRO)).toBe("Menú Normal");
      expect(textoAcceso(MIRIAM)).toBe("Menú Sin gluten");
    });

    it("estudiante sin tutor ni familia solo enseña el aula", () => {
      expect(textoVinculos(MIRIAM)).toBe("Clase Círculo");
    });

    it("tutor: sus aulas y su correo", () => {
      expect(textoVinculos(CARMEN)).toBe("Aulas: Clase Triángulo y Clase Círculo");
      expect(textoAcceso(CARMEN)).toBe("carmen.ruiz@purisima.es");
    });

    it("familia: a quién está vinculada", () => {
      expect(textoVinculos(GARCIA)).toBe("Vinculada a: Alejandro Pérez (Clase Triángulo)");
    });

    it("administración no enseña correo sino lo que gestiona", () => {
      expect(textoAcceso(MARTA)).toBe("Menús, aulas y vínculos");
    });
  });

  describe("filtrarUsuarios", () => {
    it("sin filtros devuelve todos", () => {
      expect(filtrarUsuarios(TODOS, SIN_FILTROS)).toHaveLength(5);
    });

    it("busca por nombre sin distinguir mayúsculas ni tildes", () => {
      const r = filtrarUsuarios(TODOS, { ...SIN_FILTROS, texto: "nunez" });
      expect(r.map((u) => u.id)).toEqual(["e2"]);
    });

    it("busca por correo, por aula y por dieta", () => {
      expect(filtrarUsuarios(TODOS, { ...SIN_FILTROS, texto: "purisima.es" })).toHaveLength(2);
      expect(filtrarUsuarios(TODOS, { ...SIN_FILTROS, texto: "círculo" }).map((u) => u.id)).toEqual(
        ["e2", "t1"],
      );
      expect(filtrarUsuarios(TODOS, { ...SIN_FILTROS, texto: "gluten" }).map((u) => u.id)).toEqual([
        "e2",
      ]);
    });

    it("filtra por curso, por rol y por aula", () => {
      expect(
        filtrarUsuarios(TODOS, { ...SIN_FILTROS, curso: "2025-2026" }).map((u) => u.id),
      ).toEqual(["e2"]);
      expect(filtrarUsuarios(TODOS, { ...SIN_FILTROS, rol: "estudiante" })).toHaveLength(2);
      expect(
        filtrarUsuarios(TODOS, { ...SIN_FILTROS, aula: "Clase Triángulo" }).map((u) => u.id),
      ).toEqual(["e1", "t1", "f1"]);
    });

    it("combina búsqueda y filtros", () => {
      const r = filtrarUsuarios(TODOS, {
        texto: "garcía",
        curso: "2026-2027",
        rol: "familia",
        aula: null,
      });
      expect(r.map((u) => u.id)).toEqual(["f1"]);
    });
  });
});
