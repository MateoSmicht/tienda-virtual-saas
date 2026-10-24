import { useState, useEffect, useRef } from 'react';
import ModalNuevoPedido from './ModalNuevoPedido';
import { fetchConToken, obtenerCajaActual } from '../../services/api';

const PantallaPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  // Filtros y Paginación
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);

  const [cajaAbierta, setCajaAbierta] = useState(false);
  const idUsuario = localStorage.getItem('usuarioId') || 1;

  // Estados del buscador para editar
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosBusquedaProducto, setResultadosBusquedaProducto] = useState([]);
  const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
  const [indexProductoSelec, setIndexProductoSelec] = useState(-1);

  const dropdownProductoRef = useRef(null);
  const inputProductoRef = useRef(null);
  const temporizadoresModificacion = useRef({});

  const esEditable = pedidoSeleccionado?.estado === 'PENDIENTE';

  // ==========================================
  // CARGA DE DATOS INICIAL
  // ==========================================
  // ==========================================
  // CARGA DE DATOS (AHORA CON MODO SILENCIOSO)
  // ==========================================
  const cargarDatos = async (nroPagina = 0, silencioso = false) => {
    // Solo mostramos el spinner gigante si NO es una recarga silenciosa
    if (!silencioso) setCargando(true); 
    
    try {
      let urlPedidos = `/pedidos?page=${nroPagina}&size=10`;
      if (fechaInicio && fechaFin) urlPedidos += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      if (estadoFiltro) urlPedidos += `&estado=${estadoFiltro}`;

      const resPedidos = await fetchConToken(urlPedidos);
      const dataPedidos = await resPedidos.json();

      setPedidos(dataPedidos.content || []);
      setTotalPaginas(dataPedidos.totalPages || 0);
      setTotalElementos(dataPedidos.totalElements || 0);
      setPaginaActual(dataPedidos.number || 0);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      if (!silencioso) setCargando(false);
    }
  };
  // ==========================================
  // AUTO-REFRESH (POLLING CADA 15 SEGUNDOS)
  // ==========================================
  useEffect(() => {
    // Creamos el temporizador
    const intervalo = setInterval(() => {
      // Solo actualizamos automáticamente si NO hay un modal abierto (para que no le cambie los datos mientras edita un pedido)
      // y si está en la primera página sin buscar nada específico.
      if (!pedidoSeleccionado && paginaActual === 0 && !busqueda) {
        cargarDatos(0, true); // true = silencioso
      }
    }, 15000); // 15000 ms = 15 segundos

    // Limpiamos el temporizador si el admin cambia de pantalla
    return () => clearInterval(intervalo);
  }, [fechaInicio, fechaFin, estadoFiltro, paginaActual, busqueda, pedidoSeleccionado]);

  useEffect(() => {
    if ((fechaInicio && fechaFin) || (!fechaInicio && !fechaFin)) {
      cargarDatos(0);
    }
  }, [fechaInicio, fechaFin, estadoFiltro]);

  useEffect(() => {
    const verificarCaja = async () => {
      const caja = await obtenerCajaActual(idUsuario);
      setCajaAbierta(caja !== null);
    };
    verificarCaja();

    const handleClickFuera = (e) => {
      if (dropdownProductoRef.current && !dropdownProductoRef.current.contains(e.target)) {
        setMostrarDropdownProducto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // ==========================================
  // FUNCIONES BASE DEL PEDIDO
  // ==========================================
  const actualizarEstado = async (id, nuevoEstado) => {
    if (!window.confirm(`¿Estás seguro de cambiar el estado del pedido a ${nuevoEstado}?`)) return;

    try {
      const response = await fetchConToken(`/pedidos/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ nuevoEstado })
      });
      if (response.ok) {
        const pedidoActualizado = await response.json();
        // Actualizamos la tabla de fondo
        setPedidos(pedidos.map(p => p.id === id ? pedidoActualizado : p));
        // Actualizamos el modal actual para que siga abierto pero con el nuevo estado
        setPedidoSeleccionado(pedidoActualizado);
      } else {
        alert("Error al actualizar el estado del pedido.");
      }
    } catch (error) { alert("Error de conexión al actualizar estado"); }
  };

  const eliminarPedido = async (id) => {
    const confirmar = window.confirm("¿Estás seguro de que querés eliminar este pedido de forma permanente?");
    if (!confirmar) return;
    try {
      const response = await fetchConToken(`/pedidos/${id}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        cargarDatos(paginaActual);
        setPedidoSeleccionado(null);
      }
    } catch (error) { alert("Error al eliminar pedido"); }
  };

  // ==========================================
  // EDICIÓN DEL PEDIDO CON CONFIRMACIÓN
  // ==========================================
 
  const manejarModificacion = (pedidoId, productoId, nuevaCantidad, tipo) => {
    // Si la cantidad llega a 0, por seguridad pedimos confirmación
    if (tipo === 'ELIMINAR' || nuevaCantidad === 0) {
        if (!window.confirm("¿Quitar este producto del pedido?")) return;
    }

    // 1. Encontrar el item actual para calcular la diferencia
    const itemActual = (pedidoSeleccionado.items || pedidoSeleccionado.detalles || []).find(i => (i.producto?.id || i.productoId) === productoId);
    if (!itemActual) return;

    // 2. ACTUALIZACIÓN OPTIMISTA (UI Instantánea)
    let nuevoTotal = pedidoSeleccionado.total || 0;
    let itemsActualizados = [...(pedidoSeleccionado.items || pedidoSeleccionado.detalles || [])];

    if (tipo === 'ELIMINAR' || nuevaCantidad === 0) {
      itemsActualizados = itemsActualizados.filter(i => (i.producto?.id || i.productoId) !== productoId);
      nuevoTotal -= (itemActual.precioUnitario * itemActual.cantidad);
    } else {
      const diffCantidad = nuevaCantidad - itemActual.cantidad;
      itemsActualizados = itemsActualizados.map(i => {
        if ((i.producto?.id || i.productoId) === productoId) {
          return { ...i, cantidad: nuevaCantidad };
        }
        return i;
      });
      nuevoTotal += (itemActual.precioUnitario * diffCantidad);
    }

    const pedidoOptimista = { ...pedidoSeleccionado, items: itemsActualizados, total: Math.max(0, nuevoTotal) };
    setPedidoSeleccionado(pedidoOptimista);
    setPedidos(pedidos.map(p => p.id === pedidoId ? pedidoOptimista : p));

    // 3. DEBOUNCE (Agrupar clics rápidos)
    if (temporizadoresModificacion.current[productoId]) {
      clearTimeout(temporizadoresModificacion.current[productoId]);
    }

    temporizadoresModificacion.current[productoId] = setTimeout(async () => {
      try {
        let res;
        if (tipo === 'ELIMINAR' || nuevaCantidad === 0) {
          res = await fetchConToken(`/pedidos/${pedidoId}/items/${productoId}`, { method: 'DELETE' });
        } else {
          res = await fetchConToken(`/pedidos/${pedidoId}/items/${productoId}?cantidad=${nuevaCantidad}`, { method: 'PUT' });
        }

        if (res.ok) {
          const pedidoActualizadoDB = await res.json();
          // Actualizamos silenciosamente con los datos finales del server
          setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoActualizadoDB : p));
          setPedidoSeleccionado(prev => prev && prev.id === pedidoId ? pedidoActualizadoDB : prev);
        } else {
          alert("No se pudo modificar la cantidad. Verifique el stock disponible.");
          // Si falló (ej. stock insuficiente), revertir pidiendo el pedido original
          const resPedido = await fetchConToken(`/pedidos/${pedidoId}`);
          if (resPedido.ok) {
            const pedidoRevertido = await resPedido.json();
            setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoRevertido : p));
            setPedidoSeleccionado(prev => prev && prev.id === pedidoId ? pedidoRevertido : prev);
          }
        }
      } catch (err) { console.error("Error al modificar el pedido", err); }
    }, 400); // Espera 400ms después del último clic
  };

  const agregarItemAlPedidoActual = async (producto, cantidadSuma = 1) => {
    // Agregado instantáneo y silencioso
    try {
      const res = await fetchConToken(`/pedidos/${pedidoSeleccionado.id}/items?productoId=${producto.id}&cantidad=${cantidadSuma}`, {
        method: 'POST'
      });

      if (res.ok) {
        const pedidoActualizado = await res.json();
        setPedidos(pedidos.map(p => p.id === pedidoSeleccionado.id ? pedidoActualizado : p));
        setPedidoSeleccionado(pedidoActualizado);

        setBusquedaProducto('');
        setResultadosBusquedaProducto([]);
        setMostrarDropdownProducto(false);
        inputProductoRef.current?.focus();
      } else {
        alert(`No hay stock suficiente para agregar "${producto.nombre}".`);
      }
    } catch (e) { console.error("Error de red", e); }
  };

 

  // ==========================================
  // LÓGICA DE BÚSQUEDA
  // ==========================================
  useEffect(() => {
    if (!busquedaProducto.trim() || busquedaProducto.includes('*')) {
      setResultadosBusquedaProducto([]);
      setMostrarDropdownProducto(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(busquedaProducto)}&page=0&size=5`);
        const data = await res.json();
        setResultadosBusquedaProducto(data.content || []);
        setIndexProductoSelec(-1);
        if (data.content && data.content.length > 0) setMostrarDropdownProducto(true);
      } catch (error) { console.error("Error:", error); }
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [busquedaProducto]);

  const handleKeyDownProducto = async (e) => {
    if (mostrarDropdownProducto && resultadosBusquedaProducto.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndexProductoSelec(prev => (prev < resultadosBusquedaProducto.length - 1 ? prev + 1 : prev));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndexProductoSelec(prev => (prev > 0 ? prev - 1 : 0));
        return;
      }
    }

    if (e.key === 'Enter' && busquedaProducto.trim() !== '') {
      e.preventDefault();
      if (mostrarDropdownProducto && indexProductoSelec >= 0 && !busquedaProducto.includes('*')) {
        agregarItemAlPedidoActual(resultadosBusquedaProducto[indexProductoSelec], 1);
        return;
      }
      procesarEntradaProducto(busquedaProducto.trim());
    }
  };

  const procesarEntradaProducto = async (texto) => {
    let cantidadIngresada = 1;
    let codigo = texto;

    if (texto.includes('*')) {
      const partes = texto.split('*');
      cantidadIngresada = parseInt(partes[0], 10) || 1;
      codigo = partes[1].trim();
    }

    try {
      const resCodigo = await fetchConToken(`/productos/codigo/${encodeURIComponent(codigo)}`);
      if (resCodigo.ok) {
        const productoEncontrado = await resCodigo.json();
        agregarItemAlPedidoActual(productoEncontrado, cantidadIngresada);
      } else {
        const res = await fetchConToken(`/productos?todos=true&busqueda=${encodeURIComponent(codigo)}&page=0&size=1`);
        const data = await res.json();
        if (data.content && data.content.length === 1) {
          agregarItemAlPedidoActual(data.content[0], cantidadIngresada);
        } else {
          alert("Producto no encontrado o búsqueda ambigua.");
        }
      }
    } catch (error) { console.error("Error:", error); }
  };

  const pedidosTablaFiltrados = pedidos.filter(p => {
    const termino = busqueda.toLowerCase();
    return p.id.toString().includes(termino) ||
      (p.usuario?.nombre || '').toLowerCase().includes(termino) ||
      (p.usuario?.apellido || '').toLowerCase().includes(termino);
  });

  const BadgeEstado = ({ estado }) => {
    const estilos = {
      'PENDIENTE': 'bg-amber-100 text-amber-700 border-amber-200',
      'PAGADO': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'CANCELADO': 'bg-red-100 text-red-700 border-red-200',
      'ENTREGADO': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest border ${estilos[estado] || estilos['PENDIENTE']}`}>{estado}</span>;
  };

  // Comprobación rápida para saber si el modal abierto es de caja o no
  const esPedidoPorCaja = pedidoSeleccionado?.cajaId != null;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full font-sans relative pb-24">

      {/* HEADER Y FILTROS */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pedidos y Ventas</h1>
            <p className="text-slate-500 mt-1">Haga el seguimiento y edición de las órdenes de compra.</p>
          </div>
          <div className="flex items-center gap-3">
            {!cajaAbierta && (
              <span className="hidden sm:inline-block text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50">
                ⚠️ Abrí la caja para facturar
              </span>
            )}
            <button
              onClick={() => setMostrarModalNuevo(true)}
              disabled={!cajaAbierta}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${cajaAbierta ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                }`}
            >
              <span className="material-symbols-outlined text-xl">{cajaAbierta ? 'add_circle' : 'lock'}</span>
              Nuevo Pedido
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-full md:w-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-3 py-1.5 text-sm font-medium outline-none bg-transparent dark:text-white w-full" />
            <span className="text-slate-300">-</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-3 py-1.5 text-sm font-medium outline-none bg-transparent dark:text-white w-full" />
          </div>

          <div className="w-full md:w-48 relative">
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none focus:border-teal-500 transition-colors">
              <option value="">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PAGADO">Pagados</option>
              <option value="ENTREGADO">Entregados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none">expand_more</span>
          </div>

          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-lg pointer-events-none">search</span>
            <input type="text" placeholder="Buscar por ID o cliente (En esta página)..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium text-slate-700 dark:text-white focus:border-teal-500 transition-colors" />
          </div>

          {(fechaInicio || fechaFin || estadoFiltro || busqueda) && (
            <button onClick={() => { setFechaInicio(''); setFechaFin(''); setEstadoFiltro(''); setBusqueda(''); }} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 rounded-xl transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">close</span> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE PEDIDOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-5">Orden</th>
                <th className="px-6 py-5">Cliente / Origen</th>
                <th className="px-6 py-5">Fecha y Hora</th>
                <th className="px-6 py-5">Total</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {cargando ? (
                <tr><td colSpan="6" className="text-center py-16 text-slate-400"><span className="material-symbols-outlined animate-spin text-4xl mb-3 text-teal-500">sync</span></td></tr>
              ) : pedidosTablaFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-16 text-slate-400">No se encontraron pedidos.</td></tr>
              ) : (
                pedidosTablaFiltrados.map(p => {
                  const total = p.total || 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-900 dark:text-white">#{p.id}</td>
                      <td className="px-6 py-4">
                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">{p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido}` : 'Consumidor Final'}</span>
                        <div className="flex items-center gap-1 mt-1">
                          {p.cajaId ? (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">point_of_sale</span> Local
                            </span>
                          ) : (
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">language</span> E-Commerce
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            • {p.metodoPago ? p.metodoPago.replace('_', ' ') : 'S/N'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{new Date(p.fechaPedido || p.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} hs</td>
                      <td className="px-6 py-4 font-black text-teal-600 dark:text-teal-400">${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4"><BadgeEstado estado={p.estado} /></td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => {
                          setPedidoSeleccionado(p);
                          // Solo damos foco si es web (porque en mostrador no hay buscador)
                          if (!p.cajaId) {
                            setTimeout(() => inputProductoRef.current?.focus(), 100);
                          }
                        }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors" title="Ver Detalle">
                          <span className="material-symbols-outlined text-[22px]">{p.cajaId ? 'visibility' : 'edit_document'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500">
            Mostrando <span className="font-bold text-slate-700 dark:text-slate-300">{pedidosTablaFiltrados.length}</span> de <span className="font-bold text-slate-700 dark:text-slate-300">{totalElementos}</span> pedidos
          </p>
          <div className="flex gap-2">
            <button disabled={paginaActual === 0} onClick={() => cargarDatos(paginaActual - 1)} className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white transition-colors text-slate-700">Anterior</button>
            <span className="px-4 py-2 text-sm font-black text-teal-700 bg-teal-50 rounded-lg">Pág. {paginaActual + 1} de {totalPaginas > 0 ? totalPaginas : 1}</span>
            <button disabled={paginaActual >= totalPaginas - 1 || totalPaginas === 0} onClick={() => cargarDatos(paginaActual + 1)} className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white transition-colors text-slate-700">Siguiente</button>
          </div>
        </div>
      </div>

      {mostrarModalNuevo && (
        <ModalNuevoPedido onClose={() => setMostrarModalNuevo(false)} onGuardadoExitoso={() => { setMostrarModalNuevo(false); cargarDatos(0); }} />
      )}

      

      
      {pedidoSeleccionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">receipt_long</span>
                  Pedido #{pedidoSeleccionado.id}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm font-medium text-slate-500">
                    Cliente: {pedidoSeleccionado.usuario?.nombre} {pedidoSeleccionado.usuario?.apellido}
                    {pedidoSeleccionado.usuario?.telefono && <span className="ml-2 px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-md text-[10px] font-black uppercase">{pedidoSeleccionado.usuario.telefono}</span>}
                  </p>
                  {esPedidoPorCaja && (
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase">
                      <span className="material-symbols-outlined text-[12px]">lock</span> Cobrado en Local
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setPedidoSeleccionado(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* BUSCADOR: Solo se muestra si NO es un pedido de caja */}
            {!esPedidoPorCaja && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative z-50" ref={dropdownProductoRef}>
                {esEditable ? (
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 font-black">barcode_scanner</span>
                    <input
                      ref={inputProductoRef}
                      type="text"
                      placeholder="Agregar producto... (Ej: 2*779... o nombre)"
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                      onKeyDown={handleKeyDownProducto}
                      onFocus={() => { if (resultadosBusquedaProducto.length > 0) setMostrarDropdownProducto(true) }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500 transition-all text-sm"
                    />
                    {mostrarDropdownProducto && busquedaProducto && !busquedaProducto.includes('*') && (
                      <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-800 border-2 border-teal-500 rounded-xl shadow-2xl overflow-y-auto z-50 max-h-60">
                        {resultadosBusquedaProducto.length === 0 ? (
                          <div className="p-4 text-slate-500 text-center font-bold text-sm">Buscando...</div>
                        ) : (
                          resultadosBusquedaProducto.map((p, index) => (
                            <div
                              key={p.id}
                              onClick={() => agregarItemAlPedidoActual(p, 1)}
                              onMouseEnter={() => setIndexProductoSelec(index)}
                              className={`flex justify-between items-center p-3 cursor-pointer border-b border-slate-100 dark:border-slate-700 transition-colors ${indexProductoSelec === index ? 'bg-teal-50 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center gap-2">
                                  {indexProductoSelec === index && <span className="material-symbols-outlined text-teal-500 text-[14px]">chevron_right</span>}
                                  {p.nombre}
                                </div>
                                <div className="text-[10px] text-slate-500 font-black uppercase mt-0.5 ml-5">Stock: {p.stock}</div>
                              </div>
                              <div className="font-black text-teal-600">
                                ${p.precioOferta ? p.precioOferta.toLocaleString() : p.precio.toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300 p-3 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] shrink-0 text-blue-500">info</span>
                    <p className="text-sm font-medium">Para modificar los productos o reemplazarlos, primero pasa el estado del pedido a <strong>PENDIENTE</strong> abajo.</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 dark:bg-slate-950">
              
              {/* ======================================================== */}
              {/* ALERTA DE MENSAJE / REEMPLAZOS                         */}
              {/* ======================================================== */}
              {!esPedidoPorCaja && (
                <div className="flex flex-col gap-3">
                    {/* Preferencia de Reemplazos */}
                    {(pedidoSeleccionado.mensaje || '').includes('[✅ ACEPTA REEMPLAZOS]') ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                            <span className="material-symbols-outlined text-[28px] shrink-0 text-emerald-500">check_circle</span>
                            <div>
                                <p className="font-black text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                                    ¡Autoriza Reemplazos! 
                                </p>
                                <p className="text-sm font-medium">El cliente indicó que si falta stock, <strong>puedes editar el pedido</strong> y enviarle un producto similar.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                            <span className="material-symbols-outlined text-[28px] shrink-0 text-rose-500">block</span>
                            <div>
                                <p className="font-black text-sm uppercase tracking-widest mb-1">No autoriza reemplazos</p>
                                <p className="text-sm font-medium">El cliente <strong>NO</strong> autorizó reemplazos. Si no hay stock de algún producto, elimínalo del pedido y no envíes sustitutos.</p>
                            </div>
                        </div>
                    )}

                    {/* Mensaje adicional del cliente (si dejó notas además del flag) */}
                    {pedidoSeleccionado.mensaje && pedidoSeleccionado.mensaje.replace('[✅ ACEPTA REEMPLAZOS]', '').trim() !== '' && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                            <span className="material-symbols-outlined text-[24px] shrink-0">edit_note</span>
                            <div>
                                <p className="font-black text-xs uppercase tracking-widest mb-1">Notas del cliente</p>
                                <p className="text-sm font-medium whitespace-pre-wrap">{pedidoSeleccionado.mensaje.replace('[✅ ACEPTA REEMPLAZOS]', '').trim()}</p>
                            </div>
                        </div>
                    )}
                </div>
              )}

              {/* LISTA DE PRODUCTOS */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 w-20 text-center">Cant.</th>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      {esEditable && <th className="px-4 py-3 w-12 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(pedidoSeleccionado.items || pedidoSeleccionado.detalles || []).map(item => {
                      const idParaBorrar = item.producto?.id || item.productoId;
                      const nombreMostrado = item.nombreProducto || item.producto?.nombre || 'Producto';
                      return (
                        <tr key={item.id || idParaBorrar} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">

                          <td className="px-4 py-2">
                            {!esEditable ? (
                              <span className="block w-full text-center font-bold text-sm text-slate-800 dark:text-slate-200">{item.cantidad}</span>
                            ) : (
                              <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <button onClick={() => manejarModificacion(pedidoSeleccionado.id, idParaBorrar, item.cantidad - 1, 'CANTIDAD')} className="p-1 hover:bg-slate-200 text-slate-500"><span className="material-symbols-outlined text-[14px]">remove</span></button>
                                <span className="w-6 text-center font-bold text-sm text-slate-800 dark:text-slate-200">{item.cantidad}</span>
                                <button onClick={() => manejarModificacion(pedidoSeleccionado.id, idParaBorrar, item.cantidad + 1, 'CANTIDAD')} className="p-1 hover:bg-slate-200 text-slate-500"><span className="material-symbols-outlined text-[14px]">add</span></button>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-2 font-bold text-sm text-slate-800 dark:text-slate-200">{nombreMostrado}</td>
                          <td className="px-4 py-2 text-right font-black text-slate-900 dark:text-white">${(item.precioUnitario * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>

                          {esEditable && (
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => manejarModificacion(pedidoSeleccionado.id, idParaBorrar, 0, 'ELIMINAR')} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          )}

                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-4">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total del Pedido:</span>
                  <span className="text-2xl font-black text-teal-600">${pedidoSeleccionado.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* BOTÓN DE WHATSAPP (Aparece si hay un cliente o no es de caja) */}
              {!(esPedidoPorCaja && !pedidoSeleccionado.usuario) && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1 justify-center sm:justify-start">
                      <span className="material-symbols-outlined text-[18px]">mark_email_unread</span> ¿Avisar al cliente?
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Se abrirá WhatsApp con el estado de su pedido.</p>
                  </div>
                  <button
                    onClick={() => {
                      const telefono = pedidoSeleccionado.usuario?.telefono || '';
                      if (!telefono) return alert("El cliente no tiene teléfono registrado.");
                      const mensaje = `¡Hola ${pedidoSeleccionado.usuario?.nombre}! Te contactamos de V-PERFUMERY. 
                        Tu pedido #${pedidoSeleccionado.id} se encuentra en estado *${pedidoSeleccionado.estado}*. 

                        El total de tu orden es de *$${pedidoSeleccionado.total.toLocaleString()}*.
                        ¡Cualquier duda consultanos por acá!`;
                      window.open(`https://wa.me/${telefono.replace(/\\D/g, '')}?text=${encodeURIComponent(mensaje)}`, '_blank');
                    }}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span> WhatsApp
                  </button>
                </div>
              )}
              {/* ESTADOS */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Gestionar Estado
                </h3>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {['PENDIENTE', 'PAGADO', 'ENTREGADO', 'CANCELADO'].map(est => (
                      <button
                        key={est}
                        onClick={() => actualizarEstado(pedidoSeleccionado.id, est)}
                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${pedidoSeleccionado.estado === est
                            ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                      >
                        {est}
                      </button>
                    ))}
                  </div>

                  {/* Botón Eliminar Permanente */}
                  <button
                    onClick={() => eliminarPedido(pedidoSeleccionado.id)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800/50 rounded-xl text-xs font-black tracking-widest transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                    ELIMINAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PantallaPedidos;