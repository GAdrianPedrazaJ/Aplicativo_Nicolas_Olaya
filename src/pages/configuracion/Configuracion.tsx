import { Sidebar } from '../../components/Sidebar';
import ModuleCard from '../../components/shared/ModuleCard';
import {
  Settings,
  User,
  Bell,
  Lock,
  Database,
  ShieldCheck,
  Globe,
  Save
} from 'lucide-react';

export default function Configuracion() {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">CONFIGURACIÓN</h2>
              <p className="text-slate-500 font-medium mt-1">Administra las preferencias del sistema y ajustes de tu cuenta.</p>
            </div>
            <button className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-900/10">
              <Save size={18} />
              <span>GUARDAR CAMBIOS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menú Lateral de Ajustes */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm space-y-1">
                <ConfigMenuItem icon={User} label="Perfil de Usuario" active />
                <ConfigMenuItem icon={Lock} label="Seguridad y Acceso" />
                <ConfigMenuItem icon={Bell} label="Notificaciones" />
                <ConfigMenuItem icon={Globe} label="Idioma y Región" />
                <ConfigMenuItem icon={Database} label="Conexión de Datos" />
                <ConfigMenuItem icon={ShieldCheck} label="Permisos de Rol" />
              </div>

              <div className="bg-[#005d5d] p-8 rounded-[32px] text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <Settings className="text-emerald-300 mb-4" size={32} />
                <h3 className="text-xl font-black mb-2 tracking-tight">Estado del Sistema</h3>
                <p className="text-emerald-100 text-xs font-medium leading-relaxed opacity-80">
                  Versión 2.2.0 - Tu sistema está actualizado con los últimos parches de seguridad y rendimiento.
                </p>
              </div>
            </div>

            {/* Panel de Detalles */}
            <div className="lg:col-span-2 space-y-8">
              <ModuleCard title="Información del Perfil" subtitle="Datos personales y profesionales">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                    <input type="text" className="input-field" placeholder="Nombre completo" defaultValue="Nicolas Olaya" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <input type="email" className="input-field" placeholder="correo@ejemplo.com" defaultValue="n.olaya@agrotech.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol en la Organización</label>
                    <div className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 font-bold text-sm">
                      ADMINISTRADOR DE SISTEMAS
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
                    <input type="text" className="input-field" defaultValue="Operaciones Agrícolas" />
                  </div>
                </div>
              </ModuleCard>

              <ModuleCard title="Preferencias del Sistema" subtitle="Ajustes de visualización y comportamiento">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-xl">
                        <Bell className="text-[#005d5d]" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Notificaciones de Producción</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recibe alertas sobre bajas en el rendimiento</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005d5d]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-xl">
                        <Globe className="text-slate-400" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Sincronización Automática</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Actualización de datos en tiempo real (Predeterminado)</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 bg-slate-200 px-3 py-1 rounded-full uppercase">Activo</div>
                  </div>
                </div>
              </ModuleCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ConfigMenuItem({ icon: Icon, label, active = false }: any) {
  return (
    <button className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
      active ? 'bg-emerald-50 text-[#005d5d]' : 'text-slate-500 hover:bg-slate-50'
    }`}>
      <Icon size={20} className={active ? 'text-[#005d5d]' : 'text-slate-400 group-hover:text-slate-600'} />
      <span className="text-sm font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}
