import { useState, useEffect } from 'react';
import { fetchConToken } from '../../services/api'; 

const PantallaOfertas = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [cantidadEnOferta, setCantidadEnOferta] = useState(0);
  
  // Búsqueda, Selección y Filtros
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [mostrarSoloOfertas, setMostrarSoloOfertas] = useState(false); 

  // Pestañas en el panel de control
  const [modoDescuento, setModoDescuento] = useState('manual'); // 'manual' o 'categoria'

  // Estados para Selección Manual
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje'); 
  const [valorDescuento, setValorDescuento] = useState('');

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [porcentajeCategoria, setPorcentajeCategoria] = useState('');

  const cargarDatos = () => {
    Promise.all([
      fetchConToken('/productos?todos=true&page=0&size=1000').then(res => res.json()),
      fetchConToken('/categorias').then(res => res.json()),
      fetchConToken('/productos/ofertas/cantidad').then(res => res.json()) 
    ])
    .then(([dataProductos, dataCategorias, totalOfertas]) => { // 👇 2. Recibimos el 3er dato

      setProductos(dataProductos.content || []); 
      setCategorias(dataCategorias);
      
      // 👇 3. Guardamos el número exacto que viene de la base de datos
      setCantidadEnOferta(totalOfertas); 
      
      setCargando(false);
    })
    .catch(err => {
      console.error("Error cargando datos:", err);
      setCargando(false);
    });
  }


  useEffect(() => {
    cargarDatos();
  }, []);

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const productosFiltrados = productos.filter(prod => {
    const estaEnOferta = prod.precioOferta != null && prod.precioOferta > 0;
    if (mostrarSoloOfertas && !estaEnOferta) return false;
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    return (prod.nombre || '').toLowerCase().includes(termino) || (prod.codigoBarra || '').includes(termino);
  });

  const toggleSeleccionarTodos = () => {
    if (seleccionados.length === productosFiltrados.length) setSeleccionados([]); 
    else setSeleccionados(productosFiltrados.map(p => p.id)); 
  };

  useEffect(() => {
    if (seleccionados.length > 1 && tipoDescuento === 'fijo') setTipoDescuento('porcentaje');
  }, [seleccionados, tipoDescuento]);


  const aplicarOfertasManual = async (e) => {
    e.preventDefault();
    if (seleccionados.length === 0) return alert("Seleccioná al menos un producto.");
    if (!valorDescuento || valorDescuento <= 0) return alert("Ingresá un valor de descuento válido.");

    const ofertaDTO = {
      porcentaje: tipoDescuento === 'porcentaje' ? parseFloat(valorDescuento) : null,
      precioFijo: tipoDescuento === 'fijo' ? parseFloat(valorDescuento) : null
    };

    try {
      const peticiones = seleccionados.map(id => 
        fetchConToken(`/productos/${id}/oferta`, {
          method: 'PUT', 
          body: JSON.stringify(ofertaDTO)
        })
      );
      await Promise.all(peticiones);
      alert(`¡Oferta aplicada a ${seleccionados.length} producto(s)!`);
      setSeleccionados([]); 
      setValorDescuento(''); 
      cargarDatos(); 
    } catch (error) {
      console.error("Error aplicando ofertas:", error);
      alert("Hubo un error al procesar las ofertas.");
    }
  };

  const aplicarOfertaCategoria = async (e) => {
    e.preventDefault();
    if (!categoriaSeleccionada) return alert("Seleccioná una categoría.");
    if (!porcentajeCategoria || porcentajeCategoria <= 0) return alert("Ingresá un porcentaje válido.");

    if (window.confirm(`¿Seguro que querés aplicar un ${porcentajeCategoria}% de descuento a toda esta categoría? Esta acción es transaccional y segura.`)) {
      
      const ofertaDTO = { 
        porcentaje: parseFloat(porcentajeCategoria), 
        precioFijo: null 
      };

      try {
        const response = await fetchConToken(`/productos/categoria/${categoriaSeleccionada}/oferta`, {
          method: 'PUT', 
          body: JSON.stringify(ofertaDTO)
        });

        if (response.ok) {
          alert(`¡Éxito! Oferta masiva aplicada correctamente en el servidor.`);
          setCategoriaSeleccionada('');
          setPorcentajeCategoria('');
          cargarDatos(); 
        } else {
          alert("Hubo un error del lado del servidor al aplicar la oferta masiva.");
        }
      } catch (error) {
        console.error("Error aplicando oferta masiva:", error);
        alert("Error de conexión con el servidor.");
      }
    }
  };

  const quitarOferta = async (id) => {
    if (window.confirm("¿Quitar la oferta de este producto? Volverá a su precio original.")) {
      try {
        const response = await fetchConToken(`/productos/${id}/oferta`, { method: 'DELETE' });
        if (response.ok) {
          setSeleccionados(prev => prev.filter(itemId => itemId !== id));
          cargarDatos();
        }
      } catch (error) {
        console.error("Error quitando oferta:", error);
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* CABECERA CON EL CONTADOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Centro de Ofertas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Aplique descuentos individuales o masivos a su catálogo.</p>
        </div>
        
        {/* CONTADOR DE OFERTAS ACTIVAS */}
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 px-5 py-3 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
          <div className="bg-amber-500 text-white rounded-full p-1.5 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">sell</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Activas Ahora</span>
            <span className="font-black text-amber-700 dark:text-amber-400 text-lg leading-tight">
              {cantidadEnOferta} Productos
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL DE CONTROL (Izquierda) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
            
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">local_offer</span>
              Configurar Descuento
            </h2>

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div className="flex p-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button 
                onClick={() => setModoDescuento('manual')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoDescuento === 'manual' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Manual
              </button>
              <button 
                onClick={() => setModoDescuento('categoria')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoDescuento === 'categoria' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Categoría Entera
              </button>
            </div>

            {/* ======================================================= */}
            {/* MODO MANUAL */}
            {/* ======================================================= */}
            {modoDescuento === 'manual' && (
              seleccionados.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-fade-in">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">touch_app</span>
                  <p className="text-sm text-slate-500 font-medium">Seleccione uno o más productos de la tabla para aplicar una oferta.</p>
                </div>
              ) : (
                <form onSubmit={aplicarOfertasManual} className="space-y-6 animate-fade-in">
                  <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-100 dark:border-teal-800/30 flex items-center justify-between">
                    <span className="text-sm font-bold text-teal-800 dark:text-teal-300">Productos seleccionados:</span>
                    <span className="bg-teal-600 text-white text-xs font-black px-2.5 py-1 rounded-full">{seleccionados.length}</span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo de Oferta</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tipo" value="porcentaje" checked={tipoDescuento === 'porcentaje'} onChange={() => setTipoDescuento('porcentaje')} className="text-teal-600 focus:ring-teal-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Porcentaje (%)</span>
                      </label>
                      <label className={`flex items-center gap-2 ${seleccionados.length > 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title={seleccionados.length > 1 ? "Solo disponible para 1 producto" : ""}>
                        <input type="radio" name="tipo" value="fijo" checked={tipoDescuento === 'fijo'} onChange={() => setTipoDescuento('fijo')} disabled={seleccionados.length > 1} className="text-teal-600 focus:ring-teal-500 disabled:bg-slate-200" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio Fijo ($)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {tipoDescuento === 'porcentaje' ? 'Porcentaje a descontar' : 'Nuevo Precio de Venta'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">
                        {tipoDescuento === 'porcentaje' ? '%' : '$'}
                      </span>
                      <input type="number" step="0.01" required value={valorDescuento} onChange={(e) => setValorDescuento(e.target.value)} placeholder={tipoDescuento === 'porcentaje' ? "Ej: 15" : "Ej: 999.99"} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white font-bold transition-all text-lg" />
                    </div>
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    Aplicar Oferta
                  </button>
                </form>
              )
            )}

            {/* ======================================================= */}
            {/* MODO CATEGORÍA ENTERA (CONEXIÓN AL BACKEND) */}
            {/* ======================================================= */}
            {modoDescuento === 'categoria' && (
              <form onSubmit={aplicarOfertaCategoria} className="space-y-6 animate-fade-in">
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Lanzar una oferta masiva a toda una categoría. Esto aplicara el porcentaje de descuento que desees a toda una categoria.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Categoría a bonificar</label>
                  <select 
                    required
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white font-bold transition-all outline-none"
                  >
                    <option value="">-- Seleccionar Categoría --</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Porcentaje a descontar</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">%</span>
                    <input 
                      type="number" step="0.01" required 
                      value={porcentajeCategoria} 
                      onChange={(e) => setPorcentajeCategoria(e.target.value)} 
                      placeholder="Ej: 20" 
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white font-bold transition-all text-lg outline-none" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  Lanzar Oferta Masiva
                </button>
              </form>
            )}

          </div>
        </div>

        {/* TABLA DE PRODUCTOS (Derecha) */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            
            {/* CABECERA DE LA TABLA (Buscador + Botón Filtro) */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-3">
              
              {/* Buscador */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-lg">search</span>
                <input type="text" placeholder="Buscar producto o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition-all"/>
              </div>

              {/* BOTÓN DE FILTRO: SOLO OFERTAS */}
              <button 
                onClick={() => setMostrarSoloOfertas(!mostrarSoloOfertas)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border transition-all ${
                  mostrarSoloOfertas 
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-400' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">sell</span>
                {mostrarSoloOfertas ? 'Viendo solo ofertas' : 'Ver solo ofertas'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900">
                    <th className="px-6 py-4 w-12 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" checked={productosFiltrados.length > 0 && seleccionados.length === productosFiltrados.length} onChange={toggleSeleccionarTodos}/>
                    </th>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Precios</th>
                    <th className="px-6 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cargando ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-500">Cargando catálogo...</td></tr>
                  ) : productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-500 flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                        <p>{mostrarSoloOfertas ? 'No hay productos en oferta actualmente.' : 'No se encontraron productos.'}</p>
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map(prod => {
                      const estaSeleccionado = seleccionados.includes(prod.id);
                      const estaEnOferta = prod.precioOferta != null && prod.precioOferta > 0;

                      return (
                        <tr key={prod.id} className={`transition-colors group ${estaSeleccionado ? 'bg-teal-50 dark:bg-teal-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                          
                          <td className="px-6 py-4 text-center">
                            <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" checked={estaSeleccionado} onChange={() => toggleSeleccion(prod.id)} />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700/50">
                                {prod.imagenUrl ? <img src={prod.imagenUrl} alt="img" className="w-full h-full object-cover"/> : <span className="material-symbols-outlined text-[16px] text-slate-400">image</span>}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  {prod.nombre}
                                  {estaEnOferta && <span className="material-symbols-outlined text-[14px] text-amber-500" title="En oferta">sell</span>}
                                </span>
                                <span className="text-[10px] text-slate-400">SKU: {prod.codigoBarra}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                              {prod.subcategoria?.categoria?.nombre || 'Sin categoría madre'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${estaEnOferta ? 'text-slate-400 line-through text-xs' : 'text-slate-700 dark:text-slate-300'}`}>
                                ${prod.precio?.toFixed(2)}
                              </span>
                              {estaEnOferta && (
                                <span className="text-sm font-black text-amber-500">
                                  ${prod.precioOferta?.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            {estaEnOferta && (
                              <button onClick={() => quitarOferta(prod.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100" title="Quitar Oferta">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PantallaOfertas;