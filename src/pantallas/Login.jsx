import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInSupervisor, getRoleHomeRoute } from "../services/authService";
import { AUTH_GENERIC_ERROR_MESSAGE } from "../types/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = (emailVal = email, passwordVal = password) => {
    const errors = {};
    const trimmedEmail = emailVal.trim();

    if (!trimmedEmail) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Introduce un formato de correo electrónico válido.";
    }

    if (!passwordVal) {
      errors.password = "La contraseña es obligatoria.";
    } else if (passwordVal.length < 6) {
      errors.password = "La contraseña debe contener al menos 6 caracteres.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm(email, password)) {
      return;
    }

    setLoading(true);
    try {
      const result = await signInSupervisor(email, password);

      if (result.success && result.session) {
        const targetRoute = getRoleHomeRoute(result.session.user.role);
        navigate(targetRoute, { replace: true });
      } else {
        setErrorMessage(result.error || AUTH_GENERIC_ERROR_MESSAGE);
      }
    } catch {
      setErrorMessage(AUTH_GENERIC_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (role) => {
    setErrorMessage(null);
    setValidationErrors({});
    switch (role) {
      case "admin":
        setEmail("admin@purisima.es");
        setPassword("AdminPurisima2026!");
        break;
      case "familiar":
        setEmail("familia.garcia@purisima.es");
        setPassword("FamiliaSegura2026!");
        break;
      case "especialista":
        setEmail("terapeuta@purisima.es");
        setPassword("Terapeuta2026!");
        break;
      case "tutor_docente":
      default:
        setEmail("tutor.docente@purisima.es");
        setPassword("TutorDocente2026!");
        break;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="mb-1.5 text-2xl font-bold text-blue-900">Acceso Supervisores</h1>
          <p className="text-sm text-slate-600">CEE Fundación Purísima Concepción · Agensible</p>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 p-3">
            <p className="text-center text-sm font-semibold text-red-700">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@purisima.es"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              autoCapitalize="none"
              autoComplete="email"
              aria-label="Correo electrónico del supervisor"
              disabled={loading}
              className={`h-12 w-full rounded-lg border px-3.5 text-base text-slate-900 ${
                validationErrors.email ? "border-red-500 bg-red-50" : "border-slate-300 bg-slate-50"
              }`}
            />
            {validationErrors.email && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              autoCapitalize="none"
              aria-label="Contraseña del supervisor"
              disabled={loading}
              className={`h-12 w-full rounded-lg border px-3.5 text-base text-slate-900 ${
                validationErrors.password
                  ? "border-red-500 bg-red-50"
                  : "border-slate-300 bg-slate-50"
              }`}
            />
            {validationErrors.password && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {validationErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-label={loading ? "Iniciando sesión" : "Iniciar sesión"}
            className={`h-[50px] w-full rounded-lg text-base font-bold text-white ${
              loading ? "bg-blue-300" : "bg-blue-700"
            }`}
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Accesos rápidos de prueba (Demo / QA):
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDemoRole("tutor_docente")}
                aria-label="Rellenar como Tutor Docente"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Docente
              </button>
              <button
                type="button"
                onClick={() => setDemoRole("familiar")}
                aria-label="Rellenar como Familia"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Familia
              </button>
              <button
                type="button"
                onClick={() => setDemoRole("admin")}
                aria-label="Rellenar como Administrador"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Admin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
