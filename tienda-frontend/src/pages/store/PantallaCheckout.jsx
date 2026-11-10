import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
// IMPORTAMOS LA NUEVA FUNCIÓN PÚBLICA
import { fetchConToken, traerDatosPublicosTienda } from '../../services/api'; 
import { jwtDecode } from "jwt-decode"; 

// RECIBIMOS EL TIENDASLUG
export const PantallaCheckout = ({ tiendaSlug }) => {
    const { 
        carrito, 
        subtotal, 
        vaciarCarrito, 
        eliminarDelCarrito, 
        actualizarCantidad,
        sincronizarPreciosCarrito,
        notificacionesPrecio,
        limpiarNotificacionesPrecio
    } = useCart();
    
    const [metodoPago, setMetodoPago] = useState('MERCADO_PAGO');
    const [permiteReemplazo, setPermiteReemplazo] = useState(false);
    const [notasAdicionales, setNotasAdicionales] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [pedidoTransferenciaExito, setPedidoTransferenciaExito] = useState(null);
    const [copiadoCampo, setCopiadoCampo] = useState(null);
    
    // NUEVO ESTADO PARA LA CONFIGURACIÓN DE LA TIENDA
    const [datosTienda, setDatosTienda] = useState(null);
    const navigate = useNavigate();

    // EFECTO PARA TRAER LOS DATOS DEL LOCAL (ALIAS, CBU, ENVÍO)
    useEffect(() => {
        const cargarConfiguracionTienda = async () => {
            if (!tiendaSlug) return;
            try {
                const info = await traerDatosPublicosTienda(tiendaSlug);
                setDatosTienda(info);
            } catch (err) {
                console.error("No se pudieron cargar los datos de configuración del local", err);
            }
        };
        cargarConfiguracionTienda();
        if (tiendaSlug) {
            sincronizarPreciosCarrito(tiendaSlug);
        }
    }, [tiendaSlug, sincronizarPreciosCarrito]);

    // CÁLCULOS DINÁMICOS BASADOS EN LA BASE DE DATOS
    const costoEnvio = carrito.length > 0 && datosTienda?.costoEnvio ? datosTienda.costoEnvio : 0;
    const costoServicio = carrito.length > 0 && datosTienda?.costoServicio ? datosTienda.costoServicio : 0;
    const totalFinal = subtotal + costoEnvio + costoServicio;

    const copiarAlPortapapeles = (texto, campo) => {
        if (!texto) return;
        navigator.clipboard.writeText(texto);
        setCopiadoCampo(campo);
        setTimeout(() => setCopiadoCampo(null), 2000);
    };

    const generarLinkWhatsapp = (nroPedido, montoTotal) => {
        const telefono = (datosTienda?.whatsapp || '').replace(/\D/g, '');
        const texto = encodeURIComponent(
            `¡Hola! Acabo de realizar el Pedido #${nroPedido} por ${formatPrice(montoTotal)} en ${datosTienda?.nombre || 'la tienda'}. Te adjunto el comprobante de transferencia bancaria.`
        );
        return telefono ? `https://wa.me/${telefono}?text=${texto}` : `https://wa.me/?text=${texto}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    };

    const manejarCompra = async () => {
        if (carrito.length === 0) return alert("Tu carrito está vacío.");
        
        // ==========================================
        // 1. EL FRENO: VALIDACIÓN DE SESIÓN (MODIFICADO)
        // ==========================================
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return; 
        }

        let usuarioIdReal = null;

        try {
            const tokenDecodificado = jwtDecode(token);
            usuarioIdReal = tokenDecodificado.userId; 
            
            if (!usuarioIdReal) {
                throw new Error("El token no tiene un ID de usuario válido");
            }
        } catch (error) {
            console.error("Error al leer el token de seguridad");
            localStorage.removeItem('token');
            navigate('/login');
            return;
        }

        // ==========================================
        // 2. SI ESTÁ LOGUEADO Y TENEMOS SU ID, SEGUIMOS CON LA COMPRA
        // ==========================================
        setProcesando(true);

        const mensajeFinal = permiteReemplazo 
            ? `[✅ ACEPTA REEMPLAZOS] ${notasAdicionales}`.trim() 
            : notasAdicionales.trim();

        const payload = {
            usuarioId: usuarioIdReal, 
            metodoPago: metodoPago,
            mensaje: mensajeFinal, 
            items: carrito.map(item => ({
                productoId: item.id,
                cantidad: item.cantidad
            }))
        };

        try {
            const response = await fetchConToken('/pedidos', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json(); 

                if (data.linkDePago) {
                    window.location.href = data.linkDePago;
                    vaciarCarrito(); 
                } else if (metodoPago === 'TRANSFERENCIA') {
                    // Guardamos la info del pedido generado para el modal
                    setPedidoTransferenciaExito({
                        id: data.id,
                        total: totalFinal
                    });
                    vaciarCarrito();
                } else {
                    alert(`¡Pedido #${data.id} generado con éxito! Nos contactaremos a la brevedad.`);
                    vaciarCarrito();
                    navigate('/mis-pedidos'); 
                }
            } else {
                alert("Hubo un error al procesar tu pedido en el servidor.");
            }
        } catch (error) {
            console.error("Error al generar pedido:", error);
            alert("Error de conexión. Intentá nuevamente.");
        } finally {
            setProcesando(false);
        }
    };




    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-slate-900 px-6 md:px-40 py-4">
                <div className="flex items-center gap-4">
                    <div className="text-primary"><span className="material-symbols-outlined text-3xl">shopping_cart_checkout</span></div>
                    <h2 className="text-lg font-bold">Finalizar Compra</h2>
                </div>
                <Link to="/" className="flex h-10 items-center justify-center rounded-lg bg-primary/10 px-3 text-primary hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined">close</span> Volver a la tienda
                </Link>
            </header>

            <main className="flex-1 px-6 md:px-40 py-8">
                <div className="max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* ALERTA DE CAMBIO DE PRECIO / OFERTA */}
                    {notificacionesPrecio.length > 0 && (
                        <div className="lg:col-span-2 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex items-start justify-between gap-4 shadow-sm animate-fade-in">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl shrink-0 mt-0.5">
                                    price_change
                                </span>
                                <div>
                                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                                        Se actualizaron precios de tu carrito
                                    </h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 mb-2">
                                        Algunos productos cambiaron de precio o su oferta finalizó desde que los agregaste:
                                    </p>
                                    <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300/90 list-disc list-inside">
                                        {notificacionesPrecio.map((notif, idx) => (
                                            <li key={idx}>
                                                <span className="font-semibold">{notif.nombre}</span>: 
                                                {notif.eraOferta && !notif.esOferta ? ' la oferta finalizó' : ' nuevo precio'} 
                                                {' '}(de {formatPrice(notif.precioAnterior)} a <span className="font-bold text-amber-950 dark:text-white">{formatPrice(notif.precioNuevo)}</span>)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <button 
                                onClick={limpiarNotificacionesPrecio}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                                title="Cerrar aviso"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    )}

                    {/* RESUMEN DEL PEDIDO */}
                    <div className="flex flex-col gap-6">
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Resumen del Pedido</h2>
                            <div className="space-y-4">
                                {carrito.length === 0 ? (
                                    <p className="text-slate-500 italic">No hay productos en el carrito.</p>
                                ) : (
                                    carrito.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5 shadow-sm group">
                                            <div 
                                                className="bg-center bg-no-repeat aspect-square bg-contain rounded-lg w-20 h-20 shrink-0 bg-white" 
                                                style={{ backgroundImage: `url("${item.imagenUrl || 'https://via.placeholder.com/150'}")` }}
                                            ></div>
                                            <div className="flex flex-1 flex-col justify-center">
                                                <p className="font-semibold line-clamp-1">{item.nombre}</p>
                                                
                                                {/* CONTROLES DE CANTIDAD */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                        <button 
                                                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">remove</span>
                                                        </button>
                                                        <span className="px-2 text-sm font-bold w-6 text-center">
                                                            {item.cantidad}
                                                        </span>
                                                        <button 
                                                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* PRECIO Y BOTÓN DE ELIMINAR */}
                                            <div className="shrink-0 flex flex-col items-end justify-between h-full py-1">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {formatPrice((item.esOferta ? item.precioOferta : item.precio) * item.cantidad)}
                                                </div>
                                                <button 
                                                    onClick={() => eliminarDelCarrito(item.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 mt-2"
                                                    title="Eliminar del carrito"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* TOTALES DINÁMICOS */}
                            <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
                                <div className="flex justify-between py-2 text-sm text-slate-600 dark:text-slate-400">
                                    <p>Subtotal Productos</p>
                                    <p className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(subtotal)}</p>
                                </div>
                                
                                {costoEnvio > 0 && (
                                    <div className="flex justify-between py-2 text-sm text-slate-600 dark:text-slate-400">
                                        <p>Costo de envío</p>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(costoEnvio)}</p>
                                    </div>
                                )}

                                {costoServicio > 0 && (
                                    <div className="flex justify-between py-2 text-sm text-slate-600 dark:text-slate-400">
                                        <p>Cargo de servicio</p>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(costoServicio)}</p>
                                    </div>
                                )}

                                <div className="h-px bg-primary/20 my-4"></div>
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-bold">Total a Pagar</p>
                                    <p className="text-primary text-2xl font-black">{formatPrice(totalFinal)}</p>
                                </div>
                            </div>
                        </section>

                        {/* ===================================== */}
                        {/* PREFERENCIAS DE ENTREGA Y REEMPLAZOS  */}
                        {/* ===================================== */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Preferencias de Entrega y Reemplazos</h2>
                            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                                
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center mt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={permiteReemplazo}
                                            onChange={(e) => setPermiteReemplazo(e.target.checked)}
                                            className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                        />
                                        <span className="material-symbols-outlined absolute text-white text-[16px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">check</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                            Permitir reemplazos si no hay stock
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Si falta alguna fragancia o marca, autorizo que me envíen una similar.
                                        </p>
                                    </div>
                                </label>

                                <div className="mt-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notas adicionales (Opcional)</label>
                                    <textarea 
                                        value={notasAdicionales}
                                        onChange={(e) => setNotasAdicionales(e.target.value)}
                                        placeholder="Aclaraciones sobre reemplazos, horarios de entrega o detalles de la dirección..."
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white transition-all min-h-[100px] resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* MÉTODOS DE PAGO */}
                    <div className="flex flex-col gap-6">
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Método de Pago</h2>
                            <div className="space-y-4">
                               
                                {/* 1. Opción Mercado Pago */}
                               {/* <label className="relative flex cursor-pointer items-center justify-between rounded-xl border-2 border-primary/10 bg-white dark:bg-slate-800/50 p-4 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:border-primary/30">
                                    <div className="flex items-center gap-4">
                                        <div className="flex p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <span className="material-symbols-outlined">credit_card</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Mercado Pago</p>
                                            <p className="text-sm text-slate-500">Tarjetas de crédito, débito o dinero en cuenta</p>
                                        </div>
                                    </div>
                                    <input type="radio" name="payment" value="MERCADO_PAGO" checked={metodoPago === 'MERCADO_PAGO'} onChange={() => setMetodoPago('MERCADO_PAGO')} className="w-5 h-5 text-primary focus:ring-primary" />
                                </label>*/}
                                
                                {/* 2. Opción Transferencia */}
                                <label className="relative flex cursor-pointer items-center justify-between rounded-xl border-2 border-primary/10 bg-white dark:bg-slate-800/50 p-4 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:border-primary/30">
                                    <div className="flex items-center gap-4">
                                        <div className="flex p-2 rounded-full bg-primary/10 text-primary"><span className="material-symbols-outlined">account_balance</span></div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Transferencia Bancaria</p>
                                            <p className="text-sm text-slate-500">Transferencia directa a nuestra cuenta</p>
                                        </div>
                                    </div>
                                    <input type="radio" name="payment" value="TRANSFERENCIA" checked={metodoPago === 'TRANSFERENCIA'} onChange={() => setMetodoPago('TRANSFERENCIA')} className="w-5 h-5 text-primary focus:ring-primary" />
                                </label>
                                    {/* DATOS DE TRANSFERENCIA DINÁMICOS */}
                                    {metodoPago === 'TRANSFERENCIA' && (
                                        <div className="mt-4 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl border-l-4 border-primary animate-fade-in">
                                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Datos de la cuenta</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">CBU / CVU</p>
                                                    <p className="font-mono font-medium text-slate-900 dark:text-white">
                                                        {datosTienda?.cbu || 'Cargando datos...'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">Alias</p>
                                                    <p className="font-mono font-medium text-slate-900 dark:text-white">
                                                        {datosTienda?.alias || 'Cargando datos...'}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-slate-500 italic mt-2">
                                                    Enviá el comprobante de pago por WhatsApp con tu número de pedido 
                                                    {datosTienda?.nombre ? ` a ${datosTienda.nombre}` : ''}.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                {/* 3. Opción Efectivo */}
                                <label className="relative flex cursor-pointer items-center justify-between rounded-xl border-2 border-primary/10 bg-white dark:bg-slate-800/50 p-4 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:border-primary/30">
                                    <div className="flex items-center gap-4">
                                        <div className="flex p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"><span className="material-symbols-outlined">payments</span></div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Efectivo al recibir</p>
                                            <p className="text-sm text-slate-500">Abonás cuando te entregamos el pedido</p>
                                        </div>
                                    </div>
                                    <input type="radio" name="payment" value="EFECTIVO" checked={metodoPago === 'EFECTIVO'} onChange={() => setMetodoPago('EFECTIVO')} className="w-5 h-5 text-primary focus:ring-primary" />
                                </label>

                            </div>
                        </section>

                        <div className="mt-8">
                            <button 
                                onClick={manejarCompra} 
                                disabled={procesando || carrito.length === 0}
                                className="w-full bg-primary text-white py-4 px-6 rounded-xl font-bold text-lg hover:brightness-105 active:scale-[0.98] transition-all flex justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {procesando ? (
                                    <><span className="material-symbols-outlined animate-spin">sync</span> Procesando...</>
                                ) : (
                                    <><span className="material-symbols-outlined">lock</span> Pagar de forma segura</>
                                )}
                            </button>
                            {metodoPago === 'MERCADO_PAGO' && (
                                <p className="text-center text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-widest">
                                    Serás redirigido a Mercado Pago
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            {/* MODAL ÉXITO DE PEDIDO POR TRANSFERENCIA */}
            {pedidoTransferenciaExito && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden animate-scale-up">
                        
                        {/* Decoración superior */}
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>

                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                            Paso final: Transferencia
                        </span>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                            ¡Pedido #{pedidoTransferenciaExito.id} generado!
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Transferí el total para que podamos preparar tu compra y enviártela.
                        </p>

                        {/* Tarjeta con los datos bancarios */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-3.5 mb-6">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-xs uppercase font-bold text-slate-400">Total a transferir</span>
                                <span className="text-xl font-black text-primary">
                                    {formatPrice(pedidoTransferenciaExito.total)}
                                </span>
                            </div>

                            {/* CBU */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CBU / CVU</span>
                                    <button 
                                        type="button"
                                        onClick={() => copiarAlPortapapeles(datosTienda?.cbu, 'cbu')}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">
                                            {copiadoCampo === 'cbu' ? 'done' : 'content_copy'}
                                        </span>
                                        {copiadoCampo === 'cbu' ? '¡Copiado!' : 'Copiar CBU'}
                                    </button>
                                </div>
                                <p className="font-mono text-sm bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 select-all break-all">
                                    {datosTienda?.cbu || 'No disponible'}
                                </p>
                            </div>

                            {/* Alias */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alias</span>
                                    <button 
                                        type="button"
                                        onClick={() => copiarAlPortapapeles(datosTienda?.alias, 'alias')}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">
                                            {copiadoCampo === 'alias' ? 'done' : 'content_copy'}
                                        </span>
                                        {copiadoCampo === 'alias' ? '¡Copiado!' : 'Copiar Alias'}
                                    </button>
                                </div>
                                <p className="font-mono text-sm bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 select-all">
                                    {datosTienda?.alias || 'No disponible'}
                                </p>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="space-y-2.5">
                            <a
                                href={generarLinkWhatsapp(pedidoTransferenciaExito.id, pedidoTransferenciaExito.total)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5 text-base"
                            >
                                <span className="material-symbols-outlined text-2xl">chat</span>
                                Enviar comprobante por WhatsApp
                            </a>

                            <button
                                type="button"
                                onClick={() => navigate('/mis-pedidos')}
                                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-sm transition-colors"
                            >
                                Ir a Mis Pedidos
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
    );
};