import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Iniciamos el carrito leyendo el localStorage (por si recarga la página)
    const [carrito, setCarrito] = useState(() => {
        const guardado = localStorage.getItem('carrito_vperfumery');
        return guardado ? JSON.parse(guardado) : [];
    });

    // Cada vez que el carrito cambia, lo guardamos
    useEffect(() => {
        localStorage.setItem('carrito_vperfumery', JSON.stringify(carrito));
    }, [carrito]);

    // Agregar un producto (o sumar 1 si ya existe)
    const agregarAlCarrito = (producto) => {
        setCarrito((prev) => {
            const productoExistente = prev.find((item) => item.id === producto.id);
            if (productoExistente) {
                return prev.map((item) => 
                    item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
    };

    // Eliminar el producto por completo
    const eliminarDelCarrito = (id) => {
        setCarrito((prev) => prev.filter((item) => item.id !== id));
    };

    // Modificar la cantidad exacta (botones + y -)
    const actualizarCantidad = (id, nuevaCantidad) => {
        if (nuevaCantidad < 1) {
            eliminarDelCarrito(id);
            return;
        }
        setCarrito((prev) => 
            prev.map((item) => 
                item.id === id ? { ...item, cantidad: nuevaCantidad } : item
            )
        );
    };

    // Limpiar todo el carrito
    const vaciarCarrito = () => setCarrito([]);

    // Cálculos rápidos para no repetirlos en cada componente
    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const subtotal = carrito.reduce((acc, item) => {
        const precioReal = item.esOferta ? item.precioOferta : item.precio;
        return acc + (precioReal * item.cantidad);
    }, 0);

    return (
        <CartContext.Provider value={{ 
            carrito, 
            agregarAlCarrito, 
            eliminarDelCarrito, 
            actualizarCantidad, // <--- Nueva función expuesta
            vaciarCarrito, 
            cantidadTotal, 
            subtotal 
        }}>
            {children}
        </CartContext.Provider>
    );
};

// Hook personalizado para usar el carrito fácilmente
export const useCart = () => useContext(CartContext);