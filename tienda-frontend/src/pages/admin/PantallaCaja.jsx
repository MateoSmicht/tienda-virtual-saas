import { useState, useEffect } from 'react';
import { 
  obtenerCajaActual, abrirCaja, cerrarCaja, 
  traerHistorialCajas, traerUsuarioPorId,
  registrarMovimiento, anularMovimiento, traerMovimientosPorCaja,
  fetchConToken 
} from '../../services/api';

// Función segura para obtener la fecha local en formato YYYY-MM-DD
const formatearFechaLocal = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Mini componente para cargar el nombre del cajero
const CeldaCajero = ({ idUsuario }) => {
  const [nombre, setNombre] = useState('Cargando...');
  useEffect(() => {
    if (!idUsuario) { setNombre('Sistema'); return; }
    traerUsuarioPorId(idUsuario).then(data => {
      setNombre(data ? `${data.nombre} ${data.apellido}` : 'Desconocido');
    });
  }, [idUsuario]);
  return <span>{nombre}</span>;
};

const PantallaCaja = () => {
  // --- ESTADOS PRINCIPALES ---
  const [cajaActual, setCajaActual] = useState(null);
  const [movimientosActuales, setMovimientosActuales] = useState([]); 
  const [movimientosDetalle, setMovimientosDetalle] = useState([]);   
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // --- ESTADOS DE FILTROS (Por defecto: Última semana) ---
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Restamos 7 días
    return formatearFechaLocal(d);
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return formatearFechaLocal(new Date()); // Hoy
  });
  
  const [filtroCajeroId, setFiltroCajeroId] = useState('');
  const [listaUsuarios, setListaUsuarios] = useState([]);
  
  // --- MODALES ---
  const [mostrarModalAbrir, setMostrarModalAbrir] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
  const [cajaDetalleSeleccionada, setCajaDetalleSeleccionada] = useState(null);

  // --- INPUTS ---
  const [montoIngresado, setMontoIngresado] = useState('');
  const [nuevoMovimiento, setNuevoMovimiento] = useState({ monto: '', motivo: '', tipo: 'EGRESO' });

  // --- PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);

  // 1. Cargar lista de usuarios (Muestra solo empleados)
  useEffect(() => {
    fetchConToken('/user')
      .then(res => res.json())
      .then(data => {
        const personalCaja = data.filter(u => u.rol === 'ADMIN' || u.rol === 'CAJERO');
        setListaUsuarios(personalCaja);
      })
      .catch(err => console.error("Error cargando usuarios:", err));
  }, []);

  // 2. Función principal para traer la info
  const cargarDatos = async (page = 0) => {
    setCargando(true);
    
    // Ya NO pasamos el idUsuario. El backend lo sabe por el Token.
    const caja = await obtenerCajaActual();
    setCajaActual(caja);
    
    if (caja && caja.id) {
      const movs = await traerMovimientosPorCaja(caja.id);
      setMovimientosActuales(movs);
    } else {
      setMovimientosActuales([]);
    }

    // Datos del historial
    try {
      const dataHistorial = await traerHistorialCajas(page, 10, fechaInicio, fechaFin, filtroCajeroId);
      setHistorial(dataHistorial.content || []);
      setTotalPaginas(dataHistorial.totalPages || 0);
      setPaginaActual(dataHistorial.number || 0);
      setTotalElementos(dataHistorial.totalElements || 0);
    } catch (error) {
      console.error("Error al cargar historial", error);
    }
    
    setCargando(false);
  };

  // 3. Escuchador de Filtros
  useEffect(() => {
    cargarDatos(0);
    // eslint-disable-next-line
  }, [fechaInicio, fechaFin, filtroCajeroId]);

  // 4. Cargar movimientos para el "Ojito"
  useEffect(() => {
    if (cajaDetalleSeleccionada) {
      traerMovimientosPorCaja(cajaDetalleSeleccionada.id).then(movs => setMovimientosDetalle(movs));
    } else {
      setMovimientosDetalle([]);
    }
  }, [cajaDetalleSeleccionada]);

  // --- HANDLERS (Acciones) ---
  const handleAbrirCaja = async () => {
    try {
      await abrirCaja(parseFloat(montoIngresado)); // LIMPIO
      setMostrarModalAbrir(false);
      setMontoIngresado('');
      cargarDatos(0);
    } catch (error) { alert(error.message); }
  };

  const handleCerrarCaja = async () => {
    try {
      await cerrarCaja(parseFloat(montoIngresado)); // LIMPIO
      setMostrarModalCerrar(false);
      setMontoIngresado('');
      cargarDatos(0);
    } catch (error) { alert(error.message); }
  };

  const handleGuardarMovimiento = async () => {
    try {
      await registrarMovimiento({ ...nuevoMovimiento, monto: parseFloat(nuevoMovimiento.monto) }); // LIMPIO
      setMostrarModalMovimiento(false);
      setNuevoMovimiento({ monto: '', motivo: '', tipo: 'EGRESO' });
      cargarDatos(paginaActual); 
    } catch (error) { alert(error.message); }
  };

  const handleAnularMovimiento = async (idMovimiento) => {
    const confirmar = window.confirm("¿Seguro que querés anular este movimiento? Quedará registrado en la auditoría.");
    if (!confirmar) return;
    try {
      await anularMovimiento(idMovimiento);
      cargarDatos(paginaActual);
    } catch (error) { alert(error.message); }
  };

  // Cálculo en vivo
  const calcularEfectivoAproximado = () => {
    if (!cajaActual) return 0;
    let total = cajaActual.montoInicial || 0;
    movimientosActuales.forEach(m => {
      if (!m.anulado) {
        if (m.tipo === 'INGRESO') total += m.monto;
        if (m.tipo === 'EGRESO') total -= m.monto;
      }
    });
    return total;
  };
 

  return (
    <div className="p-8 max-w-7xl mx-auto w-full font-sans pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Caja y Arqueo</h1>
        <p className="text-slate-500 mt-1">Control de flujo de efectivo y auditoría de turnos.</p>
      </div>

      {/* --- SECCIÓN 1: CAJA ACTUAL (VISTA DEL CAJERO) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${
          cajaActual ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`size-14 rounded-full flex items-center justify-center text-white shadow-lg ${cajaActual ? 'bg-teal-500 shadow-teal-500/30' : 'bg-red-500 shadow-red-500/30'}`}>
              <span className="material-symbols-outlined text-[32px]">{cajaActual ? 'lock_open' : 'lock'}</span>
            </div>
            <div>
              <h2 className={`text-xl font-black ${cajaActual ? 'text-teal-800 dark:text-teal-400' : 'text-red-800 dark:text-red-400'}`}>
                {cajaActual ? 'Turno en Curso' : 'Caja Cerrada'}
              </h2>
              {cajaActual && <p className="text-sm font-bold text-teal-700/70">Iniciada: {new Date(cajaActual.fechaApertura).toLocaleTimeString()}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            {cajaActual ? (
              <>
                <button onClick={() => setMostrarModalMovimiento(true)} className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">swap_vertical_circle</span> Movimiento
                </button>
                <button onClick={() => setMostrarModalCerrar(true)} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
                  Cerrar Caja
                </button>
              </>
            ) : (
              <button onClick={() => setMostrarModalAbrir(true)} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-teal-500/30">
                <span className="material-symbols-outlined">key</span> Abrir Caja
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Base + Movimientos</span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">
            ${calcularEfectivoAproximado().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-400 mt-1">(No incluye ventas del turno)</span>
        </div>
      </div>

      {/* --- TABLA DE MOVIMIENTOS ACTIVOS --- */}
      {cajaActual && movimientosActuales.length > 0 && (
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Movimientos manuales de este turno</h3>
          </div>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {movimientosActuales.map(m => (
                <tr key={m.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${m.anulado ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30' : ''}`}>
                  <td className="px-6 py-3 w-40">
                    <span className={`px-2 py-1 rounded text-xs font-black ${m.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {m.tipo}
                    </span>
                    {m.anulado && <span className="ml-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase font-bold">Anulado</span>}
                  </td>
                  <td className={`px-6 py-3 font-medium ${m.anulado ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {m.motivo}
                  </td>
                  <td className={`px-6 py-3 text-right font-black ${m.anulado ? 'text-slate-400 line-through' : (m.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-500')}`}>
                    {m.tipo === 'INGRESO' ? '+' : '-'}${m.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-right w-20">
                    {!m.anulado && (
                      <button onClick={() => handleAnularMovimiento(m.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Anular registro">
                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- SECCIÓN 2: AUDITORÍA DE CAJAS ANTERIORES CON FILTROS --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* CABECERA Y BARRA DE FILTROS */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-black text-slate-900 dark:text-white shrink-0">Auditoría de Turnos</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Rango de Fechas */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="text-xs font-bold outline-none bg-transparent dark:text-white" />
              <span className="text-slate-300">-</span>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="text-xs font-bold outline-none bg-transparent dark:text-white" />
            </div>

            {/* Selector de Cajero */}
            <div className="relative w-full sm:w-48">
              <select
                value={filtroCajeroId}
                onChange={(e) => setFiltroCajeroId(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-bold text-slate-700 dark:text-slate-200 appearance-none focus:border-teal-500"
              >
                <option value="">Todos los Cajeros</option>
                {listaUsuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1.5 text-slate-400 text-sm pointer-events-none">expand_more</span>
            </div>

            {/* Botón Limpiar */}
            {(fechaInicio || fechaFin || filtroCajeroId) && (
              <button onClick={() => {setFechaInicio(''); setFechaFin(''); setFiltroCajeroId('');}} className="p-2 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 rounded-xl transition-colors" title="Limpiar filtros y ver todo">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* TABLA DE AUDITORÍA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Cajero</th>
                <th className="px-6 py-4">Apertura</th>
                <th className="px-6 py-4">Cierre</th>
                <th className="px-6 py-4 text-right">Diferencia</th>
                <th className="px-6 py-4 text-center">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {cargando ? (
                <tr><td colSpan="5" className="text-center py-10">Cargando historial...</td></tr>
              ) : historial.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-slate-400">No se encontraron cajas en esta semana con estos filtros.</td></tr>
              ) : (
                historial.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold"><CeldaCajero idUsuario={c.idUsuario} /></td>
                    <td className="px-6 py-4">{new Date(c.fechaApertura).toLocaleString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-6 py-4">{c.fechaCierre ? new Date(c.fechaCierre).toLocaleString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit'}) : <span className="text-teal-500 font-bold">ACTIVA</span>}</td>
                    <td className={`px-6 py-4 text-right font-black ${c.diferencia < 0 ? 'text-red-500' : c.diferencia > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {c.diferencia !== null ? `$${c.diferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setCajaDetalleSeleccionada(c)} className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500">
            Mostrando <span className="font-bold text-slate-700 dark:text-slate-300">{historial.length}</span> de <span className="font-bold text-slate-700 dark:text-slate-300">{totalElementos}</span> cajas
          </p>
          <div className="flex gap-2">
            <button disabled={paginaActual === 0} onClick={() => cargarDatos(paginaActual - 1)} className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors">Anterior</button>
            <span className="px-4 py-2 text-sm font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-lg">Pág. {paginaActual + 1} de {totalPaginas || 1}</span>
            <button disabled={paginaActual >= totalPaginas - 1 || totalPaginas === 0} onClick={() => cargarDatos(paginaActual + 1)} className="px-4 py-2 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors">Siguiente</button>
          </div>
        </div>
      </div>

      {/* --- MODAL DE DETALLES (EL "OJITO") --- */}
      {cajaDetalleSeleccionada && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black">Resumen del Turno #{cajaDetalleSeleccionada.id}</h2>
              <button onClick={() => setCajaDetalleSeleccionada(null)} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resultados de Ventas</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between text-sm"><span>Efectivo:</span><span className="font-bold">${cajaDetalleSeleccionada.totalEfectivo?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0'}</span></div>
                    <div className="flex justify-between text-sm"><span>Mercado Pago:</span><span className="font-bold">${cajaDetalleSeleccionada.totalMercadoPago?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0'}</span></div>
                    <div className="flex justify-between text-sm"><span>Transferencia:</span><span className="font-bold">${cajaDetalleSeleccionada.totalTransferencia?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0'}</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Arqueo de Efectivo</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3 border-l-4 border-teal-500">
                    <div className="flex justify-between text-sm"><span>Monto Inicial:</span><span>${cajaDetalleSeleccionada.montoInicial?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span>Monto Cierre:</span><span>${cajaDetalleSeleccionada.montoCierre?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || 'N/A'}</span></div>
                    <div className="flex justify-between text-lg pt-2 border-t font-black">
                      <span>Diferencia:</span>
                      <span className={cajaDetalleSeleccionada.diferencia < 0 ? 'text-red-500' : 'text-emerald-500'}>
                        ${cajaDetalleSeleccionada.diferencia?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LISTA DE MOVIMIENTOS EN EL HISTORIAL */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Movimientos de este turno</h4>
                {movimientosDetalle.length === 0 ? (
                  <p className="text-sm text-slate-500 italic bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">No se registraron ingresos ni egresos manuales.</p>
                ) : (
                  <ul className="divide-y border dark:border-slate-700 rounded-xl overflow-hidden">
                    {movimientosDetalle.map(m => (
                      <li key={m.id} className={`p-3 flex justify-between text-sm bg-slate-50 dark:bg-slate-800/50 ${m.anulado ? 'opacity-60 bg-slate-100 dark:bg-slate-800' : ''}`}>
                        <div className="flex items-center gap-2">
                          <strong className={`${m.anulado ? 'text-slate-400 line-through' : (m.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-500')}`}>
                            {m.tipo}
                          </strong>
                          <span className={m.anulado ? 'line-through text-slate-400' : ''}>: {m.motivo}</span>
                          {m.anulado && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Anulado</span>}
                        </div>
                        <span className={`font-bold ${m.anulado ? 'line-through text-slate-400' : ''}`}>
                          ${m.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
              <button onClick={() => setCajaDetalleSeleccionada(null)} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-transform hover:scale-105 shadow-lg">Cerrar Detalle</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE MOVIMIENTOS (INGRESO/EGRESO) --- */}
      {mostrarModalMovimiento && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-black mb-6">Registrar Movimiento</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tipo de Movimiento</label>
                <div className="flex gap-2">
                  {['EGRESO', 'INGRESO'].map(t => (
                    <button key={t} onClick={() => setNuevoMovimiento({...nuevoMovimiento, tipo: t})} className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors border-2 ${nuevoMovimiento.tipo === t ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-transparent border-slate-200 text-slate-500'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Monto ($)</label>
                <input type="number" value={nuevoMovimiento.monto} onChange={e => setNuevoMovimiento({...nuevoMovimiento, monto: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 font-bold text-lg" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Motivo / Concepto</label>
                <input type="text" value={nuevoMovimiento.motivo} onChange={e => setNuevoMovimiento({...nuevoMovimiento, motivo: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 font-medium" placeholder="Ej: Pago a proveedor..." />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setMostrarModalMovimiento(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
              <button onClick={handleGuardarMovimiento} className="flex-[2] py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE APERTURA --- */}
      {mostrarModalAbrir && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-black mb-4">Apertura de Caja</h3>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Monto inicial en cajón ($)</label>
            <input type="number" autoFocus value={montoIngresado} onChange={e => setMontoIngresado(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-black mb-6 text-center outline-none focus:border-teal-500" placeholder="0.00" />
            <div className="flex gap-3">
              <button onClick={() => setMostrarModalAbrir(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancelar</button>
              <button onClick={handleAbrirCaja} className="flex-[2] py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30">Abrir Turno</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CIERRE --- */}
      {mostrarModalCerrar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-black mb-4">Cierre de Caja</h3>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Efectivo físico contado ($)</label>
            <input type="number" autoFocus value={montoIngresado} onChange={e => setMontoIngresado(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-black mb-6 text-center outline-none focus:border-teal-500" placeholder="0.00" />
            <div className="flex gap-3">
              <button onClick={() => setMostrarModalCerrar(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancelar</button>
              <button onClick={handleCerrarCaja} className="flex-[2] py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg">Finalizar Turno</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PantallaCaja;