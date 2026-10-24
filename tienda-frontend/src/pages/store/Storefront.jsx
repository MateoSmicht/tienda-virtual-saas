import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../../components/store/ProductCard';
import { CategoriaCard } from '../../components/store/CategoriaCard';
import { HeroSection } from '../../components/store/HeroSection';
import { fetchConToken, traerCatalogoPaginado } from '../../services/api'; 

// Recibimos tiendaSlug como propiedad desde App.jsx
export const Storefront = ({ tiendaSlug }) => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [datosDelBanner, setDatosDelBanner] = useState(null);
    
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState(null);
    const [mostrarSoloOfertas, setMostrarSoloOfertas] = useState(false);
    
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [error, setError] = useState(null);

    // ESTADOS PARA PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(0);
    const [hayMasProductos, setHayMasProductos] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();
    const busquedaURL = searchParams.get('busqueda') || '';

    // REF Y ESTADO PARA FLECHAS DE SCROLL EN CATEGORÍAS (Desktop)
    const categoriasScrollRef = useRef(null);
    const [puedeScrollIzq, setPuedeScrollIzq] = useState(false);
    const [puedeScrollDer, setPuedeScrollDer] = useState(false);

    const verificarScroll = useCallback(() => {
        const el = categoriasScrollRef.current;
        if (!el) return;
        setPuedeScrollIzq(el.scrollLeft > 5);
        setPuedeScrollDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }, []);

    useEffect(() => {
        const el = categoriasScrollRef.current;
        if (!el) return;
        verificarScroll();
        el.addEventListener('scroll', verificarScroll, { passive: true });
        window.addEventListener('resize', verificarScroll);
        return () => {
            el.removeEventListener('scroll', verificarScroll);
            window.removeEventListener('resize', verificarScroll);
        };
    }, [categorias, verificarScroll]);

    const scrollCategorias = (direccion) => {
        const el = categoriasScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direccion === 'der' ? 220 : -220, behavior: 'smooth' });
    };
    

    // ==========================================
    // 1. CARGAMOS BANNER Y CATEGORÍAS (Solo 1 vez)
    // ==========================================
    useEffect(() => {
        const cargarDatosEstaticos = async () => {
            if (!tiendaSlug) return;
            
            try {
                // Modificado para que pida las categorías y banners específicos de esta tienda
                const [resCategorias, resBanner] = await Promise.all([
                    fetchConToken(`/categorias/publico?tiendaSlug=${tiendaSlug}`), 
                    fetchConToken(`/banner/publico?tiendaSlug=${tiendaSlug}`)
                ]);
                if (resCategorias.ok) setCategorias(await resCategorias.json());
                if (resBanner.ok) setDatosDelBanner(await resBanner.json());
            } catch (err) {
                console.error("Error cargando categorías/banner:", err);
            }
        };
        cargarDatosEstaticos();
    }, [tiendaSlug]);

    // ==========================================
    // 2. FUNCIÓN MAESTRA DE BÚSQUEDA Y PAGINACIÓN
    // ==========================================
    const buscarProductosBD = async (pagina = 0, esNuevaBusqueda = true) => {
        if (!tiendaSlug) return;
        
        if (esNuevaBusqueda) setCargando(true);
        else setCargandoMas(true);
        
        setError(null);

        try {
            // Asegurate de actualizar esta función en tu api.js para que reciba tiendaSlug como primer parámetro
            const data = await traerCatalogoPaginado(tiendaSlug, pagina, busquedaURL, categoriaSeleccionada?.id, mostrarSoloOfertas,subcategoriaSeleccionada?.id);
            
            if (esNuevaBusqueda) {
                setProductos(data.content || []); 
            } else {
                setProductos(prev => [...prev, ...(data.content || [])]); 
            }

            setHayMasProductos(!data.last); 
            setPaginaActual(pagina);

        } catch (err) {
            // Manejo de la regla de negocio para planes sin E-commerce
            if (err.message?.includes("CATALOGO_INACTIVO")) {
                setError("INACTIVO");
            } else if (err.message?.includes("no existe")) {
                setError("NO_EXISTE");
            } else {
                setError(err.message);
            }
        } finally {
            setCargando(false);
            setCargandoMas(false);
        }
    };

   
    // ==========================================
    // LÓGICA DE INTERFAZ Y SCROLL
    // ==========================================
   const manejarClickCategoria = (categoria) => {
        setMostrarSoloOfertas(false);
        if (categoriaSeleccionada?.id === categoria.id) {
            setCategoriaSeleccionada(null);
            setSubcategoriaSeleccionada(null);
        } else {
            setCategoriaSeleccionada(categoria);
            setSubcategoriaSeleccionada(null); 
        }
    };

  
    const manejarClickSubcategoria = (subcat) => {
        setSubcategoriaSeleccionada(subcategoriaSeleccionada?.id === subcat.id ? null : subcat);
    };


    useEffect(() => {
        buscarProductosBD(0, true);
    }, [busquedaURL, categoriaSeleccionada, subcategoriaSeleccionada, mostrarSoloOfertas, tiendaSlug]);
    
    const cargarMasProductos = () => {
        buscarProductosBD(paginaActual + 1, false);
    };

    const scrollLentoYSuave = (destinoY, duracion) => {
        const inicioY = window.scrollY;
        const distancia = destinoY - inicioY;
        let tiempoInicio = null;

        const easeInOutQuad = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1) return (c / 2) * t * t + b;
            t--;
            return (-c / 2) * (t * (t - 2) - 1) + b;
        };

        const animacion = (tiempoActual) => {
            if (tiempoInicio === null) tiempoInicio = tiempoActual;
            const tiempoTranscurrido = tiempoActual - tiempoInicio;
            const avance = easeInOutQuad(tiempoTranscurrido, inicioY, distancia, duracion);
            window.scrollTo(0, avance);
            if (tiempoTranscurrido < duracion) {
                requestAnimationFrame(animacion);
            } else {
                window.scrollTo(0, destinoY);
            }
        };
        requestAnimationFrame(animacion);
    };
    

    const hacerScrollAlCatalogo = () => {
        setTimeout(() => {
            const seccionCatalogo = document.getElementById('seccion-catalogo');
            if (seccionCatalogo) {
                const posicionY = seccionCatalogo.getBoundingClientRect().top + window.scrollY - 80;
                scrollLentoYSuave(posicionY, 1000); 
            }
        }, 100);
    };

    const verSoloOfertas = () => {
        setCategoriaSeleccionada(null);
        setMostrarSoloOfertas(true);
        hacerScrollAlCatalogo();
    };

    const verCatalogoCompleto = () => {
        setCategoriaSeleccionada(null);
        setMostrarSoloOfertas(false);
        setSearchParams({}); 
        hacerScrollAlCatalogo();
    };

    // ==========================================
    // PANTALLAS DE ERROR (SaaS Multi-Tenant)
    // ==========================================
    if (error === "INACTIVO") {
        return (
            <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in">
                    <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">store_off</span>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Catálogo no disponible</h2>
                    <p className="text-slate-500 text-sm mb-8">Esta tienda utiliza nuestro sistema para su gestión interna, pero aún no ha habilitado su catálogo de venta online.</p>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Impulsado por LumatoSystem</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error === "NO_EXISTE") {
        return (
            <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
                <p className="font-bold text-slate-500 text-lg">La URL ingresada no corresponde a ninguna tienda registrada.</p>
            </div>
        );
    }

    // ==========================================
    // RENDER PRINCIPAL
    // ==========================================
    return (
        <>
            {datosDelBanner && (
                <HeroSection 
                    variante={datosDelBanner.variante || 'banner'}
                    datosBanner={datosDelBanner}
                    productosOferta={productos.filter(p => p.esOferta)} 
                    onVerOfertas={verSoloOfertas}
                    onVerTodo={verCatalogoCompleto}
                />
            )}

            <div className="mb-6 flex flex-col gap-4" id="seccion-catalogo">
                {/* Header de sección */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white sm:text-2xl">
                        {busquedaURL ? (
                            <><span className="text-slate-400 font-medium">Resultados para </span>"{busquedaURL}"</>
                        ) : mostrarSoloOfertas ? (
                            <><span className="mr-2">🔥</span>Ofertas Especiales</>
                        ) : 'Nuestros Productos'}
                    </h3>
                    {(categoriaSeleccionada || mostrarSoloOfertas || busquedaURL) && (
                        <button 
                            onClick={verCatalogoCompleto}
                            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                            Limpiar filtro
                        </button>
                    )}
                </div>
                
                {/* CATEGORÍAS DESLIZABLES */}
                {!busquedaURL && (
                    <div className="flex flex-col gap-3">
                        {/* FILA 1: CATEGORÍAS PRINCIPALES — Scroll horizontal con flechas */}
                        <div className="group/cats relative min-w-0">
                            {/* Flecha izquierda */}
                            {puedeScrollIzq && (
                                <button
                                    onClick={() => scrollCategorias('izq')}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 lg:opacity-0 lg:group-hover/cats:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-slate-700 active:scale-95 lg:hover:scale-110"
                                >
                                    <span className="material-symbols-outlined text-[18px] lg:text-[20px]">chevron_left</span>
                                </button>
                            )}

                            {/* Contenedor scrollable */}
                            <div 
                                ref={categoriasScrollRef} 
                                className="flex gap-2.5 pb-1 overflow-x-auto scrollbar-hide touch-scroll px-1"
                            >
                                {categorias.length > 0 && categorias.map(cat => (
                                    <CategoriaCard 
                                        key={cat.id} 
                                        categoria={cat} 
                                        isActive={categoriaSeleccionada?.id === cat.id}
                                        onClick={manejarClickCategoria}
                                    />
                                ))}
                            </div>

                            {/* Flecha derecha */}
                            {puedeScrollDer && (
                                <button
                                    onClick={() => scrollCategorias('der')}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 lg:opacity-0 lg:group-hover/cats:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-slate-700 active:scale-95 lg:hover:scale-110"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            )}
                        </div>

                        {/* FILA 2: SUBCATEGORÍAS — Scroll horizontal con snap */}
                        {categoriaSeleccionada && categoriaSeleccionada.subcategorias && categoriaSeleccionada.subcategorias.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-3 border-t border-slate-100 dark:border-slate-800 scrollbar-hide touch-scroll animate-fade-in">
                                
                                {/* Botón "Todos" para limpiar el filtro de subcategoría */}
                                <button
                                    onClick={() => setSubcategoriaSeleccionada(null)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black transition-all border-2 ${
                                        !subcategoriaSeleccionada
                                        ? 'bg-slate-800 border-slate-800 text-white dark:bg-white dark:border-white dark:text-slate-900'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-700'
                                    }`}
                                >
                                    Todo en {categoriaSeleccionada.nombre}
                                </button>

                                {/* Lista de Subcategorías */}
                                {categoriaSeleccionada.subcategorias.map(subcat => (
                                    <button
                                        key={subcat.id}
                                        onClick={() => manejarClickSubcategoria(subcat)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                                            subcategoriaSeleccionada?.id === subcat.id
                                            ? 'bg-primary border-primary text-white scale-105'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {subcat.nombre}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                {cargando ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                        <div className="relative">
                            <span className="material-symbols-outlined animate-spin text-5xl text-primary">sync</span>
                        </div>
                        <p className="font-semibold text-base mt-4 text-slate-400">Cargando catálogo...</p>
                    </div>
                ) : productos.length > 0 ? ( 
                    productos.map((product, index) => ( 
                        <div key={product.id} className="animate-card-in" style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}>
                            <ProductCard product={product} />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-6xl mb-3 text-slate-300 dark:text-slate-600">search_off</span>
                        <p className="text-base font-semibold text-slate-400">No hay productos para mostrar aquí.</p>
                    </div>
                )}
            </div>

            {/* BOTÓN CARGAR MÁS */}
            {!cargando && !error && productos.length > 0 && hayMasProductos && (
                <div className="mt-8 mb-4 flex justify-center">
                    <button 
                        onClick={cargarMasProductos}
                        disabled={cargandoMas}
                        className="group rounded-full border-2 border-primary/80 bg-primary/5 px-8 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                    >
                        {cargandoMas ? (
                            <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Cargando...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[18px] group-hover:translate-y-0.5 transition-transform">expand_more</span> Cargar Más</>
                        )}
                    </button>
                </div>
            )}
        </>
    );
};