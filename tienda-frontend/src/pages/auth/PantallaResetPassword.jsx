import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchConToken } from '../../services/api'; // Ajustá la ruta según tu estructura

export const PantallaResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const token = searchParams.get('token');


    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [estado, setEstado] = useState('IDLE'); // IDLE, CARGANDO, EXITO, ERROR
    const [mensajeError, setMensajeError] = useState('');

    const manejarSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setMensajeError("Enlace inválido o expirado. Por favor, solicitá uno nuevo.");
            setEstado('ERROR');
            return;
        }

        if (password.length < 6) {
            setMensajeError("La contraseña debe tener al menos 6 caracteres.");
            setEstado('ERROR');
            return;
        }

        if (password !== confirmarPassword) {
            setMensajeError("Las contraseñas no coinciden.");
            setEstado('ERROR');
            return;
        }

        setEstado('CARGANDO');
        setMensajeError('');

        try {
            // Reemplazamos fetch directo por fetchConToken
            const response = await fetchConToken('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, nuevaPassword: password })
            });

            if (response.ok) {
                setEstado('EXITO');

            setTimeout(() => navigate('/login', { replace: true }), 3000);
            } else {
                const data = await response.json();
                setMensajeError(data.error || "El enlace expiró o es inválido.");
                setEstado('ERROR');
            }
        } catch (error) {
            setMensajeError("Error de conexión con el servidor.");
            setEstado('ERROR');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 text-center border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                    <h2 className="text-xl font-black mb-2 dark:text-white">Enlace inválido</h2>
                    <p className="text-slate-500 mb-6">No se encontró el código de seguridad. Por favor, solicitá un nuevo cambio de contraseña.</p>
                    <Link to="/recuperar-password" className="text-primary font-bold hover:underline">Ir a recuperar contraseña</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-in my-8">
                
                <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center rounded-2xl bg-white/20 p-3 mb-4 backdrop-blur-sm shadow-inner">
                            <span className="material-symbols-outlined text-4xl">key</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-widest mb-1">Nueva Contraseña</h1>
                        <p className="text-primary-100 text-sm font-medium">
                            Ingresá tu nueva clave de acceso
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    {estado === 'EXITO' ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">check</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">¡Contraseña actualizada!</h2>
                            <p className="text-slate-500 text-sm">Serás redirigido al inicio de sesión en unos segundos...</p>
                        </div>
                    ) : (
                        <form onSubmit={manejarSubmit}>
                            {estado === 'ERROR' && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
                                    <span className="material-symbols-outlined shrink-0">error</span>
                                    <p className="pt-0.5">{mensajeError}</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nueva Contraseña</label>
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
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Repetir Contraseña</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
                                    <input 
                                        type="password" 
                                        required
                                        value={confirmarPassword}
                                        onChange={(e) => setConfirmarPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={estado === 'CARGANDO'}
                                className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg 
                                    ${estado === 'CARGANDO' ? 'bg-primary/70 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 shadow-primary/30 hover:-translate-y-0.5'}`}
                            >
                                {estado === 'CARGANDO' ? (
                                    <><span className="material-symbols-outlined animate-spin">sync</span> Guardando...</>
                                ) : (
                                    'Guardar nueva contraseña'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};