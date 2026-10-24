import { ProductCard } from './ProductCard';

export const HeroSection = ({ 
    variante = 'banner', 
    datosBanner, 
    productosOferta = [], 
    onVerOfertas, 
    onVerTodo 
}) => {

    // ==========================================
    // TIPO 2: GRILLA DE PRODUCTOS DESTACADOS
    // ==========================================
    if (variante === 'productos') {
        return (
            <div className="mb-8 p-4 sm:p-6 lg:p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="mb-6 sm:mb-8">
                    {/* Contenedor de Textos y Botones */}
                    <div className="space-y-3 sm:space-y-5 max-w-2xl">
                        <div className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            🔥 Ofertas por Tiempo Limitado
                        </div>
                        <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-5xl">
                            {datosBanner.titulo}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                            {datosBanner.subtitulo}
                        </p>

                        {/* BOTONES CON ESTÉTICA DE BANNER Y FLECHA ANIMADA */}
                        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:gap-4 sm:pt-2">
                            <button 
                                onClick={onVerOfertas}
                                className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 sm:px-8 sm:py-3.5 sm:text-base active:scale-95"
                            >
                                Ver catálogo de ofertas
                                {/* Flechita animada que indica que la página va a bajar */}
                                <span className="material-symbols-outlined text-[18px] animate-bounce sm:text-[20px]">
                                    arrow_downward
                                </span>
                            </button>
                            <button 
                                onClick={onVerTodo}
                                className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-sm border border-slate-200 transition-all hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white sm:px-8 sm:py-3.5 sm:text-base active:scale-95"
                            >
                                Catálogo Completo
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Grilla de los 4 productos en oferta */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    {productosOferta.slice(0, 4).map(prod => (
                        <ProductCard key={prod.id} product={prod} />
                    ))}
                    {productosOferta.length === 0 && (
                        <p className="col-span-full text-sm text-slate-500 py-4">
                            No hay productos en oferta en este momento.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // TIPO 1: BANNER CLÁSICO CON IMAGEN (Sin bordes blancos)
    // ==========================================
    return (
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-5 sm:p-8 lg:p-12">
            <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-2">
                
                {/* Columna Izquierda: Textos y Botones */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
                        {datosBanner.etiqueta || 'Oferta del Día'}
                    </div>
                    <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-6xl">
                        {datosBanner.titulo}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-lg">
                        {datosBanner.subtitulo}
                    </p>
                    
                    <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:gap-4 sm:pt-2">
                        <button 
                            onClick={onVerOfertas}
                            className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 sm:px-8 sm:py-3.5 sm:text-base active:scale-95"
                        >
                            Ver Ofertas
                            <span className="material-symbols-outlined text-[18px] animate-bounce sm:text-[20px]">
                                arrow_downward
                            </span>
                        </button>
                        <button 
                            onClick={onVerTodo}
                            className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 dark:bg-slate-800 dark:text-white sm:px-8 sm:py-3.5 sm:text-base active:scale-95"
                        >
                            Catálogo Completo
                        </button>
                    </div>
                </div>
                
                {/* Columna Derecha: Contenedor de la Imagen (Fondo Completo) */}
                <div 
                    className="relative aspect-video w-full rounded-xl bg-slate-200 shadow-2xl dark:bg-slate-700 bg-cover bg-center transition-all" 
                    style={{ backgroundImage: `url("${datosBanner.imagenUrl}")` }}
                >
                    {/* Etiqueta flotante del producto destacado */}
                    <div className="absolute bottom-3 right-3 rounded-lg bg-white/90 p-3 backdrop-blur-sm dark:bg-slate-900/90 shadow-lg border border-slate-100 dark:border-slate-800 sm:bottom-4 sm:right-4 sm:p-4">
                        <p className="text-[10px] font-bold uppercase text-primary sm:text-xs">Producto Destacado</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white sm:text-sm">{datosBanner.productoDestacado}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};