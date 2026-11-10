import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { traerProductoPublico } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Iniciamos el carrito leyendo el localStorage (por si recarga la página)
    const [carrito, setCarrito] = useState(() => {
        const guardado = localStorage.getItem('carrito_vperfumery');
        return guardado ? JSON.parse(guardado) : [];
    });

    const [notificacionesPrecio, setNotificacionesPrecio] = useState([]);
    const sincronizandoRef = useRef(false);

    // Cada vez que el carrito cambia, lo guardamos
    useEffect(() => {
        localStorage.setItem('carrito_vperfumery', JSON.stringify(carrito));
    }, [carrito]);

    // Función para sincronizar los precios y ofertas del carrito con el backend
    const sincronizarPreciosCarrito = useCallback(async (tiendaSlug) => {
        if (!tiendaSlug || sincronizandoRef.current) return;

        // Leemos directamente del estado o de localStorage
        const guardado = localStorage.getItem('carrito_vperfumery');
        const itemsActuales = guardado ? JSON.parse(guardado) : [];
        if (itemsActuales.length === 0) return;

        sincronizandoRef.current = true;

        try {
            const peticiones = itemsActuales.map(item =>
                traerProductoPublico(item.id, tiendaSlug)
                    .then(prodActualizado => ({ id: item.id, prod: prodActualizado, error: null }))
                    .catch(err => ({ id: item.id, prod: null, error: err }))
            );

            const resultados = await Promise.all(peticiones);
            const cambiosDetectados = [];

            setCarrito(prev => {
                let huboCambios = false;
                const nuevoCarrito = [];

                for (const item of prev) {
                    const res = resultados.find(r => r.id === item.id);
                    if (!res || !res.prod) {
                        // Si no pudimos consultar o hubo error temporal de red, conservamos el item tal cual
                        nuevoCarrito.push(item);
                        continue;
                    }

                    const prod = res.prod;
                    const precioAnterior = item.esOferta ? item.precioOferta : item.precio;
                    const precioNuevo = prod.esOferta ? prod.precioOferta : prod.precio;

                    if (
                        item.esOferta !== prod.esOferta ||
                        item.precioOferta !== prod.precioOferta ||
                        item.precio !== prod.precio
                    ) {
                        huboCambios = true;
                        cambiosDetectados.push({
                            id: item.id,
                            nombre: prod.nombre || item.nombre,
                            precioAnterior,
                            precioNuevo,
                            eraOferta: !!item.esOferta,
                            esOferta: !!prod.esOferta
                        });
                    }

                    nuevoCarrito.push({
                        ...item,
                        nombre: prod.nombre,
                        imagenUrl: prod.imagenUrl || item.imagenUrl,
                        precio: prod.precio,
                        esOferta: prod.esOferta,
                        precioOferta: prod.precioOferta,
                        stock: prod.stock
                    });
                }

                return huboCambios ? nuevoCarrito : prev;
            });

            if (cambiosDetectados.length > 0) {
                setNotificacionesPrecio(prev => [...prev, ...cambiosDetectados]);
            }
        } catch (error) {
            console.error("Error al sincronizar precios del carrito:", error);
        } finally {
            sincronizandoRef.current = false;
        }
    }, []);

    const limpiarNotificacionesPrecio = useCallback(() => {
        setNotificacionesPrecio([]);
    }, []);

    // Agregar un producto (o sumar 1 si ya existe)
    const agregarAlCarrito = (producto) => {
        setCarrito((prev) => {
            const productoExistente = prev.find((item) => item.id === producto.id);
            if (productoExistente) {
                return prev.map((item) => 
                    item.id === producto.id ? { 
                        ...item, 
                        // Actualizamos también precio por si varió
                        precio: producto.precio,
                        esOferta: producto.esOferta,
                        precioOferta: producto.precioOferta,
                        cantidad: item.cantidad + 1 
                    } : item
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
            actualizarCantidad,
            vaciarCarrito, 
            cantidadTotal, 
            subtotal,
            sincronizarPreciosCarrito,
            notificacionesPrecio,
            limpiarNotificacionesPrecio
        }}>
            {children}
        </CartContext.Provider>
    );
};

// Hook personalizado para usar el carrito fácilmente
export const useCart = () => useContext(CartContext);
