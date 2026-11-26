// Cabecera de la contraseña («¿Eres Alejandro?»): la foto del alumno si la tiene; si no, su dibujo.
import { render, screen } from "@testing-library/react-native";

import { AvatarEstudiante } from "../CredencialDibujos";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";

const alumno = ESTUDIANTES_MOCK[0];

describe("AvatarEstudiante", () => {
  it("enseña la foto si el alumno la tiene", async () => {
    await render(<AvatarEstudiante estudiante={{ ...alumno, fotoUrl: "https://foto/ale.jpg" }} />);
    const foto = screen.getByTestId("avatar-foto", { includeHiddenElements: true });
    expect(foto.props.source).toEqual({ uri: "https://foto/ale.jpg" });
  });

  it("sin foto enseña su dibujo", async () => {
    await render(<AvatarEstudiante estudiante={{ ...alumno, fotoUrl: undefined }} />);
    expect(screen.queryByTestId("avatar-foto", { includeHiddenElements: true })).toBeNull();
    expect(screen.getByText(alumno.icono, { includeHiddenElements: true })).toBeTruthy();
  });
});
