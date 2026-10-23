import React from 'react';
import { Cloud, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="bg-blue-800 text-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl text-yellow-300">
              AG
            </div>
            <div>
              <h1 className="text-xl font-bold">Agensible</h1>
              <p className="text-xs text-blue-200">CEE Fundación Purísima Concepción • Los Gantt-sters</p>
            </div>
          </div>
          <span className="bg-blue-900/60 text-xs px-3 py-1 rounded-full text-blue-200 border border-blue-700">
            Sprint 1 (HUT-01 / T-T01.1)
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6 flex-1 w-full my-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Cloud className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Infraestructura Cloud y Despliegue Continuo Vercel
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm">
            Configuración base del proyecto web con React, Vite y Tailwind CSS, preparada para integración continua con Vercel y conexión al backend de Supabase.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Despliegue</p>
                <p className="text-sm font-bold text-slate-800">Vercel (CI/CD)</p>
                <p className="text-xs text-slate-500 mt-0.5">SPA rewrites y cabeceras de seguridad</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Backend BaaS</p>
                <p className="text-sm font-bold text-slate-800">Supabase</p>
                <p className="text-xs text-slate-500 mt-0.5">PostgreSQL 16 y Realtime CDC</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Accesibilidad</p>
                <p className="text-sm font-bold text-slate-800">WCAG 2.1 AA</p>
                <p className="text-xs text-slate-500 mt-0.5">Orientación horizontal preferente</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-500">
        Subtarea SCRUM-155 (T-T01.1) • Asignada a Juan Luis Jiménez
      </footer>
    </div>
  );
}
