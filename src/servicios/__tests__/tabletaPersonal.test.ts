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

  it("recuerda y olvida al alumno de la tableta", async () => {
    await recordarAlumnoTableta("est-1");
    expect(await obtenerAlumnoTableta()).toBe("est-1");

    await olvidarAlumnoTableta();
    expect(await obtenerAlumnoTableta()).toBeNull();
  });
});
