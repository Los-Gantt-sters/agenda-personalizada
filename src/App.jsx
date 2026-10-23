import React, { useState, useEffect } from 'react';
import { Cloud, Database, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { isSupabaseConfigured, checkSupabaseConnection } from './lib/supabaseClient';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState({
    checking: true,
    connected: false,
    message: ''
  });

  useEffect(() => {
    checkSupabaseConnection().then((res) => {
      setConnectionStatus({
        checking: false,
        connected: res.connected,
        message: res.message
      });
    });
  }, []);

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
            Sprint 1 (HUT-01 / T-T01.1 & T-T01.3)
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6 flex-1 w-full my-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Variables de Entorno y Conexión Supabase Auth
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm">
            Cliente seguro de Supabase configurado con tokens JWT persistentes y variables de entorno aisladas fuera del repositorio (.env.example).
          </p>

          {/* Banner de estado de conexión */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-left max-w-xl mx-auto ${
            connectionStatus.connected
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              {connectionStatus.connected ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {connectionStatus.connected
                    ? 'Supabase Conectado'
                    : 'Modo Desarrollo / Plantilla .env activa'}
                </p>
                <p className="text-xs text-slate-600">{connectionStatus.message}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
              {isSupabaseConfigured ? 'Producción' : 'Dev Mock'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Despliegue</p>
                <p className="text-sm font-bold text-slate-800">Vercel (CI/CD)</p>
                <p className="text-xs text-slate-500 mt-0.5">vercel.json configurado</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Seguridad .env</p>
                <p className="text-sm font-bold text-slate-800">API Keys Aisladas</p>
                <p className="text-xs text-slate-500 mt-0.5">RNF15.3 cumplido con .env.example</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Auth & Tokens</p>
                <p className="text-sm font-bold text-slate-800">JWT Persistente</p>
                <p className="text-xs text-slate-500 mt-0.5">Cliente @supabase/supabase-js</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-500">
        Subtareas SCRUM-155 (T-T01.1) y SCRUM-157 (T-T01.3) • Desarrolladas por Juan Luis Jiménez Urbano
      </footer>
    </div>
  );
}
