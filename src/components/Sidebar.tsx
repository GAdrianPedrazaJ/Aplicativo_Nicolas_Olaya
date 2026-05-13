import { useAuthStore } from '../store/useAuthStore';
import { ROUTES } from '../config/routes';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown, Leaf, User } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { usuario, logout } = useAuthStore();
  const location = useLocation();

  const visibleRoutes = ROUTES.filter((route) =>
    usuario ? route.requiredRoles.includes(usuario.rol) : false
  );

  const toggleSubmenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="w-72 bg-slate-900 text-slate-300 h-screen flex flex-col shadow-2xl z-30">
      {/* Branding */}
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Leaf className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">AGRO<span className="text-indigo-500">TECH</span></h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Sistema de Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        {visibleRoutes.map((route) => (
          <div key={route.id} className="mb-1">
            {route.children ? (
              <>
                <button
                  onClick={() => toggleSubmenu(route.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    expandedMenus.includes(route.id) ? 'bg-slate-800/50 text-white' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <route.icon size={20} className={expandedMenus.includes(route.id) ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="text-sm font-bold tracking-wide">{route.label}</span>
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${
                      expandedMenus.includes(route.id) ? 'rotate-180 text-indigo-400' : 'text-slate-600'
                    }`}
                  />
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${
                  expandedMenus.includes(route.id) ? 'max-h-96 mt-1 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-9 border-l border-slate-800 space-y-1 py-1">
                    {route.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.path}
                        className={`block px-4 py-2 text-xs font-bold transition-all duration-200 hover:text-white border-l-2 -ml-[1px] ${
                          location.pathname === child.path
                            ? 'text-indigo-400 border-indigo-500'
                            : 'text-slate-500 border-transparent hover:border-slate-700'
                        }`}
                      >
                        {child.label.toUpperCase()}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Link
                to={route.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group ${
                  location.pathname === route.path
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <route.icon size={20} className={location.pathname === route.path ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                {route.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-6 mt-auto border-t border-slate-800/50">
        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-xl">
              <User size={16} className="text-slate-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-white truncate uppercase tracking-wider">{usuario?.nombre_completo}</p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">{usuario?.rol}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-all duration-300 font-bold text-xs"
        >
          <LogOut size={16} />
          CERRAR SESIÓN
        </button>
      </div>
    </aside>
  );
}
