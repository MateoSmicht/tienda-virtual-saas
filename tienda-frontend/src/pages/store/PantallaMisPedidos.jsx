import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { traerMisPedidos, traerDatosPublicosTienda } from "../../services/api";

export const PantallaMisPedidos = ({ tiendaSlug }) => {
    // Slug efectivo
    const slugEfectivo = tiendaSlug || (window.location.hostname.includes('onrender.com') ? 'smisanperfumeria' : (window.location.hostname.endsWith('.localhost') ? window.location.hostname.replace('.localhost', '') : 'smisanperfumeria'));
    const [datosTienda, setDatosTienda] = useState(null);
    const [copiadoCampo, setCopiadoCampo] = useState(null);
    const [misPedidos, setMisPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    // Paginación
    const [paginaActual, setPaginaActual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    // Estado para controlar qué pedidos están expandidos para ver el detalle
    const [pedidosExpandidos, setPedidosExpandidos] = useState({});

    const cargarPedidos = async (nroPagina = 0) => {
        setCargando(true);
        try {
            const data = await traerMisPedidos(nroPagina, 5);
            setMisPedidos(data.content || []);
            setTotalPaginas(data.totalPages || 0);
            setTotalElementos(data.totalElements || 0);
            setPaginaActual(data.number || 0);
        } catch (err) {
            console.error("Error cargando pedidos", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarPedidos(paginaActual);
        window.scrollTo(0, 0);
    }, [paginaActual]);

    useEffect(() => {
        const cargarTienda = async () => {
            if (!slugEfectivo) return;
            try {
                const info = await traerDatosPublicosTienda(slugEfectivo);
                setDatosTienda(info);
            } catch (err) {
                console.error("Error al cargar datos de la tienda:", err);
            }
        };
        cargarTienda();
    }, [slugEfectivo]);

    const copiarAlPortapapeles = (texto, campo) => {
        if (!texto) return;
        navigator.clipboard.writeText(texto);
        setCopiadoCampo(campo);
        setTimeout(() => setCopiadoCampo(null), 2000);
    };

    const generarLinkWhatsapp = (nroPedido, montoTotal) => {
        const telefono = (datosTienda?.whatsapp || '').replace(/\D/g, '');
        const texto = encodeURIComponent(
            `¡Hola! Te escribo por el Pedido #${nroPedido} (${formatPrice(montoTotal)}) realizado en ${datosTienda?.nombre || 'la tienda'}. Te adjunto el comprobante de transferencia.`
        );
        return telefono ? `https://wa.me/${telefono}?text=${texto}` : `https://wa.me/?text=${texto}`;
    };

    const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price || 0);

    const getColorEstado = (estado) => {
        switch(estado?.toUpperCase()) {
            case 'PENDIENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'PAGADO': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ENVIADO': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'ENTREGADO': return 'bg-green-100 text-green-700 border-green-200';
            case 'CANCELADO': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // 1. SOLUCIÓN A LA FECHA: Maneja Arrays de Spring Boot o Strings ISO
    const formatearFecha = (fecha) => {
        if (!fecha) return 'Fecha desconocida';
        let dateObj;
        
        if (Array.isArray(fecha)) {
            // Si SpringBoot manda [Año, Mes, Dia, Hora, Minuto]
            dateObj = new Date(fecha[0], fecha[1] - 1, fecha[2], fecha[3], fecha[4], fecha[5] || 0);
        } else {
            // Si manda un String estándar
            dateObj = new Date(fecha);
        }

        return dateObj.toLocaleDateString('es-AR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute:'2-digit' 
        });
    };

    // 2. SOLUCIÓN A LA CANTIDAD: Suma la cantidad real de productos, no solo las filas
    const calcularTotalArticulos = (items) => {
        if (!items) return 0;
        return items.reduce((total, item) => total + (item.cantidad || 1), 0);
    };

    // Alternar vista de detalles
    const toggleDetalle = (pedidoId) => {
        setPedidosExpandidos(prev => ({
            ...prev,
            [pedidoId]: !prev[pedidoId]
        }));
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display pt-8 pb-20">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                
                {/* Encabezado */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-2 text-base text-slate-500 font-medium">
                        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[22px]">home</span> Inicio
                        </Link>
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        <span className="text-slate-800 dark:text-slate-200">Mis Pedidos</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-4xl">receipt_long</span>
                        Historial de Compras
                    </h1>
                </div>

                {/* Lista de Pedidos */}
                {cargando ? (
                    <div className="py-20 flex justify-center text-primary">
                        <span className="material-symbols-outlined animate-spin text-5xl">sync</span>
                    </div>
                ) : misPedidos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl p-12 py-20 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-6xl text-primary/50">shopping_bag</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Aún no tenés compras</h2>
                        <p className="text-slate-500 mb-8 max-w-md">Tu historial de pedidos aparecerá acá una vez que realices tu primera compra.</p>
                        <Link to="/" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/30 transition-all hover:-translate-y-1">
                            Ir a la tienda
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {misPedidos.map(pedido => {
                            const estaExpandido = pedidosExpandidos[pedido.id];
                            const totalArticulos = calcularTotalArticulos(pedido.items);

                            return (
                                <div key={pedido.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col gap-4 transition-all hover:border-primary/30">
                                    
                                    {/* Cabecera del Pedido */}
                                    <div className="flex flex-wrap justify-between items-start gap-4 cursor-pointer" onClick={() => toggleDetalle(pedido.id)}>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="text-sm font-black text-slate-400">PEDIDO #{pedido.id}</p>
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${getColorEstado(pedido.estado)}`}>
                                                    {pedido.estado}
                                                </span>
                                            </div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {formatearFecha(pedido.fecha)}
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className="text-sm text-slate-500 font-medium mb-1">{totalArticulos} {totalArticulos === 1 ? 'artículo' : 'artículos'}</p>
                                                <p className="text-xl font-black text-primary">{formatPrice(pedido.total)}</p>
                                            </div>
                                            <button 
                                                className={`w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-transform ${estaExpandido ? 'rotate-180 bg-primary/10 text-primary' : ''}`}
                                            >
                                                <span className="material-symbols-outlined text-xl">expand_more</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* 3. SOLUCIÓN AL DETALLE: El Acordeón Desplegable */}
                                    {estaExpandido && (
                                        <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detalle de productos</h4>
                                            
                                            <div className="space-y-3">
                                                {pedido.items?.map((item, idx) => {
                                                    // Buscamos los datos del producto previniendo nulos
                                                    const nombreProducto = item.nombreProducto || 'Producto eliminado';
                                                    const imagenProducto = item.imagenUrl || 'https://via.placeholder.com/150';
                                                    const precioUnitario = item.precioUnitario || item.precio || 0;

                                                    return (
                                                        <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                            <div 
                                                                className="w-12 h-12 rounded-lg bg-white bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-700" 
                                                                style={{ backgroundImage: `url("${imagenProducto}")` }}
                                                            ></div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{nombreProducto}</p>
                                                                <p className="text-xs text-slate-500 font-medium">{item.cantidad} x {formatPrice(precioUnitario)}</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                                                                    {formatPrice(precioUnitario * item.cantidad)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Resumen extra (Envío / Método de pago) */}
                                            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs text-slate-500">
                                                        Método de pago: <strong className="text-slate-700 dark:text-slate-300">{pedido.metodoPago?.replace('_', ' ')}</strong>
                                                    </p>
                                                </div>

                                                {/* BLOQUE ESPECIAL SI ES TRANSFERENCIA PENDIENTE */}
                                                {pedido.metodoPago === 'TRANSFERENCIA' && pedido.estado?.toUpperCase() === 'PENDIENTE' && (
                                                    <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                                                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                                                            <span className="material-symbols-outlined text-xl">account_balance</span>
                                                            <p className="text-xs font-bold uppercase tracking-wider">
                                                                Datos para transferir y confirmar tu pedido:
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                            {datosTienda?.cbu && (
                                                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-100 dark:border-slate-800 flex justify-between items-center gap-2">
                                                                    <div className="min-w-0">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">CBU / CVU</span>
                                                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 truncate block">{datosTienda.cbu}</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copiarAlPortapapeles(datosTienda.cbu, `cbu-${pedido.id}`)}
                                                                        className="p-1 text-primary hover:bg-primary/10 rounded"
                                                                        title="Copiar CBU"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">
                                                                            {copiadoCampo === `cbu-${pedido.id}` ? 'done' : 'content_copy'}
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {datosTienda?.alias && (
                                                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-100 dark:border-slate-800 flex justify-between items-center gap-2">
                                                                    <div className="min-w-0">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Alias</span>
                                                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 truncate block">{datosTienda.alias}</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copiarAlPortapapeles(datosTienda.alias, `alias-${pedido.id}`)}
                                                                        className="p-1 text-primary hover:bg-primary/10 rounded"
                                                                        title="Copiar Alias"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">
                                                                            {copiadoCampo === `alias-${pedido.id}` ? 'done' : 'content_copy'}
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <a
                                                            href={generarLinkWhatsapp(pedido.id, pedido.total)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-md shadow-green-600/20 transition-all hover:scale-[1.01]"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">chat</span>
                                                            Enviar comprobante de transferencia por WhatsApp
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* PAGINACIÓN */}
                        {totalPaginas > 1 && (
                            <div className="flex items-center justify-between mt-8 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                <p className="text-sm font-medium text-slate-500 hidden sm:block">
                                    Mostrando {misPedidos.length} de {totalElementos} pedidos
                                </p>
                                <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                    <button 
                                        disabled={paginaActual === 0} 
                                        onClick={() => setPaginaActual(paginaActual - 1)} 
                                        className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-4 py-2 text-sm font-black text-primary bg-primary/10 rounded-xl flex items-center">
                                        Pág. {paginaActual + 1} de {totalPaginas}
                                    </span>
                                    <button 
                                        disabled={paginaActual >= totalPaginas - 1} 
                                        onClick={() => setPaginaActual(paginaActual + 1)} 
                                        className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};