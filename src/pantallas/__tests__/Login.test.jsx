import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../Login";
import * as authService from "../../services/authService";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/authService", () => ({
  signInSupervisor: vi.fn(),
  getRoleHomeRoute: vi.fn((role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "familiar") return "/familiar/resumen";
    return "/docente/agenda";
  }),
}));

function renderLogin() {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>,
  );
}

describe("Login - SCRUM-55 (Frontend Formulario de Login)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente el título y los campos del formulario", () => {
    renderLogin();

    expect(screen.getByText("Acceso Supervisores")).toBeTruthy();
    expect(screen.getByText("Correo electrónico")).toBeTruthy();
    expect(screen.getByText("Contraseña")).toBeTruthy();
    expect(screen.getByPlaceholderText("ejemplo@purisima.es")).toBeTruthy();
    expect(screen.getByPlaceholderText("••••••••")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
  });

  it("muestra errores de validación si se envía el formulario vacío", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByText("El correo electrónico es obligatorio.")).toBeTruthy();
      expect(screen.getByText("La contraseña es obligatoria.")).toBeTruthy();
    });

    expect(authService.signInSupervisor).not.toHaveBeenCalled();
  });

  it("muestra error de validación cuando el formato de email es inválido", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("ejemplo@purisima.es"), "correo-invalido");
    await user.type(screen.getByPlaceholderText("••••••••"), "123456");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByText("Introduce un formato de correo electrónico válido.")).toBeTruthy();
    });
  });

  it("autentica satisfactoriamente y redirige según el rol (RF1.4)", async () => {
    authService.signInSupervisor.mockResolvedValueOnce({
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
    renderLogin();

    await user.type(screen.getByPlaceholderText("ejemplo@purisima.es"), "tutor@purisima.es");
    await user.type(screen.getByPlaceholderText("••••••••"), "ContraseñaValida123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(authService.signInSupervisor).toHaveBeenCalledWith(
        "tutor@purisima.es",
        "ContraseñaValida123",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/docente/agenda", { replace: true });
    });
  });

  it("muestra el mensaje de error genérico cuando falla la autenticación (RF1.8)", async () => {
    authService.signInSupervisor.mockResolvedValueOnce({
      success: false,
      error: "Credenciales incorrectas o usuario no autorizado.",
    });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("ejemplo@purisima.es"), "desconocido@purisima.es");
    await user.type(screen.getByPlaceholderText("••••••••"), "clave_erronea");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByText("Credenciales incorrectas o usuario no autorizado.")).toBeTruthy();
    });
  });

  it("permite rellenar credenciales rápidas con los botones demo", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Rellenar como Administrador" }));

    expect(screen.getByPlaceholderText("ejemplo@purisima.es").value).toBe("admin@purisima.es");
  });
});
