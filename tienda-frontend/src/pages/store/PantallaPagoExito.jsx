import { Link, useSearchParams } from 'react-router-dom';

export const PantallaPagoExito = () => {
    // Usamos este hook de React Router para atrapar los datos que manda Mercado Pago en la URL
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get('payment_id'); 

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 font-display">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-primary/10 text-center animate-fade-in">
                
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="material-symbols-outlined text-6xl">check_circle</span>
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">¡Pago Exitoso!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-base leading-relaxed">
                    Tu compra se ha procesado correctamente. En breve prepararemos tu pedido para el envío y nos pondremos en contacto.
                </p>
                
                {/* Si Mercado Pago nos mandó el ID, lo mostramos como comprobante */}
                {paymentId && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Comprobante N°</p>
                        <p className="text-slate-900 dark:text-white font-mono font-bold text-lg">{paymentId}</p>
                    </div>
                )}
                
                <Link 
                    to="/" 
                    className="inline-flex w-full items-center justify-center gap-2 bg-primary text-white py-4 px-6 rounded-xl font-bold text-lg hover:brightness-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">storefront</span>
                    Volver a la tienda
                </Link>
            </div>
        </div>
    );
};