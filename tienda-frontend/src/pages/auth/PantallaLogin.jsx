import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

const PantallaLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const manejarLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('token', data.token);
        
        navigate('/dashboard'); 
        
      } else if (response.status === 401 || response.status === 403) {
        setError("Email o contraseña incorrectos. Intentá nuevamente.");
      } else {
        setError("Ocurrió un error al intentar iniciar sesión.");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 animate-fade-in">
        
        <div className="text-center mb-8">
          <div className="size-16 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
            <span className="material-symbols-outlined text-[32px]">point_of_sale</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Bienvenido de vuelta</h2>
          <p className="text-slate-500 mt-2 text-sm">Ingresá tus credenciales para acceder al panel de administración.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <form onSubmit={manejarLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">mail</span>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tienda.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">lock</span>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          <button type="submit" disabled={cargando} className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 mt-4 ${cargando ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/30 hover:-translate-y-0.5'}`}>
            {cargando ? <span className="material-symbols-outlined animate-spin">sync</span> : <>Ingresar al Sistema <span className="material-symbols-outlined text-[20px]">arrow_forward</span></>}
          </button>
        </form>

      </div>
    </div>
  );
};

export default PantallaLogin;