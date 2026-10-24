export const obtenerSubdominioActual = () => {
    const hostname = window.location.hostname;
    
    // TRUCO DE DESARROLLO: Si estás en tu PC local, podés forzar 
    // que devuelva el nombre de tu cliente para poder probar la tienda.
    // Cuando quieras probar el SaaS principal (Lumato), cambiá esto a null.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return null; // Cambiá a 'vperfumery' para probar la vista del cliente
    }

    const partes = hostname.split('.');
    
    // Si la URL tiene 3 partes o más (ej: vperfumery.lumatosystem.com)
    // y la primera parte NO es "www" ni "api"
    if (partes.length >= 3 && partes[0] !== 'www' && partes[0] !== 'api') {
        return partes[0]; // Devuelve el slug limpio: "vperfumery"
    }

    return null; // Significa que están en la página principal
};