import React from "react";
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../login";
import * as authService from "../../src/servicios/authService";

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock("../../src/servicios/authService", () => ({
  signInSupervisor: jest.fn(),
  getRoleHomeRoute: jest.fn((role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "familiar") return "/familiar/resumen";
    if (role === "cocina") return "/cocina/parte";
    return "/docente/agenda";
  }),
}));

describe("LoginScreen - Pantalla 05 (SCRUM-228 / SCRUM-243 · Acceso adultos sin selección manual de rol)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza la Pantalla 05 exacta a 05.html SIN botones de selección manual de rol ni demo alumno", async () => {
    await render(<LoginScreen />);

    expect(screen.getByText("Acceso para adultos")).toBeTruthy();
    expect(screen.getByText("Sin sesión")).toBeTruthy();
    expect(screen.getByText("Hospitalarias")).toBeTruthy();
    expect(screen.getByText("Fundación Purísima Concepción")).toBeTruthy();
    expect(
      screen.getByText(
        "Acceso único para personal del centro y familias. El sistema detecta automáticamente tu rol desde la base de datos.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Correo electrónico")).toBeTruthy();
    expect(screen.getByText("Contraseña")).toBeTruthy();
    expect(screen.getByPlaceholderText("usuario@purisima.es")).toBeTruthy();
    expect(screen.getByPlaceholderText("••••••••")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();

    // Restricción clave de 05.html / SCRUM-243: SIN botones de selección manual de rol ni demo alumno
    expect(screen.queryByText(/Accesos de prueba/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /Rellenar como/i })).toBeNull();
    expect(screen.queryByText(/Demo alumno/i)).toBeNull();
  });

  it("muestra errores de validación si se envía el formulario vacío", async () => {
    const user = userEvent.setup();
    await render(<LoginScreen />);

    const submitBtn = screen.getByRole("button", { name: "Iniciar sesión" });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("El correo electrónico es obligatorio.")).toBeTruthy();
      expect(screen.getByText("La contraseña es obligatoria.")).toBeTruthy();
    });

    expect(authService.signInSupervisor).not.toHaveBeenCalled();
  });

  it("muestra error de validación cuando el formato de email es inválido", async () => {
    const user = userEvent.setup();
    await render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText("usuario@purisima.es");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await user.type(emailInput, "correo-invalido");
    await user.type(passwordInput, "123456");

    const submitBtn = screen.getByRole("button", { name: "Iniciar sesión" });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Introduce un formato de correo electrónico válido.")).toBeTruthy();
    });
  });

  it("autentica y redirige automáticamente según el rol detectado en BBDD (Tutor 33, Familia 34, Admin 48, Cocina 54)", async () => {
    (authService.signInSupervisor as jest.Mock).mockResolvedValueOnce({
      success: true,
      session: {
        accessToken: "mock-jwt-token",
        user: {
          id: "123",
          email: "carmen.ruiz@purisima.es",
          fullName: "Carmen Ruiz",
          role: "tutor_docente",
        },
      },
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText("usuario@purisima.es");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await user.type(emailInput, "carmen.ruiz@purisima.es");
    await user.type(passwordInput, "ContraseñaValida123");

    const submitBtn = screen.getByRole("button", { name: "Iniciar sesión" });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(authService.signInSupervisor).toHaveBeenCalledWith(
        "carmen.ruiz@purisima.es",
        "ContraseñaValida123",
      );
      expect(mockReplace).toHaveBeenCalledWith("/docente/agenda");
    });
  });

  it("redirige automáticamente a Cocina (54) o Admin (48) según el rol devuelto por BBDD", async () => {
    (authService.signInSupervisor as jest.Mock).mockResolvedValueOnce({
      success: true,
      session: {
        accessToken: "mock-jwt-cocina",
        user: {
          id: "coc-1",
          email: "cocina@purisima.es",
          fullName: "Cocina Central",
          role: "cocina",
        },
      },
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText("usuario@purisima.es"), "cocina@purisima.es");
    await user.type(screen.getByPlaceholderText("••••••••"), "CocinaSegura123");
    await user.press(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/cocina/parte");
    });
  });

  it("muestra el mensaje de error genérico cuando falla la autenticación (RF1.8)", async () => {
    (authService.signInSupervisor as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "Credenciales incorrectas o usuario no autorizado.",
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText("usuario@purisima.es");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await user.type(emailInput, "desconocido@purisima.es");
    await user.type(passwordInput, "clave_erronea");

    const submitBtn = screen.getByRole("button", { name: "Iniciar sesión" });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Credenciales incorrectas o usuario no autorizado.")).toBeTruthy();
    });
  });
});
