
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const fetchConToken = async (endpoint, opciones = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...opciones.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const urlCompleta = `${API_URL}/api${endpoint}`;

  return fetch(urlCompleta, {
    ...opciones,
    headers,
  });
};


// ==========================================
// TUS FUNCIONES EXPORTADAS
// ==========================================

export const traerProductos = async () => {
  try {
    const res = await fetchConToken('/productos?page=0&size=1000'); 
    if (!res.ok) throw new Error("Error al traer productos");
    
    const data = await res.json();
    return data.content || []; 
  } catch (error) {
    console.error(error);
    return []; 
  }
};

export const traerClientes = async () => {
  try {
    const res = await fetchConToken('/user');
    if (!res.ok) throw new Error("Error al traer clientes");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ==========================================
// FUNCIONES DE CAJA
// ==========================================


export const abrirCaja = async (montoInicial) => {
  const res = await fetchConToken('/caja/abrir', {
    method: 'POST',
    body: JSON.stringify({ montoInicial })
  });
  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(errorMsg || "Error al abrir la caja");
  }
  return await res.json();
};



export const traerHistorialCajas = async (page = 0, size = 10, fechaInicio = '', fechaFin = '', cajeroId = '') => {
  try {
    let url = `/caja/historial?page=${page}&size=${size}`;
    
    if (fechaInicio) url += `&fechaInicio=${fechaInicio}T00:00:00`;
    if (fechaFin) url += `&fechaFin=${fechaFin}T23:59:59`;
    if (cajeroId) url += `&cajeroId=${cajeroId}`;

    const res = await fetchConToken(url);
    if (!res.ok) throw new Error("Error al traer historial de cajas");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { content: [], totalPages: 0, number: 0, totalElements: 0 };
  }
};

export const traerUsuarioPorId = async (id) => {
  try {
    const res = await fetchConToken(`/user/${id}`);
    if (!res.ok) throw new Error("Error al traer usuario");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};


export const anularMovimiento = async (id) => {
  const res = await fetchConToken(`/caja/movimiento/${id}/anular`, { method: 'PUT' });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

export const traerMovimientosPorCaja = async (idCaja) => {
  try {
    const res = await fetchConToken(`/caja/${idCaja}/movimientos`);
    if (!res.ok) throw new Error("Error al traer movimientos");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};


// ==========================================
// FUNCIÓN DEL CATÁLOGO PÚBLICO (SaaS)
// ==========================================
export const traerCatalogoPaginado = async (tiendaSlug, pagina = 0, busqueda = '', categoriaId = null, soloOfertas = false, subcategoriaId = null) => {
  try {
    let url = '';

    // Si estás buscando solo ofertas, apuntamos al endpoint público de ofertas
    // (Asegurate de crear este endpoint en tu ProductoController en Spring Boot)
    if (soloOfertas) {
      url = `/productos/publico/ofertas?tiendaSlug=${tiendaSlug}&page=${pagina}&size=15`;
    } else {
      // Apuntamos al catálogo general público
      url = `/productos/publico?tiendaSlug=${tiendaSlug}&page=${pagina}&size=15&todos=false`;
      
      if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
      if (categoriaId) url += `&categoriaId=${categoriaId}`;
      if (subcategoriaId) url += `&subcategoriaId=${subcategoriaId}`;
    }

    const res = await fetchConToken(url);
    
    // Si el backend lanza un error (ej: el 400 Bad Request con "CATALOGO_INACTIVO")
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Error de conexión al cargar el catálogo");
    }
    
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error; // Re-lanzamos el error para que Storefront.jsx pueda atrapar "CATALOGO_INACTIVO"
  }
};  

// ==========================================
// FUNCIÓN PARA VER DETALLE (PÚBLICO)
// ==========================================
export const traerProductoPublico = async (id, tiendaSlug) => {
    try {
        const res = await fetchConToken(`/productos/publico/${id}?tiendaSlug=${tiendaSlug}`);
        if (!res.ok) throw new Error("Error al cargar el producto");
        return await res.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};




// OBTENER CAJA ACTUAL (Ya no recibe ID)
export const obtenerCajaActual = async () => {
  try {
    const res = await fetchConToken('/caja/actual'); 
    if (res.status === 204) return null; 
    if (!res.ok) throw new Error("Error al obtener la caja");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

// CERRAR CAJA (Ya no recibe ID)
export const cerrarCaja = async (montoCierre) => {
  const res = await fetchConToken(`/caja/cerrar?monto=${montoCierre}`, {
    method: 'PUT'
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

// REGISTRAR MOVIMIENTO (Ya no recibe ID)
export const registrarMovimiento = async (movimiento) => {
  const res = await fetchConToken(`/caja/movimiento`, { 
    method: 'POST',
    body: JSON.stringify(movimiento)
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};


// ==========================================
// FUNCIONES DE PROVEEDORES
// ==========================================

export const traerProveedores = async () => {
  try {
    const res = await fetchConToken('/proveedores');
    if (!res.ok) throw new Error("Error al traer proveedores");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const crearProveedor = async (proveedor) => {
  const res = await fetchConToken('/proveedores', {
    method: 'POST',
    body: JSON.stringify(proveedor)
  });
  if (!res.ok) throw new Error("Error al crear proveedor");
  return await res.json();
};

export const modificarProveedor = async (id, proveedor) => {
  const res = await fetchConToken(`/proveedores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(proveedor)
  });
  if (!res.ok) throw new Error("Error al modificar proveedor");
  return await res.json();
};

export const eliminarProveedor = async (id) => {
  const res = await fetchConToken(`/proveedores/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error("Error al eliminar proveedor");
  return true;
};


export const aumentarPreciosProveedor = async (id, porcentaje) => {
  const res = await fetchConToken(`/proveedores/${id}/aumentar-precios`, {
    method: 'PUT',
    body: JSON.stringify({ porcentaje: parseFloat(porcentaje) })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

// ==========================================
// FUNCIONES DE STOCK Y KARDEX
// ==========================================

export const verificarCodigoBarras = async (codigo) => {
  const res = await fetchConToken(`/stock/verificar/${codigo}`);
  if (res.status === 404) return null; // Retorna null si no existe, para disparar el modal
  if (!res.ok) throw new Error("Error al verificar el código");
  return await res.json();
};

export const registrarIngresoStock = async (datosIngreso) => {
  const res = await fetchConToken('/stock/ingreso', {
    method: 'POST',
    body: JSON.stringify(datosIngreso)
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.text(); 
};



export const traerKardexGeneral = async (page = 0, size = 20, tipo = '', fechaInicio = '', fechaFin = '') => {
  try {
    let url = `/stock/general?page=${page}&size=${size}`;
    if (tipo) url += `&tipo=${tipo}`;
    if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) url += `&fechaFin=${fechaFin}`;

    const res = await fetchConToken(url);
    if (!res.ok) throw new Error("Error al traer el historial de stock");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { content: [], totalPages: 0, number: 0, totalElements: 0 };
  }
};

export const traerBoletaStock = async (idMovimiento) => {
  try {
    const res = await fetchConToken(`/stock/boleta/${idMovimiento}`);
    if (!res.ok) throw new Error("Error al traer boleta");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const traerBoletasAgrupadas = async (page = 0, size = 20, tipo = '', fechaInicio = '', fechaFin = '') => {
  try {
    let url = `/stock/boletas?page=${page}&size=${size}`;
    if (tipo) url += `&tipo=${tipo}`;
    if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) url += `&fechaFin=${fechaFin}`;

    const res = await fetchConToken(url);
    if (!res.ok) throw new Error("Error al traer las boletas agrupadas");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { content: [], totalPages: 0, number: 0, totalElements: 0 };
  }
};
export const traerMisPedidos = async (pagina = 0, size = 5) => {
  try {
    const res = await fetchConToken(`/pedidos/mis-pedidos?page=${pagina}&size=${size}`);
    if (!res.ok) throw new Error("Error al cargar el historial");
    
    // Devolvemos el objeto paginado completo
    return await res.json();
  } catch (error) {
    console.error(error);
    // Devolvemos un fallback seguro para que no explote la UI
    return { content: [], last: true }; 
  }
};

// ==========================================
// FUNCIÓN PARA TRAER CONFIGURACIÓN DEL LOCAL (PÚBLICO)
// ==========================================
export const traerDatosPublicosTienda = async (tiendaSlug) => {
    try {
        const res = await fetchConToken(`/negocios/publico/datos?tiendaSlug=${tiendaSlug}`);
        
        // Si el backend lanza un error (ej: tienda no existe o e-commerce inactivo)
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Error al obtener datos de la tienda");
        }
        
        return await res.json();
    } catch (error) {
        console.error("Error en traerDatosPublicosTienda:", error);
        throw error;
    }
};