import { createContext, useContext, useState, useEffect } from 'react';

// Creamos el contexto
const FavoritesContext = createContext();

// Hook personalizado para usarlo rápido
export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
    // Iniciamos leyendo la memoria del navegador
    const [favoritos, setFavoritos] = useState(() => {
        const guardados = localStorage.getItem('vperfumery_favoritos');
        return guardados ? JSON.parse(guardados) : [];
    });

    // Cada vez que cambien los favoritos, los guardamos en la memoria
    useEffect(() => {
        localStorage.setItem('vperfumery_favoritos', JSON.stringify(favoritos));
    }, [favoritos]);

    // Función que agrega si no está, y saca si ya está
    const toggleFavorito = (producto) => {
        setFavoritos((prevFavoritos) => {
            const yaExiste = prevFavoritos.find(item => item.id === producto.id);
            if (yaExiste) {
                return prevFavoritos.filter(item => item.id !== producto.id);
            } else {
                return [...prevFavoritos, producto];
            }
        });
    };

    // Función para saber si un botón tiene que pintarse de rojo
    const esFavorito = (productoId) => {
        return favoritos.some(item => item.id === productoId);
    };

    return (
        <FavoritesContext.Provider value={{ favoritos, toggleFavorito, esFavorito }}>
            {children}
        </FavoritesContext.Provider>
    );
};