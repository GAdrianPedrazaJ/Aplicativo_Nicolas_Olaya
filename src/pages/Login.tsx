import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { Leaf, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const usuario = await authService.login(username, password);
      if (usuario) {
        login(usuario);
        await authService.updateLastAccess(usuario.id_usuario);
        navigate('/dashboard');
      } else {
        setError('Las credenciales ingresadas no son válidas.');
      }
    } catch (err) {
      setError('Ocurrió un error al intentar iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden relative z-10 border border-slate-100">

        {/* Lado Izquierdo: Formulario */}
        <div className="p-12 lg:p-20">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Leaf className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AGRO<span className="text-indigo-600">TECH</span></h1>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Bienvenido de nuevo</h2>
            <p className="text-slate-500 font-medium">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-rose-100 p-1.5 rounded-lg">
                <Lock size={16} />
              </div>
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="ej. nicolas.olaya"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all outline-none text-slate-700 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all outline-none text-slate-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/20 group disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>INICIAR SESIÓN</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2024 AGROTECH • CONTROL DE PRODUCCIÓN
          </p>
        </div>

        {/* Lado Derecho: Imagen/Branding */}
        <div className="hidden lg:block relative bg-slate-900 p-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2064&auto=format&fit=crop"
            alt="Greenhouse"
            className="absolute inset-0 w-full h-full object-cover opacity-50 scale-110"
          />

          <div className="relative z-20 h-full flex flex-col justify-end">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-[32px] border border-white/10">
              <h3 className="text-3xl font-black text-white mb-4 leading-tight">Optimiza tu producción con inteligencia de datos.</h3>
              <p className="text-indigo-200 font-medium">Visualiza rendimientos, gestiona siembras y controla la calidad en tiempo real desde una sola plataforma.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
