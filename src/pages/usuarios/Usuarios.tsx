import { Sidebar } from '../../components/Sidebar';

export default function Usuarios() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-2">Administración de acceso y roles del sistema.</p>
      </main>
    </div>
  );
}
