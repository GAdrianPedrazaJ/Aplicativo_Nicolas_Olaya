import { useAuthStore } from '../store/useAuthStore';
import { ROUTES } from '../config/routes';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Leaf,
  LayoutDashboard,
  UploadCloud,
  History,
  FileText,
  Users,
  Settings
} from 'lucide-react';
import { useMemo } from 'react';

export function Sidebar() {
  const { usuario, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Función robusta para obtener el icono
  const renderIcon = (id: string, active: boolean) => {
    const props = { size: 18, className: active ? 'text-emerald-400' : 'text-emerald-100/60' };
    switch (id) {
      case 'dashboard': return <LayoutDashboard {...props} />;
      case 'carga-siembras': return <UploadCloud {...props} />;
      case 'carga-historicos': return <History {...props} />;
      case 'reportes': return <FileText {...props} />;
      case 'usuarios': return <Users {...props} />;
      case 'configuracion': return <Settings {...props} />;
      default: return <Leaf {...props} />;
    }
  };

  // Lógica de visibilidad simplificada y a prueba de errores
  const visibleRoutes = useMemo(() => {
    if (!usuario || !usuario.rol) return [];

    const userRole = String(usuario.rol).toUpperCase();

    return ROUTES.filter((route) => {
      if (!route.requiredRoles) return false;
      const roles = route.requiredRoles.map(r => String(r).toUpperCase());
      return roles.includes(userRole);
    });
  }, [usuario]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Formateo seguro de datos de usuario para evitar crashes
  const nombre = useMemo(() => String(usuario?.nombre_completo || usuario?.username || 'Usuario').toUpperCase(), [usuario]);
  const rol = useMemo(() => String(usuario?.rol || 'Invitado').toUpperCase(), [usuario]);
  const inicial = nombre.charAt(0);

  return (
    <header className="w-full bg-[#005d5d] text-white h-16 flex items-center justify-between px-6 shadow-2xl z-[100] shrink-0 border-b border-white/10">
      <div className="flex items-center gap-8 h-full">
        {/* Logo PETAL */}
        <Link to="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div className="bg-white text-[#005d5d] p-1.5 rounded-xl shadow-lg group-hover:rotate-12 transition-transform">
            <span className="font-black text-lg">P</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter uppercase">PETAL</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-100/60">R.D.C TANDIL</span>
          </div>
        </Link>

        {/* NAVEGACIÓN SUPERIOR: Pestañas de Carga e Inteligencia */}
        <nav className="flex items-center h-full">
          {visibleRoutes.map((route) => {
            const active = location.pathname === route.path;
            return (
              <Link
                key={route.id}
                to={route.path}
                className={`
                  flex items-center gap-2.5 px-6 h-full text-[11px] font-bold uppercase tracking-widest transition-all relative whitespace-nowrap
                  ${active
                    ? 'bg-white/10 text-white'
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/5'}
                `}
              >
                {renderIcon(route.id, active)}
                <span>{route.label}</span>
                {active && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_-2px_15px_rgba(52,211,153,0.6)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Perfil de Usuario */}
      <div className="flex items-center gap-4">
        {usuario && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
            <div className="text-right">
              <p className="text-[10px] font-black text-white leading-none">
                {nombre}
              </p>
              <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
                {rol}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-[#005d5d] shadow-md">
              {inicial}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          title="Cerrar Sesión"
        >
          <LogOut size={22} />
        </button>
      </div>
    </header>
  );
}
