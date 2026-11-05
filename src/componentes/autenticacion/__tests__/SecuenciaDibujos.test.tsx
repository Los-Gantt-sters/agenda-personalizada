import { render, screen, userEvent, waitFor } from "@testing-library/react-native";

import type { AuthResult } from "../../../tipos/auth";
import { SecuenciaDibujos } from "../SecuenciaDibujos";

const EXITO: AuthResult = {
  success: true,
  session: {
    accessToken: "token-de-prueba",
    user: { id: "u1", email: "alu-mar@alumnos.agensible", fullName: "Marcos", role: "familiar" },
  },
};
const FALLO: AuthResult = { success: false, error: "La secuencia de dibujos no coincide." };

async function pintar(iniciarSesion: jest.Mock) {
  const alEntrar = jest.fn();
  const alVolver = jest.fn();
  const resultado = await render(
    <SecuenciaDibujos
      alumnoId="mar"
      nombre="Marcos"
      icono="🚀"
      iniciarSesion={iniciarSesion}
      alEntrar={alEntrar}
      alVolver={alVolver}
    />,
  );
  return { ...resultado, alEntrar, alVolver };
}

async function tocar(user: ReturnType<typeof userEvent.setup>, ...etiquetas: string[]) {
  for (const etiqueta of etiquetas) {
    await user.press(screen.getByRole("button", { name: etiqueta }));
  }
}

describe("SecuenciaDibujos - HU-01 (T-01.2, acceso con 3 dibujos)", () => {
  it("muestra al alumno, la instrucción y los 9 dibujos", async () => {
    await pintar(jest.fn());

    expect(screen.getByText("Marcos")).toBeTruthy();
    expect(screen.getByText("🔑 Toca tus 3 dibujos en orden")).toBeTruthy();
    expect(screen.getByLabelText("0 de 3 dibujos")).toBeTruthy();
    for (const etiqueta of ["Manzana", "Perro", "Estrella", "Sol", "Coche", "Casa", "Gato"]) {
      expect(screen.getByRole("button", { name: etiqueta })).toBeTruthy();
    }
  });

  it("cuenta los dibujos tocados sin enseñar cuáles son", async () => {
    const user = userEvent.setup();
    await pintar(jest.fn());

    await tocar(user, "Manzana", "Perro");

    expect(screen.getByLabelText("2 de 3 dibujos")).toBeTruthy();
    expect(screen.getAllByText("●")).toHaveLength(2);
  });

  it("al tocar el tercer dibujo comprueba la secuencia en orden y entra", async () => {
    const user = userEvent.setup();
    const iniciarSesion = jest.fn().mockResolvedValue(EXITO);
    const { alEntrar } = await pintar(iniciarSesion);

    await tocar(user, "Manzana", "Perro", "Estrella");

    await waitFor(() => expect(alEntrar).toHaveBeenCalledWith(EXITO));
    expect(iniciarSesion).toHaveBeenCalledTimes(1);
    expect(iniciarSesion).toHaveBeenCalledWith("mar", ["manzana", "perro", "estrella"]);
  });

  it("si la secuencia no es correcta avisa y vuelve a empezar (prototipo 04)", async () => {
    const user = userEvent.setup();
    const { alEntrar } = await pintar(jest.fn().mockResolvedValue(FALLO));

    await tocar(user, "Sol", "Coche", "Casa");

    expect(await screen.findByText("🔁 No es esa. Prueba otra vez")).toBeTruthy();
    expect(screen.getByLabelText("0 de 3 dibujos")).toBeTruthy();
    expect(alEntrar).not.toHaveBeenCalled();
  });

  it("un fallo de conexión se trata igual que una secuencia incorrecta", async () => {
    const user = userEvent.setup();
    await pintar(jest.fn().mockRejectedValue(new Error("sin red")));

    await tocar(user, "Sol", "Coche", "Casa");

    expect(await screen.findByText("🔁 No es esa. Prueba otra vez")).toBeTruthy();
  });

  it("al volver a tocar un dibujo desaparece el aviso de error", async () => {
    const user = userEvent.setup();
    await pintar(jest.fn().mockResolvedValue(FALLO));

    await tocar(user, "Sol", "Coche", "Casa");
    await screen.findByText("🔁 No es esa. Prueba otra vez");
    await tocar(user, "Gato");

    expect(screen.queryByText("🔁 No es esa. Prueba otra vez")).toBeNull();
    expect(screen.getByLabelText("1 de 3 dibujos")).toBeTruthy();
  });

  it("«Borrar» quita el último dibujo tocado", async () => {
    const user = userEvent.setup();
    const iniciarSesion = jest.fn().mockResolvedValue(EXITO);
    await pintar(iniciarSesion);

    await tocar(user, "Manzana", "Gato", "Borrar el último dibujo", "Perro", "Estrella");

    await waitFor(() =>
      expect(iniciarSesion).toHaveBeenCalledWith("mar", ["manzana", "perro", "estrella"]),
    );
  });

  it("«No soy yo» vuelve a la cuadrícula de alumnos", async () => {
    const user = userEvent.setup();
    const { alVolver } = await pintar(jest.fn());

    await tocar(user, "No soy yo");

    expect(alVolver).toHaveBeenCalledTimes(1);
  });
});
