import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchConToken } from '../../services/api'; // Ajustá la ruta según tu estructura

export const PantallaRecuperarPassword = () => {
    const [email, setEmail] = useState('');
    const [estado, setEstado] = useState('IDLE'); // IDLE, CARGANDO, EXITO, ERROR
    const [mensajeError, setMensajeError] = useState('');

    const manejarEnvio = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setMensajeError("Por favor, ingresá tu correo electrónico.");
            setEstado('ERROR');
            return;
        }

        setEstado('CARGANDO');
        setMensajeError('');

        try {
            // Reemplazamos fetch directo por fetchConToken
            const response = await fetchConToken('/auth/recuperar-password', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim() })
            });

            if (response.ok) {
                setEstado('EXITO');
            } else {
                const data = await response.json();
                setMensajeError(data.error || "No pudimos procesar tu solicitud.");
                setEstado('ERROR');
            }
        } catch (error) {
            setMensajeError("Error de conexión con el servidor.");
            setEstado('ERROR');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">lock_reset</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Recuperar contraseña</h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        Ingresá tu correo electrónico y te enviaremos un enlace para que puedas volver a acceder a tu cuenta.
                    </p>
                </div>

                {estado === 'EXITO' ? (
                    <div className="text-center animate-fade-in">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl mb-6">
                            <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                ¡Correo enviado! Revisá tu bandeja de entrada o la carpeta de spam para continuar.
                            </p>
                        </div>
                        <Link to="/login" className="text-teal-600 font-bold hover:underline text-sm">
                            Volver al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={manejarEnvio} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500 transition-all text-sm"
                                    required
                                />
                            </div>
                            {estado === 'ERROR' && (
                                <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">error</span> {mensajeError}
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={estado === 'CARGANDO'}
                            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {estado === 'CARGANDO' ? (
                                <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Procesando...</>
                            ) : (
                                'Enviar enlace de recuperación'
                            )}
                        </button>

                        <div className="text-center mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <p className="text-slate-500 text-sm font-medium">
                                ¿Te acordaste tu contraseña?{' '}
                                <Link to="/login" className="text-teal-600 font-bold hover:underline">
                                    Iniciá sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};