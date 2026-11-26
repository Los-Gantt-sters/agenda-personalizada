import {
  alumnoDeCorreo,
  obtenerPermisoPreferencias,
  olvidarPermisosPreferencias,
} from "../permisoPreferencias";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({ supabase: { from: jest.fn() } }));
const sb = supabase as unknown as { from: jest.Mock };

const ALUMNO = "3f2b8c1e-7d4a-4e9b-9c55-0a1b2c3d4e5f";

function consulta(resultado: { data: unknown; error: unknown } | Error) {
  const maybeSingle = jest.fn(() =>
    resultado instanceof Error ? Promise.reject(resultado) : Promise.resolve(resultado),
  );
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  sb.from.mockReturnValue({ select });
  return { select, eq };
}

describe("permisoPreferencias (SCRUM-246: T-ACC.2, permiso de 26d)", () => {
  afterEach(() => {
    jest.clearAllMocks();
    olvidarPermisosPreferencias();
  });

  it("saca el alumno del correo técnico del inicio de sesión visual", () => {
    expect(alumnoDeCorreo(`alu-${ALUMNO}@alumnos.agensible`)).toBe(ALUMNO);
    expect(alumnoDeCorreo("carmen@colegio.es")).toBeNull();
    expect(alumnoDeCorreo(undefined)).toBeNull();
  });

  it("con «ninguno» no puede abrir Preferencias; con «parcial» o «total», sí", async () => {
    const q = consulta({ data: { nivel_permisos_preferencias: "ninguno" }, error: null });
    await expect(obtenerPermisoPreferencias(ALUMNO)).resolves.toBe(false);
    expect(sb.from).toHaveBeenCalledWith("preferencias_alumnos");
    expect(q.select).toHaveBeenCalledWith("nivel_permisos_preferencias");
    expect(q.eq).toHaveBeenCalledWith("alumno_id", ALUMNO);

    olvidarPermisosPreferencias();
    consulta({ data: { nivel_permisos_preferencias: "parcial" }, error: null });
    await expect(obtenerPermisoPreferencias(ALUMNO)).resolves.toBe(true);
  });

  it("pregunta una sola vez por alumno (la barra sale en todas las pantallas)", async () => {
    consulta({ data: { nivel_permisos_preferencias: "total" }, error: null });
    await obtenerPermisoPreferencias(ALUMNO);
    await obtenerPermisoPreferencias(ALUMNO);
    expect(sb.from).toHaveBeenCalledTimes(1);
  });

  it("sin conexión o con un alumno de ejemplo no se le quita", async () => {
    consulta(new Error("sin red"));
    await expect(obtenerPermisoPreferencias(ALUMNO)).resolves.toBe(true);
    await expect(obtenerPermisoPreferencias("ale")).resolves.toBe(true);
  });

  it("no guarda los fallos: con conexión vuelve a preguntar y respeta «ninguno»", async () => {
    consulta(new Error("sin red"));
    await expect(obtenerPermisoPreferencias(ALUMNO)).resolves.toBe(true);
    consulta({ data: null, error: { message: "fallo" } });
    await expect(obtenerPermisoPreferencias(ALUMNO)).resolves.toBe(true);

    consulta({ data: { nivel_permisos_preferencias: "ninguno" }, error: null });
    await expect(obtenerPermisoPreferencias(ALUMNO)).resolves.toBe(false);
    expect(sb.from).toHaveBeenCalledTimes(3);
  });
});
