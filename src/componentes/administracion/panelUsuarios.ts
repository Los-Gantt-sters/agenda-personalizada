// Textos y filtros del panel de administración (pantalla 48). Funciones puras: se prueban sin pantalla.
import type { RolPanel, UsuarioPanel } from "../../servicios/usuariosPanelService";
import { nombreTipoMenu } from "./menus";

export const NOMBRE_ROL: Record<RolPanel, string> = {
  estudiante: "Estudiante",
  tutor: "Tutor / Docente",
  familia: "Familia",
  admin: "Administración",
  especialista: "Especialista",
};

/** Botones del filtro «Rol» (el de especialistas no existe en el boceto: salen en «Todos»). */
export const FILTROS_ROL: readonly { id: RolPanel; nombre: string }[] = [
  { id: "estudiante", nombre: "Estudiantes" },
  { id: "tutor", nombre: "Tutores" },
  { id: "familia", nombre: "Familias" },
  { id: "admin", nombre: "Admin" },
];

/** Columna «Aula y vínculos», con el mismo formato que el boceto. */
export function textoVinculos(u: UsuarioPanel): string {
  switch (u.rol) {
    case "estudiante": {
      const partes = [u.aulas[0] ?? "Sin aula"];
      if (u.tutor) partes.push(`Tutor: ${u.tutor}`);
      if (u.familia) partes.push(u.familia);
      return partes.join(" · ");
    }
    case "tutor":
      return u.aulas.length ? `Aulas: ${u.aulas.join(" y ")}` : "Sin aulas asignadas";
    case "familia":
      return u.hijos?.length
        ? `Vinculada a: ${u.hijos.map((h) => (h.aula ? `${h.nombre} (${h.aula})` : h.nombre)).join(", ")}`
        : "Sin estudiantes vinculados";
    case "admin":
      return "Dirección y administración general del centro";
    default:
      return "Especialista del centro";
  }
}

/** Columna «Menú / Acceso»: el menú del estudiante o el correo del adulto. */
export function textoAcceso(u: UsuarioPanel): string {
  if (u.rol === "estudiante") return `Menú ${nombreTipoMenu(u.menu)}`;
  if (u.rol === "admin") return "Menús, aulas y vínculos";
  return u.email ?? "";
}

const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export interface FiltrosPanel {
  texto: string;
  /** null = «Todos» */
  curso: string | null;
  rol: RolPanel | null;
  /** null = «Todas» */
  aula: string | null;
}

export const SIN_FILTROS: FiltrosPanel = { texto: "", curso: null, rol: null, aula: null };

/** Busca por nombre, correo, aula o dieta, y aplica los filtros de curso, rol y aula. */
export function filtrarUsuarios(usuarios: UsuarioPanel[], f: FiltrosPanel): UsuarioPanel[] {
  const buscado = normalizar(f.texto.trim());
  return usuarios.filter((u) => {
    if (f.curso && !u.cursos.includes(f.curso)) return false;
    if (f.rol && u.rol !== f.rol) return false;
    if (f.aula && !u.aulas.includes(f.aula)) return false;
    if (!buscado) return true;
    const donde = [
      u.nombre,
      u.email ?? "",
      ...u.aulas,
      u.rol === "estudiante" ? nombreTipoMenu(u.menu) : "",
    ];
    return donde.some((d) => normalizar(d).includes(buscado));
  });
}
