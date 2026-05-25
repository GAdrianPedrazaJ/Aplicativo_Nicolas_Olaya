import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROUTES } from '../../config/routes';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuthStore();

  // Filtramos las rutas permitidas para el usuario actual
  const visibleRoutes = ROUTES.filter(route =>
    usuario ? route.requiredRoles.includes(usuario.rol) : false
  );

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo y Nombre */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Petal Diversificados</h1>
            <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">RDC Tandil SAS</p>
          </div>
        </div>

        {/* Pestañas de Navegación Dinámicas */}
        <nav className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
          {visibleRoutes.map((route) => (
            <button
              key={route.id}
              onClick={() => navigate(route.path)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                location.pathname === route.path
                  ? 'bg-white text-emerald-700 shadow-sm scale-105'
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
              }`}
            >
              <route.icon size={14} />
              {route.label}
            </button>
          ))}
        </nav>

        {/* Info Usuario (opcional) */}
        <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-800 uppercase">{usuario?.nombre_completo}</p>
            <p className="text-[8px] text-emerald-600 font-bold">{usuario?.rol}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
             {usuario?.nombre_completo?.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
