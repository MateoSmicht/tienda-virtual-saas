import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

export const PantallaLoginCliente = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true); 
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState(''); 
    const [apellido, setApellido] = useState(''); 
    const [telefono, setTelefono] = useState(''); 
    
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError(null);
        setMensajeExito(null);

        try {
            if (isLogin) {
                const response = await fetch('http://localhost:8080/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    localStorage.setItem('token', data.token);
                    
                    try {
                        const tokenDecodificado = jwtDecode(data.token);
                        const rol = tokenDecodificado.rol || tokenDecodificado.role;

                        if (rol === 'ADMIN') {
                            navigate('/dashboard'); 
                        } else {
                            navigate('/'); 
                        }
                    } catch (e) {
                        navigate('/');
                    }
                    
                } else if (response.status === 401 || response.status === 403) {
                    setError("Email o contraseña incorrectos.");
                } else {
                    setError("Ocurrió un error al intentar iniciar sesión.");
                }

            } else {
                const response = await fetch('http://localhost:8080/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, apellido, email, password, telefono }) 
                });

                if (response.ok) {
                    setIsLogin(true);
                    setMensajeExito("¡Cuenta creada con éxito! Ya podés iniciar sesión.");
                    setPassword(''); 
                } else {
                    const errorMsg = await response.text();
                    setError(errorMsg || "Error al crear la cuenta. El email podría estar en uso.");
                }
            }
        } catch (err) {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
            
            <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-primary dark:hover:text-white font-bold transition-colors bg-white/50 dark:bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm z-50">
                <span className="material-symbols-outlined">arrow_back</span> Volver
            </Link>

            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-in my-8">
                
                <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center rounded-2xl bg-white/20 p-3 mb-4 backdrop-blur-sm shadow-inner">
                            <span className="material-symbols-outlined text-4xl">fragrance</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-widest mb-1">V-PERFUMERY</h1>
                        <p className="text-primary-100 text-sm font-medium">
                            {isLogin ? 'Ingresá para ver tus pedidos' : 'Creá tu cuenta y descubrí ofertas'}
                        </p>
                    </div>
                </div>

                <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => { setIsLogin(true); setError(null); setMensajeExito(null); }}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button 
                        onClick={() => { setIsLogin(false); setError(null); setMensajeExito(null); }}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Registrarse
                    </button>
                </div>

                <form onSubmit={manejarSubmit} className="p-8">
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
                            <span className="material-symbols-outlined shrink-0">error</span>
                            <p className="pt-0.5">{error}</p>
                        </div>
                    )}
                    {mensajeExito && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 text-green-600 dark:text-green-400 text-sm font-medium">
                            <span className="material-symbols-outlined shrink-0">check_circle</span>
                            <p className="pt-0.5">{mensajeExito}</p>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nombre</label>
                                <input 
                                    type="text" 
                                    required={!isLogin}
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Apellido</label>
                                <input 
                                    type="text" 
                                    required={!isLogin}
                                    value={apellido}
                                    onChange={(e) => setApellido(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Teléfono</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">phone</span>
                                <input 
                                    type="tel" 
                                    required={!isLogin}
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                                    placeholder="Ej: 11 2345 6789"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                                placeholder="tu@email.com"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Contraseña</label>
                            {isLogin && (
                                <Link 
                                    to="/recuperar-password" 
                                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    ¿Olvidaste tu clave?
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                        {!isLogin && (
                            <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                Mínimo 6 caracteres
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={cargando}
                        className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg 
                            ${cargando ? 'bg-primary/70 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 shadow-primary/30 hover:-translate-y-0.5'}`}
                    >
                        {cargando ? (
                            <><span className="material-symbols-outlined animate-spin">sync</span> Procesando...</>
                        ) : (
                            <>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'} <span className="material-symbols-outlined text-[20px]">{isLogin ? 'login' : 'person_add'}</span></>
                        )}
                    </button>
                    
                </form>
            </div>
        </div>
    );
};