import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import ModalEditarPerfil from '../../pages/store/ModalEditarPerfil';

export const MobileNav = () => {
    const navigate = useNavigate();

    // Traemos los contadores globales
    const { cantidadTotal } = useCart();
    const { favoritos } = useFavorites();
    const cantidadFavoritos = favoritos.length;
    
    // ==========================================
    // ESTADOS Y LÓGICA DE SESIÓN
    // ==========================================
    const token = localStorage.getItem('token') || localStorage.getItem('vperfumery_token');
    
    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
    const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
    const menuPerfilRef = useRef(null);

    const manejarCerrarSesion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('vperfumery_token');
        localStorage.removeItem('usuarioId');
        localStorage.removeItem('usuarioEmail');
        localStorage.removeItem('usuarioRol');
        localStorage.removeItem('vperfumery_user');
        
        setMenuPerfilAbierto(false);
        navigate('/');
    };

    // Cerrar menú de perfil al tocar en otra parte de la pantalla
    useEffect(() => {
        const handleClickFueraPerfil = (e) => {
            if (menuPerfilRef.current && !menuPerfilRef.current.contains(e.target)) {
                setMenuPerfilAbierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickFueraPerfil);
        document.addEventListener('touchstart', handleClickFueraPerfil); // Para pantallas táctiles
        return () => {
            document.removeEventListener('mousedown', handleClickFueraPerfil);
            document.removeEventListener('touchstart', handleClickFueraPerfil);
        };
    }, []);

    // Función auxiliar: Si la ruta está activa, la pinta de color primario. Si no, queda gris.
    const navItemClass = ({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive 
                ? 'text-primary' 
                : 'text-slate-400 hover:text-primary dark:text-slate-500'
        }`;

    return (
        <>
            {/* Contenedor principal fijado al fondo */}
            <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
                <div className="flex h-16 items-center justify-around px-2 relative">
                    
                    {/* 1. Inicio */}
                    <NavLink to="/" className={navItemClass} end>
                        {({ isActive }) => (
                            <>
                                <span 
                                    className="material-symbols-outlined text-2xl transition-all" 
                                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    home
                                </span>
                                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>Inicio</span>
                            </>
                        )}
                    </NavLink>
                    
                    {/* 2. Buscar (Enfoca el input de búsqueda del navbar) */}
                    <button 
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'instant' });
                            // Pequeño delay para que el scroll termine y luego enfocamos el input
                            setTimeout(() => {
                                const searchInput = document.querySelector('header input[type="text"]');
                                if (searchInput) searchInput.focus();
                            }, 50);
                        }} 
                        className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary dark:text-slate-500 transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">search</span>
                        <span className="text-[10px] font-semibold">Buscar</span>
                    </button>

                    {/* 3. Favoritos */}
                    <NavLink to="/favoritos" className={({ isActive }) => 
                        `relative flex flex-col items-center justify-center gap-1 transition-colors ${
                            isActive ? 'text-red-500' : 'text-slate-400 hover:text-red-500 dark:text-slate-500'
                        }`
                    }>
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <span 
                                        className="material-symbols-outlined text-2xl"
                                        style={(isActive || cantidadFavoritos > 0) ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    >
                                        favorite
                                    </span>
                                    {cantidadFavoritos > 0 && (
                                        <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                                            {cantidadFavoritos}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>Deseos</span>
                            </>
                        )}
                    </NavLink>
                    
                    {/* 4. Carrito */}
                    <NavLink to="/checkout" className={navItemClass}>
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <span 
                                        className="material-symbols-outlined text-2xl"
                                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    >
                                        shopping_cart
                                    </span>
                                    {cantidadTotal > 0 && (
                                        <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm">
                                            {cantidadTotal}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>Mi Pedido</span>
                            </>
                        )}
                    </NavLink>
                    
                    {/* 5. Perfil / Login (CON LÓGICA DE SESIÓN) */}
                    {token ? (
                        <div className="relative flex flex-col items-center justify-center" ref={menuPerfilRef}>
                            <button 
                                onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                                className={`flex flex-col items-center justify-center gap-1 transition-colors ${menuPerfilAbierto ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                                <span 
                                    className="material-symbols-outlined text-2xl transition-all"
                                    style={menuPerfilAbierto ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    person
                                </span>
                                <span className={`text-[10px] ${menuPerfilAbierto ? 'font-bold' : 'font-semibold'}`}>Perfil</span>
                            </button>

                            {/* Menú Flotante hacia ARRIBA */}
                            {menuPerfilAbierto && (
                                <div className="absolute bottom-full mb-3 right-0 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-in pb-1">
                                    <button 
                                        onClick={() => {
                                            setMostrarModalPerfil(true);
                                            setMenuPerfilAbierto(false);
                                        }} 
                                        className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-slate-50 dark:border-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px] text-primary">manage_accounts</span> Editar Perfil
                                    </button>
                                    
                                    {/* NUEVO BOTÓN ACÁ: MIS PEDIDOS */}
                                    <Link 
                                        to="/mis-pedidos"
                                        onClick={() => setMenuPerfilAbierto(false)}
                                        className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-slate-50 dark:border-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px] text-primary">receipt_long</span> Mis Pedidos
                                    </Link>

                                    <button 
                                        onClick={manejarCerrarSesion} 
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">logout</span> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <NavLink to="/login" className={navItemClass}>
                            {({ isActive }) => (
                                <>
                                    <span 
                                        className="material-symbols-outlined text-2xl transition-all"
                                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    >
                                        login
                                    </span>
                                    <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>Ingresar</span>
                                </>
                            )}
                        </NavLink>
                    )}

                </div>
            </nav>

            {/* MODAL DE EDITAR PERFIL (Renderizado fuera del nav para que no se corte) */}
            {mostrarModalPerfil && (
                <ModalEditarPerfil onClose={() => setMostrarModalPerfil(false)} />
            )}

            <div className="h-20 lg:hidden"></div>
        </>
    );
};