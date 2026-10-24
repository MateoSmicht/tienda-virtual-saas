import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConToken } from '../../services/api';

const PantallaProductos = () => {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [cargando, setCargando] = useState(true);

  const [estadisticas, setEstadisticas] = useState({ total: 0, activos: 0, sinStock: 0 });

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState(''); // NUEVO ESTADO
  const [stockFiltro, setStockFiltro] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);

  useEffect(() => {
    fetchConToken('/categorias')
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error("Error cargando categorías:", err));
  }, []);

  const cargarProductos = async (nroPagina = 0) => {
    setCargando(true);
    try {
      let urlProductos = `/productos?todos=true&page=${nroPagina}&size=10`;
      
      if (busqueda) urlProductos += `&busqueda=${encodeURIComponent(busqueda)}`;
      if (categoriaFiltro) urlProductos += `&categoriaId=${categoriaFiltro}`;
      if (subcategoriaFiltro) urlProductos += `&subcategoriaId=${subcategoriaFiltro}`; // NUEVO PARÁMETRO
      if (stockFiltro !== '') urlProductos += `&stockMax=${stockFiltro}`;

      const [resProductos, resEstadisticas] = await Promise.all([
        fetchConToken(urlProductos).then(r => r.json()),
        fetchConToken(`/productos/estadisticas`).then(r => r.json())
      ]);
      
      setProductos(resProductos.content || []); 
      setTotalPaginas(resProductos.totalPages || 0);
      setTotalElementos(resProductos.totalElements || 0);
      setPaginaActual(resProductos.number || 0);
      setEstadisticas(resEstadisticas);

    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setCargando(false);
    }
  };

  // El debounce ahora también escucha a subcategoriaFiltro
  useEffect(() => {
    const timeout = setTimeout(() => {
      cargarProductos(0); 
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, categoriaFiltro, subcategoriaFiltro, stockFiltro]); 

  const eliminarProducto = async (id) => {
    const confirmacion = window.confirm("¿Estás seguro de que querés eliminar este producto? Esta acción no se puede deshacer.");
    if (confirmacion) {
      try {
        const response = await fetchConToken(`/productos/${id}`, { method: 'DELETE' });
        if (response.ok) {
          cargarProductos(paginaActual); 
        } else {
          alert("Hubo un error al intentar eliminar el producto.");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
      }
    }
  };

  const alternarEstado = async (productoActual) => {
    const nuevoEstado = !productoActual.disponible;
    try {
      const response = await fetchConToken(`/productos/${productoActual.id}/estado?disponible=${nuevoEstado}`, { method: 'PUT' });
      if (response.ok) {
        setProductos(productos.map(prod => prod.id === productoActual.id ? { ...prod, disponible: nuevoEstado } : prod));
      } else {
        alert("Hubo un error al cambiar el estado del producto.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  const categoriasUnicas = new Set(
    productos.map(prod => prod.subcategoria?.categoria?.id).filter(id => id != null)
  ).size;

  // LÓGICA PARA OBTENER LAS SUBCATEGORÍAS DE LA CATEGORÍA SELECCIONADA
  const categoriaSeleccionada = categorias.find(c => c.id.toString() === categoriaFiltro);
  const subcategoriasDisponibles = categoriaSeleccionada?.subcategorias || [];

  // Función para manejar el cambio de categoría y blanquear la subcategoría
  const manejarCambioCategoria = (e) => {
    setCategoriaFiltro(e.target.value);
    setSubcategoriaFiltro(''); // Si cambio "Perfumería" por "Maquillaje", borro "Hombre"
  };

  return (
    <div className="p-8 space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Gestión de Productos</h2>
          <p className="text-slate-500 text-sm">Administrá tu catálogo, stock y precios.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/productos/stock')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-all shadow-sm">
            <span className="material-symbols-outlined">inventory_2</span>
            <span>Cargar Stock</span>
          </button>
          <button onClick={() => navigate('/productos/nuevo')} className="bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">add</span>
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Catálogo</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{estadisticas.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Activos</p>
          <p className="text-2xl font-bold mt-1 text-emerald-500">{estadisticas.activos}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sin Stock (Alerta)</p>
          <p className="text-2xl font-bold mt-1 text-amber-500">{estadisticas.sinStock}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categorías en Vista</p>
          <p className="text-2xl font-bold mt-1 text-indigo-500">{categoriasUnicas}</p>
        </div>
      </div>

      {/* BARRA DE FILTROS ACTUALIZADA */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 mb-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Buscar en Catálogo</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
            <input 
              type="text"
              placeholder="Nombre o SKU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Categoría</label>
          <select
            value={categoriaFiltro}
            onChange={manejarCambioCategoria}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary transition-all"
          >
            <option value="">Todas</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        {/* NUEVO SELECT DE SUBCATEGORÍA (Se habilita solo si hay categoría) */}
        <div className="w-full md:w-48">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Subcategoría</label>
          <select
            value={subcategoriaFiltro}
            onChange={(e) => setSubcategoriaFiltro(e.target.value)}
            disabled={!categoriaFiltro || subcategoriasDisponibles.length === 0}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary transition-all disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
          >
            <option value="">Todas</option>
            {subcategoriasDisponibles.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.nombre}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-40">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Stock Max.</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-amber-500 text-[20px]">warning</span>
            <input 
              type="number"
              placeholder="Ej: 10"
              value={stockFiltro}
              onChange={(e) => setStockFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        {(busqueda || categoriaFiltro || subcategoriaFiltro || stockFiltro !== '') && (
          <div className="flex items-end">
            <button 
              onClick={() => { setBusqueda(''); setCategoriaFiltro(''); setSubcategoriaFiltro(''); setStockFiltro(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 h-[38px]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Limpiar
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Producto</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Categoría</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Precio / PPP</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Stock</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Estado</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-4xl mb-2 text-primary">sync</span>
                    <p>Buscando en la base de datos...</p>
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
                    <p>No se encontraron productos con esos filtros.</p>
                  </td>
                </tr>
              ) : (
                productos.map((prod) => (
                  <tr key={prod.id || Math.random()} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          {prod.imagenUrl ? (
                            <img src={prod.imagenUrl} alt={prod.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400">image</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {prod.nombre || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-slate-500">
                            SKU: {prod.codigoBarra || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="w-fit px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                          {prod.subcategoria?.categoria?.nombre || 'Sin Categoría'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium pl-1">
                          {prod.subcategoria?.nombre || 'Sin Subcategoría'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Venta: ${typeof prod.precio === 'number' ? prod.precio.toFixed(2) : '0.00'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Costo: ${typeof prod.ppp === 'number' ? prod.ppp.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${(prod.stock || 0) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {(prod.stock || 0) > 0 ? prod.stock : 'Agotado'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={prod.disponible || false} onChange={() => alternarEstado(prod)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        <span className="ml-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {prod.disponible ? 'Activo' : 'Pausado'}
                        </span>
                      </label>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/productos/editar/${prod.id}`)} className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg" title="Editar producto">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => eliminarProducto(prod.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg" title="Eliminar producto">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-bold text-slate-700 dark:text-slate-300">{productos.length}</span> de {totalElementos} resultados
          </p>
          
          <div className="flex gap-2">
            <button
              disabled={paginaActual === 0}
              onClick={() => cargarProductos(paginaActual - 1)}
              className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              Anterior
            </button>

            <span className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 rounded-lg">
              Página {paginaActual + 1} de {totalPaginas > 0 ? totalPaginas : 1}
            </span>

            <button
              disabled={paginaActual >= totalPaginas - 1}
              onClick={() => cargarProductos(paginaActual + 1)}
              className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PantallaProductos;