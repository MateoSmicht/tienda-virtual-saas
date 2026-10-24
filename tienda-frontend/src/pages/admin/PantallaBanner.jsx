import { useState, useEffect } from 'react';
import { fetchConToken } from '../../services/api'; // Ajustá la ruta si es necesario
import { HeroSection } from '../../components/store/HeroSection';

const PantallaBanner = () => {
    // Agregamos 'variante' al estado inicial
    const [banner, setBanner] = useState({
        etiqueta: '',
        titulo: '',
        subtitulo: '',
        imagenUrl: '',
        productoDestacado: '',
        variante: 'banner' // Por defecto arranca en el clásico
    });
    
    // Estado para guardar las ofertas y mostrarlas en la vista previa
    const [productosOferta, setProductosOferta] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Cargar los datos del banner y las ofertas al entrar
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Llamamos a tus dos endpoints
                const [resBanner, resOfertas] = await Promise.all([
                    fetchConToken('/banner'),
                    fetchConToken('/productos/ofertas') // Usamos tu endpoint del Swagger
                ]);

                if (resBanner.ok) {
                    const dataBanner = await resBanner.json();
                    if (dataBanner) setBanner(dataBanner);
                }

                if (resOfertas.ok) {
                    const dataOfertas = await resOfertas.json();
                    setProductosOferta(dataOfertas || []);
                }
            } catch (err) {
                console.error("Error cargando configuración:", err);
            } finally {
                setCargando(false);
            }
        };
        
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        setBanner({
            ...banner,
            [e.target.name]: e.target.value
        });
    };

    // Función específica para cambiar de diseño con un clic
    const cambiarVariante = (nuevaVariante) => {
        setBanner({ ...banner, variante: nuevaVariante });
    };

    const guardarBanner = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje({ texto: '', tipo: '' });

        try {
            const response = await fetchConToken('/banner', {
                method: 'PUT',
                body: JSON.stringify(banner)
            });

            if (response.ok) {
                setMensaje({ texto: '¡Configuración guardada y publicada!', tipo: 'exito' });
                setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            } else {
                setMensaje({ texto: 'Error al guardar.', tipo: 'error' });
            }
        } catch (error) {
            console.error("Error:", error);
            setMensaje({ texto: 'Fallo de conexión con el servidor.', tipo: 'error' });
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans">
            
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Personalización de Portada</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Elegí el diseño y los textos principales que verán tus clientes.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        
                        <form onSubmit={guardarBanner} className="space-y-5">
                            
                            {/* SELECTOR DE DISEÑO (LA NOVEDAD) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Diseño de la Portada</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => cambiarVariante('banner')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${banner.variante === 'banner' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-teal-200'}`}
                                    >
                                        <span className="material-symbols-outlined text-3xl mb-1">image</span>
                                        <span className="text-xs font-bold">Clásico (Imagen)</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => cambiarVariante('productos')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${banner.variante === 'productos' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-teal-200'}`}
                                    >
                                        <span className="material-symbols-outlined text-3xl mb-1">grid_view</span>
                                        <span className="text-xs font-bold">Grilla (Ofertas)</span>
                                    </button>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            {/* Textos que aplican a AMBOS diseños */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    {banner.variante === 'banner' ? 'Etiqueta Superior' : 'Etiqueta (No se muestra en Grilla)'}
                                </label>
                                <input 
                                    name="etiqueta" type="text" value={banner.etiqueta} onChange={handleChange}
                                    disabled={banner.variante === 'productos'}
                                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white outline-none disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Título Principal</label>
                                <input 
                                    name="titulo" type="text" value={banner.titulo} onChange={handleChange} required
                                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Subtítulo / Descripción</label>
                                <textarea 
                                    name="subtitulo" value={banner.subtitulo} onChange={handleChange} rows="3"
                                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white outline-none resize-none"
                                ></textarea>
                            </div>

                            {/* Campos EXCLUSIVOS del diseño "Banner" (Los deshabilitamos si elige "Productos") */}
                            <div className={`space-y-4 transition-opacity ${banner.variante === 'productos' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex justify-between">
                                        URL de la Imagen 
                                        {banner.variante === 'productos' && <span className="text-red-500 text-[10px]">Inactivo en este diseño</span>}
                                    </label>
                                    <input 
                                        name="imagenUrl" type="url" value={banner.imagenUrl} onChange={handleChange}
                                        className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Producto Destacado en Foto</label>
                                    <input 
                                        name="productoDestacado" type="text" value={banner.productoDestacado} onChange={handleChange}
                                        className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white outline-none"
                                    />
                                </div>
                            </div>

                            {/* Alertas y Botón Guardar */}
                            {mensaje.texto && (
                                <div className={`p-3 text-sm rounded-lg border font-medium ${mensaje.tipo === 'exito' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:border-teal-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800'}`}>
                                    {mensaje.texto}
                                </div>
                            )}

                            <div className="pt-2">
                                <button type="submit" disabled={guardando} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
                                    <span className="material-symbols-outlined text-[20px]">{guardando ? 'sync' : 'publish'}</span>
                                    {guardando ? 'Publicando...' : 'Publicar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* COLUMNA DERECHA: VISTA PREVIA EN VIVO */}
                <div className="xl:col-span-8">
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner min-h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-500 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                Vista Previa en Vivo de la Tienda
                            </h3>
                            <span className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 px-2 py-1 rounded font-bold animate-pulse">
                                Tiempo Real
                            </span>
                        </div>
                        
                        {/* Acá se dibuja exactamente lo mismo que ve el cliente */}
                        <div className="flex-1 pointer-events-none">
                            <HeroSection 
                                variante={banner.variante} // Pasa "banner" o "productos" dinámicamente
                                datosBanner={banner} 
                                productosOferta={productosOferta} // Pasa los productos reales en oferta
                                onVerOfertas={() => {}}
                                onVerTodo={() => {}}
                            />
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-4">
                            * Los botones de compra están deshabilitados en la vista previa.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PantallaBanner;