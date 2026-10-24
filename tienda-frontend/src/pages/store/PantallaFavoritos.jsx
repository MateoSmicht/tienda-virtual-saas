import { Link } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import { ProductCard } from '../../components/store/ProductCard';

export const PantallaFavoritos = () => {
    // Traemos la lista de productos guardados en el Local Storage
    const { favoritos } = useFavorites();

    // Hacemos que la página empiece siempre arriba de todo
    window.scrollTo(0, 0);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display pt-8 pb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
                
                {/* Encabezado y Miga de Pan */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-2 text-base text-slate-500 font-medium">
                        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[22px]">home</span> Inicio
                        </Link>
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        <span className="text-slate-800 dark:text-slate-200">Mis Favoritos</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            favorite
                        </span>
                        Mis Favoritos
                    </h1>
                </div>

                {/* Renderizado Condicional: ¿Hay favoritos o está vacío? */}
                {favoritos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl p-12 py-20 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-6xl text-red-300 dark:text-red-500/50">
                                heart_broken
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                            Aún no tenés favoritos
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-md">
                            Explorá nuestro catálogo y tocá el corazón en los productos que más te gusten para guardarlos acá.
                        </p>
                        <Link 
                            to="/"
                            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/30 transition-all hover:-translate-y-1 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">storefront</span>
                            Explorar catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {/* Iteramos sobre los favoritos y usamos la tarjeta que ya armamos */}
                        {favoritos.map((producto) => (
                            <ProductCard key={producto.id} product={producto} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};