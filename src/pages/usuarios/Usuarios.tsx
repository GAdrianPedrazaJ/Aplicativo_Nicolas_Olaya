import { Sidebar } from '../../components/Sidebar';
import { Users, UserPlus, Search, MoreVertical, Shield } from 'lucide-react';

export default function Usuarios() {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">GESTIÓN DE USUARIOS</h2>
              <p className="text-slate-500 font-medium mt-1">Administración de acceso y roles del sistema.</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <UserPlus size={18} />
              <span>NUEVO USUARIO</span>
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="relative w-96">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005d5d] outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                  <tr>
                    <th className="px-8 py-4">Usuario</th>
                    <th className="px-8 py-4">Rol</th>
                    <th className="px-8 py-4">Estado</th>
                    <th className="px-8 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#005d5d] flex items-center justify-center font-bold">NO</div>
                        <div>
                          <p className="text-sm font-black text-slate-800">Nicolas Olaya</p>
                          <p className="text-xs text-slate-500">n.olaya@agrotech.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">
                        <Shield size={12} />
                        SUPERADMIN
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      <span className="text-xs font-bold text-slate-600 uppercase">Activo</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
