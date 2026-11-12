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
    return "/docente/agenda";
  }),
}));

describe("LoginScreen - SCRUM-55 (Frontend Formulario de Login)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza correctamente el título y los campos del formulario", async () => {
    await render(<LoginScreen />);

    expect(screen.getByText("Acceso para adultos")).toBeTruthy();
    expect(screen.getByText("Correo electrónico")).toBeTruthy();
    expect(screen.getByText("Contraseña")).toBeTruthy();
    expect(screen.getByPlaceholderText("ejemplo@purisima.es")).toBeTruthy();
    expect(screen.getByPlaceholderText("••••••••")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
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

    const emailInput = screen.getByPlaceholderText("ejemplo@purisima.es");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await user.type(emailInput, "correo-invalido");
    await user.type(passwordInput, "123456");

    const submitBtn = screen.getByRole("button", { name: "Iniciar sesión" });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Introduce un formato de correo electrónico válido.")).toBeTruthy();
    });
  });

  it("autentica satisfactoriamente y redirige según el rol (RF1.4)", async () => {
    (authService.signInSupervisor as jest.Mock).mockResolvedValueOnce({
      success: true,
      session: {
        accessToken: "mock-jwt-token",
        user: {
          id: "123",
          email: "tutor@purisima.es",
          fullName: "Tutor Docente",
          role: "tutor_docente",
        },
      },
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText("ejemplo@purisima.es");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await user.type(emailInput, "tutor@purisima.es");
    await user.type(passwordInput, "ContraseñaValida123");

    const submitBtn = screen.getByRole("button", { name: "Iniciar sesión" });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(authService.signInSupervisor).toHaveBeenCalledWith(
        "tutor@purisima.es",
        "ContraseñaValida123",
      );
      expect(mockReplace).toHaveBeenCalledWith("/docente/agenda");
    });
  });

  it("muestra el mensaje de error genérico cuando falla la autenticación (RF1.8)", async () => {
    (authService.signInSupervisor as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "Credenciales incorrectas o usuario no autorizado.",
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText("ejemplo@purisima.es");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    await user.type(emailInput, "desconocido@purisima.es");
    await user.type(passwordInput, "clave_erronea");

    const submitBtn = screen.getByRole("button", { name: "Iniciar sesión" });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Credenciales incorrectas o usuario no autorizado.")).toBeTruthy();
    });
  });

  it("permite rellenar credenciales rápidas con los botones demo", async () => {
    const user = userEvent.setup();
    await render(<LoginScreen />);

    const adminBtn = screen.getByRole("button", { name: "Rellenar como Administrador" });
    await user.press(adminBtn);

    const emailInput = screen.getByPlaceholderText("ejemplo@purisima.es");
    expect(emailInput.props.value).toBe("admin@purisima.es");
  });
});
