import { Link, useSearchParams } from 'react-router-dom';

export const PantallaPagoPendiente = () => {
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get('payment_id'); 

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 font-display">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-orange-100 dark:border-orange-900/30 text-center animate-fade-in">
                
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="material-symbols-outlined text-6xl animate-pulse">schedule</span>
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Pago en Revisión</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-base leading-relaxed">
                    Mercado Pago está procesando tu pago. Esto puede tardar unos minutos o un par de horas dependiendo de tu banco. Te enviaremos un aviso en cuanto se apruebe.
                </p>
                
                {paymentId && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">ID de Operación</p>
                        <p className="text-slate-900 dark:text-white font-mono font-bold text-lg">{paymentId}</p>
                    </div>
                )}
                
                <Link 
                    to="/" 
                    className="inline-flex w-full items-center justify-center gap-2 bg-orange-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                >
                    <span className="material-symbols-outlined">storefront</span>
                    Volver a la tienda
                </Link>
            </div>
        </div>
    );
};