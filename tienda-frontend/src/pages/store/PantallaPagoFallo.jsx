import { Link } from 'react-router-dom';

export const PantallaPagoFallo = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 font-display">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/30 text-center animate-fade-in">
                
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="material-symbols-outlined text-6xl">cancel</span>
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Pago Cancelado</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-base leading-relaxed">
                    No pudimos procesar tu pago o decidiste cancelar la operación. No te preocupes, <strong>no se ha realizado ningún cargo</strong> en tu tarjeta.
                </p>
                
                <div className="flex flex-col gap-3">
                    <Link 
                        to="/checkout" 
                        className="inline-flex w-full items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 px-6 rounded-xl font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Intentar pagar de nuevo
                    </Link>
                    <Link 
                        to="/" 
                        className="inline-flex w-full items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 px-6 rounded-xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">storefront</span>
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
};