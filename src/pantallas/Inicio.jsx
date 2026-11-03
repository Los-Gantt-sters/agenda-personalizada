import { useNavigate } from "react-router-dom";

export default function Inicio() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-5">
      <h1 className="mb-2 text-3xl font-extrabold text-blue-900">Agensible</h1>
      <p className="mb-8 max-w-md text-center text-base text-slate-600">
        Agenda visual accesible · CEE Fundación Purísima Concepción
      </p>

      <button
        type="button"
        onClick={() => navigate("/login")}
        aria-label="Acceder como tutor, familiar o administrador"
        className="rounded-lg bg-blue-700 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-blue-700/20"
      >
        Acceso Supervisores
      </button>
    </div>
  );
}
