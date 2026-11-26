// Pruebas del modo tableta personal (HU-01, T-01.3 · SCRUM-52)
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  obtenerAlumnoTableta,
  olvidarAlumnoTableta,
  recordarAlumnoTableta,
} from "../tabletaPersonal";

describe("tabletaPersonal (SCRUM-52: T-01.3 Soporte modo tableta personal)", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("sin alumno guardado devuelve null", async () => {
    expect(await obtenerAlumnoTableta()).toBeNull();
  });

  it("recuerda y olvida al alumno de la tableta, con su aula", async () => {
    await recordarAlumnoTableta("est-1", "aula-1");
    expect(await obtenerAlumnoTableta()).toEqual({ alumnoId: "est-1", aulaId: "aula-1" });

    await olvidarAlumnoTableta();
    expect(await obtenerAlumnoTableta()).toBeNull();
  });

  it("lo guardado antes de SCRUM-249 (solo el id) se sigue leyendo, sin aula", async () => {
    await AsyncStorage.setItem("tuagendita:tableta-personal:alumnoId", "ale");
    expect(await obtenerAlumnoTableta()).toEqual({ alumnoId: "ale", aulaId: null });
  });
});
