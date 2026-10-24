import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext'; 

export const ProductCard = ({ product }) => {
    const { agregarAlCarrito } = useCart();
    // Estado para saber si acaba de ser agregado (animación del botón)
    const [agregado, setAgregado] = useState(false);
    
    // Traemos las funciones del contexto
    const { toggleFavorito, esFavorito } = useFavorites();
    
    // 👇 ACÁ ESTABA EL PROBLEMA: Faltaba esta línea para saber si el corazón va rojo o gris
    const isFav = esFavorito(product.id);

    // Formateador de moneda
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    };

    const precioFinal = product.esOferta ? product.precioOferta : product.precio;
    const precioOriginal = product.esOferta ? product.precio : null;
    
    const porcentajeDescuento = product.esOferta 
        ? Math.round(((product.precio - product.precioOferta) / product.precio) * 100) 
        : 0;

    // Función para manejar el clic con la animación
    const manejarAgregarAlCarrito = (e) => {
        e.preventDefault(); // Evita comportamientos no deseados si hay links cerca
        agregarAlCarrito(product); // Sumamos al carrito real
        setAgregado(true);         // Disparamos la animación visual

        // A los 1.2 segundos (1200ms), devolvemos el botón a su estado normal
        setTimeout(() => {
            setAgregado(false);
        }, 1200);
    };

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:bg-slate-800 dark:ring-slate-700/50 dark:hover:shadow-slate-900/50">
            
            {/* 1. IMAGEN DEL PRODUCTO (CLICKEABLE) */}
            <Link to={`/producto/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700 block">
                
                {/* Etiqueta de Oferta dinámica */}
                {product.esOferta && (
                    <div className="absolute left-2 top-2 z-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-2 py-1 text-[10px] font-black text-white shadow-md">
                        {porcentajeDescuento}% OFF
                    </div>
                )}

                <img 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    src={product.imagenUrl || 'https://placehold.co/300x300/e2e8f0/64748b?text=Sin+Imagen'} 
                    alt={product.nombre} 
                />
                
                {/* Botón de Favoritos */}
                <button 
                     onClick={(e) => {
                        e.preventDefault(); 
                        toggleFavorito(product); // Agrega o quita con un clic
                    }}
                    className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm dark:bg-slate-900/90 transition-all hover:scale-110"
                >
                    <span 
                        className={`material-symbols-outlined text-[20px] transition-colors ${
                         isFav ? 'text-red-500' : 'text-slate-400 hover:text-red-400'
                        }`}
                        style={isFav ? { fontVariationSettings: "'FILL' 1" } : {}} // Esto lo pinta por dentro
                    >
                        favorite
                    </span>
                </button>
            </Link>

            <div className="flex flex-1 flex-col p-2.5 sm:p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 truncate sm:text-[10px]">
                    {product.subcategoria?.categoria?.nombre || "General"}
                </p>
                
                {/* 2. TÍTULO DEL PRODUCTO (CLICKEABLE) */}
                <Link to={`/producto/${product.id}`}>
                    <h4 className="mt-0.5 line-clamp-2 h-9 text-xs font-bold leading-tight hover:text-primary transition-colors sm:h-10 sm:text-sm sm:mt-1" title={product.nombre}>
                        {product.nombre}
                    </h4>
                </Link>
                
                <div className="mt-auto flex items-end justify-between pt-1.5 sm:pt-2">
                    <div className="flex flex-col">
                        <span className="text-base font-black text-primary sm:text-lg">
                            {formatPrice(precioFinal)}
                        </span>
                        {precioOriginal && (
                            <span className="text-[10px] text-slate-400 line-through sm:text-xs">
                                {formatPrice(precioOriginal)}
                            </span>
                        )}
                    </div>
                    
                    {/* 3. BOTÓN DE AGREGAR AL CARRITO (Animado y aislado) */}
                    <button 
                        onClick={manejarAgregarAlCarrito}
                        disabled={agregado}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-white transition-all duration-300 ${
                            agregado 
                                ? 'bg-green-500 scale-110 shadow-lg shadow-green-500/30' // Estilo "¡Éxito!"
                                : 'bg-primary hover:bg-primary/90 active:scale-95'        // Estilo Normal
                        }`}
                        title="Agregar al carrito"
                    >
                        <span className="material-symbols-outlined">
                            {agregado ? 'check' : 'add_shopping_cart'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};