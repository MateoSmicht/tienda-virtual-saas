import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
// 1. CORRECCIÓN: Importamos la función correcta
import { traerProductoPublico } from '../../services/api';

// 2. CORRECCIÓN: Agregamos { tiendaSlug } adentro de los paréntesis
export const PantallaPerfilProduct = ({ tiendaSlug }) => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { agregarAlCarrito } = useCart();
    
    const [producto, setProducto] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);


    useEffect(() => {
        const cargarProducto = async () => {
            try {
                const data = await traerProductoPublico(id, tiendaSlug);
                setProducto(data);
            } catch (error) {
                // Si falla (ej. producto de otra tienda), lo mandamos al inicio
                navigate("/"); 
            } finally {
                // Aseguramos que la pantalla de carga desaparezca
                setCargando(false);
            }
        };
        
        if (id && tiendaSlug) {
            cargarProducto();
        }
    }, [id, tiendaSlug]);
    

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-5xl text-primary">sync</span>
            </div>
        );
    }

    if (!producto) return null;

    const precioFinal = producto.esOferta ? producto.precioOferta : producto.precio;
    const precioOriginal = producto.esOferta ? producto.precio : null;
    const descuento = producto.esOferta ? Math.round(((producto.precio - producto.precioOferta) / producto.precio) * 100) : 0;

    const manejarAgregar = () => {
        // Agregamos el producto las veces que el cliente indicó
        for (let i = 0; i < cantidad; i++) {
            agregarAlCarrito(producto);
        }
        
        // Activamos la animación visual de "¡Agregado!"
        setAgregado(true);
        
        // Le damos 600 milisegundos para que vea que el botón se puso verde, 
        // y luego lo mandamos a la pantalla anterior automáticamente.
        setTimeout(() => {
            navigate(-1); 
        }, 600);
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display pt-8 pb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
                
                {/* 1. MIGA DE PAN MÁS GRANDE (text-base y text-[20px]/[22px]) */}
                <div className="flex items-center gap-2 text-base text-slate-500 mb-8 font-medium">
                    <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[22px]">home</span> Inicio
                    </Link>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    <span className="text-slate-400 capitalize">{producto.subcategoria?.categoria?.nombre || 'General'}</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[250px]">{producto.nombre}</span>
                </div>

                {/* Contenedor Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800">
                    
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        {producto.esOferta && (
                            <div className="absolute top-4 left-4 z-10 bg-primary text-white font-black text-sm px-3 py-1.5 rounded-lg shadow-lg shadow-primary/30">
                                {descuento}% OFF
                            </div>
                        )}
                        <img 
                            src={producto.imagenUrl || 'https://via.placeholder.com/600?text=Sin+Imagen'} 
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col justify-center">
                        <p className="text-primary font-bold tracking-widest uppercase text-sm mb-2">
                            {producto.subcategoria?.categoria?.nombre || 'Categoría General'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                            {producto.nombre}
                        </h1>
                        
                        <div className="flex items-end gap-4 mb-6">
                            <span className="text-5xl font-black text-slate-900 dark:text-white">
                                ${precioFinal.toLocaleString()}
                            </span>
                            {precioOriginal && (
                                <span className="text-2xl text-slate-400 line-through mb-1">
                                    ${precioOriginal.toLocaleString()}
                                </span>
                            )}
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {producto.descripcion || "Este producto es excelente para el cuidado diario. Formulado con ingredientes de alta calidad para garantizar el mejor resultado."}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                <span className="material-symbols-outlined text-[20px] text-teal-500">inventory_2</span>
                                <span>Código de artículo: <strong className="text-slate-700 dark:text-slate-300">{producto.codigoBarra || producto.id}</strong></span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden h-14 w-full sm:w-32 shrink-0">
                                    <button 
                                        onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                                        className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">remove</span>
                                    </button>
                                    <span className="flex-1 text-center font-bold text-lg text-slate-900 dark:text-white">
                                        {cantidad}
                                    </span>
                                    <button 
                                        onClick={() => setCantidad(prev => prev + 1)}
                                        className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                </div>

                                {/* 2. EL BOTÓN AHORA VUELVE PARA ATRÁS (Ver función manejarAgregar) */}
                                <button 
                                    onClick={manejarAgregar}
                                    disabled={agregado}
                                    className={`flex-1 h-14 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                                        agregado 
                                            ? 'bg-green-500 text-white shadow-green-500/30' 
                                            : 'bg-primary text-white hover:bg-primary/90 shadow-primary/30 hover:-translate-y-1'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">
                                        {agregado ? 'check_circle' : 'shopping_cart'}
                                    </span>
                                    {agregado ? '¡Agregado!' : 'Agregar al carrito'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};